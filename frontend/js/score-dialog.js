export class ScoreUpdateDialog {
  constructor(root) {
    this._dialog = root.querySelector("#score-update-dialog");
    this._nickname = root.querySelector("#dialog-nickname");
    this._current = root.querySelector("#dialog-current-score");
    this._next = root.querySelector("#dialog-new-score");
  }

  confirm({ nickname, currentMs, newMs }) {
    this._nickname.textContent = nickname;
    this._current.textContent = `${currentMs} ms`;
    this._next.textContent = `${newMs} ms`;
    this._dialog.returnValue = "cancel";
    this._dialog.showModal();

    return new Promise((resolve) => {
      this._dialog.addEventListener(
        "close",
        () => resolve(this._dialog.returnValue === "confirm"),
        { once: true },
      );
    });
  }
}
