export class ScoreboardView {
  constructor(root) {
    this._body = root.querySelector("#scoreboard-body");
    this._empty = root.querySelector("#scoreboard-empty");
  }

  render(scores, currentNickname) {
    this._body.replaceChildren();
    if (!scores.length) {
      this._empty.hidden = false;
      this._empty.textContent = "Henüz skor yok.";
      return;
    }

    this._empty.hidden = true;
    const fragment = document.createDocumentFragment();
    scores.forEach((score, index) => {
      const row = document.createElement("tr");
      if (score.nickname.toLowerCase() === currentNickname.toLowerCase()) {
        row.classList.add("is-you");
      }
      const when = new Date(score.created_at);
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(score.nickname)}</td>
        <td>${score.reaction_ms} ms</td>
        <td>${when.toLocaleString("tr-TR")}</td>
      `;
      fragment.appendChild(row);
    });
    this._body.appendChild(fragment);
  }

  showError() {
    this._body.replaceChildren();
    this._empty.hidden = false;
    this._empty.textContent = "Skorboard yüklenemedi.";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
