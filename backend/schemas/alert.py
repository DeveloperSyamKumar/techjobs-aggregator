from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertCreate(BaseModel):
    name: str
    keyword: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    days_ago: Optional[int] = None


class AlertUpdate(BaseModel):
    is_active: Optional[bool] = None


class AlertResponse(BaseModel):
    id: int
    name: str
    keyword: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    days_ago: Optional[int] = None
    is_active: bool
    match_count: int
    created_at: datetime
    last_triggered_at: Optional[datetime] = None

    class Config:
        from_attributes = True
