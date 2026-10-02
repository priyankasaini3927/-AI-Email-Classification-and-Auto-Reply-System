import imaplib
import email
from email.header import decode_header
import json
from pathlib import Path
from typing import List, Dict, Any

from config.settings import IMAP_SERVER, IMAP_PORT, IMAP_USERNAME, IMAP_PASSWORD


def _decode_mime_header(header_value: str) -> str:
    """Decodes MIME encoded email header fields."""
    if not header_value:
        return ""
    decoded_parts = decode_header(header_value)
    result = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            result.append(str(part))
    return "".join(result)


def _extract_email_body(msg: email.message.Message) -> str:
    """Extracts plain text content from an email message."""
    body_parts = []
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_parts.append(payload.decode(charset, errors="replace"))
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            body_parts.append(payload.decode(charset, errors="replace"))
            
    return "\n".join(body_parts).strip()


def fetch_unread_imap_emails(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Connects to IMAP inbox and fetches unread emails.
    Returns a list of standardized raw email dictionaries.
    Raises exception if connection or credentials fail.
    """
    if not IMAP_USERNAME or not IMAP_PASSWORD:
        raise ValueError("Gmail IMAP credentials (IMAP_USERNAME / IMAP_PASSWORD) are not configured in .env")

    emails = []
    mail = None
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, timeout=10)
        mail.login(IMAP_USERNAME, IMAP_PASSWORD)
        mail.select("INBOX")

        status, response = mail.search(None, "UNSEEN")
        if status != "OK":
            return []

        email_ids = response[0].split()
        target_ids = email_ids[-limit:]  # Get latest unread up to limit

        for e_id in target_ids:
            status, data = mail.fetch(e_id, "(RFC822)")
            if status != "OK" or not data or not data[0]:
                continue

            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)

            subject = _decode_mime_header(msg.get("Subject", "No Subject"))
            from_header = _decode_mime_header(msg.get("From", ""))
            
            # Simple sender and sender_name extraction
            sender = from_header
            sender_name = ""
            if "<" in from_header and ">" in from_header:
                parts = from_header.split("<")
                sender_name = parts[0].strip().strip('"').strip("'")
                sender = parts[1].replace(">", "").strip()

            body = _extract_email_body(msg)
            date_str = msg.get("Date", "")

            # Attachment detection
            attachment = None
            if msg.is_multipart():
                for part in msg.walk():
                    content_disposition = str(part.get("Content-Disposition", ""))
                    if "attachment" in content_disposition:
                        fname = part.get_filename()
                        if fname:
                            attachment = _decode_mime_header(fname)
                            break

            emails.append({
                "id": e_id.decode("utf-8", errors="replace"),
                "sender": sender,
                "sender_name": sender_name or "Applicant",
                "subject": subject,
                "body": body,
                "received_at": date_str,
                "attachment": attachment,
            })
    finally:
        if mail:
            try:
                mail.close()
            except Exception:
                pass
            try:
                mail.logout()
            except Exception:
                pass

    return emails


def read_emails_from_json(file_path: Path | str) -> List[Dict[str, Any]]:
    """
    Reads mock/sample emails from a local JSON file.
    Ideal for local testing, development, and offline pipelines.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Email data file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        return [data]
    return []
