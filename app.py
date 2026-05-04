from flask import Flask, render_template

app = Flask(__name__)

# Serve the main game page
@app.route("/")
def home():
    return render_template("index.html")


# Optional: future API endpoint (not used yet, but useful for upgrades)
@app.route("/health")
def health():
    return {"status": "running", "game": "tic-tac-toe"}

if __name__ == "__main__":
    app.run(debug=True)