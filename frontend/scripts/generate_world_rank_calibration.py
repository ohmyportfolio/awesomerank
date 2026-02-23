#!/usr/bin/env python3
"""
Generate empirical calibration data for world-rank scoring.

This script:
1) Reads question probabilities from src/data/questions.ts
2) Derives 2PL discriminations from probabilities
3) Calibrates logistic item difficulties so marginal P(Yes) matches probabilities
4) Simulates a population and estimates theta (MAP) per response pattern
5) Builds percentile -> theta quantiles for fast lookup at runtime
"""

from __future__ import annotations

import math
import random
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS_PATH = ROOT / "src/data/questions.ts"
OUT_PATH = ROOT / "src/data/worldRankCalibration.ts"

# 20-point Gauss-Hermite nodes/weights for N(0,1) expectations
HERMITE_X = [
    -5.387480890011232,
    -4.603682449550744,
    -3.944764040115625,
    -3.347854567383216,
    -2.78880605842813,
    -2.254974002089275,
    -1.738537712116585,
    -1.234076215395323,
    -0.737473728545394,
    -0.245340708300901,
    0.245340708300901,
    0.737473728545394,
    1.234076215395323,
    1.738537712116585,
    2.254974002089275,
    2.78880605842813,
    3.347854567383216,
    3.944764040115625,
    4.603682449550744,
    5.387480890011232,
]
HERMITE_W = [
    2.229393645534151e-13,
    4.39934099227318e-10,
    1.086069370769281e-07,
    7.802556478532063e-06,
    0.000228338636016353,
    0.003243773342237861,
    0.02481052088746359,
    0.109017206020023,
    0.2866755053628341,
    0.4622436696006101,
    0.4622436696006101,
    0.2866755053628341,
    0.109017206020023,
    0.02481052088746359,
    0.003243773342237861,
    0.000228338636016353,
    7.802556478532063e-06,
    1.086069370769281e-07,
    4.39934099227318e-10,
    2.229393645534151e-13,
]


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def logit(p: float) -> float:
    return math.log(p / (1.0 - p))


def expect_sigmoid(a: float, b: float) -> float:
    # E_theta[sigmoid(a * (theta - b))] for theta ~ N(0, 1)
    total = 0.0
    sqrt2 = math.sqrt(2.0)
    for x, w in zip(HERMITE_X, HERMITE_W):
        theta = sqrt2 * x
        total += w * sigmoid(a * (theta - b))
    return total / math.sqrt(math.pi)


def solve_difficulty(p: float, a: float) -> float:
    lo, hi = -10.0, 10.0
    for _ in range(80):
        mid = (lo + hi) / 2.0
        val = expect_sigmoid(a, mid)
        if val > p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def estimate_theta_map(
    answers: list[bool], difficulties: list[float], discriminations: list[float]
) -> float:
    if not answers:
        return 0.0
    theta = 0.0
    for _ in range(40):
        grad = -theta
        hess = -1.0
        for y, b, a in zip(answers, difficulties, discriminations):
            p = sigmoid(a * (theta - b))
            grad += a * ((1.0 if y else 0.0) - p)
            hess += -(a * a) * p * (1.0 - p)
        step = grad / hess
        theta -= step
        if abs(step) < 1e-8:
            break
    return theta


def randn(rng: random.Random) -> float:
    # Box-Muller
    u1 = rng.random()
    u2 = rng.random()
    return math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)


def format_float_array(values: list[float], per_line: int = 8) -> str:
    chunks = []
    for i in range(0, len(values), per_line):
        chunk = ", ".join(f"{v:.6f}" for v in values[i : i + per_line])
        chunks.append(f"  {chunk}")
    return "[\n" + ",\n".join(chunks) + "\n]"


def main() -> None:
    text = QUESTIONS_PATH.read_text()
    pairs = re.findall(
        r'id:\s*"([^"]+)"\s*,\s*probability:\s*([0-9.]+)',
        text,
    )
    if not pairs:
        raise SystemExit("No question probabilities found.")

    question_ids = [qid for qid, _ in pairs]
    probabilities = [float(p) for _, p in pairs]

    discriminations = [clamp(0.75 + 0.5 * abs(logit(p)), 0.75, 2.25) for p in probabilities]
    difficulties = [solve_difficulty(p, a) for p, a in zip(probabilities, discriminations)]

    # Simulation
    seed = 4242
    population_size = 200_000
    rng = random.Random(seed)
    theta_hats: list[float] = []

    for _ in range(population_size):
        theta = randn(rng)
        answers = [
            rng.random() < sigmoid(a * (theta - b))
            for b, a in zip(difficulties, discriminations)
        ]
        theta_hats.append(estimate_theta_map(answers, difficulties, discriminations))

    theta_hats.sort()

    # Quantiles (percentile 0..100 in 0.1% steps)
    quantile_step = 0.1
    steps = int(round(100 / quantile_step))
    quantiles: list[float] = []
    for i in range(steps + 1):
        p = i * quantile_step / 100.0
        idx = p * (population_size - 1)
        lo = int(math.floor(idx))
        hi = int(math.ceil(idx))
        if lo == hi:
            val = theta_hats[lo]
        else:
            frac = idx - lo
            val = theta_hats[lo] * (1.0 - frac) + theta_hats[hi] * frac
        quantiles.append(val)

    out = f"""// AUTO-GENERATED FILE. DO NOT EDIT.
// Generated by scripts/generate_world_rank_calibration.py

export const WORLD_RANK_CALIBRATION = {{
  version: 'v4-2pl-empirical-cdf',
  generatedAt: '{date.today().isoformat()}',
  seed: {seed},
  populationSize: {population_size},
  quantileStep: {quantile_step},
  questionIds: {question_ids!r},
  probabilities: {format_float_array(probabilities, per_line=10)},
  discriminations: {format_float_array(discriminations, per_line=10)},
  difficulties: {format_float_array(difficulties, per_line=10)},
  thetaQuantiles: {format_float_array(quantiles, per_line=10)},
}} as const;
"""

    OUT_PATH.write_text(out)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
