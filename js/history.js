// ──────────────────────────────────────────────────────────
// HISTÓRICO UNDO / REDO
// ──────────────────────────────────────────────────────────

const history = [];
let historyIndex = -1;
let ignoreHistory = false;

function pushHistory() {
  if (ignoreHistory) return;
  const json = JSON.stringify(snapshotCanvasState());
  if (history[historyIndex] === json) return;
  history.splice(historyIndex + 1);
  history.push(json);
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreHistory(history[historyIndex]);
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restoreHistory(history[historyIndex]);
}

function restoreHistory(json) {
  restoreCanvasState(json, { after: updateUndoRedo });
}

function updateUndoRedo() {
  document.getElementById('btn-undo').disabled = historyIndex <= 0;
  document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
}
