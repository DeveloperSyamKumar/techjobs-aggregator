from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    posted_date: datetime
    apply_link: Optional[str] = None
    experience: Optional[str] = None
    source: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int

    class Config:
        from_attributes = True
