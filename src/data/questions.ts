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
    id: "Can you read and write simple sentences?",
    probability: 0.880,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have a bank account or mobile money account?",
    probability: 0.790,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have access to a flush toilet or improved sanitation?",
    probability: 0.780,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you have a refrigerator in your home?",
    probability: 0.780,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you live without fear of eviction?",
    probability: 0.770,
    category: "Level 1: Infrastructure (Survival)",
  },
  {
    id: "Do you use the internet?",
    probability: 0.740,
    category: "Level 2: Connectivity (Information)",
  },
  {
    id: "Do you have access to safe drinking water at home?",
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
    id: "Do you have social protection benefits (paid leave/sick leave)?",
    probability: 0.524,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Do you spend more than $12 (approx. 16,000 KRW) per day?",
    probability: 0.500,
    category: "Level 3: Assets (Comfort)",
  },
  {
    id: "Do you receive preventive dental care at least once a year?",
    probability: 0.450,
    category: "Level 4: Human Capital (Ability)",
  },
  {
    id: "Does your household own a car?",
    probability: 0.450,
    category: "Level 4: Human Capital (Ability)",
  },
  {
    id: "Do you have a washing machine at home?",
    probability: 0.400,
    category: "Level 4: Human Capital (Ability)",
  },
  {
    id: "Do you eat out or order food delivery at least once a week?",
    probability: 0.350,
    category: "Level 4: Human Capital (Ability)",
  },
  {
    id: "Do you have home broadband internet?",
    probability: 0.300,
    category: "Level 4: Human Capital (Ability)",
  },
  {
    id: "Do you have a university degree (Bachelor's or higher)?",
    probability: 0.250,
    category: "Level 5: Mobility (Elite)",
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
    id: "Do you use 5G internet?",
    probability: 0.200,
    category: "Level 5: Mobility (Elite)",
  },
  {
    id: "Do you subscribe to a paid streaming service (Netflix, etc.)?",
    probability: 0.150,
    category: "Level 5: Mobility (Elite)",
  },
];
