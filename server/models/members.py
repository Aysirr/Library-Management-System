from datetime import date

from database import db

class Member(db.Model):
    __tablename__ = 'members'

    member_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    phone = db.Column(db.String(20))
    join_date = db.Column(db.Date, nullable=False, default=date.today, server_default=db.text('CURRENT_DATE'))

    borrowings = db.relationship(
        "Borrowing", back_populates='member', cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def books_out(self):
        return sum(1 for b in self.borrowings if b.return_date is None)

    def to_dict(self):
        return {
            "member_id": self.member_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "join_date": self.join_date.isoformat(),
            "books_out": self.books_out,
        }
