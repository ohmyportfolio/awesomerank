import { questions, QUESTION_IDS } from '../data/questions';
import { WORLD_RANK_CALIBRATION } from '../data/worldRankCalibration';

export const SCORE_ALGO_VERSION = 'v4-2pl-empirical-cdf-optimistic-v1';
const UX_OPTIMISM_MAX_POINTS = 5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const logit = (p: number) => Math.log(p / (1 - p));

const fallbackDiscriminations = questions.map((q) => clamp(0.75 + 0.5 * Math.abs(logit(q.probability)), 0.75, 2.25));
const fallbackDifficulties = questions.map((q, idx) => -logit(q.probability) / fallbackDiscriminations[idx]);

const hasCalibration =
  WORLD_RANK_CALIBRATION.questionIds.length === QUESTION_IDS.length &&
  WORLD_RANK_CALIBRATION.questionIds.every((id, idx) => id === QUESTION_IDS[idx]) &&
  WORLD_RANK_CALIBRATION.discriminations.length === QUESTION_IDS.length &&
  WORLD_RANK_CALIBRATION.difficulties.length === QUESTION_IDS.length &&
  WORLD_RANK_CALIBRATION.thetaQuantiles.length > 1;

const difficulties = hasCalibration
  ? WORLD_RANK_CALIBRATION.difficulties
  : fallbackDifficulties;
const discriminations = hasCalibration
  ? WORLD_RANK_CALIBRATION.discriminations
  : fallbackDiscriminations;

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);

  // Abramowitz and Stegun 7.1.26
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * ax);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-ax * ax);

  return sign * y;
}

function normCdf(x: number) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function percentileFromTheta(theta: number): number {
  if (!Number.isFinite(theta)) return 50;

  if (!hasCalibration) {
    return clamp(normCdf(theta) * 100, 0, 100);
  }

  const quantiles = WORLD_RANK_CALIBRATION.thetaQuantiles;
  const step = WORLD_RANK_CALIBRATION.quantileStep;
  const last = quantiles.length - 1;

  if (theta <= quantiles[0]) return 0;
  if (theta >= quantiles[last]) return 100;

  let lo = 0;
  let hi = last;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (quantiles[mid] <= theta) lo = mid;
    else hi = mid;
  }

  const t0 = quantiles[lo];
  const t1 = quantiles[lo + 1];
  const p0 = lo * step;
  const frac = t1 === t0 ? 0 : (theta - t0) / (t1 - t0);
  return clamp(p0 + frac * step, 0, 100);
}

function applyOptimisticScoreAdjustment(rawScore: number): number {
  const clampedRaw = clamp(rawScore, 0, 100);
  const normalized = clampedRaw / 100;
  // Slightly improve harsher high-score outcomes while preserving ordering.
  const adjustment = UX_OPTIMISM_MAX_POINTS * normalized * normalized;
  return clamp(clampedRaw - adjustment, 0, 100);
}

export interface TierInfo {
  key: string;
  color: string;
}

export function getTierInfo(score: number): TierInfo {
  if (score < 0.1) return { key: 'Singularity Class', color: '#ff00ff' };
  if (score < 0.5) return { key: 'Visionary Elite', color: '#ff0055' };
  if (score < 1) return { key: 'Top 1% Elite', color: '#00f3ff' };
  if (score < 5) return { key: 'World Class', color: '#ffd700' };
  if (score < 15) return { key: 'High Achiever', color: '#00f3ff' };
  if (score < 40) return { key: 'Global Middle Class', color: '#4cd137' };
  if (score < 70) return { key: 'Aspiring Global', color: '#fbc531' };
  return { key: 'Global Citizen', color: '#a0a0a0' };
}

function estimateThetaMap(answers: boolean[]) {
  const n = Math.min(answers.length, difficulties.length);
  if (n === 0) return 0;

  // Prior: theta ~ Normal(0, 1)
  let theta = 0;

  for (let iter = 0; iter < 40; iter += 1) {
    let grad = -theta;
    let hess = -1;

    for (let i = 0; i < n; i += 1) {
      const a = discriminations[i];
      const pYes = sigmoid(a * (theta - difficulties[i]));
      const y = answers[i] ? 1 : 0;
      grad += a * (y - pYes);
      hess += -(a * a) * pYes * (1 - pYes);
    }

    const step = grad / hess;
    theta -= step;
    if (Math.abs(step) < 1e-8) break;
  }

  return theta;
}

export interface ScoreResult {
  score: number; // Top X% (0-100), smaller is better (empirically calibrated)
  tier: string; // Tier name (English key)
  yesCount: number;
  totalQuestions: number;
}

export function calculateScore(answers: boolean[]): ScoreResult {
  const theta = estimateThetaMap(answers);
  const percentile = percentileFromTheta(theta);
  const rawScore = clamp(100 - percentile, 0, 100);
  const score = applyOptimisticScoreAdjustment(rawScore);

  const tier = getTierInfo(score).key;
  const yesCount = answers.filter(Boolean).length;

  return {
    score,
    tier,
    yesCount,
    totalQuestions: answers.length,
  };
}
