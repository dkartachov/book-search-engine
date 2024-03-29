const worksUrl = "https://reststop.randomhouse.com/resources/works/?start=0&max=100&expandLevel=1&search=";
const booksUrl = "https://openlibrary.org/api/books?jscmd=data&format=json&bibkeys=ISBN:";
let bookEls = [];

document.addEventListener('keydown', (event) => {
    const key = event.key;

    if (key === 'Enter') {
        fetchResults();
    }
});

async function fetchResults() {
    clearResults();

    let searchEl = document.getElementById("search");
    let params = searchEl.value;

    if (!params) return;

    let bookList = document.getElementById('bookList');
    bookList.style.visibility = 'visible';
    bookList.textContent = 'Searching...';

    const works = await getSearchResults(params);

    if (!works) {
        clearResults();
        alert("Can't find any books, please enter valid search.");
        return;
    }

    const isbns = await getISBN(works);
    const books = await getBooks(isbns);

    bookList.textContent = 'Book List';

    createBookCards(books);
}

function createBookCards(books) {
    let bookRow;

    books.forEach((book, index) => {
        if (index % 3 === 0) {
            bookRow = createElement('div', {
                className: 'row'
            });

            document.getElementById('main').appendChild(bookRow);
        }

        let bookCol = createElement('div', {
            className: 'column'
        });

        bookRow.appendChild(bookCol);

        let bookCard = createElement('div', {
            className: 'book-card'
        });

        bookCol.appendChild(bookCard);

        // card container
        let cardContainer = createElement('a', {
            href: book.url,
            target: 'blank'
        });

        bookCard.appendChild(cardContainer);

        // cover
        let bookCover = createElement('img', {
            src: book.covers?.large || 'https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png',
            className: 'book-cover'
        });

        cardContainer.appendChild(bookCover);

        // details container
        let detailsContainer = createElement('div', {
            className: 'book-details'
        });

        bookCard.appendChild(detailsContainer);

        // book title
        let bookTitle = createElement('div', {
            textContent: book.title,
            className: 'book-title'
        });

        detailsContainer.appendChild(bookTitle);

        // author
        let authorLine = createElement('div', {});

        detailsContainer.appendChild(authorLine);

        let authorLeft = createElement('div', {
            textContent: 'Authors:',
            className: 'book-details-left'
        });

        authorLine.appendChild(authorLeft);

        book.authors.forEach(author => {
            let authorRight = createElement('div', {
                textContent: author,
                className: 'book-details-right'
            });

            authorLine.appendChild(authorRight);
        });

        // publishers
        let publishersLine = createElement('div', {});

        detailsContainer.appendChild(publishersLine);

        let publishersLeft = createElement('div', {
            textContent: 'Publishers:',
            className: 'book-details-left'
        });

        publishersLine.appendChild(publishersLeft);

        book.publishers.forEach(publisher => {
            let publisherRight = createElement('div', {
                textContent: publisher,
                className: 'book-details-right'
            });

            publishersLine.appendChild(publisherRight);
        });

        // subjects
        let subjectsLine = createElement('div', {});

        detailsContainer.appendChild(subjectsLine);

        let subjectsLeft = createElement('div', {
            textContent: 'Subjects:',
            className: 'book-details-left'
        });

        subjectsLine.appendChild(subjectsLeft);

        book.subjects.forEach((subject, index) => {
            if (index > 9) return;
            
            let subjectRight = createElement('a', {
                textContent: subject.name,
                href: subject.url,
                target: 'blank',
                className: 'book-subjects'
            })

            subjectsLine.appendChild(subjectRight);
        });
    })
}

function createElement(tag, params) {
    let element = document.createElement(tag);

    for (let param in params) {
        element[param] = params[param];
    }

    return element;
}

function css(element, params) {
    for (const property in params) {
        element.style[property] = params[property];
    }
}

function clearResults() {    
    let rows = document.getElementsByClassName('row');

    while (rows.length > 0) {
        rows[0].remove();
    }

    document.getElementById('bookList').style.visibility = 'hidden';
}

async function getSearchResults(params) {
    let res = await fetch(worksUrl + params, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    let data = await res.json();
    let works = data?.work;

    return works;
}

async function getISBN(works) {
    let isbns = [];

    if (!Array.isArray(works)) {
        isbns.push(works.titles.isbn['$']);

        return isbns;
    }

    works.forEach(work => {
        let isbn = work.titles.isbn;

        if (Array.isArray(isbn)) {
            isbn.forEach(i => {
                isbns.push(i['$']);
            })

            return;
        }

        isbns.push(isbn['$']);
    })

    return isbns;
}

async function getBooks(isbns) {
    let books = [];

    await Promise.all(isbns.map(async (isbn) => {
        let res = await fetch(booksUrl + isbn, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        let data = await res.json();
        let book = data[`ISBN:${isbn}`];
        
        if (book) {
            if (!book.title || !book.authors || !book.cover || !book.subjects || !book.publishers) {
                return;
            }

            let title = book.title;
            let authors = book.authors?.map(author => {
                return author.name;
            });
            let publishers = book.publishers?.map(publisher => {
                return publisher.name;
            })
            let subjects = book.subjects;
            let url = book.url;
            let covers = book.cover;

            books.push({
                title,
                authors,
                publishers,
                subjects,
                url,
                covers
            });
        }
    }));

    return books;
}