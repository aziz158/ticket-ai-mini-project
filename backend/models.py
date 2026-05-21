from datetime import datetime
from database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    customer_email = db.Column(db.String(100))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text)
    priority = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(20), default="Open")
    sentiment = db.Column(db.String(20))
    category = db.Column(db.String(50))
    ai_summary = db.Column(db.Text)
    ai_suggested_reply = db.Column(db.Text)
    ai_confidence = db.Column(db.Float)
    escalated = db.Column(db.Boolean, default=False)
    escalation_reason = db.Column(db.Text)
    assigned_agent_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    assigned_agent = db.relationship("User", backref="tickets")
    messages = db.relationship(
        "TicketMessage",
        backref="ticket",
        lazy="dynamic",
        order_by="TicketMessage.created_at",
    )

    def to_dict(self, include_messages=False):
        data = {
            "id": self.id,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "subject": self.subject,
            "message": self.message,
            "priority": self.priority,
            "status": self.status,
            "sentiment": self.sentiment,
            "category": self.category,
            "ai_summary": self.ai_summary,
            "ai_suggested_reply": self.ai_suggested_reply,
            "ai_confidence": self.ai_confidence,
            "escalated": self.escalated,
            "escalation_reason": self.escalation_reason,
            "assigned_agent": self.assigned_agent.to_dict() if self.assigned_agent else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }
        if include_messages:
            data["messages"] = [m.to_dict() for m in self.messages]
        return data


class TicketMessage(db.Model):
    __tablename__ = "ticket_messages"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    sender_type = db.Column(db.String(20))  # customer | agent | ai | note
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "sender_type": self.sender_type,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
