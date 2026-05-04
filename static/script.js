let board = [["","",""],["","",""],["","",""]];
let currentMode = "pvp";
let isLocked = false;

function syncState(data) {
    if (data.board) board = data.board;
    if (data.scores) {
        document.getElementById("xScore").innerText = data.scores.X;
        document.getElementById("oScore").innerText = data.scores.O;
        document.getElementById("dScore").innerText = data.scores.draw;
    }
    draw();

    // Trigger AI if it's O's turn to start the round
    if (currentMode === "ai" && data.turn === "O" && !data.winner) {
        isLocked = true;
        triggerAiStart();
    }
}

async function triggerAiStart() {
    document.getElementById("aiThinking").classList.remove("hidden");
    await new Promise(res => setTimeout(res, 1000));
    const response = await fetch("/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ i: -1, j: -1 })
    });
    const data = await response.json();
    document.getElementById("aiThinking").classList.add("hidden");
    syncState(data);
    isLocked = false;
}

async function play(i, j) {
    if (isLocked || board[i][j] !== "") return;
    
    // Immediate Visual Feedback
    let currentMark = "X";
    if (currentMode === "pvp") {
        const count = board.flat().filter(x => x !== "").length;
        currentMark = (count % 2 === 0) ? "X" : "O";
    }
    board[i][j] = currentMark;
    draw();
    isLocked = true;

    try {
        const response = await fetch("/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ i, j })
        });
        const data = await response.json();

        if (currentMode === "ai" && !data.winner) {
            document.getElementById("aiThinking").classList.remove("hidden");
            await new Promise(res => setTimeout(res, 700));
            document.getElementById("aiThinking").classList.add("hidden");
        }

        syncState(data);
        if (data.winner) showWinnerPopup(data);
        else isLocked = false;
    } catch (e) { isLocked = false; }
}

function showWinnerPopup(data) {
    let title = data.winner === "draw" ? "🤝 Draw!" : `🎉 ${data.winner} Wins!`;
    let subtitle = data.winner === "draw" ? 
        `Next round starts with ${data.next_starter}` : 
        `${data.winner} won, so ${data.next_starter} takes the round!`;

    document.getElementById("winnerText").innerHTML = 
        `<div style="font-size: 1.5rem; margin-bottom: 8px;">${title}</div>` +
        `<div style="font-size: 1rem; color: #888;">${subtitle}</div>`;
    document.getElementById("modal").style.display = "flex";
}

function resetGame() {
    isLocked = true;
    fetch("/reset", { method: "POST" })
    .then(r => r.json())
    .then(data => {
        syncState(data);
        isLocked = false;
    });
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    isLocked = true;
    fetch("/next_round", { method: "POST" })
    .then(r => r.json())
    .then(data => {
        syncState(data);
        isLocked = false;
    });
}

function setMode(m) {
    currentMode = m;
    fetch("/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m })
    })
    .then(r => r.json())
    .then(data => {
        syncState(data);
        document.getElementById("menu").classList.remove("active");
        document.getElementById("game").classList.add("active");
        document.getElementById("modeTitle").innerText = m === "ai" ? "🤖 AI Mode" : "👥 PvP Mode";
    });
}

function goBack() {
    document.getElementById("game").classList.remove("active");
    document.getElementById("menu").classList.add("active");
}

function draw() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const btn = document.createElement("button");
            btn.className = "cell";
            btn.innerText = cell;
            btn.onclick = () => play(i, j);
            boardEl.appendChild(btn);
        });
    });
}