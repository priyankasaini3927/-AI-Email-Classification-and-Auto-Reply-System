import sys
from pathlib import Path
from typing import List, Dict, Any

from app.email_reader import read_emails_from_json, fetch_unread_imap_emails
from app.preprocessor import preprocess_email
from app.classifier import classify_email
from app.confidence import calculate_confidence
from app.router import determine_route, determine_action
from app.responder import render_response, dispatch_response
from app.logger import log_email_transaction
from config.settings import BASE_DIR, IMAP_USERNAME
from app.server import app


def process_single_email(raw_email: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the end-to-end processing pipeline on a single email:
    1. Preprocess raw content
    2. Classify intent with AI
    3. Calculate deterministic confidence
    4. Determine route & action path
    5. Render and dispatch response
    6. Record transaction log
    """
    # 1. Preprocessing
    cleaned_email = preprocess_email(raw_email)

    # 2. AI Classification
    classification = classify_email(cleaned_email["combined_content"])

    # 3. Deterministic Confidence Calculation
    confidence = calculate_confidence(classification)

    # 4. Routing Decision
    route = determine_route(confidence)
    action = determine_action(route, classification.get("intent_type", ""))

    # 5. Response Rendering and Dispatch
    rendered_email = render_response(action, cleaned_email, classification, confidence)
    dispatch_result = dispatch_response(rendered_email)

    # 6. Structured Logging
    log_record = log_email_transaction(
        email_data=cleaned_email,
        classification=classification,
        confidence=confidence,
        route=route,
        action=action,
        dispatch_result=dispatch_result,
    )

    return {
        "email_id": cleaned_email.get("id"),
        "subject": cleaned_email.get("subject"),
        "classification": classification,
        "confidence": confidence,
        "route": route,
        "action": action,
        "rendered_response": rendered_email,
        "dispatch_result": dispatch_result,
    }


def process_batch(emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processes a list of emails sequentially."""
    results = []
    for email_data in emails:
        result = process_single_email(email_data)
        results.append(result)
    return results


def main():
    """Main entrypoint for local execution or automated pipeline."""
    sample_file = BASE_DIR / "tests" / "sample_emails.json"

    # Default to sample JSON if IMAP is not configured or if requested
    if len(sys.argv) > 1:
        custom_path = Path(sys.argv[1])
        print(f"Loading test emails from {custom_path}...")
        emails = read_emails_from_json(custom_path)
    elif IMAP_USERNAME:
        print(f"Connecting to IMAP inbox ({IMAP_USERNAME})...")
        try:
            emails = fetch_unread_imap_emails(limit=5)
        except Exception as e:
            print(f"[IMAP] Connection error: {e}")
            emails = []
        if not emails and sample_file.exists():
            print("No unread IMAP emails found. Falling back to sample_emails.json...")
            emails = read_emails_from_json(sample_file)
    elif sample_file.exists():
        print(f"Reading sample test emails from {sample_file.name}...")
        emails = read_emails_from_json(sample_file)
    else:
        print("No email sources found. Please provide a JSON file or configure IMAP credentials.")
        return

    print(f"Processing {len(emails)} email(s)...\n")
    results = process_batch(emails)
    print(f"\nProcessing complete! Processed {len(results)} email(s). Check logs/ for details.")


if __name__ == "__main__":
    main()
