from database import db

class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    books = db.relationship("Book", back_populates='category')

    def __repr__(self):
        return f"<Category {self.name}>"

    def to_dict(self):
        return {
            "category_id": self.category_id,
            "name": self.name,
            "books": len(self.books),
        }
