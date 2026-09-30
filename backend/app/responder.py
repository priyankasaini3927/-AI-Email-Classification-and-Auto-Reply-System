import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, Any

from config.settings import (
    TEMPLATES_DIR,
    SENDER_EMAIL,
    SENDER_NAME,
    HR_EMAIL,
    SMTP_SERVER,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    EXECUTION_MODE,
)


def load_template(template_name: str) -> str:
    """Loads a template file from the templates directory."""
    template_path = TEMPLATES_DIR / template_name
    if not template_path.exists():
        raise FileNotFoundError(f"Template file not found: {template_path}")
    return template_path.read_text(encoding="utf-8")


def render_response(
    action: str,
    email_data: Dict[str, Any],
    classification: Dict[str, Any],
    confidence: float,
) -> Dict[str, str]:
    """
    Renders the appropriate response email or HR escalation notice
    based on the selected action.
    """
    candidate_name = email_data.get("sender_name") or "Applicant"
    sender_email = email_data.get("sender", "")
    subject = email_data.get("subject", "No Subject")
    original_body = email_data.get("body", "")

    if action == "send_acknowledgement":
        template = load_template("acknowledgement.txt")
        body = template.format(
            candidate_name=candidate_name,
            sender_name=SENDER_NAME,
        )
        recipient = sender_email
        response_subject = f"Receipt Confirmation: {subject}"

    elif action == "send_interview_info":
        template = load_template("interview.txt")
        body = template.format(
            candidate_name=candidate_name,
            sender_name=SENDER_NAME,
        )
        recipient = sender_email
        response_subject = f"Interview Information: {subject}"

    elif action == "request_clarification":
        template = load_template("clarification.txt")
        body = template.format(
            candidate_name=candidate_name,
            sender_name=SENDER_NAME,
        )
        recipient = sender_email
        response_subject = f"Information Needed: {subject}"

    else:  # forward_to_hr
        template = load_template("human_review.txt")
        body = template.format(
            candidate_name=candidate_name,
            sender_email=sender_email,
            subject=subject,
            intent_type=classification.get("intent_type", "unknown"),
            confidence=f"{confidence:.2f}",
            reason=classification.get("reason", "Needs manual triage"),
            original_body=original_body,
        )
        recipient = HR_EMAIL
        response_subject = f"[HR Review Required] {subject}"

    return {
        "recipient": recipient,
        "subject": response_subject,
        "body": body,
        "action": action,
    }


def dispatch_response(rendered_email: Dict[str, str]) -> Dict[str, Any]:
    """
    Sends the email via SMTP if in 'live' mode, or mocks dispatch in 'dry_run' mode.
    """
    recipient = rendered_email["recipient"]
    subject = rendered_email["subject"]
    body = rendered_email["body"]
    action = rendered_email["action"]

    if EXECUTION_MODE != "live":
        return {
            "status": "dry_run_success",
            "recipient": recipient,
            "subject": subject,
            "action": action,
            "sent": False,
        }

    # Live SMTP Dispatch
    try:
        msg = MIMEMultipart()
        msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return {
            "status": "sent_success",
            "recipient": recipient,
            "subject": subject,
            "action": action,
            "sent": True,
        }
    except Exception as e:
        return {
            "status": "send_failed",
            "recipient": recipient,
            "subject": subject,
            "action": action,
            "sent": False,
            "error": str(e),
        }
