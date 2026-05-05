let mode = localStorage.getItem("mode") || "pvp";
let board = [["", "", ""], ["", "", ""], ["", "", ""]];
let turn = "X";
let scores = { X: 0, O: 0, draw: 0 };
let locked = false;
let gameOver = false;
let nextRoundStarter = "X"; // Track who starts the next match

window.onload = () => {
    document.getElementById("modeTitle").innerText =
        mode === "ai" ? "🤖 AI Mode" : "👥 PvP Mode";
    draw();
};

function draw() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";

    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const btn = document.createElement("div");
            btn.className = "cell";
            btn.innerText = cell;
            btn.onclick = () => play(i, j);
            boardEl.appendChild(btn);
        });
    });

    // Visual feedback: Highlight whose turn it is on the scoreboard
    document.getElementById("xScore").parentElement.style.boxShadow = 
        turn === "X" ? "0 0 15px #ff4d4d" : "none";
    document.getElementById("oScore").parentElement.style.boxShadow = 
        turn === "O" ? "0 0 15px #00ffe1" : "none";

    updateScores();
}

function play(i, j) {
    if (board[i][j] !== "" || gameOver || locked) return;

    board[i][j] = turn;
    draw();

    const winLine = checkWinner(turn);
    if (winLine) {
        highlightWin(winLine);
        // The winner loses the starting advantage for the next round
        nextRoundStarter = (turn === "X") ? "O" : "X";
        setTimeout(() => endGame(turn), 600);
        return;
    }

    if (isDraw()) {
        // On draw, just alternate the starter
        nextRoundStarter = (nextRoundStarter === "X") ? "O" : "X";
        endGame("draw");
        return;
    }

    turn = turn === "X" ? "O" : "X";

    if (mode === "ai" && turn === "O") {
        aiMove();
    }
}

function aiMove() {
    locked = true;
    document.getElementById("aiThinking").classList.remove("hidden");

    setTimeout(() => {
        let move = bestMove();
        board[move.i][move.j] = "O";
        draw();

        document.getElementById("aiThinking").classList.add("hidden");

        const winLine = checkWinner("O");
        if (winLine) {
            highlightWin(winLine);
            nextRoundStarter = "X"; // AI won, Player starts next
            setTimeout(() => endGame("O"), 600);
        } else if (isDraw()) {
            nextRoundStarter = "X"; 
            endGame("draw");
        } else {
            turn = "X";
            locked = false;
        }
    }, 700);
}

function checkWinner(p) {
    const lines = [
        [[0,0], [0,1], [0,2]], [[1,0], [1,1], [1,2]], [[2,0], [2,1], [2,2]], // Rows
        [[0,0], [1,0], [2,0]], [[0,1], [1,1], [2,1]], [[0,2], [1,2], [2,2]], // Cols
        [[0,0], [1,1], [2,2]], [[0,2], [1,1], [2,0]]  // Diagonals
    ];
    for (let line of lines) {
        if (line.every(([r, c]) => board[r][c] === p)) return line;
    }
    return null;
}

function highlightWin(line) {
    const cells = document.getElementsByClassName("cell");
    line.forEach(([r, c]) => {
        cells[r * 3 + c].classList.add("winning-cell");
    });
}

function endGame(result) {
    gameOver = true;

    if (result === "X") scores.X++;
    else if (result === "O") scores.O++;
    else scores.draw++;

    document.getElementById("winnerText").innerHTML = 
        (result === "draw" ? "🤝 Draw!" : `🏆 ${result} Wins!`) + 
        `<br><span style="font-size: 1rem; color: #ffd166;">Next round: ${nextRoundStarter} starts</span>`;

    document.getElementById("modal").style.display = "flex";
    updateScores();
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    resetBoard();
}

function resetBoard() {
    board = [["", "", ""], ["", "", ""], ["", "", ""]];
    gameOver = false;
    locked = false;
    
    // Use the player who was designated to start
    turn = nextRoundStarter; 
    
    draw();

    // If AI is starting (O), trigger its move automatically
    if (mode === "ai" && turn === "O") {
        aiMove();
    }
}

function resetGame() {
    scores = { X: 0, O: 0, draw: 0 };
    nextRoundStarter = "X";
    resetBoard();
}

function updateScores() {
    document.getElementById("xScore").innerText = scores.X;
    document.getElementById("oScore").innerText = scores.O;
    document.getElementById("dScore").innerText = scores.draw;
}

function goBack() {
    window.location.href = "index.html";
}

// Logic for the basic AI (bestMove function stays as you had it or you can upgrade to minimax)
function bestMove() {
    for (let p of ["O", "X"]) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === "") {
                    board[i][j] = p;
                    if (checkWinner(p)) {
                        board[i][j] = "";
                        return { i, j };
                    }
                    board[i][j] = "";
                }
            }
        }
    }
    let moves = [[1, 1], [0, 0], [0, 2], [2, 0], [2, 2]];
    for (let [i, j] of moves) {
        if (board[i][j] === "") return { i, j };
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === "") return { i, j };
        }
    }
}

function isDraw() {
    return board.flat().every(c => c !== "");
}