export interface Question {
  id: string; // Now uses English text as key
  probability: number;
  category: string;
}

export const questions: Question[] = [
  {
    id: "Do you have access to electricity in your home?",
    probability: 0.916,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have access to a flush toilet or improved sanitation?",
    probability: 0.780,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have access to safe drinking water at home?",
    probability: 0.740,
    category: "Level 2: Connectivity (Information)",
  },
  {
    id: "Do you have a washing machine at home?",
    probability: 0.400,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Do you have a bank account or mobile money account?",
    probability: 0.790,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have a refrigerator in your home?",
    probability: 0.780,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you use the internet?",
    probability: 0.740,
    category: "Level 2: Connectivity (Information)",
  },
  {
    id: "Do you live in a non-overcrowded home?",
    probability: 0.700,
    category: "Level 2: Connectivity (Information)",
  },
  {
    id: "Can you afford a healthy diet?",
    probability: 0.680,
    category: "Level 2: Connectivity (Information)",
  },
  {
    id: "Do you own a personal smartphone?",
    probability: 0.600,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Did you graduate from high school (secondary education)?",
    probability: 0.590,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Can you access essential healthcare without financial hardship?",
    probability: 0.550,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Do you have a valid passport?",
    probability: 0.250,
    category: "Level 5: Mobility (Elite)",
  },
  {
    id: "Have you ever flown on an airplane?",
    probability: 0.200,
    category: "Level 5: Mobility (Elite)",
  },
  {
    id: "Do you regularly spend money on cultural activities (OTT subscriptions like Netflix, movie tickets, concerts, theater, or musicals)?",
    probability: 0.150,
    category: "Level 5: Mobility (Elite)",
  },
];

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const QUESTION_IDS = questions.map((question) => question.id);

export const QUESTION_SET_ID = `qs_${fnv1a32(
  JSON.stringify(questions.map((q) => ({ id: q.id, p: q.probability, c: q.category })))
)}`;
