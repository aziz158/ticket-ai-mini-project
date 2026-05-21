from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from sqlalchemy import func

from database import db
from models import Ticket, User

analytics_bp = Blueprint("analytics", __name__)


def _day_range(days_ago: int):
    day = datetime.utcnow() - timedelta(days=days_ago)
    return (
        day.replace(hour=0, minute=0, second=0, microsecond=0),
        day.replace(hour=23, minute=59, second=59, microsecond=999999),
    )


@analytics_bp.route("/analytics/overview", methods=["GET"])
def overview():
    total = Ticket.query.count()
    open_count = Ticket.query.filter_by(status="Open").count()
    resolved_count = Ticket.query.filter_by(status="Resolved").count()
    pending_count = Ticket.query.filter_by(status="Pending").count()
    escalated_count = Ticket.query.filter(Ticket.escalated.is_(True)).count()

    ai_resolved = Ticket.query.filter(
        Ticket.status == "Resolved",
        Ticket.escalated.is_(False),
        Ticket.ai_confidence >= 0.8,
    ).count()
    ai_resolved_pct = round((ai_resolved / resolved_count * 100) if resolved_count else 0, 1)

    resolved_tickets = Ticket.query.filter(
        Ticket.status == "Resolved",
        Ticket.resolved_at.isnot(None),
    ).all()
    avg_response_hours = 0.0
    if resolved_tickets:
        total_hours = sum(
            (t.resolved_at - t.created_at).total_seconds() / 3600
            for t in resolved_tickets
            if t.resolved_at and t.created_at
        )
        avg_response_hours = round(total_hours / len(resolved_tickets), 1)

    sentiment_dist = db.session.query(Ticket.sentiment, func.count(Ticket.id)).group_by(Ticket.sentiment).all()
    priority_dist = db.session.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all()
    category_dist = db.session.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()

    return jsonify(
        {
            "total_tickets": total,
            "open_tickets": open_count,
            "resolved_tickets": resolved_count,
            "pending_tickets": pending_count,
            "escalated_tickets": escalated_count,
            "ai_resolved_percentage": ai_resolved_pct,
            "avg_response_time_hours": avg_response_hours,
            "sentiment_distribution": {s: c for s, c in sentiment_dist if s},
            "priority_distribution": {p: c for p, c in priority_dist if p},
            "category_distribution": {cat: c for cat, c in category_dist if cat},
        }
    )


@analytics_bp.route("/analytics/escalations", methods=["GET"])
def escalations():
    escalated_tickets = Ticket.query.filter(Ticket.escalated.is_(True)).all()

    reasons: dict[str, int] = {}
    for t in escalated_tickets:
        if t.escalation_reason:
            for part in t.escalation_reason.split(";"):
                r = part.strip()
                if r:
                    reasons[r] = reasons.get(r, 0) + 1

    daily = []
    for i in range(6, -1, -1):
        start, end = _day_range(i)
        day_total = Ticket.query.filter(Ticket.created_at.between(start, end)).count()
        day_esc = Ticket.query.filter(
            Ticket.created_at.between(start, end),
            Ticket.escalated.is_(True),
        ).count()
        daily.append(
            {
                "date": start.strftime("%Y-%m-%d"),
                "total": day_total,
                "escalated": day_esc,
                "rate": round((day_esc / day_total * 100) if day_total else 0, 1),
            }
        )

    return jsonify(
        {
            "total_escalated": len(escalated_tickets),
            "escalation_reasons": reasons,
            "daily_escalations": daily,
        }
    )


@analytics_bp.route("/analytics/sentiment", methods=["GET"])
def sentiment_trends():
    trends = []
    for i in range(13, -1, -1):
        start, end = _day_range(i)
        rows = (
            db.session.query(Ticket.sentiment, func.count(Ticket.id))
            .filter(Ticket.created_at.between(start, end))
            .group_by(Ticket.sentiment)
            .all()
        )
        entry: dict = {"date": start.strftime("%Y-%m-%d")}
        for s, c in rows:
            if s:
                entry[s] = c
        trends.append(entry)

    overall = db.session.query(Ticket.sentiment, func.count(Ticket.id)).group_by(Ticket.sentiment).all()

    return jsonify(
        {
            "trends": trends,
            "overall": {s: c for s, c in overall if s},
        }
    )


@analytics_bp.route("/analytics/performance", methods=["GET"])
def performance():
    agents = User.query.filter_by(role="Support Agent").all()
    agent_stats = []
    for agent in agents:
        total = Ticket.query.filter_by(assigned_agent_id=agent.id).count()
        resolved = Ticket.query.filter_by(assigned_agent_id=agent.id, status="Resolved").count()
        agent_stats.append(
            {
                "agent": agent.to_dict(),
                "total_assigned": total,
                "resolved": resolved,
                "resolution_rate": round((resolved / total * 100) if total else 0, 1),
            }
        )

    daily_volume = []
    for i in range(29, -1, -1):
        start, end = _day_range(i)
        count = Ticket.query.filter(Ticket.created_at.between(start, end)).count()
        daily_volume.append({"date": start.strftime("%Y-%m-%d"), "count": count})

    ai_resolved = Ticket.query.filter(
        Ticket.status == "Resolved", Ticket.escalated.is_(False), Ticket.ai_confidence >= 0.8
    ).count()
    human_resolved = Ticket.query.filter(
        Ticket.status == "Resolved",
        db.or_(Ticket.escalated.is_(True), Ticket.ai_confidence < 0.8),
    ).count()

    return jsonify(
        {
            "agent_performance": agent_stats,
            "daily_volume": daily_volume,
            "ai_vs_human": {"ai": ai_resolved, "human": human_resolved},
        }
    )
