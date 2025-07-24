import firebase_admin
from firebase_admin import credentials, auth

def initialize_firebase():
    """Initialize Firebase Admin SDK with proper error handling."""
    try:
        # Use environment variable or fallback to relative path
        credentials_path = os.getenv(
            'FIREBASE_CREDENTIALS_PATH', 
            '../firebase_service_account.json'
        )
        
        if not Path(credentials_path).exists():
            raise FileNotFoundError(f"Firebase credentials file not found: {credentials_path}")
        
        cred = credentials.Certificate(credentials_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Firebase Admin SDK: {e}")
        raise

# Initialize Firebase
initialize_firebase()
