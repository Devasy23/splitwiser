import secrets
import string
from app.config import logger
def generate_jwt_secret():
    """
    Generates a cryptographically secure 64-character secret key for JWT authentication.
    
    The key consists of uppercase and lowercase letters, digits, and the special characters "!@#$%^&*".
    
    Returns:
        A randomly generated 64-character string suitable for use as a JWT secret key.
    """
    # Generate a 64-character secret key
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(64))
    return secret_key

if __name__ == "__main__":
    secret = generate_jwt_secret()
    logger.info("Generated JWT Secret Key:")
    logger.info(secret)
    logger.info("\nCopy this key to your .env file:")
    logger.info(f"SECRET_KEY={secret}")
