from typing import Literal
from config.settings import THRESHOLD_AUTO_REPLY, THRESHOLD_CLARIFICATION

RouteType = Literal["auto_reply", "clarification", "human_review"]
ActionType = Literal["send_acknowledgement", "send_interview_info", "request_clarification", "forward_to_hr"]


def determine_route(confidence: float) -> RouteType:
    """
    Evaluates confidence score against fixed thresholds:
    - confidence >= 0.75: auto_reply
    - confidence >= 0.45: clarification
    - confidence < 0.45:  human_review
    """
    if confidence >= THRESHOLD_AUTO_REPLY:
        return "auto_reply"
    elif confidence >= THRESHOLD_CLARIFICATION:
        return "clarification"
    else:
        return "human_review"


def determine_action(route: RouteType, intent_type: str) -> ActionType:
    """
    Maps the route and intent type to the concrete response action path:
    - auto_reply + job_application -> send_acknowledgement (Path 1)
    - auto_reply + interview_request -> send_interview_info (Path 2)
    - clarification -> request_clarification (Path 3)
    - human_review (or fallback) -> forward_to_hr (Path 4)
    """
    if route == "auto_reply":
        if intent_type == "job_application":
            return "send_acknowledgement"
        elif intent_type == "interview_request":
            return "send_interview_info"
        else:
            # Irrelevant or unsupported intents in auto_reply route safely escalate
            return "forward_to_hr"
    elif route == "clarification":
        return "request_clarification"
    else:
        return "forward_to_hr"
