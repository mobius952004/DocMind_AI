import uuid
import datetime
import bcrypt
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, status
from app.models.auth import SignupRequest, LoginRequest, AuthResponse, UserResponse
from app.services.database import get_db

router = APIRouter()

# Memory fallback storage if MongoDB server is not running locally yet
_in_memory_users = {}

@router.post("/signup", response_model=AuthResponse)
def signup(request: SignupRequest):
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match."
        )
    
    db = get_db()
    
    # Hash password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), salt).decode('utf-8')
    session_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().isoformat()
    
    if db is not None:
        try:
            # Check existing username or email
            if db.users.find_one({"username": request.username}):
                raise HTTPException(status_code=400, detail="Username already registered.")
            if db.users.find_one({"email": request.email}):
                raise HTTPException(status_code=400, detail="Email already registered.")
            
            user_doc = {
                "username": request.username,
                "email": request.email,
                "password_hash": hashed_password,
                "session_id": session_id,
                "created_at": created_at
            }
            db.users.insert_one(user_doc)
        except HTTPException:
            raise
        except Exception as e:
            print(f"MongoDB write error, falling back to memory: {e}")
            _in_memory_users[request.username] = {
                "username": request.username,
                "email": request.email,
                "password_hash": hashed_password,
                "session_id": session_id,
                "created_at": created_at
            }
    else:
        # Local fallback if DB is offline
        if request.username in _in_memory_users:
            raise HTTPException(status_code=400, detail="Username already registered.")
        _in_memory_users[request.username] = {
            "username": request.username,
            "email": request.email,
            "password_hash": hashed_password,
            "session_id": session_id,
            "created_at": created_at
        }
        
    return AuthResponse(
        message="Account created successfully",
        user=UserResponse(
            username=request.username,
            email=request.email,
            session_id=session_id
        )
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest):
    identifier = request.identifier.strip()
    db = get_db()
    user_doc = None
    
    if db is not None:
        try:
            user_doc = db.users.find_one({
                "$or": [
                    {"username": identifier},
                    {"email": identifier}
                ]
            })
        except Exception as e:
            print(f"MongoDB query error: {e}")
            user_doc = _in_memory_users.get(identifier)
    else:
        user_doc = _in_memory_users.get(identifier)
        if not user_doc:
            for u in _in_memory_users.values():
                if u["email"] == identifier:
                    user_doc = u
                    break

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Verify password
    if not bcrypt.checkpw(request.password.encode('utf-8'), user_doc["password_hash"].encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Generate new session ID on login
    new_session_id = str(uuid.uuid4())
    if db is not None:
        try:
            db.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"session_id": new_session_id}}
            )
        except Exception:
            pass

    return AuthResponse(
        message="Login successful",
        user=UserResponse(
            username=user_doc["username"],
            email=user_doc["email"],
            session_id=new_session_id
        )
    )


@router.get("/me")
def get_current_user(x_session_id: Optional[str] = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Session ID missing.")
    
    db = get_db()
    if db is not None:
        user_doc = db.users.find_one({"session_id": x_session_id})
        if user_doc:
            return {
                "username": user_doc["username"],
                "email": user_doc["email"],
                "session_id": user_doc["session_id"]
            }
            
    return {"message": "Active session", "session_id": x_session_id}
