
// Mupal Madness — Version A0 Core Simulation Engine
// Engine only: no UI, no screen flow, no artwork rendering.
// Purpose: generate a population, run one independent trial,
// determine top 6 survivors, and summarize results.

/**
 * @typedef {"cold" | "temperate" | "hot"} Temperature
 * @typedef {"small" | "medium" | "large"} EarType
 */

/**
 * A0 uses 3 simplified ear sizes for student-facing clarity.
 * Asset names reuse the strongest existing A1 artwork:
 * - small   -> super small ears image
 * - medium  -> medium ears image
 * - large   -> very large ears image
 */
const EAR_TYPES_A0 = [
  {
    id: "small",
    label: "Small ears",
    asset: "ears_super_small",
    modifiers: { cold: 3, temperate: 0, hot: -3 },
  },
  {
    id: "medium",
    label: "Medium ears",
    asset: "ears_medium",
    modifiers: { cold: 0, temperate: 3, hot: 0 },
  },
  {
    id: "large",
    label: "Large ears",
    asset: "ears_very_large",
    modifiers: { cold: -3, temperate: 0, hot: 3 },
  },
];

const TEMPERATURE_STATES_A0 = ["cold", "temperate", "hot"];

/**
 * @typedef A0Mupal
 * @property {number} id
 * @property {EarType} earType
 * @property {string} label
 * @property {string} asset
 * @property {number|null} baseRoll
 * @property {number|null} modifier
 * @property {number|null} finalScore
 * @property {boolean} survived
 */

/**
 * @typedef TrialResult
 * @property {Temperature} environment
 * @property {EarType} prediction
 * @property {{small:number, medium:number, large:number}} survivors
 * @property {A0Mupal[]} population
 */

/** @returns {number} */
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/** @returns {number} */
function roll2d6() {
  return rollDie() + rollDie();
}

/**
 * @param {EarType} earType
 * @returns {{id:EarType, label:string, asset:string, modifiers:{cold:number, temperate:number, hot:number}}}
 */
function getEarTypeData(earType) {
  const ear = EAR_TYPES_A0.find((item) => item.id === earType);
  if (!ear) {
    throw new Error(`Unknown ear type: ${earType}`);
  }
  return ear;
}

/**
 * @param {EarType} earType
 * @param {number} id
 * @returns {A0Mupal}
 */
function createMupal(earType, id) {
  const ear = getEarTypeData(earType);

  return {
    id,
    earType: ear.id,
    label: ear.label,
    asset: ear.asset,
    baseRoll: null,
    modifier: null,
    finalScore: null,
    survived: false,
  };
}

/**
 * Generates a fresh 15-Mupal population:
 * - 5 small
 * - 5 medium
 * - 5 large
 *
 * @returns {A0Mupal[]}
 */
function generatePopulation() {
  /** @type {A0Mupal[]} */
  const population = [];
  let currentId = 1;

  for (let i = 0; i < 5; i += 1) {
    population.push(createMupal("small", currentId));
    currentId += 1;
  }

  for (let i = 0; i < 5; i += 1) {
    population.push(createMupal("medium", currentId));
    currentId += 1;
  }

  for (let i = 0; i < 5; i += 1) {
    population.push(createMupal("large", currentId));
    currentId += 1;
  }

  return population;
}

/**
 * @param {EarType} earType
 * @param {Temperature} environment
 * @returns {number}
 */
function getEarModifier(earType, environment) {
  const ear = getEarTypeData(earType);
  return ear.modifiers[environment];
}

/**
 * Calculates one Mupal's score for a single trial.
 *
 * @param {A0Mupal} mupal
 * @param {Temperature} environment
 * @returns {{baseRoll:number, modifier:number, finalScore:number}}
 */
function calculateTrialScore(mupal, environment) {
  const baseRoll = roll2d6();
  const modifier = getEarModifier(mupal.earType, environment);

  return {
    baseRoll,
    modifier,
    finalScore: baseRoll + modifier,
  };
}

/**
 * Applies scores to every Mupal in the population for one trial.
 *
 * @param {A0Mupal[]} population
 * @param {Temperature} environment
 * @returns {A0Mupal[]}
 */
function scorePopulation(population, environment) {
  return population.map((mupal) => {
    const result = calculateTrialScore(mupal, environment);

    return {
      ...mupal,
      baseRoll: result.baseRoll,
      modifier: result.modifier,
      finalScore: result.finalScore,
      survived: false,
    };
  });
}

/**
 * Marks the top 6 scoring Mupals as survivors.
 * If there are ties at the cutoff, the default array sort order
 * will determine the final top 6. This is acceptable for Version A0.
 *
 * @param {A0Mupal[]} scoredPopulation
 * @returns {A0Mupal[]}
 */
function determineSurvivors(scoredPopulation) {
  const sorted = [...scoredPopulation].sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return a.id - b.id;
  });

  const survivorIds = new Set(sorted.slice(0, 6).map((mupal) => mupal.id));

  return scoredPopulation.map((mupal) => ({
    ...mupal,
    survived: survivorIds.has(mupal.id),
  }));
}

/**
 * Summarizes surviving counts by ear type.
 *
 * @param {A0Mupal[]} population
 * @returns {{small:number, medium:number, large:number}}
 */
function summarizeSurvivors(population) {
  const summary = {
    small: 0,
    medium: 0,
    large: 0,
  };

  for (const mupal of population) {
    if (mupal.survived) {
      summary[mupal.earType] += 1;
    }
  }

  return summary;
}

/**
 * Runs one complete independent A0 trial.
 *
 * @param {Temperature} environment
 * @param {EarType} prediction
 * @returns {TrialResult}
 */
function runTrial(environment, prediction) {
  if (!TEMPERATURE_STATES_A0.includes(environment)) {
    throw new Error(`Invalid environment: ${environment}`);
  }

  if (!["small", "medium", "large"].includes(prediction)) {
    throw new Error(`Invalid prediction: ${prediction}`);
  }

  const freshPopulation = generatePopulation();
  const scoredPopulation = scorePopulation(freshPopulation, environment);
  const finalPopulation = determineSurvivors(scoredPopulation);
  const survivors = summarizeSurvivors(finalPopulation);

  return {
    environment,
    prediction,
    survivors,
    population: finalPopulation,
  };
}

/**
 * Creates a compact summary row for use in the final comparison screen.
 *
 * @param {TrialResult} trialResult
 * @returns {{environment:Temperature, prediction:EarType, small:number, medium:number, large:number}}
 */
function createSummaryRow(trialResult) {
  return {
    environment: trialResult.environment,
    prediction: trialResult.prediction,
    small: trialResult.survivors.small,
    medium: trialResult.survivors.medium,
    large: trialResult.survivors.large,
  };
}

// Optional browser/global exports.
window.MupalEngineVA0 = {
  EAR_TYPES_A0,
  TEMPERATURE_STATES_A0,
  rollDie,
  roll2d6,
  getEarTypeData,
  createMupal,
  generatePopulation,
  getEarModifier,
  calculateTrialScore,
  scorePopulation,
  determineSurvivors,
  summarizeSurvivors,
  runTrial,
  createSummaryRow,
};

/*
Example manual test in browser console:

const result = window.MupalEngineVA0.runTrial("cold", "small");
console.log(result);
console.log(window.MupalEngineVA0.createSummaryRow(result));
*/