"""
Find and Fix Duplicate Emails
==============================

This script helps identify and resolve duplicate email addresses in the users collection.

Usage:
    python -m migrations.002_fix_duplicate_emails

Options:
    --dry-run    : Show duplicates without fixing (default)
    --fix        : Automatically fix duplicates by keeping the oldest account
    --interactive: Interactively choose which account to keep
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

from app.config import logger, settings
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


async def find_duplicate_emails(db):
    """Find all duplicate email addresses in the users collection"""

    logger.info("Searching for duplicate emails...")

    pipeline = [
        {
            "$group": {
                "_id": "$email",
                "count": {"$sum": 1},
                "users": {
                    "$push": {
                        "id": "$_id",
                        "name": "$name",
                        "created_at": "$created_at",
                    }
                },
            }
        },
        {"$match": {"count": {"$gt": 1}}},
        {"$sort": {"count": -1}},
    ]

    duplicates = await db.users.aggregate(pipeline).to_list(length=1000)

    if not duplicates:
        logger.info("✓ No duplicate emails found!")
        return []

    logger.info(f"⚠ Found {len(duplicates)} email(s) with duplicates:")
    logger.info("")

    for dup in duplicates:
        email = dup["_id"]
        count = dup["count"]
        users = dup["users"]

        logger.info(f"Email: {email}")
        logger.info(f"  Duplicate count: {count}")
        logger.info(f"  Accounts:")

        for i, user in enumerate(users, 1):
            created = user.get("created_at", "Unknown")
            if isinstance(created, datetime):
                created = created.strftime("%Y-%m-%d %H:%M:%S")
            logger.info(
                f"    {i}. ID: {user['id']}, Name: {user.get('name', 'Unknown')}, Created: {created}"
            )

        logger.info("")

    return duplicates


async def fix_duplicates_auto(db, duplicates):
    """Automatically fix duplicates by keeping the oldest account and deleting others"""

    logger.info("=" * 60)
    logger.info("AUTO-FIX MODE: Keeping oldest account for each email")
    logger.info("=" * 60)
    logger.info("")

    total_deleted = 0

    for dup in duplicates:
        email = dup["_id"]
        users = dup["users"]

        # Sort by created_at (oldest first)
        sorted_users = sorted(users, key=lambda x: x.get("created_at", datetime.min))

        # Keep the oldest, delete the rest
        keep_user = sorted_users[0]
        delete_users = sorted_users[1:]

        logger.info(f"Email: {email}")
        logger.info(
            f"  ✓ Keeping: ID {keep_user['id']} ({keep_user.get('name', 'Unknown')})"
        )

        for user in delete_users:
            user_id = user["id"]
            logger.info(f"  ✗ Deleting: ID {user_id} ({user.get('name', 'Unknown')})")

            # Delete the user
            result = await db.users.delete_one({"_id": user_id})
            if result.deleted_count > 0:
                total_deleted += 1
                logger.info(f"    → Deleted successfully")
            else:
                logger.warning(f"    → Failed to delete")

        logger.info("")

    logger.info(f"Total accounts deleted: {total_deleted}")
    return total_deleted


async def fix_duplicates_interactive(db, duplicates):
    """Interactively ask user which account to keep for each duplicate"""

    logger.info("=" * 60)
    logger.info("INTERACTIVE MODE: You choose which account to keep")
    logger.info("=" * 60)
    logger.info("")

    total_deleted = 0

    for dup in duplicates:
        email = dup["_id"]
        users = dup["users"]

        logger.info(f"Email: {email}")
        logger.info(f"Which account do you want to KEEP?")

        for i, user in enumerate(users, 1):
            created = user.get("created_at", "Unknown")
            if isinstance(created, datetime):
                created = created.strftime("%Y-%m-%d %H:%M:%S")
            logger.info(
                f"  {i}. Name: {user.get('name', 'Unknown')}, Created: {created}, ID: {user['id']}"
            )

        while True:
            try:
                choice = (
                    input(f"\nEnter number to keep (1-{len(users)}) or 's' to skip: ")
                    .strip()
                    .lower()
                )

                if choice == "s":
                    logger.info("Skipped")
                    break

                choice_num = int(choice)
                if 1 <= choice_num <= len(users):
                    keep_idx = choice_num - 1
                    keep_user = users[keep_idx]

                    logger.info(
                        f"✓ Keeping: {keep_user.get('name', 'Unknown')} (ID: {keep_user['id']})"
                    )

                    # Delete all others
                    for i, user in enumerate(users):
                        if i != keep_idx:
                            user_id = user["id"]
                            logger.info(
                                f"✗ Deleting: {user.get('name', 'Unknown')} (ID: {user_id})"
                            )

                            result = await db.users.delete_one({"_id": user_id})
                            if result.deleted_count > 0:
                                total_deleted += 1
                    break
                else:
                    logger.warning(f"Invalid choice. Enter 1-{len(users)} or 's'")
            except ValueError:
                logger.warning(f"Invalid input. Enter a number 1-{len(users)} or 's'")

        logger.info("")

    logger.info(f"Total accounts deleted: {total_deleted}")
    return total_deleted


async def main():
    """Main function"""

    import argparse

    parser = argparse.ArgumentParser(description="Find and fix duplicate emails")
    parser.add_argument(
        "--fix", action="store_true", help="Automatically fix by keeping oldest account"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Interactively choose which account to keep",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only show duplicates without fixing (default)",
        default=True,
    )
    args = parser.parse_args()

    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    try:
        logger.info("=" * 60)
        logger.info("DUPLICATE EMAIL FINDER AND FIXER")
        logger.info("=" * 60)
        logger.info(f"Database: {settings.database_name}")
        logger.info("")

        # Find duplicates
        duplicates = await find_duplicate_emails(db)

        if not duplicates:
            logger.info("No action needed. Database is clean! ✓")
            return

        # Determine mode
        if args.fix:
            logger.info("⚠ WARNING: This will DELETE duplicate accounts automatically!")
            confirm = input("Type 'yes' to proceed: ").strip().lower()
            if confirm == "yes":
                await fix_duplicates_auto(db, duplicates)
            else:
                logger.info("Cancelled.")

        elif args.interactive:
            await fix_duplicates_interactive(db, duplicates)

        else:
            logger.info("=" * 60)
            logger.info("DRY RUN MODE - No changes made")
            logger.info("=" * 60)
            logger.info("")
            logger.info("To fix duplicates automatically (keep oldest):")
            logger.info("  python -m migrations.002_fix_duplicate_emails --fix")
            logger.info("")
            logger.info("To fix duplicates interactively (you choose):")
            logger.info("  python -m migrations.002_fix_duplicate_emails --interactive")

        logger.info("")
        logger.info("=" * 60)
        logger.info("DONE")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
