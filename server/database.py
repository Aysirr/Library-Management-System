import os

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine

db = SQLAlchemy()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "Library.db")


@event.listens_for(Engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()
