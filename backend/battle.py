import random
from models import Zone

TIMING_COEFFICIENTS = {"perfect": 0.95, "good": 0.75, "miss": 0.0}
TIMING_THRESHOLDS = {"perfect": 0.15, "good": 0.40}
ZONES = [Zone.head, Zone.wrist, Zone.waist, Zone.thrust]
TIME_LIMIT = 60.0


def judge_timing(timing_value: float) -> str:
    deviation = abs(timing_value - 0.5)
    if deviation <= TIMING_THRESHOLDS["perfect"]:
        return "perfect"
    elif deviation <= TIMING_THRESHOLDS["good"]:
        return "good"
    return "miss"


def calculate_hit(timing_coeff: float, player_stat: float, opponent_stat: float) -> bool:
    if timing_coeff == 0.0:
        return False
    probability = timing_coeff * (player_stat / (player_stat + opponent_stat))
    return random.random() < probability


def ai_choose_zone() -> Zone:
    return random.choice(ZONES)


def ai_attack(player_stats: dict, ai_stats: dict) -> dict:
    zone = ai_choose_zone()
    timing_roll = random.gauss(0.5, 0.2)
    timing_roll = max(0.0, min(1.0, timing_roll))
    grade = judge_timing(timing_roll)
    coeff = TIMING_COEFFICIENTS[grade]
    hit = calculate_hit(coeff, ai_stats[zone.value], player_stats[zone.value])
    return {"zone": zone.value, "timing_grade": grade, "hit": hit}


def generate_ai_stats(player_stats: dict, difficulty: float = 0.85) -> dict:
    return {zone: score * difficulty for zone, score in player_stats.items()}


class BattleSession:
    def __init__(self, player_stats: dict, opponent_stats: dict, opponent_name: str = "AI 상대"):
        self.player_stats = player_stats
        self.opponent_stats = opponent_stats
        self.opponent_name = opponent_name
        self.player_score = 0
        self.opponent_score = 0
        self.round_log = []
        self.finished = False
        self.result = None

    def player_attack(self, zone: str, timing: float) -> dict:
        if self.finished:
            return {"error": "match_finished"}

        grade = judge_timing(timing)
        coeff = TIMING_COEFFICIENTS[grade]
        hit = calculate_hit(coeff, self.player_stats.get(zone, 50), self.opponent_stats.get(zone, 50))

        if hit:
            self.player_score += 1

        ai_result = ai_attack(self.player_stats, self.opponent_stats)
        if ai_result["hit"]:
            self.opponent_score += 1

        round_data = {
            "round": len(self.round_log) + 1,
            "player": {"zone": zone, "timing_grade": grade, "hit": hit},
            "opponent": ai_result,
            "score": {"player": self.player_score, "opponent": self.opponent_score},
        }

        self.round_log.append(round_data)

        if self.player_score >= 2:
            self.finished = True
            self.result = "win"
        elif self.opponent_score >= 2:
            self.finished = True
            self.result = "lose"

        round_data["finished"] = self.finished
        round_data["result"] = self.result
        return round_data

    def timeout_judge(self) -> dict:
        self.finished = True
        if self.player_score > self.opponent_score:
            self.result = "win"
        elif self.player_score < self.opponent_score:
            self.result = "lose"
        else:
            self.result = "draw"
        return {
            "finished": True,
            "result": self.result,
            "score": {"player": self.player_score, "opponent": self.opponent_score},
        }
