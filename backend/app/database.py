from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    """
    Establishes an asynchronous connection to MongoDB and sets the active database.
    
    Initializes the MongoDB client using the configured connection URL and selects the database specified in the application settings.
    """
    mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb.database = mongodb.client[settings.database_name]
    print("Connected to MongoDB")

async def close_mongo_connection():
    """
    Closes the MongoDB client connection if it is currently open.
    
    This function safely terminates the connection to the MongoDB server by closing the existing client instance.
    """
    if mongodb.client:
        mongodb.client.close()
        print("Disconnected from MongoDB")

def get_database():
    """
    Return the currently active MongoDB database instance.
    
    Returns:
        The MongoDB database object managed by the module, or None if not connected.
    """
    return mongodb.database
