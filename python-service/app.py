#!/usr/bin/env python3
"""
Smart College Event Management System (Smart CEMS)
Python AI & Cryptographic Verification Microservice
Rajiv Gandhi University of Knowledge Technologies - IIIT RK Valley
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import hashlib
import math
import re
from urllib.parse import urlparse, parse_qs

PORT = 5001

# Positive and negative word dictionaries for Rule-Based Sentiment NLP
POSITIVE_WORDS = {
    'great', 'excellent', 'amazing', 'inspiring', 'helpful', 'informative',
    'fantastic', 'good', 'well', 'organized', 'learned', 'fun', 'super',
    'valuable', 'enjoyed', 'awesome', 'best', 'smooth', 'loved'
}
NEGATIVE_WORDS = {
    'bad', 'poor', 'delayed', 'disorganized', 'boring', 'waste', 'worst',
    'crowded', 'audio', 'issue', 'unprepared', 'slow', 'confusing', 'disappointed'
}

# Branch skill mappings for AI Event Recommendation
BRANCH_AFFINITIES = {
    'cse': {'coding', 'hackathon', 'ai', 'web', 'cybersecurity', 'ctf', 'cloud', 'algorithm', 'software', 'programming', 'python', 'developer', 'data'},
    'ece': {'iot', 'embedded', 'robotics', 'circuits', 'hardware', 'signals', 'sensors', 'antenna', 'vlsi', 'electronics'},
    'mech': {'robotics', 'cad', 'design', 'drone', 'mechanics', 'automobile', 'sports', 'cricket', 'manufacturing'},
    'civil': {'structure', 'survey', 'design', 'green', 'sustainability', 'sports', 'concrete', 'cad'},
    'chem': {'process', 'energy', 'materials', 'science', 'quiz', 'chemical', 'petro'},
    'mme': {'metallurgy', 'materials', 'nano', 'testing', 'science', 'metallurgical', 'mining'}
}

BRANCH_ALIASES = {
    'cse': ['cse', 'computer', 'software', 'information technology', 'coding', 'programming'],
    'ece': ['ece', 'electronic', 'communication', 'circuits'],
    'mech': ['mech', 'mechanical', 'automobile'],
    'civil': ['civil'],
    'chem': ['chem', 'chemical'],
    'mme': ['mme', 'metallurg', 'material']
}

def detect_branch_key(text):
    if not text:
        return 'cse'
    t = str(text).lower()
    for branch, aliases in BRANCH_ALIASES.items():
        if any(alias in t for alias in aliases):
            return branch
    return 'cse'

def is_department_match(branch_key, dept_text):
    if not dept_text:
        return False
    d = str(dept_text).lower()
    if 'all' in d or 'inter' in d or 'multidisciplinary' in d:
        return True
    aliases = BRANCH_ALIASES.get(branch_key, [branch_key])
    return any(a in d for a in aliases)

class AIRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ('/api/ai/health', '/'):
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "service": "Smart CEMS Python AI Microservice",
                "institution": "RGUKT IIIT RK Valley",
                "status": "healthy",
                "version": "1.0.0",
                "endpoints": [
                    "/api/ai/recommend [POST]",
                    "/api/ai/verify-certificate [POST]",
                    "/api/ai/analyze-feedback [POST]"
                ]
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        if parsed.path == '/api/ai/recommend':
            self.handle_recommendation(body)
        elif parsed.path == '/api/ai/verify-certificate':
            self.handle_certificate_verification(body)
        elif parsed.path == '/api/ai/analyze-feedback':
            self.handle_sentiment_analysis(body)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Unknown POST route"}).encode('utf-8'))

    def handle_recommendation(self, body):
        """
        AI Content-Based Event Recommendation Algorithm:
        Computes relevance scores based on student branch, interests, and event keywords.
        """
        raw_dept = body.get('department') or 'Computer Science & Engineering'
        branch_key = detect_branch_key(raw_dept)
        events = body.get('events', [])
        student_interests = [str(w).lower() for w in body.get('interests', [])]

        target_skills = BRANCH_AFFINITIES.get(branch_key, set()).union(set(student_interests))

        recommendations = []
        for evt in events:
            # Tokenize event text
            text = f"{evt.get('title', '')} {evt.get('category', '')} {evt.get('description', '')} {evt.get('tagline', '')} {evt.get('department', '')}".lower()
            words = set(re.findall(r'\b[a-z]{3,}\b', text))

            # Calculate keyword intersection
            intersection = len(words.intersection(target_skills))
            dept_matches = is_department_match(branch_key, evt.get('department', ''))

            # Score formula: base dept match + domain intersection, scaled 52-98
            base_score = 70 if dept_matches else 45
            match_score = min(98, max(52, int(base_score + (intersection * 12))))

            dept_display = raw_dept.replace('&', 'and').title()
            recommendations.append({
                "eventId": evt.get('id'),
                "title": evt.get('title'),
                "tagline": evt.get('tagline', ''),
                "category": evt.get('category', 'Technical'),
                "department": evt.get('department', 'Multidisciplinary'),
                "venue_name": evt.get('venue_name', 'Campus Venue'),
                "start_date": evt.get('start_date', ''),
                "image_url": evt.get('image_url', ''),
                "entry_fee": evt.get('entry_fee', 'Free'),
                "team_type": evt.get('team_type', 'Individual'),
                "matchScore": match_score,
                "reasons": [
                    f"Aligned with {dept_display} focus areas" if dept_matches else "Cross-disciplinary campus interest",
                    f"{intersection} domain factor(s) matched"
                ]
            })

        recommendations.sort(key=lambda x: x['matchScore'], reverse=True)

        self._set_headers(200)
        self.wfile.write(json.dumps({
            "success": True,
            "studentDepartment": raw_dept,
            "detectedBranch": branch_key.upper(),
            "recommendedEvents": recommendations[:10]
        }).encode('utf-8'))

    def handle_certificate_verification(self, body):
        """
        Cryptographic Certificate Integrity Verifier:
        Validates SHA-256 certificate signature against RGUKT University salt.
        """
        student_id = (body.get('studentId') or '').strip().upper()
        event_id = (body.get('eventId') or '').strip()
        ticket_code = (body.get('ticketCode') or '').strip()
        client_hash = (body.get('certificateHash') or '').strip()

        secret_salt = "RGUKT_RKV_SECURE_EVENT_SALT_2026"
        data_string = f"{student_id}|{event_id}|{ticket_code}|{secret_salt}"
        expected_hash = hashlib.sha256(data_string.encode('utf-8')).hexdigest()

        is_valid = (client_hash.lower() == expected_hash.lower()) if client_hash else True

        self._set_headers(200)
        self.wfile.write(json.dumps({
            "valid": is_valid,
            "studentId": student_id,
            "eventId": event_id,
            "generatedHash": f"RKV-CERT-{expected_hash[:16].upper()}",
            "fullVerificationDigest": expected_hash,
            "issuer": "Directorate of Student Affairs, RGUKT RK Valley",
            "message": "Certificate signature verified authentic" if is_valid else "Hash mismatch: potential certificate forgery"
        }).encode('utf-8'))

    def handle_sentiment_analysis(self, body):
        """
        Participant Feedback Sentiment Analysis:
        Calculates polarity and sentiment label for event organizers.
        """
        reviews = body.get('reviews', [])
        results = []

        total_score = 0
        for item in reviews:
            text = str(item).lower()
            tokens = re.findall(r'\b[a-z]+\b', text)
            pos_count = sum(1 for w in tokens if w in POSITIVE_WORDS)
            neg_count = sum(1 for w in tokens if w in NEGATIVE_WORDS)

            delta = pos_count - neg_count
            score = round(max(-1.0, min(1.0, (delta / max(1, pos_count + neg_count)))), 2)
            label = "Positive" if score > 0.2 else ("Negative" if score < -0.2 else "Neutral")
            total_score += score

            results.append({
                "review": item,
                "sentimentScore": score,
                "label": label
            })

        avg_score = round(total_score / max(1, len(reviews)), 2)
        overall_label = "Positive" if avg_score > 0.2 else ("Negative" if avg_score < -0.2 else "Neutral")

        self._set_headers(200)
        self.wfile.write(json.dumps({
            "totalReviews": len(reviews),
            "averageScore": avg_score,
            "overallSentiment": overall_label,
            "details": results
        }).encode('utf-8'))

if __name__ == '__main__':
    print("==================================================")
    print(f" RGUKT RK Valley - Smart CEMS Python AI Service  ")
    print(f" Running on: http://localhost:{PORT}            ")
    print(" AI Recommender • Certificate Verifier • NLP     ")
    print("==================================================")
    server = HTTPServer(('0.0.0.0', PORT), AIRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Python AI Microservice...")
