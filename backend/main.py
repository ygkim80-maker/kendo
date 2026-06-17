from datetime import date, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import init_db, get_db, Student, AttendanceLog, SkillStat, MatchRecord, CoachFeedback, Zone, MatchResult, OpponentType
from schemas import (
    StudentCreate, StudentOut, AttendanceCreate, AttendanceOut,
    SkillStatOut, SkillStatCreate, MatchRecordOut,
    CoachFeedbackOut, CoachFeedbackCreate,
    BattleStart, BattleAction,
)
from battle import BattleSession
from seed import seed

app = FastAPI(title="정진 — Kendo Training API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

active_battles: dict[int, BattleSession] = {}


@app.on_event("startup")
def startup():
    init_db()
    seed()


@app.get("/api/students", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@app.get("/api/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).get(student_id)
    if not s:
        raise HTTPException(404)
    return s


@app.post("/api/students", response_model=StudentOut)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    s = Student(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@app.get("/api/students/{student_id}/attendance", response_model=list[AttendanceOut])
def get_attendance(student_id: int, db: Session = Depends(get_db)):
    monday = date.today() - timedelta(days=date.today().weekday())
    return (
        db.query(AttendanceLog)
        .filter(AttendanceLog.student_id == student_id, AttendanceLog.date >= monday)
        .order_by(AttendanceLog.date)
        .all()
    )


@app.post("/api/attendance", response_model=AttendanceOut)
def log_attendance(data: AttendanceCreate, db: Session = Depends(get_db)):
    log = AttendanceLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.get("/api/students/{student_id}/skills", response_model=list[SkillStatOut])
def get_skills(student_id: int, db: Session = Depends(get_db)):
    month = date.today().strftime("%Y-%m")
    return (
        db.query(SkillStat)
        .filter(SkillStat.student_id == student_id, SkillStat.month == month)
        .all()
    )


@app.post("/api/skills", response_model=SkillStatOut)
def update_skill(data: SkillStatCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(SkillStat)
        .filter(SkillStat.student_id == data.student_id, SkillStat.zone == data.zone, SkillStat.month == data.month)
        .first()
    )
    if existing:
        existing.score = data.score
        db.commit()
        db.refresh(existing)
        return existing
    stat = SkillStat(**data.model_dump())
    db.add(stat)
    db.commit()
    db.refresh(stat)
    return stat


@app.get("/api/ranking")
def get_ranking(db: Session = Depends(get_db)):
    month = date.today().strftime("%Y-%m")
    results = (
        db.query(Student.id, Student.name, func.sum(SkillStat.score).label("total"))
        .join(SkillStat)
        .filter(SkillStat.month == month)
        .group_by(Student.id)
        .order_by(func.sum(SkillStat.score).desc())
        .all()
    )
    return [{"rank": i + 1, "id": r.id, "name": r.name, "score": round(r.total)} for i, r in enumerate(results)]


@app.get("/api/students/{student_id}/feedback", response_model=list[CoachFeedbackOut])
def get_feedback(student_id: int, db: Session = Depends(get_db)):
    return (
        db.query(CoachFeedback)
        .filter(CoachFeedback.student_id == student_id)
        .order_by(CoachFeedback.date.desc())
        .limit(5)
        .all()
    )


@app.post("/api/feedback", response_model=CoachFeedbackOut)
def create_feedback(data: CoachFeedbackCreate, db: Session = Depends(get_db)):
    fb = CoachFeedback(**data.model_dump(), date=date.today())
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@app.get("/api/students/{student_id}/matches", response_model=list[MatchRecordOut])
def get_matches(student_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MatchRecord)
        .filter(MatchRecord.student_id == student_id)
        .order_by(MatchRecord.date.desc())
        .limit(20)
        .all()
    )


@app.post("/api/battle/start")
def battle_start(data: BattleStart, db: Session = Depends(get_db)):
    student = db.query(Student).get(data.student_id)
    if not student:
        raise HTTPException(404, "Student not found")

    month = date.today().strftime("%Y-%m")
    skills = db.query(SkillStat).filter(SkillStat.student_id == data.student_id, SkillStat.month == month).all()
    player_stats = {s.zone.value if hasattr(s.zone, 'value') else s.zone: s.score for s in skills}
    for z in ["head", "wrist", "waist", "thrust"]:
        player_stats.setdefault(z, 50.0)

    if data.opponent_type == "ghost" and data.opponent_student_id:
        opp = db.query(Student).get(data.opponent_student_id)
        if not opp:
            raise HTTPException(404, "Opponent not found")
        opp_skills = db.query(SkillStat).filter(SkillStat.student_id == opp.id, SkillStat.month == month).all()
        opponent_stats = {s.zone.value if hasattr(s.zone, 'value') else s.zone: s.score for s in opp_skills}
        for z in ["head", "wrist", "waist", "thrust"]:
            opponent_stats.setdefault(z, 50.0)
        opponent_name = opp.name
    else:
        opponent_stats = {zone: score * 0.85 for zone, score in player_stats.items()}
        opponent_name = "AI 상대"

    session = BattleSession(player_stats, opponent_stats, opponent_name)
    active_battles[data.student_id] = session

    return {
        "status": "started",
        "opponent_name": opponent_name,
        **session.get_state(),
    }


@app.post("/api/battle/action/{student_id}")
def battle_action(student_id: int, action: BattleAction):
    session = active_battles.get(student_id)
    if not session:
        raise HTTPException(404, "No active battle")
    return session.process(
        action=action.action,
        zone=action.zone,
        kiai=action.kiai,
        kamae=action.kamae_change,
    )


@app.post("/api/battle/timeout/{student_id}")
def battle_timeout(student_id: int, db: Session = Depends(get_db)):
    session = active_battles.get(student_id)
    if not session:
        raise HTTPException(404, "No active battle")
    result = session.timeout_judge()

    record = MatchRecord(
        student_id=student_id,
        opponent_type=OpponentType.ai,
        opponent_name=session.opponent_name,
        score_player=session.player_score,
        score_opponent=session.opponent_score,
        result=MatchResult(result["result"]),
        date=date.today(),
    )
    db.add(record)
    db.commit()
    del active_battles[student_id]
    return result


@app.post("/api/battle/finish/{student_id}")
def battle_finish(student_id: int, db: Session = Depends(get_db)):
    session = active_battles.get(student_id)
    if not session:
        raise HTTPException(404, "No active battle")
    if not session.finished:
        return session.timeout_judge()

    record = MatchRecord(
        student_id=student_id,
        opponent_type=OpponentType.ai,
        opponent_name=session.opponent_name,
        score_player=session.player_score,
        score_opponent=session.opponent_score,
        result=MatchResult(session.result),
        date=date.today(),
    )
    db.add(record)
    db.commit()
    del active_battles[student_id]
    return {"result": session.result, "score": {"player": session.player_score, "opponent": session.opponent_score}}
