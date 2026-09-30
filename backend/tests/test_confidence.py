import unittest
from app.confidence import calculate_confidence


class TestConfidenceCalculation(unittest.TestCase):

    def test_job_application_high_clarity_complete(self):
        """Job application with high clarity and complete information."""
        payload = {
            "intent_type": "job_application",
            "clarity_level": "high",
            "missing_information": False,
            "needs_human_review": False,
        }
        # 0 + 0.40 (intent) + 0.30 (clarity) = 0.70
        self.assertEqual(calculate_confidence(payload), 0.70)

    def test_interview_request_high_clarity(self):
        """Interview request with high clarity and complete info."""
        payload = {
            "intent_type": "interview_request",
            "clarity_level": "high",
            "missing_information": False,
            "needs_human_review": False,
        }
        # 0 + 0.40 (intent) + 0.30 (clarity) = 0.70
        self.assertEqual(calculate_confidence(payload), 0.70)

    def test_job_application_medium_clarity(self):
        """Job application with medium clarity."""
        payload = {
            "intent_type": "job_application",
            "clarity_level": "medium",
            "missing_information": False,
            "needs_human_review": False,
        }
        # 0 + 0.40 + 0.15 = 0.55
        self.assertEqual(calculate_confidence(payload), 0.55)

    def test_job_application_missing_information(self):
        """Job application with missing details (e.g. no resume attached)."""
        payload = {
            "intent_type": "job_application",
            "clarity_level": "high",
            "missing_information": True,
            "needs_human_review": False,
        }
        # 0 + 0.40 + 0.30 - 0.20 = 0.50
        self.assertEqual(calculate_confidence(payload), 0.50)

    def test_interview_request_needs_human_review(self):
        """Interview request containing sensitive/salary requests requiring human review."""
        payload = {
            "intent_type": "interview_request",
            "clarity_level": "high",
            "missing_information": False,
            "needs_human_review": True,
        }
        # 0 + 0.40 + 0.30 - 0.30 = 0.40
        self.assertEqual(calculate_confidence(payload), 0.40)

    def test_clarification_intent(self):
        """Candidate asking questions about interview timeline or role requirements."""
        payload = {
            "intent_type": "clarification",
            "clarity_level": "high",
            "missing_information": False,
            "needs_human_review": False,
        }
        # 0 + 0.0 (intent) + 0.30 (clarity) = 0.30
        self.assertEqual(calculate_confidence(payload), 0.30)

    def test_irrelevant_spam_email(self):
        """Irrelevant spam email with low clarity and deductions clamped at 0.00."""
        payload = {
            "intent_type": "irrelevant",
            "clarity_level": "low",
            "missing_information": True,
            "needs_human_review": True,
        }
        # 0 - 0.20 - 0.30 = -0.50 -> clamped to 0.00
        self.assertEqual(calculate_confidence(payload), 0.00)


if __name__ == "__main__":
    unittest.main()

