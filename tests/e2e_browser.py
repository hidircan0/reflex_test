#!/usr/bin/env python3
"""Headless Chromium pass over the real UI flow."""

from __future__ import annotations

import json
import subprocess
import time
import urllib.error
import urllib.request
BASE = "http://127.0.0.1:8080"
DRIVER = "http://127.0.0.1:9515"


def req(method: str, path: str, body: dict | None = None) -> dict:
    data = None
    if method != "GET":
        data = json.dumps({} if body is None else body).encode()
    request = urllib.request.Request(
        f"{DRIVER}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        raise RuntimeError(f"{method} {path} -> {exc.code}: {detail}") from exc
    return payload.get("value", payload)


def wait_state(session: str, wanted: str, timeout: float = 8.0) -> str:
    deadline = time.monotonic() + timeout
    last = ""
    while time.monotonic() < deadline:
        last = req(
            "POST",
            f"/session/{session}/execute/sync",
            {
                "script": 'return document.getElementById("lights").dataset.state;',
                "args": [],
            },
        )
        if last == wanted:
            return last
        time.sleep(0.05)
    raise SystemExit(f"timeout waiting for state={wanted}, last={last}")


def js(session: str, script: str):
    return req(
        "POST",
        f"/session/{session}/execute/sync",
        {"script": script, "args": []},
    )


def click(session: str, css: str) -> None:
    js(session, f'document.querySelector({css!r}).click();')


def text_of(session: str, css: str) -> str:
    return js(session, f'return document.querySelector({css!r}).textContent.trim();')


def main() -> None:
    driver = subprocess.Popen(
        ["chromedriver", "--port=9515", "--silent"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    session = None
    try:
        session = req(
            "POST",
            "/session",
            {
                "capabilities": {
                    "alwaysMatch": {
                        "browserName": "chrome",
                        "goog:chromeOptions": {
                            "binary": "/usr/bin/chromium",
                            "args": [
                                "--headless=new",
                                "--no-sandbox",
                                "--disable-gpu",
                                "--window-size=1280,900",
                            ],
                        },
                    }
                }
            },
        )["sessionId"]

        req("POST", f"/session/{session}/url", {"url": f"{BASE}/"})
        wait_state(session, "idle")
        lamp_count = js(session, 'return document.querySelectorAll(".lamp").length;')
        if lamp_count != 10:
            raise SystemExit(f"expected 10 lamps, got {lamp_count}")

        js(
            session,
            """
            const input = document.getElementById("nickname");
            input.value = "e2e_rank_check";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            """,
        )

        click(session, "#start-btn")
        wait_state(session, "lighting")
        click(session, "#trigger-btn")
        wait_state(session, "false_start")
        fault = text_of(session, "#status")
        if fault != "Hatalı Çıkış! Çok erken bastınız":
            raise SystemExit(f"unexpected false-start text: {fault!r}")

        click(session, "#start-btn")
        wait_state(session, "go", timeout=14.0)
        click(session, "#trigger-btn")
        wait_state(session, "result")
        deadline = time.monotonic() + 5
        result = ""
        while time.monotonic() < deadline:
            result = text_of(session, "#result")
            if "oldun!" in result:
                break
            time.sleep(0.1)
        if not result.startswith("Tepki süreniz:") or "oldun!" not in result:
            raise SystemExit(f"result did not show placement: {result!r}")

        deadline = time.monotonic() + 5
        rows = 0
        while time.monotonic() < deadline:
            rows = js(session, 'return document.querySelectorAll("#scoreboard-body tr").length;')
            if rows:
                break
            time.sleep(0.1)
        if not rows:
            raise SystemExit("scoreboard did not show the new score")
        print(f"browser flow ok: {result}, rows={rows}")
    finally:
        if session:
            try:
                req("DELETE", f"/session/{session}")
            except urllib.error.URLError:
                pass
        driver.terminate()
        driver.wait(timeout=5)


if __name__ == "__main__":
    main()
