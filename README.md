# AI Email Classification & Auto-Reply System

A deterministic, rule-governed AI email automation system for HR and recruitment inboxes.

This project is a programmatic Python implementation of an existing n8n email automation workflow.

---

## Architecture Overview

```
[Incoming Email]
       │
       ▼
[Preprocessor] ──► (cleans whitespace, strips quoted email reply trails)
       │
       ▼
[AI Classifier] ──► (extracts qualitative JSON: intent, clarity, missing info, review)
       │
       ▼
[Deterministic Confidence Engine] ──► (computes score strictly with fixed business math)
       │
       ▼
[Router]
  ├── >= 0.75 ──────────────► Auto-Reply (Path 1: Acknowledgement / Path 2: Interview)
  ├── >= 0.45 & < 0.75 ─────► Ask Clarification (Path 3)
  └── < 0.45 ───────────────► Human Review / Forward to HR (Path 4)
       │
       ▼
[Responder] ──► (renders templates & dispatches email / logs mock action)
       │
       ▼
[Logger] ──► (writes transaction records to console and logs/audit.jsonl)
```

---

## Project Structure

```
email_reply/
│
├── app/
│   ├── __init__.py
│   ├── email_reader.py      # Reads from IMAP or local JSON test files
│   ├── preprocessor.py      # Cleans formatting and strips email reply trails
│   ├── classifier.py        # LLM qualitative classifier with strict JSON output
│   ├── confidence.py        # Deterministic scoring algorithm
│   ├── router.py            # Routes based on fixed confidence thresholds
│   ├── responder.py         # Renders response templates & dispatches replies
│   └── logger.py            # Structured audit logger
│
├── config/
│   ├── __init__.py
│   └── settings.py          # Centralized configuration & environment loader
│
├── templates/
│   ├── acknowledgement.txt  # Path 1: Job application receipt
│   ├── interview.txt        # Path 2: Interview response
│   ├── clarification.txt    # Path 3: Missing information request
│   └── human_review.txt     # Path 4: HR escalation notice
│
├── tests/
│   ├── test_confidence.py   # Unit tests for scoring rules
│   ├── test_router.py       # Unit tests for routing thresholds
│   └── sample_emails.json   # Multi-path test dataset
│
├── main.py                  # Main execution entrypoint
├── .env.example             # Environment variable template
├── requirements.txt         # Minimal production dependencies
└── README.md
```

---

## Setup & Quickstart

### 1. Create and Activate Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file from the provided `.env.example`:

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in your details:
```env
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4o-mini
EXECUTION_MODE=dry_run
HR_EMAIL=hr@example.com
```

---

## Running the System

### Run with Local Test Dataset (Dry-run mode)

```powershell
python main.py tests/sample_emails.json
```

### Run Unit Tests

```powershell
python -m unittest discover -s tests
```

---

## Deterministic Scoring Matrix

| Factor | Condition | Score Adjustment |
|---|---|---|
| **Base** | Starting value | `0.00` |
| **Intent** | `job_application` | `+0.40` |
| **Intent** | `interview_request` | `+0.40` |
| **Clarity** | `high` | `+0.30` |
| **Clarity** | `medium` | `+0.15` |
| **Missing Info** | `true` | `-0.20` |
| **Human Review** | `true` | `-0.30` |
| **Clamping** | Final Result | $\max(0.00, \min(1.00, \text{score}))$ |

---

## Routing Thresholds

* **$\ge 0.75$**: `auto_reply` $\rightarrow$ Dispatches acknowledgement or interview info directly.
* **$\ge 0.45 \text{ and } < 0.75$**: `clarification` $\rightarrow$ Requests missing information from sender.
* **$< 0.45$**: `human_review` $\rightarrow$ Escalates the complete case and metadata to HR.
