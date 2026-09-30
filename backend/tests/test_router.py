import unittest
from app.router import determine_route, determine_action


class TestRouter(unittest.TestCase):

    def test_auto_reply_threshold(self):
        """Confidence >= 0.75 routes to auto_reply."""
        self.assertEqual(determine_route(0.75), "auto_reply")
        self.assertEqual(determine_route(0.85), "auto_reply")
        self.assertEqual(determine_route(1.00), "auto_reply")

    def test_clarification_threshold(self):
        """0.45 <= Confidence < 0.75 routes to clarification."""
        self.assertEqual(determine_route(0.45), "clarification")
        self.assertEqual(determine_route(0.50), "clarification")
        self.assertEqual(determine_route(0.74), "clarification")

    def test_human_review_threshold(self):
        """Confidence < 0.45 routes to human_review."""
        self.assertEqual(determine_route(0.44), "human_review")
        self.assertEqual(determine_route(0.30), "human_review")
        self.assertEqual(determine_route(0.00), "human_review")

    def test_action_mapping(self):
        """Verify routing action mappings for all 4 paths."""
        # Path 1: Job application auto-reply
        self.assertEqual(determine_action("auto_reply", "job_application"), "send_acknowledgement")
        
        # Path 2: Interview request auto-reply
        self.assertEqual(determine_action("auto_reply", "interview_request"), "send_interview_info")
        
        # Path 3: Clarification
        self.assertEqual(determine_action("clarification", "job_application"), "request_clarification")
        self.assertEqual(determine_action("clarification", "interview_request"), "request_clarification")
        
        # Path 4: Human review
        self.assertEqual(determine_action("human_review", "irrelevant"), "forward_to_hr")
        self.assertEqual(determine_action("human_review", "job_application"), "forward_to_hr")


if __name__ == "__main__":
    unittest.main()
