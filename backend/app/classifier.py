import json
import re
from typing import Literal, Dict, Any

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from config.settings import GEMINI_API_KEY, MODEL_NAME


if HAS_PYDANTIC:
    class ClassificationSchema(BaseModel):
        intent_type: Literal[
            "job_application",
            "interview_request",
            "clarification",
            "irrelevant"
        ] = Field(
            description="The primary category of the email."
        )

        clarity_level: Literal[
            "high",
            "medium",
            "low"
        ] = Field(
            description=(
                "high = intent is obvious and complete, "
                "medium = clear but some details missing, "
                "low = unclear or ambiguous."
            )
        )

        missing_information: bool = Field(
            description=(
                "True if resume, applied role, availability, "
                "or contact info is missing."
            )
        )

        needs_human_review: bool = Field(
            description=(
                "True if intent is unclear, conflicting, "
                "or sensitive. Always be conservative."
            )
        )

        reason: str = Field(
            description="Short factual explanation for the classification."
        )


CLASSIFIER_SYSTEM_PROMPT = """You are an expert HR/recruitment email classifier.
Analyze the incoming email and return a structured JSON assessment.

DO NOT generate any numeric confidence scores.
Return ONLY valid JSON matching the requested structure.

Classify into exactly one intent_type:
- "job_application": Candidate is applying for a role.
- "interview_request": Candidate is responding to or asking about an interview / scheduling.
- "clarification": Candidate is asking questions or seeking more details about an application/process.
- "irrelevant": Spam, promotional, newsletter, or non-HR email.

Assess clarity_level:
- "high": The sender's intent is obvious and all standard details are provided.
- "medium": The sender's intent is understandable, but key details are omitted.
- "low": The message is ambiguous, disjointed, or impossible to decipher with certainty.

Evaluate missing_information (Boolean):
- Set to true if essential items (e.g. attached resume, target position, interview availability, or contact details) are absent.
- Set to false if all necessary information is present.

Evaluate needs_human_review (Boolean):
- Set to true if the email contains complaints, salary/legal/contract negotiation, sensitive topics, conflicting requests, or ambiguous intent.
- Always be conservative: if in doubt, set needs_human_review to true.

Output format must be strictly JSON:
{
  "intent_type": "job_application | interview_request | clarification | irrelevant",
  "clarity_level": "high | medium | low",
  "missing_information": true | false,
  "needs_human_review": true | false,
  "reason": "short factual reason"
}
"""


def _call_gemini_rest(email_content: str) -> str:
    """Fallback REST API client using standard library urllib when google-genai package is not installed."""
    import urllib.request

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/"
        f"models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"
    )

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "system_instruction": {
            "parts": [
                {
                    "text": CLASSIFIER_SYSTEM_PROMPT
                }
            ]
        },
        "contents": [
            {
                "parts": [
                    {
                        "text": email_content
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.0,
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(
            response.read().decode("utf-8")
        )

        candidates = result.get("candidates", [])

        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])

            if parts and "text" in parts[0]:
                return parts[0]["text"]

        return "{}"


def classify_email(email_content: str) -> Dict[str, Any]:
    """
    Calls the Google Gemini model to perform qualitative classification.
    Validates output using Pydantic and returns a dictionary conforming to the specification.
    """

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        # Fallback for offline/unconfigured environment
        return {
            "intent_type": "irrelevant",
            "clarity_level": "low",
            "missing_information": True,
            "needs_human_review": True,
            "reason": (
                "Gemini API key not configured. "
                "Routed to human review for safety."
            ),
        }

    try:
        # -----------------------------------------
        # Prepare email text for Gemini
        # -----------------------------------------
        #
        # email_content is already expected to be a string.
        # Gemini's generate_content() must receive text,
        # not a Python dictionary.
        #
        email_text = email_content

        # -----------------------------------------
        # Call Gemini
        # -----------------------------------------

        if HAS_GENAI:
            client = genai.Client(
                api_key=GEMINI_API_KEY
            )

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=email_text,
                config=types.GenerateContentConfig(
                    system_instruction=CLASSIFIER_SYSTEM_PROMPT,
                    temperature=0.0,
                    response_mime_type="application/json",
                ),
            )

            raw_text = response.text or "{}"

        else:
            raw_text = _call_gemini_rest(
                email_text
            )

        # -----------------------------------------
        # Clean Gemini response
        # -----------------------------------------

        clean_text = raw_text.strip()

        if clean_text.startswith("```"):
            clean_text = re.sub(
                r"^```(?:json)?\s*",
                "",
                clean_text
            )

            clean_text = re.sub(
                r"\s*```$",
                "",
                clean_text
            )

        # -----------------------------------------
        # Parse JSON
        # -----------------------------------------

        parsed_data = json.loads(
            clean_text
        )

        # -----------------------------------------
        # Validate structured schema
        # -----------------------------------------

        if HAS_PYDANTIC:
            validated = ClassificationSchema(
                **parsed_data
            )

            return validated.model_dump()

        else:
            return {
                "intent_type": parsed_data.get(
                    "intent_type",
                    "irrelevant"
                ),

                "clarity_level": parsed_data.get(
                    "clarity_level",
                    "low"
                ),

                "missing_information": bool(
                    parsed_data.get(
                        "missing_information",
                        True
                    )
                ),

                "needs_human_review": bool(
                    parsed_data.get(
                        "needs_human_review",
                        True
                    )
                ),

                "reason": str(
                    parsed_data.get(
                        "reason",
                        "Parsed classification"
                    )
                ),
            }

    except Exception as e:
        # Fail-safe:
        # Always escalate to human review if AI call fails
        return {
            "intent_type": "irrelevant",
            "clarity_level": "low",
            "missing_information": True,
            "needs_human_review": True,
            "reason": (
                f"Gemini classification error ({str(e)}). "
                "Routed to human review."
            ),
        }