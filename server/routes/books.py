from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from database import db
from models import Book

books_bp = Blueprint("books", __name__, url_prefix="/books")


@books_bp.route("", methods=["GET"])
def get_books():
    books = Book.query.order_by(Book.title).all()
    return jsonify([book.to_dict() for book in books])


@books_bp.route("", methods=["POST"])
def add_book():
    data = request.get_json()
    book = Book(
        isbn=data["isbn"].strip(),
        title=data["title"].strip(),
        author=data["author"].strip(),
        category_id=data.get("category_id") or None,
        copies=int(data["copies"]),
    )
    try:
        db.session.add(book)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A book with that ISBN already exists, or copies is negative."}), 400
    return jsonify({"message": f"Book '{book.title}' added.", "book": book.to_dict()}), 201


@books_bp.route("/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    book = db.get_or_404(Book, book_id)
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Book deleted, along with its borrowing history."})
