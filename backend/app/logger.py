import logging
import json
from datetime import datetime, timezone
from typing import Dict, Any
from config.settings import LOGS_DIR

# Set up standard file and console loggers
LOG_FILE_PATH = LOGS_DIR / "email_automation.log"

logger = logging.getLogger("email_automation")
logger.setLevel(logging.INFO)

# File handler with UTF-8 encoding
if not logger.handlers:
    file_handler = logging.FileHandler(LOG_FILE_PATH, encoding="utf-8")
    file_formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)


def log_email_transaction(
    email_data: Dict[str, Any],
    classification: Dict[str, Any],
    confidence: float,
    route: str,
    action: str,
    dispatch_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Logs the minimum required processing details:
    - timestamp
    - email information
    - detected intent
    - confidence score
    - action taken
    - reason
    """
    log_record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email_id": email_data.get("id", "N/A"),
        "sender": email_data.get("sender", "N/A"),
        "sender_name": email_data.get("sender_name", "N/A"),
        "subject": email_data.get("subject", "N/A"),
        "body": email_data.get("body", ""),
        "attachment": email_data.get("attachment", None),
        "detected_intent": classification.get("intent_type", "N/A"),
        "clarity_level": classification.get("clarity_level", "N/A"),
        "missing_information": classification.get("missing_information", False),
        "needs_human_review": classification.get("needs_human_review", False),
        "confidence_score": confidence,
        "route_selected": route,
        "action_taken": action,
        "reason": classification.get("reason", "N/A"),
        "dispatch_status": dispatch_result.get("status", "N/A"),
        "recipient": dispatch_result.get("recipient", "N/A"),
        "response_preview": email_data.get("response_preview") or dispatch_result.get("response_preview", ""),
        "source": email_data.get("source", "gmail_imap"),
    }

    # Log readable line to console/file
    logger.info(
        "PROCESSED EMAIL | ID: %s | From: %s | Intent: %s | Conf: %.2f | Route: %s | Action: %s",
        log_record["email_id"],
        log_record["sender"],
        log_record["detected_intent"],
        log_record["confidence_score"],
        log_record["route_selected"],
        log_record["action_taken"],
    )

    # Append full audit json line to audit.jsonl for persistent logging
    audit_file = LOGS_DIR / "audit.jsonl"
    with open(audit_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_record) + "\n")

    return log_record
