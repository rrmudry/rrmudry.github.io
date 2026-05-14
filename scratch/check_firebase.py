
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use the environment's project ID
project_id = "site-6e500"

# Initialize Firebase Admin (assuming default credentials or ADC)
# If this fails, I'll try another way.
try:
    firebase_admin.initialize_app(options={'projectId': project_id})
    db = firestore.client()

    print("--- ASSESSMENTS ---")
    assessments = db.collection('assessments').stream()
    for a in assessments:
        print(f"ID: {a.id}, Data: {a.to_dict()}")

    print("\n--- RECENT STUDENT RESULTS ---")
    # We don't know the assignment ID, so we might need to check multiple.
    # But let's check 'Waves_Unit_Test' if it exists.
    res = db.collection('student_results').doc('Waves_Unit_Test').collection('students').stream()
    found = False
    for r in res:
        found = True
        print(f"Student: {r.id}, Data: {r.to_dict()}")
    
    if not found:
        print("No results found in Firebase for Waves_Unit_Test")

except Exception as e:
    print(f"Error: {e}")
