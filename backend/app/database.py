from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings,logger

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    """
    Initializes an asynchronous connection to MongoDB and sets the active database.
    
    Establishes a connection using the configured MongoDB URL and selects the database specified in the application settings.
    """
    mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb.database = mongodb.client[settings.database_name]
    logger.info("Connected to MongoDB")

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
