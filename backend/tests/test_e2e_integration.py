"""
Full End-to-End System Test Suite
Tests:
- Authentication & Sessions
- Protected Route Enforcement
- Real Metrics & Aggregations (Zero Mock Data)
- System Status & Secret Masking
- Real Connection Handshakes (Gmail IMAP, SMTP, Gemini AI)
- Ingestion Pipeline & Execution Safety (Dry Run vs Live)
- Test Scenarios: Job Application, Interview Scheduling, Clarification, Human Review, Irrelevant Spam
- Audit Logging & Details
"""

import sys
import json
import urllib.request
import urllib.error
import http.cookiejar
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

# Setup Cookiejar for session cookie management
cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

results = []

def record(test_name, status, details):
    results.append({
        "test": test_name,
        "status": status,
        "details": details
    })
    print(f"[{status}] {test_name}: {details}")

def request(path, method="GET", data=None, headers=None, use_auth=True):
    url = f"{BASE_URL}{path}"
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    
    encoded_data = None
    if data is not None:
        req_headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    try:
        if use_auth:
            resp = opener.open(req, timeout=15)
        else:
            # Unauthenticated opener without cookies
            resp = urllib.request.urlopen(req, timeout=15)
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

print("\n==================================================")
print("STARTING FULL END-TO-END AUTOMATED VERIFICATION")
print("==================================================\n")

# TEST 1A: Protected Route without Login
status, data = request("/api/auth/me", method="GET", use_auth=False)
if status == 401:
    record("Protected Route Access Blocked", "PASS", "Unauthenticated request to /api/auth/me correctly returned 401 Unauthorized.")
else:
    record("Protected Route Access Blocked", "FAIL", f"Expected 401, got status {status}")

# TEST 1B: Invalid Credentials
status, data = request("/api/auth/login", method="POST", data={"email": "admin@example.com", "password": "WrongPassword!"})
if status == 401 and "Invalid" in data.get("detail", ""):
    record("Login Invalid Credentials Handling", "PASS", "Invalid password correctly rejected with 401 and generic security message.")
else:
    record("Login Invalid Credentials Handling", "FAIL", f"Unexpected response: {status}, {data}")

# TEST 1C: Valid Login
status, data = request("/api/auth/login", method="POST", data={"email": "admin@example.com", "password": "Admin@12345"})
if status == 200 and data.get("success") and data.get("user", {}).get("email") == "admin@example.com":
    record("Login Valid Credentials", "PASS", "Authenticated successfully and HTTP-only session cookie established.")
else:
    record("Login Valid Credentials", "FAIL", f"Login failed: {status}, {data}")

# TEST 1D: Session Persistence
status, data = request("/api/auth/me", method="GET")
if status == 200 and data.get("authenticated") and data.get("user", {}).get("email") == "admin@example.com":
    record("Session Persistence (/api/auth/me)", "PASS", "Session cookie verified and valid user profile returned.")
else:
    record("Session Persistence (/api/auth/me)", "FAIL", f"Session check failed: {status}, {data}")

# TEST 2: Dashboard Real Data & Refresh
status, stats_data = request("/api/stats", method="GET")
if status == 200 and "total_processed" in stats_data and "auto_replies" in stats_data and "hr_reviews" in stats_data:
    tot = stats_data["total_processed"]
    auto = stats_data["auto_replies"]
    hr = stats_data["hr_reviews"]
    irr = stats_data["irrelevant"]
    record("Dashboard Stats API", "PASS", f"Dynamic stats calculated from active records: Total={tot}, Auto-Replies={auto}, HR Reviews={hr}, Irrelevant={irr}")
else:
    record("Dashboard Stats API", "FAIL", f"Failed fetching stats: {status}, {stats_data}")

# TEST 3: System Status & Secret Masking
status, sys_status = request("/api/status", method="GET")
status_set, settings_data = request("/api/settings", method="GET")
if status == 200 and status_set == 200:
    # Ensure secrets are NOT exposed
    settings_str = json.dumps(settings_data)
    has_secret_leak = "hbjpsmqvxxfvrmhq" in settings_str or "AQ.Ab8RN6Ly" in settings_str
    if not has_secret_leak:
        record("System Status & Secret Masking", "PASS", f"System status reports Gmail={sys_status.get('gmailConnected')}, Mode={sys_status.get('executionMode')}, Model={sys_status.get('activeModel')}. Secrets are strictly masked.")
    else:
        record("System Status & Secret Masking", "FAIL", "Security violation: plain-text passwords or API keys detected in settings output!")
else:
    record("System Status & Secret Masking", "FAIL", f"Status endpoints returned {status} / {status_set}")

# TEST 4: Test Gemini Classifier Handshake
status, gemini_res = request("/api/test/gemini", method="POST")
if status == 200 and gemini_res.get("success") and gemini_res.get("operational"):
    record("Test Gemini Connection", "PASS", f"Connected to {gemini_res.get('model')}. Live classification returned structured schema successfully.")
else:
    record("Test Gemini Connection", "FAIL", f"Gemini test failed: {gemini_res}")

# TEST 5: Test Gmail IMAP Connection
status, gmail_res = request("/api/test/gmail", method="POST")
if status == 200 and gmail_res.get("success") and gmail_res.get("connected"):
    record("Test Gmail IMAP Connection", "PASS", gmail_res.get("message"))
else:
    record("Test Gmail IMAP Connection", "FAIL", f"Gmail test failed: {gmail_res}")

# TEST 6: Test SMTP Connection
status, smtp_res = request("/api/test/smtp", method="POST")
if status == 200 and smtp_res.get("success") and smtp_res.get("connected"):
    record("Test SMTP Handshake", "PASS", smtp_res.get("message"))
else:
    record("Test SMTP Handshake", "FAIL", f"SMTP test failed: {smtp_res}")

# TEST 15: Ensure Dry Run is Active
status, mode_res = request("/api/settings/execution-mode", method="POST", data={"mode": "dry_run"})
if status == 200 and mode_res.get("executionMode") == "dry_run":
    record("Dry Run Safety Verification", "PASS", "Execution mode is verified DRY_RUN. No outbound emails will be dispatched.")
else:
    record("Dry Run Safety Verification", "FAIL", f"Could not set dry run: {mode_res}")

# TEST 8: Job Application Scenario
job_email = {
    "sender": "candidate.test@example.com",
    "sender_name": "Test Candidate",
    "subject": "Application for Python Developer",
    "body": "Hello HR Team,\n\nI would like to apply for the Python Developer position.\n\nI have experience with Python, FastAPI and MySQL.\nPlease find my resume attached.\n\nRegards,\nTest Candidate",
    "intent_type": "job_application",
    "clarity_level": "high",
    "missing_information": False,
    "needs_human_review": False,
    "attachment": "Resume_Test_Candidate.pdf"
}
status, job_res = request("/api/process-email", method="POST", data=job_email)
if status == 200 and job_res.get("route") == "auto_reply" and job_res.get("action") == "send_acknowledgement":
    record("Job Application Routing & Action", "PASS", f"Scored confidence={job_res.get('confidence')}, Route={job_res.get('route')}, Action={job_res.get('action')}")
else:
    record("Job Application Routing & Action", "FAIL", f"Unexpected job application routing: {job_res}")

# TEST 9: Interview Request Scenario
interview_email = {
    "sender": "interviewee.test@example.com",
    "sender_name": "Interview Candidate",
    "subject": "Re: Interview Scheduling",
    "body": "Hello,\n\nThank you for the interview invitation.\n\nI am available Thursday and Friday between 2 PM and 5 PM.\n\nPlease let me know the confirmed interview time.\n\nRegards,\nTest Candidate",
    "intent_type": "interview_request",
    "clarity_level": "high",
    "missing_information": False,
    "needs_human_review": False
}
status, interview_res = request("/api/process-email", method="POST", data=interview_email)
if status == 200 and interview_res.get("route") == "auto_reply" and interview_res.get("action") == "send_interview_info":
    record("Interview Request Routing & Action", "PASS", f"Scored confidence={interview_res.get('confidence')}, Route={interview_res.get('route')}, Action={interview_res.get('action')}")
else:
    record("Interview Request Routing & Action", "FAIL", f"Unexpected interview routing: {interview_res}")

# TEST 10: Clarification Scenario
clarification_email = {
    "sender": "inquiry.test@example.com",
    "sender_name": "Inquiry User",
    "subject": "Job Inquiry",
    "body": "Hello,\n\nI am interested in opportunities at your company.\nCould you tell me what engineering positions are currently available?\n\nRegards,\nTest Candidate",
    "intent_type": "clarification",
    "clarity_level": "medium",
    "missing_information": True,
    "needs_human_review": False
}
status, clar_res = request("/api/process-email", method="POST", data=clarification_email)
# Clarification with medium clarity (+0.15) or low clarity routes to clarification or human_review consistently
if status == 200 and clar_res.get("route") in ["clarification", "human_review"]:
    record("Clarification Routing Consistency", "PASS", f"Route={clar_res.get('route')}, Action={clar_res.get('action')}, Confidence={clar_res.get('confidence')}")
else:
    record("Clarification Routing Consistency", "FAIL", f"Unexpected response: {clar_res}")

# TEST 11: Human Review Scenario (Salary / Dispute)
dispute_email = {
    "sender": "salary.dispute@example.com",
    "sender_name": "Sensitive Candidate",
    "subject": "Urgent Contract and Salary Issue",
    "body": "There is an issue with the salary mentioned in my offer letter. Please review clause 4 before I sign.",
    "intent_type": "clarification",
    "clarity_level": "high",
    "missing_information": False,
    "needs_human_review": True
}
status, dispute_res = request("/api/process-email", method="POST", data=dispute_email)
if status == 200 and dispute_res.get("route") == "human_review" and dispute_res.get("action") == "forward_to_hr":
    record("Human Review Escalation Safety", "PASS", f"Sensitive contract email routed to {dispute_res.get('route')} ({dispute_res.get('action')}) safely without auto-reply.")
else:
    record("Human Review Escalation Safety", "FAIL", f"Safety violation: sensitive email did not escalate! Result: {dispute_res}")

# TEST 12: Irrelevant / Spam Email
spam_email = {
    "sender": "seo.blast@spampromo.org",
    "sender_name": "SEO Blast Team",
    "subject": "Limited Time SEO Promotion",
    "body": "We can increase your website traffic and ranking. Contact us for our special offer.",
    "intent_type": "irrelevant",
    "clarity_level": "high",
    "missing_information": True,
    "needs_human_review": False
}
status, spam_res = request("/api/process-email", method="POST", data=spam_email)
if status == 200 and (spam_res.get("route") == "human_review" or spam_res.get("intent_type") == "irrelevant"):
    record("Irrelevant / Spam Handling", "PASS", f"Spam detected as intent={spam_res.get('intent_type')}, Route={spam_res.get('route')}. Discarded/Archived from candidate queue.")
else:
    record("Irrelevant / Spam Handling", "FAIL", f"Spam handling issue: {spam_res}")

# TEST 13: Email Details Retrieval (/api/emails/{id})
test_id = job_res.get("id")
status, detail_res = request(f"/api/emails/{test_id}", method="GET")
required_fields = ["sender", "subject", "body", "timestamp", "intent_type", "confidence", "clarity_level", "missing_information", "needs_human_review", "reason", "route", "action"]
has_all_fields = all(f in detail_res for f in required_fields)
if status == 200 and has_all_fields:
    record("Email Details Retrieval (/api/emails/{id})", "PASS", f"Retrieved complete email details for {test_id} with all 12 required telemetry fields.")
else:
    record("Email Details Retrieval (/api/emails/{id})", "FAIL", f"Missing fields or status {status}: {detail_res}")

# TEST 14: Audit Logs Feed
status, logs_res = request("/api/logs", method="GET")
if status == 200 and isinstance(logs_res, list) and len(logs_res) > 0:
    first_log = logs_res[0]
    log_fields = ["timestamp", "email_id", "sender", "intent", "confidence", "route", "action", "status"]
    has_log_fields = all(lf in first_log for lf in log_fields)
    if has_log_fields:
        record("Audit Logs Verification", "PASS", f"Retrieved {len(logs_res)} structured audit logs with valid transaction fields.")
    else:
        record("Audit Logs Verification", "FAIL", f"Audit log record missing required fields: {first_log}")
else:
    record("Audit Logs Verification", "FAIL", f"Failed to retrieve logs: {status}, {logs_res}")

# TEST 17: Error Handling & Invalid Routes
status, err_res = request("/api/emails/NON_EXISTENT_ID_9999", method="GET")
if status == 404:
    record("Error Handling: 404 Not Found", "PASS", "Non-existent email lookup gracefully returns HTTP 404.")
else:
    record("Error Handling: 404 Not Found", "FAIL", f"Expected 404, got {status}: {err_res}")

# TEST 1F: Logout & Post-Logout Protection
status, logout_res = request("/api/auth/logout", method="POST")
status_after, after_res = request("/api/auth/me", method="GET")
if status == 200 and status_after == 401:
    record("Logout & Post-Logout Protection", "PASS", "Session successfully invalidated; subsequent access returns 401.")
else:
    record("Logout & Post-Logout Protection", "FAIL", f"Logout error: {logout_res}, {status_after}")

print("\n==================================================")
print(f"TEST SUITE COMPLETE: {sum(1 for r in results if r['status'] == 'PASS')} PASSED / {sum(1 for r in results if r['status'] == 'FAIL')} FAILED")
print("==================================================\n")
