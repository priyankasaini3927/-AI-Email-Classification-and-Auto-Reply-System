import os
from pathlib import Path


# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
LOGS_DIR = BASE_DIR / "logs"

# Ensure logs directory exists
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Load .env file safely (with built-in fallback if python-dotenv is not installed)
env_path = BASE_DIR.parent / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(env_path)
except ImportError:
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k not in os.environ:
                        os.environ[k] = v



# LLM Configuration (Google Gemini)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash-lite")


# HR & Mail Settings
HR_EMAIL = os.getenv("HR_EMAIL", "hr@example.com")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "recruitment@example.com")
SENDER_NAME = os.getenv("SENDER_NAME", "Recruitment Team")

# IMAP / Email Ingestion Settings
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))
IMAP_USERNAME = os.getenv("IMAP_USERNAME", "")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD", "")

# SMTP / Email Sending Settings
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# Execution Mode: 'dry_run' or 'live'
EXECUTION_MODE = os.getenv("EXECUTION_MODE", "dry_run").lower()

# Routing Confidence Thresholds (Fixed per specification)
THRESHOLD_AUTO_REPLY = 0.75
THRESHOLD_CLARIFICATION = 0.45

# Admin Credentials
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@12345")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")
