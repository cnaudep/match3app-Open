from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

leaderboard = []

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json
    name = data.get("name", "Игрок")
    moves = data.get("moves", 0)

    if isinstance(name, str) and isinstance(moves, int):
        leaderboard.append({"name": name, "moves": moves})
        leaderboard.sort(key=lambda x: -x["moves"])  # Больше ходов — выше
        del leaderboard[5:]
        return jsonify(success=True)
    return jsonify(error="Invalid data"), 400

@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify(leaderboard)