import os
import time
import json
import secrets
import hashlib
import hmac
from pathlib import Path
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Cookie, status
from fastapi.middleware.cors import CORSMiddleware

import imaplib
import smtplib

from config.settings import (
    BASE_DIR,
    LOGS_DIR,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_PASSWORD_HASH,
    IMAP_SERVER,
    IMAP_PORT,
    IMAP_USERNAME,
    IMAP_PASSWORD,
    SMTP_SERVER,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    EXECUTION_MODE,
    HR_EMAIL,
    SENDER_EMAIL,
    SENDER_NAME,
    GEMINI_API_KEY,
    MODEL_NAME,
    THRESHOLD_AUTO_REPLY,
    THRESHOLD_CLARIFICATION,
)
from app.email_reader import fetch_unread_imap_emails
from app.preprocessor import preprocess_email
from app.classifier import classify_email
from app.confidence import calculate_confidence, SCORING_MATRIX
import config.settings
from app.router import determine_route, determine_action
from app.responder import render_response, dispatch_response
from app.logger import log_email_transaction

app = FastAPI(
    title="AI Email Assistant API",
    description="Backend API with secure session authentication and email processing pipeline",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store with TTL
SESSION_STORE: Dict[str, Dict[str, Any]] = {}
SESSION_TTL_SECONDS = 86400  # 24 hours


# Pydantic schemas
class LoginRequest(BaseModel):
    email: str
    password: str


class SettingsUpdateRequest(BaseModel):
    emailConnection: Optional[Dict[str, Any]] = None
    aiConfiguration: Optional[Dict[str, Any]] = None
    automation: Optional[Dict[str, Any]] = None


class ExecutionModeRequest(BaseModel):
    mode: str


class ProcessEmailRequest(BaseModel):
    id: Optional[str] = None
    sender: str
    sender_name: Optional[str] = None
    subject: str
    body: str
    intent_type: Optional[str] = None
    clarity_level: Optional[str] = None
    missing_information: Optional[bool] = False
    needs_human_review: Optional[bool] = False
    confidence: Optional[float] = None
    route: Optional[str] = None
    action: Optional[str] = None
    attachment: Optional[str] = None
    reason: Optional[str] = None
    response_preview: Optional[str] = None


# Persistent / Initial data store
INITIAL_EMAILS = [
    {
        "id": "MSG-024",
        "sender": "alex.morgan@example.com",
        "sender_name": "Alex Morgan",
        "subject": "Application for Python Developer",
        "body": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Python Developer position currently open at your organization. Attached please find my updated resume and GitHub portfolio showcasing 5+ years of production experience in FastAPI, Docker, and distributed message queues.\n\nI look forward to discussing how my background aligns with your engineering goals.\n\nWarm regards,\nAlex Morgan\nPhone: +1 (555) 234-8901",
        "timestamp": "2026-09-28T22:15:00Z",
        "time_display": "10 mins ago",
        "intent_type": "job_application",
        "clarity_level": "high",
        "missing_information": False,
        "needs_human_review": False,
        "confidence": 0.92,
        "route": "auto_reply",
        "action": "send_acknowledgement",
        "processing_status": "Success",
        "attachment": "Resume_Alex_Morgan.pdf",
        "reason": "Direct application for Python Developer role with complete resume and contact details provided.",
        "response_preview": "Hi Alex Morgan,\n\nThank you for applying for the Python Developer position. We have safely received your resume (Resume_Alex_Morgan.pdf) and application materials.\n\nOur recruitment team will review your profile within 3 business days.\n\nBest regards,\nHR Recruitment Team",
    },
    {
        "id": "MSG-023",
        "sender": "sara.connor@example.com",
        "sender_name": "Sara Connor",
        "subject": "Interview Schedule Request",
        "body": "Hello HR Team,\n\nThank you for progressing my application. I received the invitation for the Round 2 Technical Panel. I can confirm availability on Thursday at 2:00 PM EST or Friday between 10:00 AM - 1:00 PM EST.\n\nPlease let me know which time slot works best for the panel interviewers.\n\nBest regards,\nSara Connor",
        "timestamp": "2026-09-28T21:50:00Z",
        "time_display": "35 mins ago",
        "intent_type": "interview_request",
        "clarity_level": "high",
        "missing_information": False,
        "needs_human_review": False,
        "confidence": 0.88,
        "route": "auto_reply",
        "action": "send_interview_info",
        "processing_status": "Success",
        "attachment": None,
        "reason": "Candidate confirmed technical interview availability for Thursday/Friday afternoon.",
        "response_preview": "Hi Sara Connor,\n\nThank you for sharing your availability. We have noted your preferred slots for Thursday and Friday.\n\nA calendar invite with Google Meet coordinates will follow shortly.\n\nBest regards,\nTalent Acquisition Team",
    },
    {
        "id": "MSG-022",
        "sender": "jordan.lee@example.com",
        "sender_name": "Jordan Lee",
        "subject": "Query regarding position",
        "body": "Hey there,\n\nI saw your job post and wanted to ask if you have any engineering spots open or if remote candidates are eligible. Let me know.\n\nJordan",
        "timestamp": "2026-09-28T21:10:00Z",
        "time_display": "1 hour ago",
        "intent_type": "clarification",
        "clarity_level": "low",
        "missing_information": True,
        "needs_human_review": True,
        "confidence": 0.15,
        "route": "human_review",
        "action": "forward_to_hr",
        "processing_status": "Success",
        "attachment": None,
        "reason": "Vague job inquiry without attached CV or specified engineering position.",
        "response_preview": "[ESCALATED TO HR]\nFrom: jordan.lee@example.com\nFlagged: Low clarity & missing specific position title. Forwarded to recruiter inbox for manual triage.",
    },
    {
        "id": "MSG-021",
        "sender": "david.k@example.com",
        "sender_name": "David K",
        "subject": "Salary details?",
        "body": "Dear HR Director,\n\nI reviewed the offer letter sent yesterday. The base compensation does not match what was discussed verbally with the VP of Engineering. I need clause 4 amended and a revised package of $160,000 before signing.\n\nRegards,\nDavid K",
        "timestamp": "2026-09-28T20:20:00Z",
        "time_display": "2 hours ago",
        "intent_type": "clarification",
        "clarity_level": "medium",
        "missing_information": False,
        "needs_human_review": True,
        "confidence": 0.08,
        "route": "human_review",
        "action": "forward_to_hr",
        "processing_status": "Success",
        "attachment": "Offer_Clause_Revision.docx",
        "reason": "Compensation and offer dispute requiring manual HR review.",
        "response_preview": "[ESCALATED TO HR PRIORITY]\nFrom: david.k@example.com\nFlagged: Sensitive offer letter negotiation & compensation clause modification. Forwarded to Senior HR Partner.",
    },
    {
        "id": "MSG-020",
        "sender": "promo@marketing-blast.xyz",
        "sender_name": "Sales Outreach",
        "subject": "Huge Opportunity!!!",
        "body": "Attention HR Manager,\n\nSupercharge your team's productivity with our AI SEO tools! Special promo: $49/mo lifetime discount if you sign up today.\n\nClick here to unsubscribe.",
        "timestamp": "2026-09-28T19:30:00Z",
        "time_display": "3 hours ago",
        "intent_type": "irrelevant",
        "clarity_level": "medium",
        "missing_information": True,
        "needs_human_review": True,
        "confidence": 0.30,
        "route": "human_review",
        "action": "forward_to_hr",
        "processing_status": "Success",
        "attachment": None,
        "reason": "Spam marketing solicitation unrelated to recruitment or hiring.",
        "response_preview": "[ESCALATED TO HR SPAM ARCHIVE]\nFrom: promo@marketing-blast.xyz\nFlagged: Promotional blast. Filtered out from candidate pipeline.",
    }
]

INITIAL_LOGS = [
    {
        "timestamp": "2026-09-28 22:15:00",
        "email_id": "MSG-024",
        "sender": "alex.morgan@example.com",
        "intent": "job_application",
        "confidence": 0.92,
        "route": "auto_reply",
        "action": "send_acknowledgement",
        "status": "Success",
        "details": {
            "clarity": "high",
            "missing_info": False,
            "human_review": False,
            "reason": "Direct application for Python Developer role with complete resume and contact details provided.",
            "recipient": "alex.morgan@example.com",
        }
    },
    {
        "timestamp": "2026-09-28 21:50:00",
        "email_id": "MSG-023",
        "sender": "sara.connor@example.com",
        "intent": "interview_request",
        "confidence": 0.88,
        "route": "auto_reply",
        "action": "send_interview_info",
        "status": "Success",
        "details": {
            "clarity": "high",
            "missing_info": False,
            "human_review": False,
            "reason": "Candidate confirmed technical interview availability for Thursday/Friday afternoon.",
            "recipient": "sara.connor@example.com",
        }
    },
    {
        "timestamp": "2026-09-28 21:10:00",
        "email_id": "MSG-022",
        "sender": "jordan.lee@example.com",
        "intent": "clarification",
        "confidence": 0.15,
        "route": "human_review",
        "action": "forward_to_hr",
        "status": "Success",
        "details": {
            "clarity": "low",
            "missing_info": True,
            "human_review": True,
            "reason": "Vague job inquiry without attached CV or specified engineering position.",
            "recipient": "hr@example.com",
        }
    },
    {
        "timestamp": "2026-09-28 20:20:00",
        "email_id": "MSG-021",
        "sender": "david.k@example.com",
        "intent": "clarification",
        "confidence": 0.08,
        "route": "human_review",
        "action": "forward_to_hr",
        "status": "Success",
        "details": {
            "clarity": "medium",
            "missing_info": False,
            "human_review": True,
            "reason": "Compensation and offer dispute requiring manual HR review.",
            "recipient": "hr@example.com",
        }
    },
    {
        "timestamp": "2026-09-28 19:30:00",
        "email_id": "MSG-020",
        "sender": "promo@marketing-blast.xyz",
        "intent": "irrelevant",
        "confidence": 0.30,
        "route": "human_review",
        "action": "forward_to_hr",
        "status": "Success",
        "details": {
            "clarity": "medium",
            "missing_info": True,
            "human_review": True,
            "reason": "Spam marketing solicitation unrelated to recruitment or hiring.",
            "recipient": "hr@example.com",
        }
    }
]


DEMO_SENDERS = {
    "alex.morgan@example.com",
    "sara.connor@example.com",
    "jordan.lee@example.com",
    "david.k@example.com",
    "promo@marketing-blast.xyz",
}

PROCESSED_EMAILS_FILE = LOGS_DIR / "processed_emails.json"


def save_processed_emails():
    """Persists current DATA_EMAILS to disk for restart durability."""
    try:
        # Save only genuinely processed non-demo email records
        records_to_save = [
            e for e in DATA_EMAILS
            if e.get("sender") not in DEMO_SENDERS and e.get("source") != "sample_emails"
        ]
        with open(PROCESSED_EMAILS_FILE, "w", encoding="utf-8") as f:
            json.dump(records_to_save, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Storage] Failed to save processed_emails.json: {e}")


def load_initial_stores():
    """
    Loads genuinely processed real emails and audit logs.
    Strictly isolates sample/demo presets so they never populate the normal dashboard.
    """
    emails = []
    logs = []

    # 1. Load saved real emails from processed_emails.json if present
    if PROCESSED_EMAILS_FILE.exists():
        try:
            with open(PROCESSED_EMAILS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, list):
                    for item in saved:
                        sender = item.get("sender", "")
                        if sender not in DEMO_SENDERS and item.get("source") != "sample_emails":
                            emails.append(item)
        except Exception as e:
            print(f"[Storage] Error reading processed_emails.json: {e}")

    # 2. Reconstruct from audit.jsonl for logs and any real emails
    audit_file = LOGS_DIR / "audit.jsonl"
    if audit_file.exists():
        try:
            with open(audit_file, "r", encoding="utf-8") as f:
                lines = [l.strip() for l in f if l.strip()]
            for line in lines[-100:]:
                try:
                    rec = json.loads(line)
                    sender = rec.get("sender", "N/A")
                    # Strict isolation: never load demo test presets into normal dashboard
                    if sender in DEMO_SENDERS or rec.get("source") == "sample_emails":
                        continue

                    ts = rec.get("timestamp", "").replace("T", " ")[:19]
                    e_id = rec.get("email_id", "N/A")
                    dispatch_status = rec.get("dispatch_status", "")
                    proc_status = "Failed" if dispatch_status == "send_failed" else "Success"

                    log_item = {
                        "timestamp": ts,
                        "email_id": e_id,
                        "sender": sender,
                        "intent": rec.get("detected_intent", "irrelevant"),
                        "confidence": float(rec.get("confidence_score", 0.0)),
                        "route": rec.get("route_selected", "human_review"),
                        "action": rec.get("action_taken", "forward_to_hr"),
                        "status": proc_status,
                        "details": {
                            "clarity": rec.get("clarity_level", "low"),
                            "missing_info": rec.get("missing_information", False),
                            "human_review": rec.get("needs_human_review", False),
                            "reason": rec.get("reason", ""),
                            "recipient": rec.get("recipient", "N/A"),
                        }
                    }
                    if not any(l["email_id"] == e_id and l["timestamp"] == ts for l in logs):
                        logs.insert(0, log_item)

                    # Only reconstruct if we have real content (never create synthetic text)
                    if not any(e["id"] == e_id for e in emails):
                        real_body = rec.get("body")
                        if real_body is not None and real_body != "":
                            emails.insert(0, {
                                "id": e_id,
                                "sender": sender,
                                "sender_name": rec.get("sender_name") or sender.split("@")[0],
                                "subject": rec.get("subject", "No Subject"),
                                "body": real_body,
                                "timestamp": rec.get("timestamp", ""),
                                "time_display": ts[11:16] if len(ts) >= 16 else "Recent",
                                "intent_type": rec.get("detected_intent", "irrelevant"),
                                "clarity_level": rec.get("clarity_level", "low"),
                                "missing_information": rec.get("missing_information", False),
                                "needs_human_review": rec.get("needs_human_review", False),
                                "confidence": float(rec.get("confidence_score", 0.0)),
                                "route": rec.get("route_selected", "human_review"),
                                "action": rec.get("action_taken", "forward_to_hr"),
                                "processing_status": proc_status,
                                "attachment": rec.get("attachment", None),
                                "reason": rec.get("reason", "Audit logged transaction"),
                                "response_preview": rec.get("response_preview") or f"[{rec.get('action_taken', 'dispatched').upper()}] Dispatched to {rec.get('recipient', 'N/A')}",
                            })
                except Exception:
                    pass
        except Exception as e:
            print(f"Error loading audit.jsonl: {e}")

    return emails, logs


DATA_EMAILS, DATA_LOGS = load_initial_stores()

DATA_SETTINGS = {
    "emailConnection": {
        "gmailAccount": IMAP_USERNAME or SENDER_EMAIL or "",
        "imapServer": IMAP_SERVER,
        "imapPort": IMAP_PORT,
        "imapStatus": "Connected" if IMAP_USERNAME else "Not Configured",
        "imapSsl": True,
        "smtpServer": SMTP_SERVER,
        "smtpPort": SMTP_PORT,
        "smtpStatus": "Connected" if SMTP_USERNAME else "Not Configured",
        "smtpTls": True,
        "lastPing": "Just now",
        "isAccountConfigured": bool(IMAP_USERNAME or SENDER_EMAIL),
        "passwordConfigured": bool(IMAP_PASSWORD or SMTP_PASSWORD),
        "passwordStatus": "Masked (.env)" if (IMAP_PASSWORD or SMTP_PASSWORD) else "Not Configured",
    },
    "aiConfiguration": {
        "modelName": MODEL_NAME,
        "provider": "Google Gemini AI",
        "apiKeyConfigured": bool(GEMINI_API_KEY),
        "apiKeyStatus": "Configured" if GEMINI_API_KEY else "Not Configured",
        "temperature": getattr(config.settings, "TEMPERATURE", 0.0),
        "systemPromptActive": True,
        "classificationStatus": "Operational" if GEMINI_API_KEY else "Unavailable",
    },
    "automation": {
        "executionMode": EXECUTION_MODE,
        "hrEmail": HR_EMAIL,
        "senderEmail": SENDER_EMAIL,
        "senderName": SENDER_NAME,
        "autoReplyThreshold": THRESHOLD_AUTO_REPLY,
        "clarificationThreshold": THRESHOLD_CLARIFICATION,
    },
    "scoringMatrix": SCORING_MATRIX,
}


# Authentication helpers
def verify_credentials(email: str, password: str) -> bool:
    """Secure credential verification without timing leaks."""
    if not email or not password:
        return False

    email_target = (ADMIN_EMAIL or "admin@example.com").strip().lower()
    email_clean = email.strip().lower()
    email_matches = hmac.compare_digest(email_clean, email_target)

    pwd_matches = False
    if ADMIN_PASSWORD and hmac.compare_digest(password, ADMIN_PASSWORD):
        pwd_matches = True
    elif ADMIN_PASSWORD_HASH:
        hashed_input = hashlib.sha256(password.encode("utf-8")).hexdigest()
        pwd_matches = hmac.compare_digest(hashed_input.lower(), ADMIN_PASSWORD_HASH.strip().lower())
    else:
        pwd_matches = hmac.compare_digest(password, "Admin@12345")

    return email_matches and pwd_matches


def get_current_user(request: Request, session_id: Optional[str] = Cookie(None)) -> Optional[Dict[str, Any]]:
    """Retrieves authenticated session user if token is valid and unexpired."""
    token = session_id
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token or token not in SESSION_STORE:
        return None

    sess = SESSION_STORE[token]
    now = time.time()
    if now - sess["created_at"] > SESSION_TTL_SECONDS:
        del SESSION_STORE[token]
        return None

    return sess


def require_auth(request: Request, session_id: Optional[str] = Cookie(None)) -> Dict[str, Any]:
    """Dependency that enforces active authentication session."""
    user = get_current_user(request, session_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    return user


# =====================================================================
# AUTHENTICATION ENDPOINTS
# =====================================================================

@app.post("/api/auth/login")
def login(creds: LoginRequest, response: Response):
    """
    POST /api/auth/login
    Authenticates admin user and establishes an HTTP-only session cookie.
    Does NOT reveal whether email or password specifically was incorrect.
    """
    if not verify_credentials(creds.email, creds.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Generate secure random session token
    token = secrets.token_urlsafe(32)
    SESSION_STORE[token] = {
        "email": creds.email.strip().lower(),
        "created_at": time.time(),
        "role": "admin"
    }

    # Set HTTP-only secure cookie
    response.set_cookie(
        key="session_id",
        value=token,
        httponly=True,
        max_age=SESSION_TTL_SECONDS,
        samesite="lax",
        secure=False,  # Set to False for local dev over HTTP
        path="/"
    )

    return {
        "success": True,
        "message": "Authenticated successfully",
        "user": {
            "email": creds.email.strip().lower(),
            "role": "admin"
        }
    }


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, session_id: Optional[str] = Cookie(None)):
    """
    POST /api/auth/logout
    Terminates session on server and clears the HTTP-only cookie.
    """
    token = session_id
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if token and token in SESSION_STORE:
        del SESSION_STORE[token]

    response.delete_cookie(key="session_id", path="/")
    return {"success": True, "message": "Logged out successfully"}


@app.get("/api/auth/me")
def check_session(user: Dict[str, Any] = Depends(require_auth)):
    """
    GET /api/auth/me
    Validates current session state on browser refresh.
    """
    return {
        "authenticated": True,
        "user": {
            "email": user["email"],
            "role": user.get("role", "admin")
        }
    }


# =====================================================================
# PROTECTED APPLICATION ENDPOINTS (Require active authentication)
# =====================================================================

@app.get("/api/stats")
def get_stats(user: Dict[str, Any] = Depends(require_auth)):
    """Returns real email analytics and triage metrics calculated directly from processed records."""
    total = len(DATA_EMAILS)
    auto_replies = sum(1 for e in DATA_EMAILS if e.get("route") == "auto_reply")
    clarifications = sum(1 for e in DATA_EMAILS if e.get("route") == "clarification")
    hr_reviews = sum(1 for e in DATA_EMAILS if e.get("route") == "human_review")
    irrelevant = sum(1 for e in DATA_EMAILS if e.get("intent_type") == "irrelevant")

    job_apps = sum(1 for e in DATA_EMAILS if e.get("intent_type") == "job_application")
    interviews = sum(1 for e in DATA_EMAILS if e.get("intent_type") == "interview_request")
    clarif_intents = sum(1 for e in DATA_EMAILS if e.get("intent_type") == "clarification")

    pct_total = total if total > 0 else 1
    percentages = {
        "job_application": round((job_apps / pct_total) * 100, 1),
        "interview_request": round((interviews / pct_total) * 100, 1),
        "clarification": round((clarif_intents / pct_total) * 100, 1),
        "irrelevant": round((irrelevant / pct_total) * 100, 1),
    }

    auto_rate = round((auto_replies / pct_total) * 100, 1)
    hr_rate = round((hr_reviews / pct_total) * 100, 1)

    return {
        "total_processed": total,
        "auto_replies": auto_replies,
        "clarifications": clarifications,
        "hr_reviews": hr_reviews,
        "irrelevant": irrelevant,
        "percentages": percentages,
        "trends": {
            "total": f"{total} total records in pipeline",
            "auto_replies": f"{auto_rate}% automated resolution rate",
            "hr_reviews": f"{hr_rate}% human escalation rate",
            "irrelevant": "Filtered & archived safely",
        }
    }


@app.get("/api/emails")
def get_emails(user: Dict[str, Any] = Depends(require_auth)):
    """Returns list of processed emails."""
    return DATA_EMAILS


@app.get("/api/emails/{email_id}")
def get_email_by_id(email_id: str, user: Dict[str, Any] = Depends(require_auth)):
    """Returns single email by ID."""
    for item in DATA_EMAILS:
        if item.get("id") == email_id:
            return item
    raise HTTPException(status_code=404, detail=f"Email {email_id} not found")


@app.get("/api/logs")
def get_logs(user: Dict[str, Any] = Depends(require_auth)):
    """Returns transaction audit logs."""
    return DATA_LOGS


@app.get("/api/settings")
def get_settings(user: Dict[str, Any] = Depends(require_auth)):
    """Returns application configuration."""
    import config.settings
    current_mode = getattr(config.settings, "EXECUTION_MODE", "dry_run")
    DATA_SETTINGS["automation"]["executionMode"] = current_mode
    DATA_SETTINGS["automation"]["autoReplyThreshold"] = getattr(config.settings, "THRESHOLD_AUTO_REPLY", 0.75)
    DATA_SETTINGS["automation"]["clarificationThreshold"] = getattr(config.settings, "THRESHOLD_CLARIFICATION", 0.45)
    DATA_SETTINGS["automation"]["hrEmail"] = getattr(config.settings, "HR_EMAIL", "")
    DATA_SETTINGS["automation"]["senderEmail"] = getattr(config.settings, "SENDER_EMAIL", "")
    DATA_SETTINGS["automation"]["senderName"] = getattr(config.settings, "SENDER_NAME", "")

    # Sync email connection values from config.settings
    account = getattr(config.settings, "IMAP_USERNAME", "") or getattr(config.settings, "SENDER_EMAIL", "")
    DATA_SETTINGS["emailConnection"]["gmailAccount"] = account
    DATA_SETTINGS["emailConnection"]["isAccountConfigured"] = bool(account)
    DATA_SETTINGS["emailConnection"]["imapServer"] = getattr(config.settings, "IMAP_SERVER", "")
    DATA_SETTINGS["emailConnection"]["imapPort"] = getattr(config.settings, "IMAP_PORT", 993)
    DATA_SETTINGS["emailConnection"]["smtpServer"] = getattr(config.settings, "SMTP_SERVER", "")
    DATA_SETTINGS["emailConnection"]["smtpPort"] = getattr(config.settings, "SMTP_PORT", 587)
    DATA_SETTINGS["emailConnection"]["imapStatus"] = "Connected" if getattr(config.settings, "IMAP_USERNAME", "") else "Not Configured"
    DATA_SETTINGS["emailConnection"]["smtpStatus"] = "Connected" if getattr(config.settings, "SMTP_USERNAME", "") else "Not Configured"
    has_pwd = bool(getattr(config.settings, "IMAP_PASSWORD", "") or getattr(config.settings, "SMTP_PASSWORD", ""))
    DATA_SETTINGS["emailConnection"]["passwordConfigured"] = has_pwd
    DATA_SETTINGS["emailConnection"]["passwordStatus"] = "Masked (.env)" if has_pwd else "Not Configured"

    # Sync AI configuration values from config.settings
    has_key = bool(getattr(config.settings, "GEMINI_API_KEY", ""))
    DATA_SETTINGS["aiConfiguration"]["modelName"] = getattr(config.settings, "MODEL_NAME", "gemini-2.5-flash-lite")
    DATA_SETTINGS["aiConfiguration"]["apiKeyConfigured"] = has_key
    DATA_SETTINGS["aiConfiguration"]["apiKeyStatus"] = "Configured" if has_key else "Not Configured"
    DATA_SETTINGS["aiConfiguration"]["temperature"] = getattr(config.settings, "TEMPERATURE", 0.0)
    DATA_SETTINGS["aiConfiguration"]["classificationStatus"] = "Operational" if has_key else "Unavailable"

    DATA_SETTINGS["scoringMatrix"] = SCORING_MATRIX
    return DATA_SETTINGS


@app.put("/api/settings")
def update_settings(payload: SettingsUpdateRequest, user: Dict[str, Any] = Depends(require_auth)):
    """Updates application settings."""
    import config.settings
    if payload.emailConnection:
        DATA_SETTINGS["emailConnection"].update(payload.emailConnection)
    if payload.aiConfiguration:
        DATA_SETTINGS["aiConfiguration"].update(payload.aiConfiguration)
    if payload.automation:
        DATA_SETTINGS["automation"].update(payload.automation)
        if "executionMode" in payload.automation:
            mode = payload.automation["executionMode"].lower()
            import app.responder
            config.settings.EXECUTION_MODE = mode
            app.responder.EXECUTION_MODE = mode
        if "autoReplyThreshold" in payload.automation:
            try:
                val = float(payload.automation["autoReplyThreshold"])
                import app.router
                config.settings.THRESHOLD_AUTO_REPLY = val
                app.router.THRESHOLD_AUTO_REPLY = val
                DATA_SETTINGS["automation"]["autoReplyThreshold"] = val
            except (ValueError, TypeError):
                pass
        if "clarificationThreshold" in payload.automation:
            try:
                val = float(payload.automation["clarificationThreshold"])
                import app.router
                config.settings.THRESHOLD_CLARIFICATION = val
                app.router.THRESHOLD_CLARIFICATION = val
                DATA_SETTINGS["automation"]["clarificationThreshold"] = val
            except (ValueError, TypeError):
                pass
    return get_settings(user)



@app.post("/api/settings/execution-mode")
def set_execution_mode(payload: ExecutionModeRequest, user: Dict[str, Any] = Depends(require_auth)):
    """Updates system execution mode ('dry_run' or 'live')."""
    new_mode = payload.mode.strip().lower()
    if new_mode not in ["dry_run", "live"]:
        raise HTTPException(status_code=400, detail="Execution mode must be 'dry_run' or 'live'")

    import config.settings
    import app.responder
    config.settings.EXECUTION_MODE = new_mode
    app.responder.EXECUTION_MODE = new_mode
    DATA_SETTINGS["automation"]["executionMode"] = new_mode

    return {
        "success": True,
        "executionMode": new_mode,
        "message": f"Execution mode switched to {new_mode.upper()}."
    }


@app.get("/api/status")
def get_status(user: Dict[str, Any] = Depends(require_auth)):
    """Returns system operational status."""
    import config.settings
    current_mode = getattr(config.settings, "EXECUTION_MODE", "dry_run")
    imap_user = getattr(config.settings, "IMAP_USERNAME", IMAP_USERNAME)
    smtp_user = getattr(config.settings, "SMTP_USERNAME", SMTP_USERNAME)
    gemini_key = getattr(config.settings, "GEMINI_API_KEY", GEMINI_API_KEY)
    model_name = getattr(config.settings, "MODEL_NAME", MODEL_NAME)
    return {
        "systemOnline": True,
        "gmailConnected": bool(imap_user),
        "imapConnected": bool(imap_user),
        "smtpConnected": bool(smtp_user),
        "aiModelAvailable": bool(gemini_key),
        "executionMode": current_mode,
        "activeModel": model_name,
        "lastSync": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


# =====================================================================
# INTEGRATION & INGESTION PIPELINE ENDPOINTS
# =====================================================================

@app.post("/api/ingest")
def run_ingestion(user: Dict[str, Any] = Depends(require_auth)):
    """
    POST /api/ingest
    Fetches real Gmail emails via IMAP, runs the full deterministic pipeline:
    preprocessing -> Gemini classification -> confidence calculation -> routing -> responder -> logging.
    Returns processing summary and refreshed records.
    Never falls back to sample/demo emails.
    """
    source = "gmail_imap"

    if not IMAP_USERNAME or not IMAP_PASSWORD:
        raise HTTPException(
            status_code=400,
            detail="Gmail IMAP credentials (IMAP_USERNAME / IMAP_PASSWORD) are not configured in .env."
        )

    try:
        raw_emails = fetch_unread_imap_emails(limit=5)
    except Exception as e:
        err_msg = str(e)
        if "AUTHENTICATIONFAILED" in err_msg.upper():
            friendly = "Authentication failed. Check your Gmail App Password in .env"
        elif "timed out" in err_msg.lower():
            friendly = f"Connection timed out reaching {IMAP_SERVER}:{IMAP_PORT}"
        else:
            friendly = f"Gmail IMAP connection error: {err_msg}"
        print(f"[Ingest] IMAP fetch exception: {friendly}")
        raise HTTPException(
            status_code=502,
            detail=friendly
        )

    if not raw_emails:
        return {
            "processed": 0,
            "auto_replies": 0,
            "clarifications": 0,
            "hr_reviews": 0,
            "irrelevant": 0,
            "source": "gmail_imap",
            "message": "No unread emails found.",
            "items": []
        }

    processed_items = []
    auto_count = 0
    clar_count = 0
    hr_count = 0
    irr_count = 0

    for raw_email in raw_emails:
        try:
            # 1. Preprocessing
            cleaned_email = preprocess_email(raw_email)

            # 2. AI Classification with Gemini
            classification = classify_email(cleaned_email.get("combined_content", ""))

            # 3. Deterministic Confidence Calculation
            confidence = calculate_confidence(classification)

            # 4. Routing Decision & Action
            route = determine_route(confidence)
            action = determine_action(route, classification.get("intent_type", ""))

            # 5. Response Rendering and Dispatch (Dry-run safe)
            rendered = render_response(action, cleaned_email, classification, confidence)
            dispatch_result = dispatch_response(rendered)

            email_id = cleaned_email.get("id") or f"MSG-0{len(DATA_EMAILS) + 101}"
            cleaned_email["id"] = email_id
            proc_status = "Success" if dispatch_result.get("status") != "send_failed" else "Failed"

            response_body = rendered.get("body", "")
            response_preview = response_body[:280] + ("..." if len(response_body) > 280 else "")
            cleaned_email["response_preview"] = response_preview
            cleaned_email["source"] = "gmail_imap"

            # 6. Structured Logging (Persistent to audit.jsonl)
            log_record = log_email_transaction(
                email_data=cleaned_email,
                classification=classification,
                confidence=confidence,
                route=route,
                action=action,
                dispatch_result=dispatch_result
            )

            email_record = {
                "id": email_id,
                "sender": cleaned_email.get("sender", "unknown"),
                "sender_name": cleaned_email.get("sender_name") or cleaned_email.get("sender", "").split("@")[0],
                "subject": cleaned_email.get("subject", "No Subject"),
                "body": cleaned_email.get("body", ""),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "time_display": "Just now",
                "intent_type": classification.get("intent_type", "irrelevant"),
                "clarity_level": classification.get("clarity_level", "low"),
                "missing_information": classification.get("missing_information", False),
                "needs_human_review": classification.get("needs_human_review", False),
                "confidence": confidence,
                "route": route,
                "action": action,
                "processing_status": proc_status,
                "attachment": cleaned_email.get("attachment", None),
                "reason": classification.get("reason", "Processed via pipeline ingestion"),
                "response_preview": response_preview,
            }

            DATA_EMAILS.insert(0, email_record)

            log_entry = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                "email_id": email_id,
                "sender": email_record["sender"],
                "intent": email_record["intent_type"],
                "confidence": email_record["confidence"],
                "route": email_record["route"],
                "action": email_record["action"],
                "status": proc_status,
                "details": {
                    "clarity": email_record["clarity_level"],
                    "missing_info": email_record["missing_information"],
                    "human_review": email_record["needs_human_review"],
                    "reason": email_record["reason"],
                    "recipient": rendered.get("recipient", "N/A"),
                }
            }
            DATA_LOGS.insert(0, log_entry)

            if route == "auto_reply":
                auto_count += 1
            elif route == "clarification":
                clar_count += 1
            else:
                hr_count += 1

            if classification.get("intent_type") == "irrelevant":
                irr_count += 1

            processed_items.append(email_record)

        except Exception as ex:
            print(f"[Ingest] Pipeline processing error on {raw_email.get('id')}: {ex}")

    save_processed_emails()

    return {
        "processed": len(processed_items),
        "auto_replies": auto_count,
        "clarifications": clar_count,
        "hr_reviews": hr_count,
        "irrelevant": irr_count,
        "source": source,
        "message": f"Successfully ingested and processed {len(processed_items)} email(s).",
        "items": processed_items
    }


# =====================================================================
# LIVE CONNECTION TEST ENDPOINTS
# =====================================================================

@app.post("/api/test/gmail")
def test_gmail(user: Dict[str, Any] = Depends(require_auth)):
    """Tests Gmail IMAP SSL connection."""
    if not IMAP_USERNAME or not IMAP_PASSWORD:
        return {
            "success": False,
            "connected": False,
            "message": "Gmail IMAP credentials (IMAP_USERNAME / IMAP_PASSWORD) are not set in .env"
        }
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, timeout=8)
        mail.login(IMAP_USERNAME, IMAP_PASSWORD)
        mail.select("INBOX")
        mail.close()
        mail.logout()
        return {
            "success": True,
            "connected": True,
            "message": f"Connected to Gmail IMAP ({IMAP_USERNAME}) successfully."
        }
    except Exception as e:
        err = str(e)
        if "AUTHENTICATIONFAILED" in err.upper():
            friendly = "Authentication failed. Check your Gmail App Password in .env"
        elif "timed out" in err.lower():
            friendly = f"Connection timed out reaching {IMAP_SERVER}:{IMAP_PORT}"
        else:
            friendly = f"Gmail IMAP connection error: {err}"
        return {
            "success": False,
            "connected": False,
            "message": friendly
        }


@app.post("/api/test/smtp")
def test_smtp(user: Dict[str, Any] = Depends(require_auth)):
    """Tests SMTP STARTTLS handshake and authentication."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        return {
            "success": False,
            "connected": False,
            "message": "SMTP credentials (SMTP_USERNAME / SMTP_PASSWORD) are not configured in .env"
        }
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=8) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        return {
            "success": True,
            "connected": True,
            "message": f"SMTP handshake & authentication successful ({SMTP_USERNAME} via {SMTP_SERVER}:{SMTP_PORT})."
        }
    except Exception as e:
        err = str(e)
        if "Authentication failed" in err or "Username and Password not accepted" in err:
            friendly = "SMTP authentication failed. Verify Gmail App Password in .env"
        elif "timed out" in err.lower():
            friendly = f"SMTP connection timed out reaching {SMTP_SERVER}:{SMTP_PORT}"
        else:
            friendly = f"SMTP handshake error: {err}"
        return {
            "success": False,
            "connected": False,
            "message": friendly
        }


@app.post("/api/test/gemini")
def test_gemini(user: Dict[str, Any] = Depends(require_auth)):
    """Tests Google Gemini AI qualitative classifier."""
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "operational": False,
            "message": "GEMINI_API_KEY is not configured in .env"
        }
    try:
        sample_prompt = (
            "From: candidate@example.com\n"
            "Subject: Application for Senior Backend Engineer\n\n"
            "Hi, I would like to apply for the Senior Backend Engineer opening. "
            "I have 5 years experience in Python and FastAPI. Resume attached."
        )
        result = classify_email(sample_prompt)
        if result and "intent_type" in result:
            return {
                "success": True,
                "operational": True,
                "model": MODEL_NAME,
                "message": f"Gemini classifier ({MODEL_NAME}) is operational.",
                "sample_result": result
            }
        else:
            return {
                "success": False,
                "operational": False,
                "message": f"Unexpected response format from Gemini: {result}"
            }
    except Exception as e:
        return {
            "success": False,
            "operational": False,
            "message": f"Gemini API test failed: {str(e)}"
        }


@app.post("/api/process-email")
def process_new_email(payload: ProcessEmailRequest, user: Dict[str, Any] = Depends(require_auth)):
    """Processes, scores, and records an email using the deterministic engine."""
    next_id = payload.id or f"MSG-0{len(DATA_EMAILS) + 25}"

    # If classification fields are missing, run qualitative Gemini classifier
    if not payload.intent_type:
        raw_content = f"Subject: {payload.subject}\n\n{payload.body}"
        classified = classify_email(raw_content)
        intent_type = classified.get("intent_type", "irrelevant")
        clarity_level = classified.get("clarity_level", "low")
        missing_info = classified.get("missing_information", True)
        human_review = classified.get("needs_human_review", True)
        reason = classified.get("reason", "Classified via Gemini AI")
    else:
        intent_type = payload.intent_type
        clarity_level = payload.clarity_level or "high"
        missing_info = bool(payload.missing_information)
        human_review = bool(payload.needs_human_review)
        reason = payload.reason or "Evaluated via structured assessment"

    classification = {
        "intent_type": intent_type,
        "clarity_level": clarity_level,
        "missing_information": missing_info,
        "needs_human_review": human_review,
        "reason": reason,
    }

    # Deterministic Confidence Calculation
    if payload.confidence is not None:
        confidence = payload.confidence
    else:
        confidence = calculate_confidence(classification)

    # Routing Decision
    if payload.route is not None:
        route = payload.route
    else:
        route = determine_route(confidence)

    # Action Selection
    if payload.action is not None:
        action = payload.action
    else:
        action = determine_action(route, intent_type)

    # Response Rendering and Dispatch (Dry-run safe)
    cleaned_email = {
    "id": next_id,
    "sender": payload.sender,
    "sender_name": payload.sender_name or payload.sender.split("@")[0],
    "subject": payload.subject,
    "body": payload.body,
    "attachment": payload.attachment,
    }

    rendered = render_response(
        action,
        cleaned_email,
       classification,
        confidence
    )

    response_body = rendered.get("body", "")
    response_preview = (
        payload.response_preview
        or response_body[:280] + ("..." if len(response_body) > 280 else "")
    )

    cleaned_email["response_preview"] = response_preview
    dispatch_result = dispatch_response(rendered)
    proc_status = "Success" if dispatch_result.get("status") != "send_failed" else "Failed"

    email_record = {
        "id": next_id,
        "sender": payload.sender,
        "sender_name": cleaned_email["sender_name"],
        "subject": payload.subject,
        "body": payload.body,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "time_display": "Just now",
        "intent_type": intent_type,
        "clarity_level": clarity_level,
        "missing_information": missing_info,
        "needs_human_review": human_review,
        "confidence": confidence,
        "route": route,
        "action": action,
        "processing_status": proc_status,
        "attachment": payload.attachment,
        "reason": reason,
        "response_preview": response_preview,
    }

    DATA_EMAILS.insert(0, email_record)

    log_entry = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        "email_id": next_id,
        "sender": payload.sender,
        "intent": email_record["intent_type"],
        "confidence": email_record["confidence"],
        "route": email_record["route"],
        "action": email_record["action"],
        "status": proc_status,
        "details": {
            "clarity": email_record["clarity_level"],
            "missing_info": email_record["missing_information"],
            "human_review": email_record["needs_human_review"],
            "reason": email_record["reason"],
            "recipient": rendered.get("recipient", "N/A"),
        }
    }
    DATA_LOGS.insert(0, log_entry)

    # Structured audit logging
    log_email_transaction(
        email_data=cleaned_email,
        classification=classification,
        confidence=confidence,
        route=route,
        action=action,
        dispatch_result=dispatch_result
    )

    if payload.sender not in DEMO_SENDERS:
        save_processed_emails()

    return email_record
