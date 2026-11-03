from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from database import db
from models import Category

categories_bp = Blueprint("categories", __name__, url_prefix="/categories")


@categories_bp.route("", methods=["GET"])
def get_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify([category.to_dict() for category in categories])


@categories_bp.route("", methods=["POST"])
def add_category():
    name = request.get_json()["name"].strip()
    if not name:
        return jsonify({"error": "Category name is required."}), 400
    category = Category(name=name)
    try:
        db.session.add(category)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": f"Category '{name}' already exists."}), 400
    return jsonify({"message": f"Category '{name}' added.", "category": category.to_dict()}), 201


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    category = db.get_or_404(Category, category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted. Its books are now uncategorised."})
