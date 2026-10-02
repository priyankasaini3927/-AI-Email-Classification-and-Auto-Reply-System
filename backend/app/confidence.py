from typing import Dict, Any, List

SCORING_MATRIX: List[Dict[str, str]] = [
    {
        "factor": "Base",
        "condition": "Starting Value",
        "adjustment": "0.00",
        "color": "text-slate-400",
    },
    {
        "factor": "Intent",
        "condition": "job_application / interview_request",
        "adjustment": "+0.40",
        "color": "text-emerald-400",
    },
    {
        "factor": "Clarity",
        "condition": "high (+0.30) / medium (+0.15)",
        "adjustment": "+0.30 / +0.15",
        "color": "text-emerald-400",
    },
    {
        "factor": "Completeness",
        "condition": "missing_information = false (+0.10) / true (-0.20)",
        "adjustment": "+0.10 / -0.20",
        "color": "text-indigo-300",
    },
    {
        "factor": "Escalation",
        "condition": "needs_human_review = false (+0.10) / true (-0.30)",
        "adjustment": "+0.10 / -0.30",
        "color": "text-rose-400",
    },
    {
        "factor": "Clamping",
        "condition": "Max(0.00, Min(1.00, score))",
        "adjustment": "[0.00, 1.00]",
        "color": "text-cyan-400",
    },
]


def calculate_confidence(classification: Dict[str, Any]) -> float:
    """
    Calculates a deterministic confidence score based on the qualitative
    AI classification output.

    Scoring rules:

    Positive signals:
    - intent_type == 'job_application': +0.40
    - intent_type == 'interview_request': +0.40
    - clarity_level == 'high': +0.30
    - clarity_level == 'medium': +0.15
    - missing_information == False: +0.10
    - needs_human_review == False: +0.10

    Negative signals:
    - missing_information == True: -0.20
    - needs_human_review == True: -0.30

    Bounds:
    - Clamped between [0.00, 1.00]
    - Rounded to 2 decimal places
    """

    confidence = 0.0

    intent_type = classification.get("intent_type", "")
    clarity_level = classification.get("clarity_level", "")
    missing_information = bool(
        classification.get("missing_information", False)
    )
    needs_human_review = bool(
        classification.get("needs_human_review", False)
    )

    # Intent weight
    if intent_type == "job_application":
        confidence += 0.40
    elif intent_type == "interview_request":
        confidence += 0.40

    # Clarity weight
    if clarity_level == "high":
        confidence += 0.30
    elif clarity_level == "medium":
        confidence += 0.15

    # Completeness / safety signals
    supported_intent = intent_type in {
        "job_application",
        "interview_request",
    }

    if supported_intent:
        if missing_information is False:
            confidence += 0.10
        else:
            confidence -= 0.20

        if needs_human_review is False:
            confidence += 0.10
        else:
            confidence -= 0.30
    else:
        # Irrelevant / unsupported intent should not gain
        # confidence from completeness or safety signals.
        if needs_human_review:
            confidence -= 0.30

    # Clamp between 0.0 and 1.0
    confidence = max(0.0, min(1.0, confidence))

    return round(confidence, 2)