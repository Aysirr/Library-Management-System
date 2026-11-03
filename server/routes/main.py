from flask import Blueprint, jsonify

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def home():
    return jsonify({
        "message": "Library Management System API",
        "endpoints": ["/books", "/members", "/categories", "/borrowings"],
    })
