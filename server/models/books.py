from database import db

class Book(db.Model):
    __tablename__ = 'books'
    __table_args__ = (
        db.CheckConstraint("copies >= 0", name='ck_book_copies'),
    )

    book_id = db.Column(db.Integer, primary_key=True)
    isbn = db.Column(db.String(20), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id', ondelete='SET NULL'))
    copies = db.Column(db.Integer, nullable=False, default=1, server_default='1')

    category = db.relationship("Category", back_populates='books')
    borrowings = db.relationship(
        "Borrowing", back_populates='book', cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def available(self):
        out = sum(1 for b in self.borrowings if b.return_date is None)
        return self.copies - out

    def to_dict(self):
        return {
            "book_id": self.book_id,
            "isbn": self.isbn,
            "title": self.title,
            "author": self.author,
            "category_id": self.category_id,
            "category": self.category.name if self.category else None,
            "copies": self.copies,
            "available": self.available,
        }
