from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash_ = pwd_context.hash("test")
    print(f"Bcrypt hash generated successfully: {hash_}")
    print("Passlib + Bcrypt is WORKING.")
except Exception as e:
    print(f"Passlib/Bcrypt ERROR: {e}")
