import os
from pymongo import MongoClient, IndexModel
import traceback

# MongoDB Connection Manager
MONGODB_URI = os.getenv("MONGODB_URI", "")

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is not None:
        return _db
    
    uri = os.getenv("MONGODB_URI", "")
    if not uri:
        # Fallback to local MongoDB if no Atlas URI provided yet
        uri = "mongodb://localhost:27017"
    
    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        _db = _client["docmind_db"]
        
        # Ensure unique indexes on users collection
        _db.users.create_index("username", unique=True)
        _db.users.create_index("email", unique=True)
        _db.users.create_index("session_id")
        return _db
    except Exception as e:
        print(f"MongoDB Connection Warning (URI: {uri[:15]}...): {e}")
        # Return fallback in-memory or dummy DB object if MongoDB is unreachable
        return None
