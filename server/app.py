from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate

from database import db, DATABASE_URI
from routes.main import main_bp
from routes.books import books_bp
from routes.members import members_bp
from routes.categories import categories_bp
from routes.borrowing import borrowings_bp

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.json.sort_keys = False
migrate = Migrate(app, db)

CORS(app)
db.init_app(app)

app.register_blueprint(main_bp)
app.register_blueprint(books_bp)
app.register_blueprint(members_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(borrowings_bp)


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Record not found."}), 404


@app.errorhandler(400)
@app.errorhandler(KeyError)
@app.errorhandler(ValueError)
@app.errorhandler(TypeError)
def bad_request(error):
    return jsonify({"error": "Invalid or missing data."}), 400


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5001)
