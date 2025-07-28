"""
Migration script to standardize user avatar fields to imageUrl.
This script:
1. Identifies users with avatar field but no imageUrl field
2. Copies avatar values to imageUrl field
3. Removes the deprecated avatar field
4. Logs migration statistics
"""

from backup_db import create_backup
import json
import logging
import os
import sys
from datetime import datetime

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

# Add the script's directory to Python path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)


# Load environment variables from the backend directory
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# Get MongoDB connection details from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up file logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(
    log_dir, f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
)
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
)
logger.addHandler(file_handler)

# Validate required environment variables
if not MONGODB_URL:
    logger.error("MONGODB_URL environment variable is required")
    sys.exit(1)
if not DATABASE_NAME:
    logger.error("DATABASE_NAME environment variable is required")
    sys.exit(1)


def migrate_avatar_to_imageurl():
    """
    Migrate avatar field to imageUrl in users collection.
    Returns statistics about the migration.
    """
    try:
        # First create a backup
        logger.info("Creating database backup...")
        backup_path, backup_metadata = create_backup()
        logger.info(f"Backup created at: {backup_path}")

        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        users = db.users

        # Find users with avatar field
        users_with_avatar = users.find({"avatar": {"$exists": True}})
        users_to_update = []
        stats = {
            "total_users": users.count_documents({}),
            "users_with_avatar": 0,
            "users_with_both_fields": 0,
            "users_updated": 0,
            "conflicts": 0,
        }

        for user in users_with_avatar:
            stats["users_with_avatar"] += 1

            # Check for conflicts (users with both fields)
            if "imageUrl" in user and user["imageUrl"] is not None:
                if user["imageUrl"] != user["avatar"]:
                    logger.warning(
                        f"Conflict found for user {user['_id']}: "
                        f"avatar='{user['avatar']}', imageUrl='{user['imageUrl']}'"
                    )
                    stats["conflicts"] += 1
                    continue
                stats["users_with_both_fields"] += 1

            # Prepare update
            users_to_update.append(
                UpdateOne(
                    {"_id": user["_id"]},
                    {"$set": {"imageUrl": user["avatar"]}, "$unset": {
                        "avatar": ""}},
                )
            )

        # Perform bulk update if there are users to update
        if users_to_update:
            result = users.bulk_write(users_to_update)
            stats["users_updated"] = result.modified_count
            logger.info(f"Successfully updated {result.modified_count} users")

        return stats

    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise


def rollback_migration(backup_path):
    """
    Rollback the migration using a specified backup.
    """
    try:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        backup_file_path = os.path.join(backup_path, "users.json")
        if not os.path.exists(backup_file_path):
            raise FileNotFoundError(f"Backup file not found: {backup_file_path}")

        # Read users collection backup
        with open(backup_file_path, "r") as f:
            users_backup = json.load(f)

        # Convert string IDs back to ObjectId
        for user in users_backup:
            user["_id"] = ObjectId(user["_id"])

        # Replace current users collection with backup
        db.users.drop()
        if users_backup:
            db.users.insert_many(users_backup)

        logger.info(f"Successfully rolled back to backup: {backup_path}")
        return True

    except Exception as e:
        logger.error(f"Rollback failed: {str(e)}")
        raise


if __name__ == "__main__":
    logger.info("Starting avatar to imageUrl migration...")
    stats = migrate_avatar_to_imageurl()

    logger.info("\nMigration completed. Statistics:")
    logger.info(f"Total users: {stats['total_users']}")
    logger.info(f"Users with avatar field: {stats['users_with_avatar']}")
    logger.info(f"Users with both fields: {stats['users_with_both_fields']}")
    logger.info(f"Users updated: {stats['users_updated']}")
    logger.info(f"Conflicts found: {stats['conflicts']}")

    print("\nMigration completed. Check the log file for details:", log_file)
