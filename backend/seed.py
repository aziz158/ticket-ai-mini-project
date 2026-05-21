"""Import CSV seed data into the SQLite database. Run once from backend/ directory."""
import csv
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import db
from models import Ticket, TicketMessage, User

DATA_DIR = os.path.join(os.path.dirname(__file__), "..")


def parse_dt(value: str) -> datetime:
    return datetime.strptime(value.strip(), "%Y-%m-%d %H:%M:%S")


def seed():
    with app.app_context():
        db.create_all()

        TicketMessage.query.delete()
        Ticket.query.delete()
        User.query.delete()

        with open(os.path.join(DATA_DIR, "user_table.csv"), newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                db.session.add(User(id=int(row["id"]), name=row["name"], email=row["email"], role=row["role"]))

        with open(os.path.join(DATA_DIR, "tickets_table.csv"), newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                db.session.add(
                    Ticket(
                        id=int(row["id"]),
                        customer_name=row["customer_name"],
                        customer_email=row["customer_email"],
                        subject=row["subject"],
                        message=row["message"],
                        priority=row["priority"],
                        status=row["status"],
                        sentiment=row["sentiment"],
                        category=row.get("category") or None,
                        ai_summary=row["ai_summary"],
                        ai_suggested_reply=row["ai_suggested_reply"],
                        ai_confidence=float(row["ai_confidence"]),
                        escalated=row["escalated"].strip().lower() == "true",
                        assigned_agent_id=int(row["assigned_agent_id"]) if row.get("assigned_agent_id", "").strip() else None,
                        created_at=parse_dt(row["created_at"]),
                    )
                )

        with open(os.path.join(DATA_DIR, "tickets_message_table.csv"), newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                db.session.add(
                    TicketMessage(
                        id=int(row["id"]),
                        ticket_id=int(row["ticket_id"]),
                        sender_type=row["sender_type"],
                        message=row["message"],
                        created_at=parse_dt(row["created_at"]),
                    )
                )

        db.session.commit()
        print("Database seeded successfully.")


if __name__ == "__main__":
    seed()
