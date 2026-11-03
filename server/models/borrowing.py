from datetime import date

from database import db

class Borrowing(db.Model):
    __tablename__ = "borrowings"
    __table_args__ = (
        db.CheckConstraint("due_date >= borrow_date", name="ck_borrowings_dates"),
    )

    borrow_id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("books.book_id", ondelete="CASCADE"), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey("members.member_id", ondelete="CASCADE"), nullable=False)
    borrow_date = db.Column(db.Date, nullable=False, default=date.today,
    server_default=db.text("CURRENT_DATE"))
    due_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date)

    book = db.relationship("Book", back_populates="borrowings")
    member = db.relationship("Member", back_populates="borrowings")

    @property
    def status(self):
        if self.return_date:
            return "Returned"
        if self.due_date < date.today():
            return "Overdue"
        return "Out"

    def to_dict(self):
        return {
            "borrow_id": self.borrow_id,
            "book_id": self.book_id,
            "book": self.book.title,
            "member_id": self.member_id,
            "member": self.member.full_name,
            "borrow_date": self.borrow_date.isoformat(),
            "due_date": self.due_date.isoformat(),
            "return_date": self.return_date.isoformat() if self.return_date else None,
            "status": self.status,
        }
