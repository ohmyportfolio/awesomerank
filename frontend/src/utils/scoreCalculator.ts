import { questions } from '../data/questions';

const getLevelNumber = (category: string) => {
    const match = category.match(/Level\s*(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 1;
};

const getLevelExponent = (level: number) => {
    return Math.min(5, Math.max(1, 6 - level));
};

const JEFFREYS_PRIOR_ALPHA = 0.5;
const JEFFREYS_PRIOR_BETA = 0.5;

const levelRate = (yesCount: number, totalCount: number) =>
    (yesCount + JEFFREYS_PRIOR_ALPHA) / (totalCount + JEFFREYS_PRIOR_ALPHA + JEFFREYS_PRIOR_BETA);

const computeYesCountDistribution = (questionIndices: number[]) => {
    let dp = new Array<number>(questionIndices.length + 1).fill(0);
    dp[0] = 1;

    for (const questionIndex of questionIndices) {
        const pYes = questions[questionIndex].probability;
        const next = new Array<number>(dp.length).fill(0);
        for (let yesCount = 0; yesCount < dp.length; yesCount += 1) {
            const p = dp[yesCount];
            if (p === 0) continue;

            next[yesCount] += p * (1 - pYes);
            if (yesCount + 1 < dp.length) next[yesCount + 1] += p * pYes;
        }
        dp = next;
    }

    return dp;
};

const levelModel = (() => {
    const byLevel = new Map<number, number[]>();
    for (let idx = 0; idx < questions.length; idx += 1) {
        const level = getLevelNumber(questions[idx].category);
        const existing = byLevel.get(level);
        if (existing) existing.push(idx);
        else byLevel.set(level, [idx]);
    }

    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    const data = levels.map((level) => {
        const indices = byLevel.get(level) ?? [];
        return {
            level,
            exponent: getLevelExponent(level),
            indices,
            count: indices.length,
            yesCountDistribution: computeYesCountDistribution(indices)
        };
    });

    const exponentSum = data.reduce((sum, l) => sum + l.exponent, 0);

    const compositeIndexFromYesCounts = (yesCounts: number[]) => {
        let weightedLogSum = 0;
        for (let i = 0; i < data.length; i += 1) {
            const rate = levelRate(yesCounts[i] ?? 0, data[i].count);
            weightedLogSum += data[i].exponent * Math.log(rate);
        }
        return Math.exp(weightedLogSum / exponentSum);
    };

    return { data, exponentSum, compositeIndexFromYesCounts };
})();

const lowerBoundByScore = (sortedScores: Array<{ score: number }>, target: number) => {
    let lo = 0;
    let hi = sortedScores.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sortedScores[mid].score < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

const globalScoreTable = (() => {
    const entries: Array<{ score: number; probability: number }> = [];
    const yesCounts = new Array<number>(levelModel.data.length).fill(0);

    const walk = (levelIndex: number, probability: number) => {
        if (levelIndex >= levelModel.data.length) {
            entries.push({ score: levelModel.compositeIndexFromYesCounts(yesCounts), probability });
            return;
        }

        const dp = levelModel.data[levelIndex].yesCountDistribution;
        for (let k = 0; k < dp.length; k += 1) {
            const p = dp[k];
            if (p === 0) continue;
            yesCounts[levelIndex] = k;
            walk(levelIndex + 1, probability * p);
        }
    };

    walk(0, 1);

    entries.sort((a, b) => a.score - b.score);

    const tailProbability = new Array<number>(entries.length);
    let acc = 0;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
        acc += entries[i].probability;
        tailProbability[i] = acc;
    }

    return { entries, tailProbability };
})();

export interface ScoreResult {
    score: number;        // Top X% (0-100)
    tier: string;         // Tier name (English key)
    yesCount: number;     // Total yes answers
    totalQuestions: number;
}

export function calculateScore(answers: boolean[]): ScoreResult {
    const userLevelYesCounts = levelModel.data.map((level) =>
        level.indices.reduce((count, questionIndex) => count + (answers[questionIndex] ? 1 : 0), 0)
    );
    const userCompositeIndex = levelModel.compositeIndexFromYesCounts(userLevelYesCounts);

    const startIndex = lowerBoundByScore(globalScoreTable.entries, userCompositeIndex);
    const topShareRaw = startIndex < globalScoreTable.tailProbability.length
        ? globalScoreTable.tailProbability[startIndex]
        : 0;
    const topShare = Math.min(1, Math.max(0, topShareRaw));

    const score = topShare * 100;

    // Determine Tier
    let tier = "Global Citizen";
    if (score < 0.000001) { tier = "Singularity Class"; }
    else if (score < 0.0001) { tier = "Visionary Elite"; }
    else if (score < 0.01) { tier = "World Class"; }
    else if (score < 1) { tier = "Top 1% Elite"; }
    else if (score < 10) { tier = "High Achiever"; }
    else if (score < 30) { tier = "Global Middle Class"; }
    else if (score < 60) { tier = "Aspiring Global"; }

    const yesCount = answers.filter(a => a).length;

    return {
        score,
        tier,
        yesCount,
        totalQuestions: answers.length
    };
}

// Re-export for Result component
export { levelModel, globalScoreTable, lowerBoundByScore };
