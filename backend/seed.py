from datetime import date, timedelta
from models import init_db, SessionLocal, Student, AttendanceLog, SkillStat, CoachFeedback, Zone
import random

def seed():
    init_db()
    db = SessionLocal()

    if db.query(Student).count() > 0:
        db.close()
        return

    today = date.today()
    students_data = [
        {"name": "이도윤", "grade": "二段", "months": 18},
        {"name": "박서준", "grade": "二段", "months": 15},
        {"name": "김하늘", "grade": "初段", "months": 12},
        {"name": "최승현", "grade": "初段", "months": 8},
        {"name": "정민재", "grade": "1급", "months": 6},
    ]

    students = []
    for sd in students_data:
        s = Student(
            name=sd["name"],
            dojang_id=1,
            grade=sd["grade"],
            join_date=today - timedelta(days=sd["months"] * 30),
        )
        db.add(s)
        db.flush()
        students.append(s)

    monday = today - timedelta(days=today.weekday())
    for s in students:
        for i in range(7):
            d = monday + timedelta(days=i)
            present = random.random() < 0.7
            db.add(AttendanceLog(student_id=s.id, date=d, present=present))

    month_str = today.strftime("%Y-%m")
    base_scores = {
        "이도윤": {"head": 88, "wrist": 82, "waist": 79, "thrust": 70},
        "박서준": {"head": 85, "wrist": 78, "waist": 81, "thrust": 65},
        "김하늘": {"head": 80, "wrist": 72, "waist": 75, "thrust": 60},
        "최승현": {"head": 78, "wrist": 64, "waist": 71, "thrust": 55},
        "정민재": {"head": 70, "wrist": 60, "waist": 65, "thrust": 50},
    }
    for s in students:
        scores = base_scores[s.name]
        for zone_key, score in scores.items():
            db.add(SkillStat(student_id=s.id, zone=Zone(zone_key), score=score, month=month_str))

    db.add(CoachFeedback(
        student_id=students[3].id,
        coach_name="박정훈 사범",
        text="손목치기 타이밍이 빨라졌습니다. 허리치기 시 왼발 축 고정에 집중하세요.",
        ai_drafted=True,
        date=today,
    ))

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
