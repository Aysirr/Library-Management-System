
import sqlite3
from pathlib import Path

DATABASE = Path(__file__).resolve().parent / "Library.db"


def seed_database():
    conn = sqlite3.connect(DATABASE)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    try:
        # Categories
        categories = [
            ("Fiction",),
            ("Science",),
            ("Technology",),
            ("History",),
            ("Education",),
            ("Biography",),
        ]

        cursor.executemany("""
            INSERT INTO categories (name)
            SELECT ?
            WHERE NOT EXISTS (
                SELECT 1 FROM categories WHERE name = ?
            )
        """, [(name, name) for (name,) in categories])

        # Books
        books = [
            ("Things Fall Apart", "Chinua Achebe", "9780385474542", 5),
            ("The River Between", "Ngugi wa Thiong'o", "9780435905484", 5),
            ("A Brief History of Time", "Stephen Hawking", "9780553380163", 2),
            ("Clean Code", "Robert C. Martin", "9780132350884", 3),
            ("The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", 1),
            ("The Alchemist", "Paulo Coelho", "9780061122415", 1),
            ("Long Walk to Freedom", "Nelson Mandela", "9780316548182", 6),
            ("Introduction to Algorithms", "Thomas H. Cormen", "9780262046305", 3),
            ("World History", "Philip Parker", "9781405332844", 4),
            ("Basic Mathematics", "Serge Lang", "9780387967872", 5),
        ]

        cursor.executemany("""
            INSERT INTO books (title, author, isbn, category_id)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM books WHERE isbn = ?
            )
        """, [(*book, book[2]) for book in books])

        # Members
        members = [
            ("John Kamau", "john@example.com", "0712345678"),
            ("Mary Wanjiku", "mary@example.com", "0723456789"),
            ("Peter Otieno", "peter@example.com", "0734567890"),
            ("Grace Achieng", "grace@example.com", "0745678901"),
            ("David Mwangi", "david@example.com", "0756789012"),
        ]

        cursor.executemany("""
            INSERT INTO members (full_name, email, phone)
            SELECT ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM members WHERE email = ?
            )
        """, [(*member, member[1]) for member in members])

        conn.commit()

        print("Successfully seeded database!")

        for table in ["categories", "books", "members"]:
            count = cursor.execute(
                f"SELECT COUNT(*) FROM {table}"
            ).fetchone()[0]
            print(f"{table.capitalize()}: {count}")

    except sqlite3.Error as error:
        conn.rollback()
        print(f"Database error: {error}")

    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()
