from flask import Blueprint, jsonify, request

from database import db
from models import Ticket
from services.ai_service import (
    analyze_sentiment,
    classify_ticket,
    detect_escalation,
    suggest_reply,
    summarize_ticket,
)

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ai/classify", methods=["POST"])
def classify():
    data = request.json or {}
    return jsonify(classify_ticket(data.get("subject", ""), data.get("message", "")))


@ai_bp.route("/ai/summarize", methods=["POST"])
def summarize():
    data = request.json or {}
    return jsonify(summarize_ticket(data.get("subject", ""), data.get("message", "")))


@ai_bp.route("/ai/suggest-reply", methods=["POST"])
def suggest():
    data = request.json or {}
    return jsonify(
        suggest_reply(
            data.get("subject", ""),
            data.get("message", ""),
            data.get("sentiment"),
            data.get("category"),
        )
    )


@ai_bp.route("/ai/analyze-sentiment", methods=["POST"])
def sentiment():
    data = request.json or {}
    return jsonify(analyze_sentiment(data.get("message", "")))


@ai_bp.route("/ai/process-ticket/<int:ticket_id>", methods=["POST"])
def process_ticket(ticket_id):
    """Re-run the full AI pipeline on an existing ticket."""
    ticket = db.get_or_404(Ticket, ticket_id)
    subject = ticket.subject or ""
    message = ticket.message or ""

    c = classify_ticket(subject, message)
    ticket.category = c["category"]
    ticket.ai_confidence = c["confidence"]

    ticket.sentiment = analyze_sentiment(message)["sentiment"]
    ticket.ai_summary = summarize_ticket(subject, message)["summary"]
    ticket.ai_suggested_reply = suggest_reply(subject, message, ticket.sentiment, ticket.category)["reply"]

    esc = detect_escalation(message, ticket.sentiment, ticket.ai_confidence)
    ticket.escalated = esc["should_escalate"]
    ticket.escalation_reason = esc["escalation_reason"]

    db.session.commit()
    return jsonify(ticket.to_dict())
