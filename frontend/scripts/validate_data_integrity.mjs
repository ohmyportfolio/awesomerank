import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const questionsPath = resolve(root, 'src/data/questions.ts');
const calibrationPath = resolve(root, 'src/data/worldRankCalibration.ts');
const thresholdsPath = resolve(root, 'src/data/worldIncomeThresholds.ts');

function read(path) {
  return readFileSync(path, 'utf8');
}

function extractQuestionIdsFromQuestionsTs(text) {
  return [...text.matchAll(/id:\s*"([^"]+)"\s*,\s*probability:/g)].map((m) => m[1]);
}

function extractStringArrayByField(text, fieldName) {
  const blockMatch = text.match(new RegExp(`${fieldName}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, 'm'));
  if (!blockMatch) return null;
  return [...blockMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractNumberArrayByField(text, fieldName) {
  const blockMatch = text.match(new RegExp(`${fieldName}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, 'm'));
  if (!blockMatch) return null;
  return blockMatch[1]
    .split(',')
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function extractThresholdsByBasis(text, basis) {
  let blockMatch = null;
  if (basis === 'PPP') {
    blockMatch = text.match(/PPP:\s*\[([\s\S]*?)\],\s*\n\s*MER:/m);
  } else {
    blockMatch = text.match(/MER:\s*\[([\s\S]*?)\],\s*\n\};/m);
  }
  if (!blockMatch) return null;

  return [...blockMatch[1].matchAll(/\{\s*p:\s*([0-9.]+),\s*income:\s*([0-9.]+)\s*\}/g)].map((m) => ({
    p: Number.parseFloat(m[1]),
    income: Number.parseFloat(m[2]),
  }));
}

function checkMonotonic(points, basis, errors) {
  if (!points || points.length < 2) {
    errors.push(`[${basis}] No threshold points found`);
    return;
  }
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    if (!(cur.p > prev.p)) {
      errors.push(`[${basis}] Percentile is not strictly increasing at index ${i}: ${prev.p} -> ${cur.p}`);
    }
    if (cur.income < prev.income) {
      errors.push(`[${basis}] Income is decreasing at index ${i}: ${prev.income} -> ${cur.income}`);
    }
  }
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function estimateThetaMap(answers, difficulties, discriminations) {
  const n = Math.min(answers.length, difficulties.length, discriminations.length);
  if (n === 0) return 0;
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

function percentileFromTheta(theta, thetaQuantiles, quantileStep) {
  if (!Number.isFinite(theta)) return 50;
  const last = thetaQuantiles.length - 1;
  if (theta <= thetaQuantiles[0]) return 0;
  if (theta >= thetaQuantiles[last]) return 100;
  let lo = 0;
  let hi = last;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (thetaQuantiles[mid] <= theta) lo = mid;
    else hi = mid;
  }
  const t0 = thetaQuantiles[lo];
  const t1 = thetaQuantiles[lo + 1];
  const p0 = lo * quantileStep;
  const frac = t1 === t0 ? 0 : (theta - t0) / (t1 - t0);
  return Math.max(0, Math.min(100, p0 + frac * quantileStep));
}

function scoreFromAnswers(answers, difficulties, discriminations, thetaQuantiles, quantileStep) {
  const theta = estimateThetaMap(answers, difficulties, discriminations);
  const percentile = percentileFromTheta(theta, thetaQuantiles, quantileStep);
  const rawScore = Math.max(0, Math.min(100, 100 - percentile));
  const normalized = rawScore / 100;
  const adjustment = 5 * normalized * normalized;
  return Math.max(0, Math.min(100, rawScore - adjustment));
}

function main() {
  const errors = [];

  const questionsText = read(questionsPath);
  const calibrationText = read(calibrationPath);
  const thresholdsText = read(thresholdsPath);

  const questionIds = extractQuestionIdsFromQuestionsTs(questionsText);
  const calibrationQuestionIds = extractStringArrayByField(calibrationText, 'questionIds');

  if (!calibrationQuestionIds) {
    errors.push('worldRankCalibration.ts: questionIds field missing');
  } else {
    if (questionIds.length !== calibrationQuestionIds.length) {
      errors.push(`Question count mismatch: questions=${questionIds.length}, calibration=${calibrationQuestionIds.length}`);
    }
    const minLen = Math.min(questionIds.length, calibrationQuestionIds.length);
    for (let i = 0; i < minLen; i += 1) {
      if (questionIds[i] !== calibrationQuestionIds[i]) {
        errors.push(`Question ID mismatch at index ${i}: "${questionIds[i]}" !== "${calibrationQuestionIds[i]}"`);
      }
    }
  }

  const probabilities = extractNumberArrayByField(calibrationText, 'probabilities');
  const difficulties = extractNumberArrayByField(calibrationText, 'difficulties');
  const discriminations = extractNumberArrayByField(calibrationText, 'discriminations');
  const thetaQuantiles = extractNumberArrayByField(calibrationText, 'thetaQuantiles');
  const quantileStepMatch = calibrationText.match(/quantileStep:\s*([0-9.]+)/);
  const quantileStep = quantileStepMatch ? Number.parseFloat(quantileStepMatch[1]) : null;

  if (!probabilities || !difficulties || !discriminations || !thetaQuantiles || quantileStep === null || !Number.isFinite(quantileStep)) {
    errors.push('worldRankCalibration.ts: required numeric arrays are missing');
  } else {
    if (probabilities.length !== questionIds.length) {
      errors.push(`Calibration probabilities length mismatch: ${probabilities.length} !== ${questionIds.length}`);
    }
    if (difficulties.length !== questionIds.length) {
      errors.push(`Calibration difficulties length mismatch: ${difficulties.length} !== ${questionIds.length}`);
    }
    if (discriminations.length !== questionIds.length) {
      errors.push(`Calibration discriminations length mismatch: ${discriminations.length} !== ${questionIds.length}`);
    }
    if (thetaQuantiles.length < 2) {
      errors.push('Calibration thetaQuantiles must have at least 2 points');
    }

    // Score resolution guard: avoid collapsing to near yes-count only.
    if (questionIds.length <= 20) {
      const uniqueScores = new Set();
      const n = questionIds.length;
      for (let mask = 0; mask < (1 << n); mask += 1) {
        const answers = new Array(n);
        for (let i = 0; i < n; i += 1) {
          answers[i] = Boolean(mask & (1 << i));
        }
        const score = scoreFromAnswers(answers, difficulties, discriminations, thetaQuantiles, quantileStep);
        uniqueScores.add(score.toFixed(8));
      }
      if (uniqueScores.size < 200) {
        errors.push(`Score resolution too low: unique scores=${uniqueScores.size} (expected >= 200)`);
      }
    }

    // Rare-vs-common single-YES guard.
    const minP = Math.min(...probabilities);
    const maxP = Math.max(...probabilities);
    const rareIdx = probabilities.findIndex((p) => p === minP);
    const commonIdx = probabilities.findIndex((p) => p === maxP);
    if (rareIdx >= 0 && commonIdx >= 0 && rareIdx !== commonIdx) {
      const rareAnswers = new Array(questionIds.length).fill(false);
      const commonAnswers = new Array(questionIds.length).fill(false);
      rareAnswers[rareIdx] = true;
      commonAnswers[commonIdx] = true;
      const rareScore = scoreFromAnswers(rareAnswers, difficulties, discriminations, thetaQuantiles, quantileStep);
      const commonScore = scoreFromAnswers(commonAnswers, difficulties, discriminations, thetaQuantiles, quantileStep);
      if (Math.abs(rareScore - commonScore) < 1e-9) {
        errors.push('Rare-question YES and common-question YES produce identical score');
      }
    }
  }

  const ppp = extractThresholdsByBasis(thresholdsText, 'PPP');
  const mer = extractThresholdsByBasis(thresholdsText, 'MER');
  checkMonotonic(ppp, 'PPP', errors);
  checkMonotonic(mer, 'MER', errors);

  const metadataKeys = ['generatedAt:', 'extractorVersion:', 'sourceLastModified:', 'sourceHash:'];
  for (const key of metadataKeys) {
    if (!thresholdsText.includes(key)) {
      errors.push(`worldIncomeThresholds.ts: missing metadata key "${key}"`);
    }
  }

  if (errors.length > 0) {
    console.error('Data integrity check failed:\n');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log('Data integrity check passed.');
}

main();
