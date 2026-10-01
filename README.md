# AI Email Classification & Auto-Reply System

An AI-powered HR email classification and automated response system built with Python, FastAPI, Google Gemini, Gmail IMAP/SMTP, and React.

The system processes incoming recruitment-related emails, classifies their intent using Gemini, calculates a deterministic confidence score using backend business rules, routes the email accordingly, generates the appropriate response, and records the processing result for auditability.

A React-based administrative dashboard provides authentication, system monitoring, processed email inspection, audit logs, and execution controls.

## Key Features

- AI-powered email classification using Google Gemini
- Gmail IMAP integration for incoming email ingestion
- SMTP integration for automated email responses
- Structured AI classification output
- Deterministic confidence calculation
- Rule-based routing
- Automated job application acknowledgement
- Interview-related response handling
- Clarification requests for incomplete messages
- Human-in-the-loop HR escalation
- React admin dashboard
- Authentication and protected routes
- Email inspection and audit logs
- Dry Run / Live execution modes
- Environment-based secret configuration

## System Architecture

```text
Incoming Email
      │
      ▼
Email Reader / IMAP
      │
      ▼
Preprocessing
      │
      ▼
Gemini Classifier
      │
      ▼
Deterministic Confidence Engine
      │
      ▼
Rule-Based Router
      │
      ├───────────────┬────────────────┬─────────────────┐
      ▼               ▼                ▼                 ▼
 Auto Reply     Clarification     Human Review      Irrelevant
      │               │                │
      ▼               ▼                ▼
 Acknowledgement   Request Missing   HR Escalation
 / Interview       Information
      │               │                │
      └───────────────┴────────────────┘
                      │
                      ▼
                SMTP Dispatcher
                      │
                      ▼
                Audit Logger
```

## Email Classification

The classifier supports these intent types:

| Intent | Description |
|---|---|
| `job_application` | Candidate is clearly applying for a role or submitting an application |
| `interview_request` | Message relates to interview scheduling or interview communication |
| `clarification` | Recruitment-related message is incomplete and requires additional information |
| `irrelevant` | Message is unrelated to the recruitment workflow |

The AI classifier returns structured information such as:

```json
{
  "intent_type": "job_application",
  "clarity_level": "high",
  "missing_information": false,
  "needs_human_review": false,
  "reason": "The candidate clearly states the target position and confirms the attached resume."
}
```

The AI provides qualitative classification information. Numeric routing confidence is calculated separately by the backend.

## Deterministic Confidence Engine

The project separates language understanding from business decisions.

Gemini determines:
- intent type
- clarity level
- missing information
- whether human review is required
- short factual reason

The backend then calculates the numeric confidence score using deterministic rules.

Current scoring rules include:

| Factor | Condition | Adjustment |
|---|---|---|
| Base | Starting score | 0.00 |
| Supported intent | `job_application` | +0.40 |
| Supported intent | `interview_request` | +0.40 |
| Clarity | `high` | +0.30 |
| Clarity | `medium` | +0.15 |
| Complete information | Supported intent + no missing information | +0.10 |
| Safe automation | Supported intent + no human review required | +0.10 |
| Missing information | `true` | -0.20 |
| Human review | `true` | -0.30 |

The final score is clamped to the range:
**0.00 to 1.00**

### Routing Logic

```text
Confidence >= 0.75
        ↓
    auto_reply

0.45 <= Confidence < 0.75
        ↓
    clarification

Confidence < 0.45
        ↓
    human_review
```

### Route to Action

| Route | Action |
|---|---|
| `auto_reply` + `job_application` | Send acknowledgement |
| `auto_reply` + `interview_request` | Send interview response |
| `clarification` | Request missing information |
| `human_review` | Escalate to HR |

## Automated Response Flow

### Job Application
The system acknowledges receipt of the application using a predefined response template.

### Interview Request
The system sends an interview-related response using the configured template.

### Clarification
The system requests missing recruitment information such as resume/CV, role, availability, or contact information.

### Human Review
Messages requiring manual attention are prepared for HR review with classification, confidence, route, action, and reason.

## Frontend Dashboard

The React frontend provides:

### Authentication
- Admin login
- Protected routes
- Backend-controlled authentication flow

### Dashboard
- System overview
- Processing statistics
- Recent email activity
- System status

### Emails
- Processed email listing
- Email inspection
- Classification and routing information

### Logs
- Audit transaction records
- Processing history
- Structured log information

### Settings
- System configuration/status
- Mail connectivity information
- Execution mode controls

## Dry Run and Live Mode

The system supports:

```env
EXECUTION_MODE=dry_run
```

### Dry Run
Used for development and safe testing. The workflow processes emails and records actions without sending live responses.

### Live
Used when actual SMTP responses should be dispatched.

Keep the system in Dry Run mode during development and testing.

## Security

Secrets are not stored in the repository.

Ignored files include:
- `.env`
- `.venv/`
- `backend/logs/`
- `frontend/node_modules/`
- `frontend/dist/`
- `__pycache__/`

Use `.env.example` as the configuration template.

Never commit:
- API keys
- Gmail App Passwords
- IMAP credentials
- SMTP credentials
- Admin passwords

## Tech Stack

### Backend
- Python
- FastAPI
- Google Gemini API
- Gmail IMAP
- SMTP
- python-dotenv

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React

### Logging
- Python logging
- JSON Lines audit records

## Project Structure

```text
ai-hr-email-automation/
│
├── backend/
│   ├── app/
│   │   ├── email_reader.py
│   │   ├── preprocessor.py
│   │   ├── classifier.py
│   │   ├── confidence.py
│   │   ├── router.py
│   │   ├── responder.py
│   │   ├── logger.py
│   │   └── server.py
│   │
│   ├── config/
│   │   └── settings.py
│   │
│   ├── logs/
│   │   └── runtime-generated files
│   │
│   ├── templates/
│   │   ├── acknowledgement.txt
│   │   ├── interview.txt
│   │   ├── clarification.txt
│   │   └── human_review.txt
│   │
│   ├── tests/
│   │   ├── test_confidence.py
│   │   ├── test_router.py
│   │   └── sample_emails.json
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .env.example
├── .gitignore
└── README.md
```

## Environment Configuration

Create a local `.env` file using `.env.example` as the template.

Example variable names:

```env
GEMINI_API_KEY=
MODEL_NAME=gemini-2.5-flash-lite

HR_EMAIL=
SENDER_EMAIL=
SENDER_NAME=

IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
IMAP_USERNAME=
IMAP_PASSWORD=

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

EXECUTION_MODE=dry_run

ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_PASSWORD_HASH=
```

Do not commit the real `.env` file.

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/priyankasaini3927/AI-HR-Email-Automation.git
cd AI-HR-Email-Automation
```

### 2. Create the Python environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure environment variables
Create the root `.env` file using `.env.example` and add your own credentials.

## Running the Backend

From the project root:

```bash
cd backend
python -m uvicorn main:app --reload
```

- Backend: `http://127.0.0.1:8000`
- FastAPI Swagger documentation: `http://127.0.0.1:8000/docs`

## Running the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`

## Testing

Run backend tests with:

```bash
cd backend
python -m unittest discover -s tests
```

The project has also been validated through end-to-end testing covering authentication, protected routes, dashboard behavior, backend status, Gemini connectivity, Gmail/IMAP connectivity, SMTP connectivity, email ingestion, classification/routing scenarios, logs, Dry Run safety, Live mode handling, API errors, browser console checks, and responsive frontend behavior.

## Design Principles

### AI for Understanding
Gemini is used for natural-language understanding and structured email classification.

### Deterministic Business Logic
Confidence calculation and routing are handled by backend rules rather than relying on an LLM-generated numeric decision.

### Human-in-the-Loop
Unclear, incomplete, or review-required emails can be escalated rather than automatically handled.

### Safe Execution
Dry Run mode allows the workflow to be tested without sending live emails.

### Auditability
Processing information is recorded through structured logs and audit records.

## Current Project Status

The core workflow is implemented and integrated:

```text
Gmail / IMAP
      ↓
Preprocessing
      ↓
Gemini Classification
      ↓
Deterministic Confidence
      ↓
Rule-Based Routing
      ↓
Automated Response / HR Review
      ↓
SMTP
      ↓
Audit Logging
      ↓
React Dashboard
```

## Future Scope

Potential future improvements may include:
- Multilingual classification
- Calendar integration
- Resume information extraction
- Candidate thread tracking
- Duplicate candidate detection
- Advanced analytics
- Cloud deployment
- CI/CD integration

These are future extensions and are not part of the current core implementation.

## Author

**Priyanka Saini**  
B.Tech AI & Data Science  

Interests:
- AI / Machine Learning
- Automation
- Python
- Backend Development
- AI-powered applications
