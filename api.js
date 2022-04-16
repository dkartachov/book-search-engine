const worksUrl = "https://reststop.randomhouse.com/resources/works/?start=0&max=100&expandLevel=1&search=";
const booksUrl = "https://openlibrary.org/api/books?jscmd=data&format=json&bibkeys=ISBN:";
let bookEls = [];

async function fetchResults() {
    clearResults();

    let searchEl = document.getElementById("search");
    let params = searchEl.value;

    if (!params) return;

    console.log("Searching...");

    const works = await getSearchResults(params);

    if (!works) {
        alert("Can't find any books, please enter valid search.");
        return;
    }

    const isbns = await getISBN(works);
    const books = await getBooks(isbns);

    console.log(books);

    document.getElementById('bookList').style.visibility = 'visible';

    let bookRow;

    books.forEach((book, index) => {
        if (index % 3 === 0) {
            bookRow = document.createElement('div');
            bookRow.className = 'row';

            document.getElementById('main').appendChild(bookRow);
        }

        let bookCol = document.createElement('div');
        bookCol.className = 'column';

        bookRow.appendChild(bookCol);

        let bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        bookCol.appendChild(bookCard);

        // book container
        let bookContainer = document.createElement('a');
        bookContainer.href = book.url;
        bookContainer.target = 'blank';
        css(bookContainer, {
            'margin-bottom': '10px'
        })

        bookCard.appendChild(bookContainer);

        // book cover
        let bookCover = document.createElement('img');
        bookCover.src = book.covers?.large || 'https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png',

        css(bookCover, {
            'width': '100%',
            'height': '100%'
        });

        bookContainer.appendChild(bookCover);

        // add book title
        let bookTitle = document.createElement('div');
        bookTitle.className = 'book-title';
        bookTitle.textContent = book.title;

        bookCard.appendChild(bookTitle);

        // add book author
        let author = document.createElement('div');
        author.textContent = `Authors: ${book.authors[0]}`;

        bookCard.appendChild(author);
    })
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
        console.log(book);
        if (book) {
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

            books.push(
                {
                    title,
                    authors,
                    publishers,
                    subjects,
                    url,
                    covers
                }
            );
        }
    }));

    return books;
}