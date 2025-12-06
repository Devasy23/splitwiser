from app.config import logger, settings
from motor.motor_asyncio import AsyncIOMotorClient


class MongoDB:
    client: AsyncIOMotorClient = None
    database = None


mongodb = MongoDB()


async def create_indexes():
    """
    Create indexes for optimal query performance.

    These indexes support the optimized settlement and balance queries.
    """
    try:
        # Settlements collection indexes
        settlements = mongodb.database.settlements

        # Compound index for balance calculations (most critical for performance)
        await settlements.create_index(
            [("groupId", 1), ("status", 1), ("payerId", 1), ("payeeId", 1)],
            name="idx_settlements_balance_query",
        )

        # Index for group-based queries
        await settlements.create_index(
            [("groupId", 1), ("status", 1)], name="idx_settlements_group_status"
        )

        # Index for user-specific queries
        await settlements.create_index(
            [("payerId", 1), ("status", 1)], name="idx_settlements_payer"
        )
        await settlements.create_index(
            [("payeeId", 1), ("status", 1)], name="idx_settlements_payee"
        )

        # Expenses collection indexes
        expenses = mongodb.database.expenses
        await expenses.create_index(
            [("groupId", 1), ("createdAt", -1)], name="idx_expenses_group_date"
        )

        # Groups collection indexes
        groups = mongodb.database.groups
        await groups.create_index(
            [("members.userId", 1)], name="idx_groups_member_userid"
        )

        # Users collection indexes
        users = mongodb.database.users
        await users.create_index([("email", 1)], unique=True, name="idx_users_email")

        logger.info("Database indexes created/verified successfully")
    except Exception as e:
        logger.warning(f"Error creating indexes (may already exist): {e}")


async def connect_to_mongo():
    """
    Initializes an asynchronous connection to MongoDB and sets the active database.

    Establishes a connection using the configured MongoDB URL and selects the database specified in the application settings.
    """
    mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb.database = mongodb.client[settings.database_name]
    logger.info("Connected to MongoDB")

    # Create indexes for optimal performance
    await create_indexes()


async def close_mongo_connection():
    """
    Closes the MongoDB client connection if it is currently open.

    This function safely terminates the connection to the MongoDB server by closing
    the existing client instance.
    """
    if mongodb.client:
        mongodb.client.close()
        logger.info("Disconnected from MongoDB")


def get_database():
    """
    Returns the current MongoDB database instance.

    Use this function to access the active database connection managed by the module.
    """
    return mongodb.database
