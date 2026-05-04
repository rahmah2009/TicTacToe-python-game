from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- GLOBAL DATA ---
scores = {"X": 0, "O": 0, "draw": 0}
next_starter = "X" 
game = {
    "board": [["", "", ""], ["", "", ""], ["", "", ""]],
    "turn": "X",
    "mode": "pvp",
    "game_over": False
}

def check_winner(b, p):
    # Rows and Columns
    for i in range(3):
        if all(b[i][j] == p for j in range(3)) or all(b[j][i] == p for j in range(3)):
            return True
    # Diagonals
    if b[0][0] == p and b[1][1] == p and b[2][2] == p: return True
    if b[0][2] == p and b[1][1] == p and b[2][0] == p: return True
    return False

def is_draw(b):
    return all(cell != "" for row in b for cell in row)

def best_move(board):
    # 1. Win / Block
    for p in ["O", "X"]:
        for i in range(3):
            for j in range(3):
                if board[i][j] == "":
                    board[i][j] = p
                    if check_winner(board, p):
                        board[i][j] = ""
                        return i, j
                    board[i][j] = ""
    # 2. Logic: Center, then Corners
    for r, c in [(1,1), (0,0), (0,2), (2,0), (2,2)]:
        if board[r][c] == "": return r, c
    return next((r, c) for r in range(3) for c in range(3) if board[r][c] == "")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/mode", methods=["POST"])
def set_mode():
    global scores, next_starter
    game["mode"] = request.json["mode"]
    # HARD RESET for new mode
    scores = {"X": 0, "O": 0, "draw": 0}
    next_starter = "X"
    reset_logic(full_reset=True)
    return jsonify({"board": game["board"], "scores": scores, "turn": game["turn"]})

@app.route("/move", methods=["POST"])
def move():
    global next_starter
    data = request.json
    i, j = data.get("i"), data.get("j")
    
    # Handle AI auto-start signal
    if i == -1 and game["mode"] == "ai" and game["turn"] == "O":
        ai_i, ai_j = best_move(game["board"])
        game["board"][ai_i][ai_j] = "O"
        game["turn"] = "X"
        return jsonify({"board": game["board"], "scores": scores, "turn": "X"})

    if game["game_over"] or game["board"][i][j] != "":
        return jsonify({"error": "Invalid"}), 400

    curr = game["turn"]
    game["board"][i][j] = curr

    # Check Winner
    if check_winner(game["board"], curr):
        game["game_over"] = True
        scores[curr] += 1
        next_starter = "O" if curr == "X" else "X"
        return jsonify({"board": game["board"], "winner": curr, "scores": scores, "next_starter": next_starter})
    
    if is_draw(game["board"]):
        game["game_over"] = True
        scores["draw"] += 1
        next_starter = "O" if next_starter == "X" else "X"
        return jsonify({"board": game["board"], "winner": "draw", "scores": scores, "next_starter": next_starter})

    # AI Turn
    if game["mode"] == "ai":
        ai_i, ai_j = best_move(game["board"])
        game["board"][ai_i][ai_j] = "O"
        if check_winner(game["board"], "O"):
            game["game_over"] = True
            scores["O"] += 1
            next_starter = "X"
            return jsonify({"board": game["board"], "winner": "O", "scores": scores, "next_starter": "X"})
        if is_draw(game["board"]):
            game["game_over"] = True
            scores["draw"] += 1
            next_starter = "X"
            return jsonify({"board": game["board"], "winner": "draw", "scores": scores, "next_starter": "X"})
        game["turn"] = "X"
    else:
        game["turn"] = "O" if curr == "X" else "X"

    return jsonify({"board": game["board"], "scores": scores, "turn": game["turn"]})

@app.route("/reset", methods=["POST"])
def reset():
    global scores, next_starter
    scores = {"X": 0, "O": 0, "draw": 0}
    next_starter = "X"
    reset_logic(full_reset=True)
    return jsonify({"board": game["board"], "scores": scores, "turn": game["turn"]})

@app.route("/next_round", methods=["POST"])
def next_round():
    reset_logic(full_reset=False)
    return jsonify({"board": game["board"], "scores": scores, "turn": game["turn"]})

def reset_logic(full_reset):
    game["board"] = [["", "", ""], ["", "", ""], ["", "", ""]]
    game["turn"] = "X" if full_reset else next_starter
    game["game_over"] = False

if __name__ == "__main__":
    app.run(debug=True)