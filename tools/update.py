#!/usr/bin/env python3
"""멘헤라 수심계 갱신 스크립트.

Claude(또는 사람)가 대화 내용을 보고 다섯 항목을 -5~+5로 판정해서 넘기면
점수를 계산해 status.json을 갱신한다.

    python3 tools/update.py --work 3 --mood -1 --sleep -2 --meals 0 --social 1 \
        --comment "작업은 꽤 했는데 새벽 3시 취침. 수면 위에서 버티는 중."

점수 공식
    raw   = 50 + 4*작업량 + 3*텐션 + 수면 + 식사 + 교류      (0~100)
    score = round(직전 점수 * 0.3 + raw * 0.7)               (급변 완화)
--set 으로 점수를 직접 지정할 수도 있다.
"""
import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUS = ROOT / "status.json"
LEVELS = ROOT / "levels.json"
WEIGHTS = {"work": 4, "mood": 3, "sleep": 1, "meals": 1, "social": 1}
SMOOTH = 0.3          # 직전 점수 반영 비율
HISTORY_MAX = 60
KST = timezone(timedelta(hours=9))


def factor(v: str) -> int:
    n = int(v)
    if not -5 <= n <= 5:
        raise argparse.ArgumentTypeError("항목 값은 -5 ~ +5 사이여야 함")
    return n


def main() -> None:
    p = argparse.ArgumentParser(description="멘헤라 수치 갱신")
    for key, label in [("work", "작업량"), ("mood", "텐션/말투"), ("sleep", "수면"),
                       ("meals", "식사"), ("social", "교류/외출")]:
        p.add_argument(f"--{key}", type=factor, default=0, help=f"{label} (-5~+5, 모르면 0)")
    p.add_argument("--comment", required=True, help="사이트에 공개될 한두 문장 관측 일지")
    p.add_argument("--set", type=int, dest="override", help="점수 직접 지정 (0~100)")
    p.add_argument("--subject", help="사이트에 표시될 이름 변경")
    p.add_argument("--dry-run", action="store_true", help="저장하지 않고 결과만 출력")
    a = p.parse_args()

    status = json.loads(STATUS.read_text(encoding="utf-8"))
    levels = json.loads(LEVELS.read_text(encoding="utf-8"))
    prev = int(status.get("score", 55))

    factors = {k: getattr(a, k) for k in WEIGHTS}
    raw = max(0, min(100, 50 + sum(WEIGHTS[k] * v for k, v in factors.items())))
    if a.override is not None:
        score = max(0, min(100, a.override))
    else:
        score = round(prev * SMOOTH + raw * (1 - SMOOTH))

    now = datetime.now(KST).isoformat(timespec="seconds")
    status.update(score=score, updatedAt=now, comment=a.comment.strip(), factors=factors)
    if a.subject:
        status["subject"] = a.subject
    history = status.setdefault("history", [])
    history.append({"t": now, "score": score, "comment": a.comment.strip()})
    status["history"] = history[-HISTORY_MAX:]

    lv = next(l for l in levels if l["min"] <= score <= l["max"])
    print(f"직전 {prev} -> raw {raw} -> 최종 {score}  |  Lv.{lv['lv']} {lv['name']} ({lv['zone']})")

    if not a.dry_run:
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("status.json 저장 완료")


if __name__ == "__main__":
    main()
