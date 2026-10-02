import re
from typing import Dict, Any


def clean_text(text: str) -> str:
    """
    Cleans and normalizes email text by removing extra spaces,
    normalizing line breaks, and stripping leading/trailing whitespace.
    """
    if not text:
        return ""
    
    # Normalize carriage returns and line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Remove excessive consecutive newlines (more than 2 -> 2)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # Normalize inline spaces and tabs (multiple horizontal spaces -> single space)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    
    return "\n".join(lines).strip()


def strip_email_trail(text: str) -> str:
    """
    Strips quoted reply trails and forwarded message headers.
    """
    if not text:
        return ""
    
    # Common reply delimiters in email bodies
    delimiter_patterns = [
        r"^-+\s*Original Message\s*-+",
        r"^On\s.+wrote:\s*$",
        r"^From:\s.+Sent:\s.+",
        r"^_{10,}",
    ]
    
    lines = text.split("\n")
    cleaned_lines = []
    
    for line in lines:
        if any(re.match(pattern, line.strip(), re.IGNORECASE) for pattern in delimiter_patterns):
            break
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines).strip()


def preprocess_email(raw_email: Dict[str, Any]) -> Dict[str, Any]:
    """
    Preprocesses raw email data:
    - Normalizes subject line
    - Cleans and strips body content
    - Returns structured clean payload for the classifier
    """
    subject = raw_email.get("subject", "").strip()
    body = raw_email.get("body", "")
    
    # Clean email trail first, then clean formatting
    body_stripped = strip_email_trail(body)
    cleaned_body = clean_text(body_stripped if body_stripped else body)
    cleaned_subject = clean_text(subject)
    
    # Combine subject and body into a structured formatted context
    combined_content = f"Subject: {cleaned_subject}\n\nBody:\n{cleaned_body}"
    
    return {
        "id": raw_email.get("id", ""),
        "sender": raw_email.get("sender", "").strip(),
        "sender_name": raw_email.get("sender_name", "").strip(),
        "subject": cleaned_subject,
        "body": cleaned_body,
        "combined_content": combined_content.strip(),
        "received_at": raw_email.get("received_at", ""),
        "attachment": raw_email.get("attachment", None),
    }
