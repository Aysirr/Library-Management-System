-- Library Management System: database schema (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE books (
    book_id     INTEGER PRIMARY KEY,
    isbn        VARCHAR(20)  NOT NULL UNIQUE,
    title       VARCHAR(200) NOT NULL,
    author      VARCHAR(150) NOT NULL,
    category_id INTEGER,
    copies      INTEGER      NOT NULL DEFAULT 1,
    CONSTRAINT ck_book_copies CHECK (copies >= 0),
    FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE SET NULL
);

CREATE TABLE members (
    member_id INTEGER PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    phone     VARCHAR(20),
    join_date DATE         NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE borrowings (
    borrow_id   INTEGER PRIMARY KEY,
    book_id     INTEGER NOT NULL,
    member_id   INTEGER NOT NULL,
    borrow_date DATE    NOT NULL DEFAULT CURRENT_DATE,
    due_date    DATE    NOT NULL,
    return_date DATE,
    CONSTRAINT ck_borrowings_dates CHECK (due_date >= borrow_date),
    FOREIGN KEY (book_id)   REFERENCES books (book_id)     ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members (member_id) ON DELETE CASCADE
);
