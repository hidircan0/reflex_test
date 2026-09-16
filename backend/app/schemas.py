import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

NICKNAME_RE = re.compile(
    r"^[A-Za-z0-9ÇĞİÖŞÜçğıöşü_-]+(?: [A-Za-z0-9ÇĞİÖŞÜçğıöşü_-]+)*$"
)


def normalize_nickname(value: str) -> str:
    nick = " ".join(str(value).split())
    if not (2 <= len(nick) <= 24) or not NICKNAME_RE.fullmatch(nick):
        raise ValueError("nickname must be 2-24 letters, numbers, or spaces")
    return nick


class ScoreCreate(BaseModel):
    nickname: str = Field(min_length=2, max_length=24)
    reaction_ms: int = Field(gt=0, le=10000)

    @field_validator("nickname", mode="before")
    @classmethod
    def collapse_nickname(cls, value: str) -> str:
        return normalize_nickname(value)


class ScoreUpdate(BaseModel):
    reaction_ms: int = Field(gt=0, le=10000)


class ScoreRead(BaseModel):
    id: int
    nickname: str
    reaction_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthRead(BaseModel):
    status: str
