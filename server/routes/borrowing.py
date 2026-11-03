from datetime import date

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from database import db
from models import Book, Member, Borrowing

borrowings_bp = Blueprint("borrowings", __name__, url_prefix="/borrowings")


@borrowings_bp.route("", methods=["GET"])
def get_borrowings():
    borrowings = Borrowing.query.order_by(
        Borrowing.return_date.isnot(None), Borrowing.due_date
    ).all()
    return jsonify([borrowing.to_dict() for borrowing in borrowings])


@borrowings_bp.route("", methods=["POST"])
def add_borrowing():
    data = request.get_json()
    book = db.get_or_404(Book, int(data["book_id"]))
    member = db.get_or_404(Member, int(data["member_id"]))
    if book.available <= 0:
        return jsonify({"error": "No copies of that book are available right now."}), 400
    borrowing = Borrowing(
        book_id=book.book_id,
        member_id=member.member_id,
        borrow_date=date.fromisoformat(data["borrow_date"]),
        due_date=date.fromisoformat(data["due_date"]),
    )
    try:
        db.session.add(borrowing)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Due date must be on or after the borrow date."}), 400
    return jsonify({"message": "Borrowing recorded.", "borrowing": borrowing.to_dict()}), 201


@borrowings_bp.route("/<int:borrow_id>/return", methods=["PUT"])
def return_borrowing(borrow_id):
    borrowing = db.get_or_404(Borrowing, borrow_id)
    borrowing.return_date = date.today()
    db.session.commit()
    return jsonify({"message": "Book marked as returned.", "borrowing": borrowing.to_dict()})


@borrowings_bp.route("/<int:borrow_id>", methods=["DELETE"])
def delete_borrowing(borrow_id):
    borrowing = db.get_or_404(Borrowing, borrow_id)
    db.session.delete(borrowing)
    db.session.commit()
    return jsonify({"message": "Borrowing record deleted."})
