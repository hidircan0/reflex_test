# Reflex Test

A web reaction-time game with F1-style start lights. Scores are stored in Postgres as `nickname` + `reaction_ms`. There is no user login.

## How it works

1. Enter a nickname and press **New round** (or Enter).
2. The red lights turn on one column at a time, then switch to green after a random 2–6 second wait.
3. When the lights go green, press **Trigger** (or Space). The time is saved in milliseconds.
4. Pressing before green cancels the round: `Hatalı Çıkış! Çok erken bastınız`

If that nickname already exists, the old score is not overwritten. The current and new times are shown; confirm to update the record.

## Requirements

- Docker and Docker Compose
- A `.env` file in the project root

## Setup

```bash
cp .env.example .env
```

Set a strong `POSTGRES_PASSWORD` in `.env`:

```env
POSTGRES_USER=refleks
POSTGRES_PASSWORD=a-strong-password
POSTGRES_DB=refleks
```

## Start

```bash
docker compose up --build -d
```

App: [http://localhost:8080](http://localhost:8080)

## Stop

```bash
docker compose down
```

Containers stop. Scores stay in the `postgres_data` volume.

To wipe the data as well:

```bash
docker compose down -v
```

## Ports

| Service  | Address                                  |
| -------- | ---------------------------------------- |
| Web      | `http://localhost:8080`                  |
| API      | `http://127.0.0.1:8001` (localhost only) |
| Postgres | `localhost:5433`                         |

The browser also reaches the API through `/api` (`/api/health`, `/api/scores`).

## Layout

```
frontend/           HTML, CSS, JS, nginx
backend/            FastAPI + Postgres
docker-compose.yml
.env.example
```

The nickname is kept in `localStorage`. The scoreboard stores one row per nickname (case-insensitive).

## Tests

```bash
node tests/game.test.js
```
