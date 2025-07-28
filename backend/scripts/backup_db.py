"""
Database backup script for Splitwiser.
Creates a backup of all collections before performing migrations.
"""
import json
from datetime import datetime
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Get the script's directory and backend directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

# Load environment variables from .env file in backend directory
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

# Get MongoDB connection details from environment
MONGODB_URL = os.getenv('MONGODB_URL')
DATABASE_NAME = os.getenv('DATABASE_NAME')

def create_backup():
    """Create a backup of all collections."""
    try:
        # Create backup directory if it doesn't exist
        backup_dir = "backups"
        backup_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(backup_dir, f"backup_{backup_time}")
        os.makedirs(backup_path, exist_ok=True)

        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]

        # Get all collections
        collections = db.list_collection_names()
        backup_stats = {}

        for collection_name in collections:
            collection = db[collection_name]
            documents = list(collection.find({}))
            
            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                doc['_id'] = str(doc['_id'])

            # Save to file
            backup_file = os.path.join(backup_path, f"{collection_name}.json")
            with open(backup_file, 'w') as f:
                json.dump(documents, f, indent=2, default=str)
            
            backup_stats[collection_name] = len(documents)

        # Save backup metadata
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'database': DATABASE_NAME,
            'collections': backup_stats,
            'total_documents': sum(backup_stats.values())
        }
        
        with open(os.path.join(backup_path, "backup_metadata.json"), 'w') as f:
            json.dump(metadata, f, indent=2)

        return backup_path, metadata
        
    except Exception as e:
        print(f"Backup failed: {str(e)}")
        raise

if __name__ == "__main__":
    backup_path, metadata = create_backup()
    print(f"Backup created successfully at: {backup_path}")
    print("\nBackup statistics:")
    print(f"Total documents: {metadata['total_documents']}")
    for coll, count in metadata['collections'].items():
        print(f"{coll}: {count} documents")
