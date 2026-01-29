import os
import glob
import re
import pandas as pd
import fitz  # PyMuPDF
import cv2
import numpy as np
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image

# Load environment variables
load_dotenv()
API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    print("Error: GOOGLE_API_KEY not found in environment variables.")
    exit(1)

# Configuration
INPUT_DIR = './student_submissions'
OUTPUT_FILE = 'grades.csv'

# Grading Rubric System Prompt
GRADER_PROMPT = r"""
You are an expert Physics Teacher grading a "Conservation of Momentum" lab report.
Your goal is to evaluate the student's work based on the provided images of their PDF submission.

**Student Identification (CRITICAL):**
1. **Name:** Read the Student Name from the "Name" field at the top of the first page.
2. **Student ID (SID):** Look for a QR code OR printed text at the top of the page that says "SID:######". 
   - Extract the 6-digit number after "SID:". 
   - If you see a QR code, try to "read" or infer the SID from the context if it's printed nearby.

**Grading Tasks:**
1. **Completion Check:** Did the student fill out all sections? (Data tables, calculations, written answers).
2. **Data Validity:** Look at their data tables. Do the numbers make physical sense? (e.g., Mass shouldn't be negative).
3. **Conceptual Understanding:** Evaluate their written answers for the "Real World Connections" and "Conceptual Questions" sections.
    - They should correctly apply the Impulse-Momentum theorem ($J = \Delta p$).
    - They should understand Newton's 3rd Law in collisions.
4. **Plagiarism/AI Check:** 
    - Flag if the text sounds overly robotic, uses advanced vocabulary not typical for high schoolers, or contains "AI hallucinations" (nonsense phrases).
    - Flag if the data matches the "randomized seed" data exactly (if known, otherwise ignore).

**Output Format:**
Return ONLY a valid JSON object with the following structure (no markdown formatting):
{
  "student_name_detected": "Name Found",
  "sid_detected": "######",
  "score": 0-100,
  "feedback": "Brief summary of feedback...",
  "plagiarism_flag": true/false,
  "plagiarism_reason": "Explanation if flagged..."
}
"""

def extract_images_from_pdf(pdf_path):
    """Converts PDF pages to Opencv format images. Uses 300 DPI for QR reliability."""
    doc = fitz.open(pdf_path)
    images = []
    for page in doc:
        # Boost DPI to 300 to make QR codes much clearer for CV detectors
        pix = page.get_pixmap(dpi=300)
        img_data = pix.tobytes("ppm")
        # Convert to numpy array for OpenCV
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        images.append(img)
    return images

def scan_qr_for_sid(image):
    """Scans an image for a QR code containing 'SID:' with multiple preprocessing attempts."""
    detect = cv2.QRCodeDetector()
    
    # Attempt 1: Raw image
    value, points, straight_qrcode = detect.detectAndDecode(image)
    
    # Attempt 2: Grayscale + Threshold (Helps with glare/low contrast)
    if not value:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        value, points, straight_qrcode = detect.detectAndDecode(thresh)

    if value:
        # Check for SID format
        match = re.search(r"SID:(\d+)", value)
        if match:
            return match.group(1) # Return just the digits
        return value # Return raw value if it doesn't match expected pattern
        
    return None

def grade_submission(images):
    """Sends images to Gemini for grading using the new google-genai SDK."""
    try:
        # Initialize Client
        client = genai.Client(api_key=API_KEY)
        
        # Prepare content: Prompt + List of PIL Images
        content_parts = [GRADER_PROMPT]
        
        for cv_img in images:
            # Convert to RGB for PIL/Gemini
            color_converted = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(color_converted)
            content_parts.append(pil_img)

        # Call the API. Using gemini-2.5-flash as it's the current flagship
        target_model = "gemini-2.5-flash" 
        
        response = client.models.generate_content(
            model=target_model, 
            contents=content_parts
        )
        
        # Clean response text
        text = response.text
        if text.startswith('```json'):
            text = text.replace('```json', '').replace('```', '')
        text = text.strip()
        
        # Parse JSON
        import json
        return json.loads(text)

    except Exception as e:
        print(f"  AI Error: {e}")
        # Debugging: List models if we get a 404
        if "404" in str(e) or "not found" in str(e).lower():
            try:
                print("  --- Listing Available Models for this Key ---")
                client = genai.Client(api_key=API_KEY)
                for m in client.models.list():
                    print(f"  > {m.name}")
            except:
                pass
        return {
            "student_name_detected": "Error",
            "sid_detected": "Error",
            "score": 0,
            "feedback": f"AI Processing Failed. Check terminal for available models.",
            "plagiarism_flag": False
        }

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Creating input directory: {INPUT_DIR}")
        os.makedirs(INPUT_DIR)
        print("Please put PDF files in this folder and run again.")
        return

    pdf_files = glob.glob(os.path.join(INPUT_DIR, "*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {INPUT_DIR}")
        return

    results = []

    print(f"Found {len(pdf_files)} submissions. Processing...")

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        print(f"\nProcessing: {filename}")
        
        try:
            # 1. Convert to Images (300 DPI)
            images = extract_images_from_pdf(pdf_path)
            if not images:
                print("  Error: Could not extract images.")
                continue

            # 2. Scan QR Code via Computer Vision
            detected_sid = None
            for img in images:
                detected_sid = scan_qr_for_sid(img)
                if detected_sid:
                    print(f"  CV QR Found SID: {detected_sid}")
                    break
            
            # 3. Grade and Extract SID with AI
            print("  Analyzing with Gemini...")
            ai_result = grade_submission(images)
            
            # 4. Final SID Logic (AI Fallback)
            final_sid = detected_sid
            if not final_sid:
                ai_sid = ai_result.get('sid_detected')
                if ai_sid and ai_sid != "N/A" and ai_sid != "Error":
                    final_sid = ai_sid
                    print(f"  AI Fallback Found SID: {final_sid}")
                else:
                    final_sid = "N/A"

            # 5. Compile Row
            row = {
                "Filename": filename,
                "Student ID": final_sid,
                "Student Name": ai_result.get('student_name_detected', 'Unknown'),
                "Score": ai_result.get('score', 0),
                "Flagged": "YES" if ai_result.get('plagiarism_flag') else "No",
                "Flag Reason": ai_result.get('plagiarism_reason', ''),
                "Feedback": ai_result.get('feedback', '')
            }
            results.append(row)
            print(f"  Score: {row['Score']} | SID: {row['Student ID']}")

        except Exception as e:
            print(f"  Critical Error processing file: {e}")

    # Export
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nDone! Grades saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
