/**
 * Deterministic Confidence Engine & Router
 * Faithful JavaScript implementation of backend logic in app/confidence.py & app/router.py
 */

export const THRESHOLDS = {
  AUTO_REPLY: 0.75,
  CLARIFICATION: 0.45,
};

export const INTENT_OPTIONS = [
  { value: 'job_application', label: 'Job Application', weight: '+0.40' },
  { value: 'interview_request', label: 'Interview Request', weight: '+0.40' },
  { value: 'clarification', label: 'Clarification', weight: '+0.00' },
  { value: 'irrelevant', label: 'Irrelevant / Spam', weight: '+0.00' },
];

export const CLARITY_OPTIONS = [
  { value: 'high', label: 'High', weight: '+0.30' },
  { value: 'medium', label: 'Medium', weight: '+0.15' },
  { value: 'low', label: 'Low', weight: '+0.00' },
];

/**
 * Calculates score breakdowns and total confidence score
 */
export function calculateConfidenceDetails(classification) {
  const {
    intent_type = 'irrelevant',
    clarity_level = 'low',
    missing_information = false,
    needs_human_review = false,
  } = classification;

  const breakdowns = [];
  let score = 0.0;

  // Base
  breakdowns.push({
    factor: 'Base Score',
    condition: 'Starting Value',
    delta: 0.0,
    runningTotal: 0.0,
  });

  // Intent
  if (intent_type === 'job_application') {
    score += 0.40;
    breakdowns.push({ factor: 'Intent', condition: 'job_application', delta: 0.40, runningTotal: score });
  } else if (intent_type === 'interview_request') {
    score += 0.40;
    breakdowns.push({ factor: 'Intent', condition: 'interview_request', delta: 0.40, runningTotal: score });
  } else {
    breakdowns.push({ factor: 'Intent', condition: intent_type, delta: 0.00, runningTotal: score });
  }

  // Clarity
  if (clarity_level === 'high') {
    score += 0.30;
    breakdowns.push({ factor: 'Clarity', condition: 'high', delta: 0.30, runningTotal: score });
  } else if (clarity_level === 'medium') {
    score += 0.15;
    breakdowns.push({ factor: 'Clarity', condition: 'medium', delta: 0.15, runningTotal: score });
  } else {
    breakdowns.push({ factor: 'Clarity', condition: 'low', delta: 0.00, runningTotal: score });
  }

  const isSupportedIntent = ['job_application', 'interview_request'].includes(intent_type);

  if (isSupportedIntent) {
    // Missing info
    if (missing_information === false) {
      score += 0.10;
      breakdowns.push({ factor: 'Completeness', condition: 'missing_information = false', delta: 0.10, runningTotal: score });
    } else {
      score -= 0.20;
      breakdowns.push({ factor: 'Missing Info Penalty', condition: 'missing_information = true', delta: -0.20, runningTotal: score });
    }

    // Human review
    if (needs_human_review === false) {
      score += 0.10;
      breakdowns.push({ factor: 'Safety Bonus', condition: 'needs_human_review = false', delta: 0.10, runningTotal: score });
    } else {
      score -= 0.30;
      breakdowns.push({ factor: 'Escalation Penalty', condition: 'needs_human_review = true', delta: -0.30, runningTotal: score });
    }
  } else {
    if (needs_human_review) {
      score -= 0.30;
      breakdowns.push({ factor: 'Escalation Penalty', condition: 'needs_human_review = true', delta: -0.30, runningTotal: score });
    }
  }

  const unclampedScore = score;
  const clamped = Math.max(0.0, Math.min(1.0, score));
  const finalConfidence = Number(clamped.toFixed(2));

  return {
    confidence: finalConfidence,
    unclampedScore: Number(unclampedScore.toFixed(2)),
    breakdowns,
  };
}

/**
 * Maps confidence to routing decision
 */
export function determineRoute(confidence) {
  if (confidence >= THRESHOLDS.AUTO_REPLY) {
    return 'auto_reply';
  } else if (confidence >= THRESHOLDS.CLARIFICATION) {
    return 'clarification';
  } else {
    return 'human_review';
  }
}

/**
 * Maps route and intent to action
 */
export function determineAction(route, intent_type) {
  if (route === 'auto_reply') {
    if (intent_type === 'job_application') {
      return 'send_acknowledgement';
    } else if (intent_type === 'interview_request') {
      return 'send_interview_info';
    } else {
      return 'forward_to_hr';
    }
  } else if (route === 'clarification') {
    return 'request_clarification';
  } else {
    return 'forward_to_hr';
  }
}

/**
 * Format intent label
 */
export function formatIntent(intent) {
  switch (intent) {
    case 'job_application':
      return 'Job Application';
    case 'interview_request':
      return 'Interview Request';
    case 'clarification':
      return 'Clarification';
    case 'irrelevant':
      return 'Irrelevant / Spam';
    default:
      return intent || 'Unknown';
  }
}

/**
 * Format route label
 */
export function formatRoute(route) {
  switch (route) {
    case 'auto_reply':
      return 'Auto Reply';
    case 'clarification':
      return 'Clarification';
    case 'human_review':
      return 'HR Review';
    default:
      return route || 'Review';
  }
}

/**
 * Format action label
 */
export function formatAction(action) {
  switch (action) {
    case 'send_acknowledgement':
      return 'Send Acknowledgement';
    case 'send_interview_info':
      return 'Send Interview Info';
    case 'request_clarification':
      return 'Request Information';
    case 'forward_to_hr':
      return 'Forward to HR';
    default:
      return action || 'Forward to HR';
  }
}
