/**
 * EvidenceChecker Engine
 * 
 * Analyzes student free response scientific writing against a 4-point CAST/NGSS Rubric:
 * 1. Scientific Claim (1 pt): States a directional relationship or direct answer.
 * 2. Quantitative Evidence (1 pt): Cites at least 2 specific numerical values from the table/graph.
 * 3. Units of Measurement (1 pt): Attaches correct scientific units to measurements.
 * 4. Comparative Reasoning (1 pt): Compares data points/rates and explains the mechanism (Why/Because).
 */

class EvidenceChecker {
  /**
   * Evaluates student text against a scenario's free response expectations
   * @param {string} text - Student's written answer
   * @param {object} scenarioConfig - Scenario questions.freeResponse configuration
   * @returns {object} Detailed rubric score and diagnostic feedback
   */
  static evaluate(text, scenarioConfig) {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        maxScore: 4,
        criteria: [
          { name: "Scientific Claim", earned: false, points: 0, maxPoints: 1, feedback: "No response entered." },
          { name: "Quantitative Evidence", earned: false, points: 0, maxPoints: 1, feedback: "Cite at least two data points from the table.", numbersFound: [] },
          { name: "Units of Measurement", earned: false, points: 0, maxPoints: 1, feedback: "Include scientific units with your numbers.", unitsFound: [] },
          { name: "Comparative Reasoning", earned: false, points: 0, maxPoints: 1, feedback: "Explain why this occurred using scientific principles." }
        ],
        overallFeedback: "Start by writing a claim stating how the independent variable affected the dependent variable.",
        actionableTips: [
          "State a clear claim directly answering the investigative prompt.",
          "Quote at least two specific pairs of numbers from the data table.",
          "Include the appropriate scientific units (e.g., m/s², N, mL/min, °C, Ma, ppm).",
          "Explain the scientific reason using 'because' and scientific concepts."
        ]
      };
    }

    const cleanText = text.toLowerCase();
    const targetNumbers = scenarioConfig.targetNumbers || [];
    const requiredUnits = (scenarioConfig.requiredUnits || []).map(u => u.toLowerCase());
    const claimKeywords = (scenarioConfig.claimKeywords || []).map(k => k.toLowerCase());
    const reasoningKeywords = (scenarioConfig.reasoningKeywords || []).map(k => k.toLowerCase());

    // -------------------------------------------------------------
    // CRITERION 1: SCIENTIFIC CLAIM
    // -------------------------------------------------------------
    let claimEarned = false;
    let claimFeedback = "";
    const hasClaimKeyword = claimKeywords.some(kw => cleanText.includes(kw));
    const wordCount = text.trim().split(/\s+/).length;

    if (hasClaimKeyword && wordCount >= 6) {
      claimEarned = true;
      claimFeedback = "Clear claim identifying the directional relationship or phenomenon.";
    } else if (wordCount >= 6) {
      // Check for generic claim phrases
      const genericClaimPhrases = ["relationship is", "shows that", "as the", "increases", "decreases", "effect of", "causes"];
      if (genericClaimPhrases.some(p => cleanText.includes(p))) {
        claimEarned = true;
        claimFeedback = "Claim stated, though incorporating more specific science vocabulary will strengthen it.";
      } else {
        claimEarned = false;
        claimFeedback = "Missing a clear scientific claim. Explicitly state the relationship between the variables.";
      }
    } else {
      claimEarned = false;
      claimFeedback = "Response is too brief to establish a complete scientific claim.";
    }

    // -------------------------------------------------------------
    // CRITERION 2: QUANTITATIVE NUMERICAL EVIDENCE
    // -------------------------------------------------------------
    // Extract numbers from text (integers, decimals, negative numbers)
    const rawNumberMatches = cleanText.match(/-?\d+(?:\.\d+)?/g) || [];
    const extractedNumbers = rawNumberMatches.map(n => parseFloat(n)).filter(n => !isNaN(n));

    // Match against scenario target numbers (within 3% or ±0.15 tolerance)
    const matchedTargets = new Set();
    const identifiedNumbers = [];

    extractedNumbers.forEach(num => {
      targetNumbers.forEach(target => {
        const diff = Math.abs(num - target);
        const relDiff = target !== 0 ? diff / Math.abs(target) : diff;
        if (diff <= 0.2 || relDiff <= 0.05) {
          if (!matchedTargets.has(target)) {
            matchedTargets.add(target);
            identifiedNumbers.push(num);
          }
        }
      });
    });

    let evidenceEarned = false;
    let evidenceFeedback = "";

    if (matchedTargets.size >= 2) {
      evidenceEarned = true;
      evidenceFeedback = `Excellent quantitative evidence! Cited ${matchedTargets.size} authentic values from the data table (${identifiedNumbers.slice(0, 3).join(", ")}).`;
    } else if (matchedTargets.size === 1) {
      evidenceEarned = false;
      evidenceFeedback = `Cited 1 data point (${identifiedNumbers[0]}), but at least TWO data points are required to establish a comparative trend.`;
    } else if (extractedNumbers.length > 0) {
      evidenceEarned = false;
      evidenceFeedback = `Numbers detected (${extractedNumbers.slice(0, 3).join(", ")}), but they do not match the values in the provided data table.`;
    } else {
      evidenceEarned = false;
      evidenceFeedback = "No numerical values found. You must cite specific numbers from the data table or graph.";
    }

    // -------------------------------------------------------------
    // CRITERION 3: UNITS OF MEASUREMENT
    // -------------------------------------------------------------
    const detectedUnits = [];
    requiredUnits.forEach(unit => {
      // Check for exact unit word or symbol boundaries
      const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i');
      if (regex.test(cleanText)) {
        detectedUnits.push(unit);
      }
    });

    let unitsEarned = false;
    let unitsFeedback = "";

    if (detectedUnits.length >= 1) {
      unitsEarned = true;
      unitsFeedback = `Scientific units included correctly (${detectedUnits.join(", ")}).`;
    } else {
      unitsEarned = false;
      unitsFeedback = `Missing measurement units. Be sure to include appropriate units such as ${requiredUnits.slice(0, 2).join(" or ")}.`;
    }

    // -------------------------------------------------------------
    // CRITERION 4: COMPARATIVE ANALYSIS & SCIENTIFIC REASONING
    // -------------------------------------------------------------
    // Check for comparative words
    const comparativeWords = [
      "compared to", "from", "to", "increased by", "decreased by", "higher than", "lower than",
      "faster", "slower", "greater", "less", "double", "quadruple", "difference", "rate", "slope", "ratio"
    ];
    const hasComparison = comparativeWords.some(w => cleanText.includes(w));

    // Check for reasoning words (why / because / scientific concepts)
    const reasoningConnectors = ["because", "due to", "since", "as a result", "which causes", "mechanism", "reason", "explains"];
    const hasReasoningConnector = reasoningConnectors.some(w => cleanText.includes(w));
    const hasDomainReasoningKeyword = reasoningKeywords.some(kw => cleanText.includes(kw));

    let reasoningEarned = false;
    let reasoningFeedback = "";

    if (hasComparison && (hasReasoningConnector || hasDomainReasoningKeyword)) {
      reasoningEarned = true;
      reasoningFeedback = "Strong comparative analysis supported by underlying scientific reasoning.";
    } else if (hasComparison && !hasReasoningConnector && !hasDomainReasoningKeyword) {
      reasoningEarned = false;
      reasoningFeedback = "Good data comparison, but missing scientific reasoning. Explain WHY this occurred using underlying science principles (e.g. 'because...').";
    } else if (!hasComparison && (hasReasoningConnector || hasDomainReasoningKeyword)) {
      reasoningEarned = false;
      reasoningFeedback = "Scientific concepts mentioned, but you need to explicitly compare your cited numbers (e.g. 'increased from X to Y').";
    } else {
      reasoningEarned = false;
      reasoningFeedback = "Missing both data comparison and scientific reasoning. Compare your numbers and explain the underlying scientific cause.";
    }

    // -------------------------------------------------------------
    // COMPILE TOTAL SCORE & ACTIONABLE ADVICE
    // -------------------------------------------------------------
    const criteria = [
      { name: "Scientific Claim", earned: claimEarned, points: claimEarned ? 1 : 0, maxPoints: 1, feedback: claimFeedback },
      { name: "Quantitative Evidence", earned: evidenceEarned, points: evidenceEarned ? 1 : 0, maxPoints: 1, feedback: evidenceFeedback, numbersFound: identifiedNumbers },
      { name: "Units of Measurement", earned: unitsEarned, points: unitsEarned ? 1 : 0, maxPoints: 1, feedback: unitsFeedback, unitsFound: detectedUnits },
      { name: "Comparative Reasoning", earned: reasoningEarned, points: reasoningEarned ? 1 : 0, maxPoints: 1, feedback: reasoningFeedback }
    ];

    const totalScore = criteria.reduce((sum, c) => sum + c.points, 0);

    const actionableTips = [];
    if (!claimEarned) actionableTips.push("State a direct claim describing the trend (e.g., 'As X increases, Y increases/decreases...').");
    if (!evidenceEarned) actionableTips.push(`Quote at least two specific data pairs from the table (such as ${targetNumbers.slice(0, 2).join(" and ")}).`);
    if (!unitsEarned) actionableTips.push(`Add the correct scientific units after your numbers (e.g., ${requiredUnits.slice(0, 2).join(", ")}).`);
    if (!reasoningEarned) actionableTips.push("Use the word 'because' and explain the scientific mechanism behind this trend.");

    let overallFeedback = "";
    if (totalScore === 4) {
      overallFeedback = "🌟 Outstanding Response! Full 4/4 standard mastery achieved. Your response features a clear claim, authentic cited data, correct scientific units, and strong reasoning.";
    } else if (totalScore === 3) {
      overallFeedback = "👍 Proficient Work (3/4)! You are very close to full mastery. Review the highlighted criterion below to earn full credit.";
    } else if (totalScore === 2) {
      overallFeedback = "📝 Approaching Proficiency (2/4). You have the foundation, but need more specific evidence or scientific explanation.";
    } else {
      overallFeedback = "⚠️ Emerging Response. Follow the actionable checklist below to construct a complete scientific argument.";
    }

    return {
      score: totalScore,
      maxScore: 4,
      criteria,
      overallFeedback,
      actionableTips
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EvidenceChecker };
}
