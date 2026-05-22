import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

CATEGORIES = [
    "Billing",
    "Refund",
    "Technical Support",
    "Account Issue",
    "Complaint",
    "Feature Request",
    "General Inquiry",
]

SENTIMENTS = ["Positive", "Neutral", "Negative", "Angry"]

LEGAL_KEYWORDS = ["lawsuit", "legal action", "sue", "attorney", "lawyer", "court", "fraud", "scam"]
REFUND_KEYWORDS = ["refund", "money back", "chargeback", "dispute"]


def _call_ollama(prompt: str) -> str | None:
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": MODEL, "prompt": prompt, "stream": False},
            timeout=60,
        )
        if resp.status_code == 200:
            return resp.json().get("response", "").strip()
    except Exception as e:
        print(f"[Ollama] {e}")
    return None


def classify_ticket(subject: str, message: str) -> dict:
    prompt = (
        f"You are a customer support classifier. Classify this ticket into exactly one category "
        f"and rate your confidence as a percentage.\n"
        f"Categories: {', '.join(CATEGORIES)}\n\n"
        f"Subject: {subject}\nMessage: {message}\n\n"
        f"Respond with ONLY this format and nothing else: <category>, <confidence>\n"
        f"Example: Billing, 92"
    )
    result = _call_ollama(prompt)
    category = "General Inquiry"
    confidence = 0.75

    if result:
        # Parse "Category, 92" format
        parts = result.strip().split(",")
        if len(parts) >= 2:
            raw_cat = parts[0].strip()
            raw_conf = parts[-1].strip().rstrip("%")
            for cat in CATEGORIES:
                if cat.lower() in raw_cat.lower():
                    category = cat
                    break
            try:
                parsed = float(raw_conf)
                # Model may return 0-100 or 0-1
                confidence = parsed / 100 if parsed > 1 else parsed
                confidence = max(0.0, min(confidence, 1.0))
            except ValueError:
                confidence = 0.80
        else:
            # Fallback: plain category name with no confidence
            for cat in CATEGORIES:
                if cat.lower() in result.lower():
                    category = cat
                    confidence = 0.80
                    break

    return {"category": category, "confidence": round(confidence, 2)}


def analyze_sentiment(message: str) -> dict:
    prompt = (
        f"You are a sentiment analyzer. Classify the sentiment of this customer message.\n"
        f"Options: {', '.join(SENTIMENTS)}\n\n"
        f"Message: {message}\n\n"
        f"Respond with ONLY the sentiment, nothing else."
    )
    result = _call_ollama(prompt)
    sentiment = "Neutral"

    if result:
        for s in SENTIMENTS:
            if s.lower() in result.lower():
                sentiment = s
                break

    return {"sentiment": sentiment}


def summarize_ticket(subject: str, message: str) -> dict:
    prompt = (
        f"You are a customer support AI. Summarize this support ticket in 1-2 concise sentences.\n\n"
        f"Subject: {subject}\nMessage: {message}\n\n"
        f"Provide only the summary, nothing else."
    )
    result = _call_ollama(prompt)
    return {"summary": result or f"Customer inquiry regarding: {subject}"}


def suggest_reply(
    subject: str, message: str, sentiment: str | None = None, category: str | None = None
) -> dict:
    context = ""
    if sentiment:
        context += f"Customer sentiment: {sentiment}. "
    if category:
        context += f"Issue category: {category}. "

    prompt = (
        f"You are a professional customer support agent. Write a helpful, empathetic reply.\n"
        f"{context}\n\n"
        f"Subject: {subject}\nCustomer Message: {message}\n\n"
        f"Write a professional response. Be concise and helpful."
    )
    result = _call_ollama(prompt)
    fallback = "Thank you for contacting support. We have received your request and will respond shortly."
    return {"reply": result or fallback}


def detect_escalation(
    message: str, sentiment: str | None = None, ai_confidence: float | None = None
) -> dict:
    reasons: list[str] = []

    if sentiment == "Angry":
        reasons.append("Angry customer")

    if ai_confidence is not None and ai_confidence < 0.7:
        reasons.append("Low AI confidence")

    if any(kw in message.lower() for kw in LEGAL_KEYWORDS):
        reasons.append("Legal threat detected")

    if any(kw in message.lower() for kw in REFUND_KEYWORDS) and sentiment in ("Negative", "Angry"):
        reasons.append("Refund dispute")

    if not reasons:
        prompt = (
            f"Should this customer support message be escalated to a human agent?\n"
            f"Respond with YES or NO only.\n\nMessage: {message}"
        )
        result = _call_ollama(prompt)
        if result and "yes" in result.lower():
            reasons.append("AI recommended escalation")

    return {
        "should_escalate": bool(reasons),
        "reasons": reasons,
        "escalation_reason": "; ".join(reasons) if reasons else None,
    }
