from pydantic import BaseModel
from datetime import date
from typing import Optional


class StudentCreate(BaseModel):
    name: str
    dojang_id: int = 1
    grade: str = "初段"
    join_date: date


class StudentOut(BaseModel):
    id: int
    name: str
    dojang_id: int
    grade: str
    join_date: date
    model_config = {"from_attributes": True}


class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    present: bool = True


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: date
    present: bool
    model_config = {"from_attributes": True}


class SkillStatOut(BaseModel):
    id: int
    student_id: int
    zone: str
    score: float
    month: str
    model_config = {"from_attributes": True}


class SkillStatCreate(BaseModel):
    student_id: int
    zone: str
    score: float
    month: str


class MatchRecordOut(BaseModel):
    id: int
    student_id: int
    opponent_type: str
    opponent_name: str
    score_player: int
    score_opponent: int
    result: str
    date: date
    model_config = {"from_attributes": True}


class CoachFeedbackOut(BaseModel):
    id: int
    student_id: int
    coach_name: str
    text: str
    ai_drafted: bool
    date: date
    model_config = {"from_attributes": True}


class CoachFeedbackCreate(BaseModel):
    student_id: int
    coach_name: str
    text: str
    ai_drafted: bool = False


class BattleAction(BaseModel):
    zone: str
    timing: float


class BattleStart(BaseModel):
    student_id: int
    opponent_type: str = "ai"
    opponent_student_id: Optional[int] = None
