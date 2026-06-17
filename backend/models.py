from sqlalchemy import Column, Integer, String, Boolean, Float, Date, ForeignKey, Enum, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum

Base = declarative_base()


class Zone(str, enum.Enum):
    head = "head"
    wrist = "wrist"
    waist = "waist"
    thrust = "thrust"


class OpponentType(str, enum.Enum):
    ai = "ai"
    ghost = "ghost"


class MatchResult(str, enum.Enum):
    win = "win"
    lose = "lose"
    draw = "draw"


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    dojang_id = Column(Integer, nullable=False, default=1)
    grade = Column(String, nullable=False, default="初段")
    join_date = Column(Date, nullable=False)
    attendance_logs = relationship("AttendanceLog", back_populates="student")
    skill_stats = relationship("SkillStat", back_populates="student")
    match_records = relationship("MatchRecord", back_populates="student")
    feedbacks = relationship("CoachFeedback", back_populates="student")


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    present = Column(Boolean, nullable=False, default=True)
    student = relationship("Student", back_populates="attendance_logs")


class SkillStat(Base):
    __tablename__ = "skill_stats"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    zone = Column(Enum(Zone), nullable=False)
    score = Column(Float, nullable=False, default=50.0)
    month = Column(String, nullable=False)
    student = relationship("Student", back_populates="skill_stats")


class MatchRecord(Base):
    __tablename__ = "match_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    opponent_type = Column(Enum(OpponentType), nullable=False)
    opponent_name = Column(String, nullable=False, default="AI 상대")
    score_player = Column(Integer, nullable=False, default=0)
    score_opponent = Column(Integer, nullable=False, default=0)
    result = Column(Enum(MatchResult), nullable=False)
    date = Column(Date, nullable=False)
    student = relationship("Student", back_populates="match_records")


class CoachFeedback(Base):
    __tablename__ = "coach_feedbacks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    coach_name = Column(String, nullable=False)
    text = Column(String, nullable=False)
    ai_drafted = Column(Boolean, nullable=False, default=False)
    date = Column(Date, nullable=False)
    student = relationship("Student", back_populates="feedbacks")


engine = create_engine("sqlite:///kendo.db")
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
