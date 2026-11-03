from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from database import db
from models import Member

members_bp = Blueprint("members", __name__, url_prefix="/members")


@members_bp.route("", methods=["GET"])
def get_members():
    members = Member.query.order_by(Member.full_name).all()
    return jsonify([member.to_dict() for member in members])


@members_bp.route("", methods=["POST"])
def add_member():
    data = request.get_json()
    member = Member(
        full_name=data["full_name"].strip(),
        email=data["email"].strip().lower(),
        phone=data.get("phone", "").strip() or None,
    )
    try:
        db.session.add(member)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A member with that email already exists."}), 400
    return jsonify({"message": f"Member '{member.full_name}' added.", "member": member.to_dict()}), 201


@members_bp.route("/<int:member_id>", methods=["DELETE"])
def delete_member(member_id):
    member = db.get_or_404(Member, member_id)
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member deleted, along with their borrowing history."})
