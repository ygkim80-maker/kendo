"""
기검체일치(氣劍體一致) 기반 검도 시합 엔진
- 체력바 없음. 유효 격자 1회 = 한판(Ippon)
- 삼판다승제 (2본 선취 승리)
- 3심제 (2명 이상 깃발 = 득점 인정)
- 거리/자세/기합/잔심 조건 동시 충족 필요
- 세메(칼끝 교란), 카운터, 동시타격 중심선 판정
"""
import random
import time


ZONE_KANJI = {"head": "面", "wrist": "小手", "waist": "胴", "thrust": "突"}

KAMAE_ATTACK_BONUS = {
    "chudan": {"head": 0.0, "wrist": 0.05, "waist": 0.0, "thrust": 0.1},
    "jodan": {"head": 0.15, "wrist": -0.1, "waist": 0.05, "thrust": -0.05},
    "gedan": {"head": -0.1, "wrist": 0.0, "waist": 0.0, "thrust": 0.05},
}

KAMAE_DEFENSE_WEAKNESS = {
    "chudan": [],
    "jodan": ["wrist", "thrust"],
    "gedan": ["head"],
}


def referee_vote(quality: float) -> list:
    return [((quality + random.gauss(0, 0.08)) > 0.5) for _ in range(3)]


def check_ippon(zone, attacker_kamae, kiai, zanshin, stat, defender_kamae,
                blocked, distance, simultaneous=False, centerline=0.6):
    if distance == "far":
        return {"ippon": False, "votes": [False]*3, "reason": "거리 부족"}
    if distance == "tsuba" and zone != "wrist":
        return {"ippon": False, "votes": [False]*3, "reason": "코등이에서는 손목만 가능"}
    if not kiai:
        return {"ippon": False, "votes": [False]*3, "reason": "기합 없음"}
    if blocked:
        return {"ippon": False, "votes": [False]*3, "reason": "방어됨"}

    q = 0.4 + (stat / 100.0) * 0.3
    q += KAMAE_ATTACK_BONUS.get(attacker_kamae, {}).get(zone, 0)
    if zone in KAMAE_DEFENSE_WEAKNESS.get(defender_kamae, []):
        q += 0.15
    if not zanshin:
        q *= 0.3
    if simultaneous:
        if centerline < 0.45:
            return {"ippon": False, "votes": [False]*3, "reason": "동시타격 — 중심선 미점유"}
        q *= centerline

    q = max(0.0, min(1.0, q))
    votes = referee_vote(q)
    ippon = sum(votes) >= 2
    reason = f"{ZONE_KANJI.get(zone,zone)} 유효! (심판 {sum(votes)}/3)" if ippon else (
        "심판 1명만 인정" if sum(votes) == 1 else "기검체일치 부족")
    return {"ippon": ippon, "votes": votes, "quality": q, "reason": reason}


class BattleSession:
    def __init__(self, player_stats, opponent_stats, opponent_name="AI 상대"):
        self.player_stats = player_stats
        self.opponent_stats = opponent_stats
        self.opponent_name = opponent_name
        self.player_score = 0
        self.opponent_score = 0
        self.finished = False
        self.result = None
        self.distance = "far"
        self.player_kamae = "chudan"
        self.opponent_kamae = "chudan"
        self.tsuba_turns = 0
        self.hansoku = {"player": 0, "opponent": 0}
        self.turn = 0
        self.log = []
        self.seme_pressure = 0.5  # 0=상대우세, 1=내가우세
        self.opening_zone = None
        self.opening_until = 0
        self.last_action_time = time.time()

    def state(self):
        return {
            "distance": self.distance,
            "player_kamae": self.player_kamae,
            "opponent_kamae": self.opponent_kamae,
            "score": {"player": self.player_score, "opponent": self.opponent_score},
            "hansoku": self.hansoku,
            "turn": self.turn,
            "seme_pressure": round(self.seme_pressure, 2),
            "opening_zone": self.opening_zone if time.time() < self.opening_until else None,
            "finished": self.finished,
            "result": self.result,
        }

    def to_dict(self):
        return {
            "player_stats": self.player_stats,
            "opponent_stats": self.opponent_stats,
            "opponent_name": self.opponent_name,
            "player_score": self.player_score,
            "opponent_score": self.opponent_score,
            "finished": self.finished,
            "result": self.result,
            "distance": self.distance,
            "player_kamae": self.player_kamae,
            "opponent_kamae": self.opponent_kamae,
            "tsuba_turns": self.tsuba_turns,
            "hansoku": self.hansoku,
            "turn": self.turn,
            "log": self.log,
            "seme_pressure": self.seme_pressure,
            "opening_zone": self.opening_zone,
            "opening_until": self.opening_until,
            "last_action_time": self.last_action_time,
        }

    @classmethod
    def from_dict(cls, d):
        s = cls.__new__(cls)
        s.player_stats = d["player_stats"]
        s.opponent_stats = d["opponent_stats"]
        s.opponent_name = d["opponent_name"]
        s.player_score = d["player_score"]
        s.opponent_score = d["opponent_score"]
        s.finished = d["finished"]
        s.result = d["result"]
        s.distance = d["distance"]
        s.player_kamae = d["player_kamae"]
        s.opponent_kamae = d["opponent_kamae"]
        s.tsuba_turns = d["tsuba_turns"]
        s.hansoku = d["hansoku"]
        s.turn = d["turn"]
        s.log = d["log"]
        s.seme_pressure = d["seme_pressure"]
        s.opening_zone = d["opening_zone"]
        s.opening_until = d["opening_until"]
        s.last_action_time = d["last_action_time"]
        return s

    def _ai_action(self):
        if self.distance == "far":
            return {"action": "advance"} if random.random() < 0.7 else {"action": "wait"}
        if self.distance == "tsuba":
            if self.tsuba_turns > 2 or random.random() < 0.5:
                return {"action": "push_out"}
            return {"action": "strike", "zone": "wrist"} if random.random() < 0.35 else {"action": "wait"}
        # issoku
        r = random.random()
        if r < 0.30:
            weak = KAMAE_DEFENSE_WEAKNESS.get(self.player_kamae, [])
            zone = random.choice(weak) if weak and random.random() < 0.6 else random.choice(["head","wrist","waist","thrust"])
            return {"action": "strike", "zone": zone}
        if r < 0.45:
            return {"action": "advance"}
        if r < 0.60:
            return {"action": "retreat"}
        if r < 0.75:
            return {"action": "seme"}
        return {"action": "wait", "kamae": random.choice(["chudan","jodan"])}

    def process(self, action, zone=None, kiai=False, kamae=None):
        if self.finished:
            return {"error": "finished", **self.state()}

        self.turn += 1
        now = time.time()
        dt = now - self.last_action_time
        self.last_action_time = now

        ai = self._ai_action()
        p_event = None
        o_event = None
        p_ippon = None
        o_ippon = None
        flags_player = None
        flags_opponent = None

        if kamae and kamae in ("chudan","jodan","gedan"):
            self.player_kamae = kamae
        if ai.get("kamae"):
            self.opponent_kamae = ai["kamae"]

        # ── Seme (칼끝 교란) ──
        if action == "seme":
            shift = 0.08 + random.gauss(0, 0.03)
            self.seme_pressure = min(1.0, self.seme_pressure + shift)
            if self.seme_pressure > 0.75 and random.random() < 0.5:
                weak = KAMAE_DEFENSE_WEAKNESS.get(self.opponent_kamae, [])
                zones = weak if weak else ["head","wrist","waist","thrust"]
                self.opening_zone = random.choice(zones)
                self.opening_until = now + 2.0
                p_event = f"세메 성공! 상대 {ZONE_KANJI.get(self.opening_zone,'')} 빈틈 발생!"
            else:
                p_event = "칼끝 교란 — 압박 중"

        # AI seme
        if ai["action"] == "seme":
            shift = 0.06 + random.gauss(0, 0.03)
            self.seme_pressure = max(0.0, self.seme_pressure - shift)
            o_event = "상대 세메 — 압박"

        # ── Distance ──
        if action == "advance":
            if self.distance == "far":
                self.distance = "issoku"
                p_event = "전진 → 일족일도의 거리"
            elif self.distance == "issoku":
                self.distance = "tsuba"
                self.tsuba_turns = 0
                p_event = "돌진 → 코등이"
        elif action == "retreat":
            if self.distance == "tsuba":
                self.distance = "issoku"
                self.tsuba_turns = 0
                p_event = "이탈"
            elif self.distance == "issoku":
                self.distance = "far"
                p_event = "후퇴"
        elif action == "push_out" and self.distance == "tsuba":
            self.distance = "issoku"
            self.tsuba_turns = 0
            p_event = "밀어내기"

        if ai["action"] == "advance":
            if self.distance == "far":
                self.distance = "issoku"
                o_event = "상대 전진"
            elif self.distance == "issoku":
                self.distance = "tsuba"
                self.tsuba_turns = 0
                o_event = "상대 돌진"
        elif ai["action"] == "retreat":
            if self.distance == "tsuba":
                self.distance = "issoku"
                o_event = "상대 이탈"
            elif self.distance == "issoku":
                self.distance = "far"
                o_event = "상대 후퇴"
        elif ai["action"] == "push_out" and self.distance == "tsuba":
            self.distance = "issoku"
            self.tsuba_turns = 0
            o_event = "상대 밀어내기"

        # ── Player Strike ──
        if action == "strike" and zone:
            if self.distance == "far":
                p_event = "거리 부족!"
            else:
                is_opening = (self.opening_zone == zone and now < self.opening_until)
                block_chance = 0.28 - (0.15 if is_opening else 0)
                blocked = random.random() < max(0.05, block_chance)
                simul = ai["action"] == "strike"
                cl = 0.5 + (self.seme_pressure - 0.5) * 0.4 + random.gauss(0, 0.08)

                zanshin = True
                p_ippon = check_ippon(zone, self.player_kamae, kiai, zanshin,
                    self.player_stats.get(zone, 50), self.opponent_kamae,
                    blocked, self.distance, simul, cl)
                flags_player = p_ippon["votes"]

                if p_ippon["ippon"]:
                    self.player_score += 1
                    self.distance = "far"
                    self.seme_pressure = 0.5
                    self.opening_zone = None
                p_event = p_ippon["reason"]
                if not p_ippon["ippon"] and not blocked and self.distance == "issoku":
                    self.distance = "tsuba"
                    self.tsuba_turns = 0

        # ── AI Strike ──
        if ai["action"] == "strike" and not (p_ippon and p_ippon["ippon"]):
            ai_zone = ai.get("zone", "head")
            if self.distance != "far":
                blocked = random.random() < 0.3
                ai_kiai = random.random() < 0.82
                ai_zanshin = random.random() < 0.72
                simul = action == "strike"
                cl = 0.5 - (self.seme_pressure - 0.5) * 0.4 + random.gauss(0, 0.08)

                o_ippon = check_ippon(ai_zone, self.opponent_kamae, ai_kiai, ai_zanshin,
                    self.opponent_stats.get(ai_zone, 50), self.player_kamae,
                    blocked, self.distance, simul, cl)
                flags_opponent = o_ippon["votes"]

                if o_ippon["ippon"]:
                    self.opponent_score += 1
                    self.distance = "far"
                    self.seme_pressure = 0.5
                o_event = f"상대 {ZONE_KANJI.get(ai_zone,ai_zone)} — {o_ippon['reason']}"

        if action == "wait":
            p_event = p_event or "대치"
        if not o_event:
            o_event = "상대 대치"

        # Tsuba timeout
        if self.distance == "tsuba":
            self.tsuba_turns += 1
            if self.tsuba_turns > 4:
                self.hansoku["player"] += 1
                self.hansoku["opponent"] += 1
                self.distance = "issoku"
                self.tsuba_turns = 0

        if self.player_score >= 2:
            self.finished = True
            self.result = "win"
        elif self.opponent_score >= 2:
            self.finished = True
            self.result = "lose"

        return {
            "turn": self.turn,
            "player_event": p_event,
            "opponent_event": o_event,
            "player_zone": zone,
            "opponent_zone": ai.get("zone"),
            "player_ippon": p_ippon,
            "opponent_ippon": o_ippon,
            "flags_player": flags_player,
            "flags_opponent": flags_opponent,
            "fumikomi": action == "strike" and self.distance != "far",
            **self.state(),
        }

    def timeout_judge(self):
        self.finished = True
        if self.player_score > self.opponent_score:
            self.result = "win"
        elif self.player_score < self.opponent_score:
            self.result = "lose"
        else:
            self.result = "draw"
        return {"finished": True, **self.state()}
