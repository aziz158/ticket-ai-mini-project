from flask import Flask
from flask_cors import CORS

from database import db
from extensions import socketio
from routes.ai_routes import ai_bp
from routes.analytics import analytics_bp
from routes.tickets import tickets_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///support.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "jeeva-ai-secret-key-change-in-prod"

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")

    app.register_blueprint(tickets_bp, url_prefix="/api")
    app.register_blueprint(ai_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app


app = create_app()


@socketio.on("connect")
def on_connect():
    print("Client connected")


@socketio.on("disconnect")
def on_disconnect():
    print("Client disconnected")


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
