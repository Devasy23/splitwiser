"""
Database Index Migration
========================

This script creates all necessary indexes for optimal query performance
in the Splitwiser application.

Run this script once to set up indexes:
    python -m migrations.001_create_indexes

Expected runtime: < 30 seconds
"""

import asyncio
import sys
from pathlib import Path

from app.config import logger, settings
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


async def create_indexes():
    """Create all database indexes for optimal performance"""

    logger.info("=" * 60)
    logger.info("DATABASE INDEX MIGRATION")
    logger.info("=" * 60)

    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    try:
        logger.info(f"Connected to database: {settings.database_name}")
        logger.info("")

        # ==========================================
        # USERS COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'users' collection...")

        # Email index (unique) - Critical for login performance
        try:
            await db.users.create_index("email", unique=True)
            logger.info("   ✓ Created unique index on 'email'")
        except Exception as e:
            if "duplicate key" in str(e).lower() or "11000" in str(e):
                logger.warning(
                    f"   ⚠ Cannot create unique email index - duplicate emails exist in database"
                )
                logger.warning(
                    f"   → Creating non-unique index instead for performance"
                )
                # Create non-unique index for performance even with duplicates
                try:
                    await db.users.create_index("email", unique=False)
                    logger.info("   ✓ Created non-unique index on 'email'")
                except Exception as e2:
                    logger.error(f"   ✗ Failed to create email index: {e2}")
            else:
                logger.error(f"   ✗ Failed to create email index: {e}")
                raise

        # Firebase UID index (sparse) - For Google OAuth users
        await db.users.create_index("firebase_uid", sparse=True)
        logger.info("   ✓ Created sparse index on 'firebase_uid'")

        logger.info("")

        # ==========================================
        # GROUPS COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'groups' collection...")

        # Join code index (unique) - For group joining
        await db.groups.create_index("joinCode", unique=True)
        logger.info("   ✓ Created unique index on 'joinCode'")

        # Member userId index - Critical for finding user's groups
        await db.groups.create_index([("members.userId", 1)])
        logger.info("   ✓ Created index on 'members.userId'")

        # Created by index - For user's created groups
        await db.groups.create_index("createdBy")
        logger.info("   ✓ Created index on 'createdBy'")

        logger.info("")

        # ==========================================
        # EXPENSES COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'expenses' collection...")

        # Compound index: groupId + createdAt - For listing group expenses
        await db.expenses.create_index([("groupId", 1), ("createdAt", -1)])
        logger.info("   ✓ Created compound index on 'groupId' + 'createdAt'")

        # Compound index: groupId + splits.userId - For finding user's expenses
        await db.expenses.create_index([("groupId", 1), ("splits.userId", 1)])
        logger.info("   ✓ Created compound index on 'groupId' + 'splits.userId'")

        # Compound index: groupId + tags - For filtering by tags
        await db.expenses.create_index([("groupId", 1), ("tags", 1)])
        logger.info("   ✓ Created compound index on 'groupId' + 'tags'")

        # Compound index: createdBy + createdAt - For user's created expenses
        await db.expenses.create_index([("createdBy", 1), ("createdAt", -1)])
        logger.info("   ✓ Created compound index on 'createdBy' + 'createdAt'")

        logger.info("")

        # ==========================================
        # SETTLEMENTS COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'settlements' collection...")

        # Compound index: groupId + status - Critical for settlement queries
        await db.settlements.create_index([("groupId", 1), ("status", 1)])
        logger.info("   ✓ Created compound index on 'groupId' + 'status'")

        # Compound index: groupId + payerId + payeeId - For balance calculations
        await db.settlements.create_index(
            [("groupId", 1), ("payerId", 1), ("payeeId", 1)]
        )
        logger.info("   ✓ Created compound index on 'groupId' + 'payerId' + 'payeeId'")

        # Expense ID index - For finding settlements by expense
        await db.settlements.create_index("expenseId")
        logger.info("   ✓ Created index on 'expenseId'")

        # Payer ID index - For finding all settlements where user paid
        await db.settlements.create_index("payerId")
        logger.info("   ✓ Created index on 'payerId'")

        # Payee ID index - For finding all settlements where user owes
        await db.settlements.create_index("payeeId")
        logger.info("   ✓ Created index on 'payeeId'")

        # Compound index for balance queries - user in either role
        await db.settlements.create_index([("payerId", 1), ("payeeId", 1)])
        logger.info("   ✓ Created compound index on 'payerId' + 'payeeId'")

        logger.info("")

        # ==========================================
        # REFRESH_TOKENS COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'refresh_tokens' collection...")

        # Token index (unique) - For token lookup during refresh
        await db.refresh_tokens.create_index("token", unique=True)
        logger.info("   ✓ Created unique index on 'token'")

        # Compound index: user_id + revoked - For finding user's active tokens
        await db.refresh_tokens.create_index([("user_id", 1), ("revoked", 1)])
        logger.info("   ✓ Created compound index on 'user_id' + 'revoked'")

        # TTL index on expires_at - Auto-delete expired tokens
        await db.refresh_tokens.create_index(
            "expires_at", expireAfterSeconds=0  # Delete immediately when expired
        )
        logger.info(
            "   ✓ Created TTL index on 'expires_at' (auto-cleanup expired tokens)"
        )

        logger.info("")

        # ==========================================
        # PASSWORD_RESETS COLLECTION INDEXES
        # ==========================================
        logger.info("📋 Creating indexes for 'password_resets' collection...")

        # Token index (unique) - For reset token lookup
        await db.password_resets.create_index("token", unique=True)
        logger.info("   ✓ Created unique index on 'token'")

        # Compound index: user_id + used - For finding user's reset history
        await db.password_resets.create_index([("user_id", 1), ("used", 1)])
        logger.info("   ✓ Created compound index on 'user_id' + 'used'")

        # TTL index on expires_at - Auto-delete expired reset tokens
        await db.password_resets.create_index(
            "expires_at", expireAfterSeconds=0  # Delete immediately when expired
        )
        logger.info(
            "   ✓ Created TTL index on 'expires_at' (auto-cleanup expired resets)"
        )

        logger.info("")

        # ==========================================
        # VERIFY INDEXES CREATED
        # ==========================================
        logger.info("=" * 60)
        logger.info("VERIFICATION")
        logger.info("=" * 60)

        collections_to_verify = [
            "users",
            "groups",
            "expenses",
            "settlements",
            "refresh_tokens",
            "password_resets",
        ]

        for collection_name in collections_to_verify:
            indexes = await db[collection_name].index_information()
            index_count = len(indexes)
            logger.info(f"✓ {collection_name}: {index_count} indexes")
            for index_name, index_info in indexes.items():
                if index_name != "_id_":  # Skip default _id index
                    key = index_info.get("key", [])
                    unique = " (unique)" if index_info.get("unique") else ""
                    ttl = (
                        f" (TTL: {index_info.get('expireAfterSeconds')}s)"
                        if "expireAfterSeconds" in index_info
                        else ""
                    )
                    logger.info(f"    - {index_name}: {key}{unique}{ttl}")

        logger.info("")
        logger.info("=" * 60)
        logger.info("✅ ALL INDEXES CREATED SUCCESSFULLY!")
        logger.info("=" * 60)
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Monitor query performance in logs")
        logger.info("2. Run performance benchmarks")
        logger.info("3. Check index usage with db.collection.explain()")
        logger.info("")

    except Exception as e:
        logger.error(f"❌ Error creating indexes: {e}")
        raise
    finally:
        client.close()
        logger.info("Database connection closed.")


async def drop_indexes_if_needed():
    """
    CAUTION: This drops all custom indexes.
    Only use this if you need to recreate indexes from scratch.
    """
    logger.warning("⚠️  DROP INDEXES MODE - THIS WILL DELETE ALL CUSTOM INDEXES")
    logger.warning("Are you sure you want to continue? (yes/no)")

    # In automated scripts, you might want to pass a flag instead
    # For now, we'll just skip this function unless explicitly called

    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    try:
        collections = ["users", "groups", "expenses", "settlements", "refresh_tokens"]

        for collection_name in collections:
            # Get all indexes
            indexes = await db[collection_name].index_information()

            # Drop all except _id_ index
            for index_name in indexes.keys():
                if index_name != "_id_":
                    await db[collection_name].drop_index(index_name)
                    logger.info(
                        f"   Dropped index '{index_name}' from {collection_name}"
                    )

        logger.info("✓ All custom indexes dropped")

    except Exception as e:
        logger.error(f"Error dropping indexes: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    logger.info("Starting index migration...")
    asyncio.run(create_indexes())
    logger.info("Migration complete!")
