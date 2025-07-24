import firebase_admin
from firebase_admin import credentials, auth

# Path to your Firebase Admin SDK JSON
cred = credentials.Certificate("../firebase_service_account.json")
firebase_admin.initialize_app(cred)
