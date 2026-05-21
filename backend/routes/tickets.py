from datetime import datetime

from flask import Blueprint, jsonify, request

from database import db
from extensions import socketio
from models import Ticket, TicketMessage, User
from services.ai_service import (
    analyze_sentiment,
    classify_ticket,
    detect_escalation,
    suggest_reply,
    summarize_ticket,
)

tickets_bp = Blueprint("tickets", __name__)


def _run_ai_pipeline(ticket: Ticket) -> None:
    subject = ticket.subject or ""
    message = ticket.message or ""

    classification = classify_ticket(subject, message)
    ticket.category = classification["category"]
    ticket.ai_confidence = classification["confidence"]

    ticket.sentiment = analyze_sentiment(message)["sentiment"]
    ticket.ai_summary = summarize_ticket(subject, message)["summary"]
    ticket.ai_suggested_reply = suggest_reply(subject, message, ticket.sentiment, ticket.category)["reply"]

    escalation = detect_escalation(message, ticket.sentiment, ticket.ai_confidence)
    ticket.escalated = escalation["should_escalate"]
    ticket.escalation_reason = escalation["escalation_reason"]


@tickets_bp.route("/tickets", methods=["GET"])
def get_tickets():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    priority = request.args.get("priority")
    sentiment = request.args.get("sentiment")
    escalated = request.args.get("escalated")
    search = request.args.get("search", "")
    sort_by = request.args.get("sort_by", "created_at")
    sort_dir = request.args.get("sort_dir", "desc")

    query = Ticket.query

    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if sentiment:
        query = query.filter(Ticket.sentiment == sentiment)
    if escalated is not None:
        query = query.filter(Ticket.escalated == (escalated.lower() == "true"))
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Ticket.customer_name.ilike(like),
                Ticket.subject.ilike(like),
                Ticket.customer_email.ilike(like),
            )
        )

    sort_col = getattr(Ticket, sort_by, Ticket.created_at)
    query = query.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "tickets": [t.to_dict() for t in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": page,
            "per_page": per_page,
        }
    )


@tickets_bp.route("/tickets/<int:ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    ticket = db.get_or_404(Ticket, ticket_id)
    return jsonify(ticket.to_dict(include_messages=True))


@tickets_bp.route("/tickets", methods=["POST"])
def create_ticket():
    data = request.json or {}

    ticket = Ticket(
        customer_name=data.get("customer_name"),
        customer_email=data.get("customer_email"),
        subject=data.get("subject"),
        message=data.get("message"),
        priority=data.get("priority", "Medium"),
        status="Open",
    )

    _run_ai_pipeline(ticket)

    db.session.add(ticket)
    db.session.flush()

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_type="customer",
        message=ticket.message,
    )
    db.session.add(msg)
    db.session.commit()

    payload = ticket.to_dict()
    socketio.emit("ticket_created", payload)

    return jsonify(payload), 201


@tickets_bp.route("/tickets/<int:ticket_id>", methods=["PUT"])
def update_ticket(ticket_id):
    ticket = db.get_or_404(Ticket, ticket_id)
    data = request.json or {}

    for field in ("status", "priority", "escalated", "escalation_reason", "assigned_agent_id", "sentiment", "category"):
        if field in data:
            setattr(ticket, field, data[field])

    if data.get("status") == "Resolved" and not ticket.resolved_at:
        ticket.resolved_at = datetime.utcnow()

    if "message" in data:
        msg = TicketMessage(
            ticket_id=ticket.id,
            sender_type=data.get("sender_type", "agent"),
            message=data["message"],
        )
        db.session.add(msg)

    db.session.commit()

    payload = ticket.to_dict(include_messages=True)
    socketio.emit("ticket_updated", payload)

    return jsonify(payload)


@tickets_bp.route("/tickets/<int:ticket_id>", methods=["DELETE"])
def delete_ticket(ticket_id):
    ticket = db.get_or_404(Ticket, ticket_id)
    TicketMessage.query.filter_by(ticket_id=ticket_id).delete()
    db.session.delete(ticket)
    db.session.commit()
    socketio.emit("ticket_deleted", {"id": ticket_id})
    return jsonify({"message": "Ticket deleted"})


@tickets_bp.route("/tickets/<int:ticket_id>/messages", methods=["POST"])
def add_message(ticket_id):
    db.get_or_404(Ticket, ticket_id)
    data = request.json or {}

    msg = TicketMessage(
        ticket_id=ticket_id,
        sender_type=data.get("sender_type", "agent"),
        message=data.get("message"),
    )
    db.session.add(msg)
    db.session.commit()

    payload = msg.to_dict()
    socketio.emit("message_added", payload)
    return jsonify(payload), 201


@tickets_bp.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])
