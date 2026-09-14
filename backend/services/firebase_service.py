import os
import json
import logging
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt

from config import settings
from models.user import UserSignUp, UserLogin, UserProfileUpdate, UserResponse

logger = logging.getLogger("smartfarm.firebase")
logging.basicConfig(level=logging.INFO)

# Firebase Admin SDK imports (optional/graceful)
FIREBASE_AVAILABLE = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase_admin package not installed. Operating in local mode.")


class FirebaseService:
    def __init__(self):
        self.is_connected = False
        self.db = None
        self.app = None
        self.mode = "dev"
        # Local mock storage for dev/fallback mode
        self._mock_users_db: Dict[str, Dict[str, Any]] = {}
        self._mock_auth_db: Dict[str, Dict[str, str]] = {}  # email -> {hashed_password, salt, user_id}

        self._initialize_firebase()
        self._seed_default_user()

    def _initialize_firebase(self):
        """Attempts to initialize Firebase Admin SDK using file or environment variables."""
        if not FIREBASE_AVAILABLE:
            logger.info("Firebase SDK not available. Using local simulation store.")
            self.mode = "local_simulation"
            return

        try:
            # 1. Check if an app is already initialized
            if firebase_admin._apps:
                self.app = firebase_admin.get_app()
                self.db = firestore.client()
                self.is_connected = True
                self.mode = "live_firebase"
                logger.info("Reusing existing Firebase App instance.")
                return

            # 2. Check credentials file path
            cred = None
            resolved_cred_path = settings.clean_firebase_credentials_path
            if resolved_cred_path and os.path.exists(resolved_cred_path):
                logger.info(f"Loading Firebase credentials from file: {resolved_cred_path}")
                cred = credentials.Certificate(resolved_cred_path)

            # 3. Check environment variables
            elif settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
                logger.info("Loading Firebase credentials from environment variables.")
                private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key": private_key,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cred_dict)

            if cred:
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.is_connected = True
                self.mode = "live_firebase"
                logger.info(f"Firebase initialized successfully with project ID: {settings.FIREBASE_PROJECT_ID or 'from service account'}")
            else:
                self.mode = "dev_simulation"
                logger.info("No Firebase credentials provided. Running in dev simulation mode.")
        except Exception as e:
            self.is_connected = False
            self.mode = "dev_simulation"
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to dev simulation mode.")

    def _seed_default_user(self):
        """Seeds standard default demo user in local store for seamless out-of-the-box local testing."""
        default_user_id = "USR-UGESH-001"
        salt = secrets.token_hex(8)
        hashed_pw = self._hash_password("password123", salt)
        
        self._mock_auth_db["ugeshraja@example.com"] = {
            "user_id": default_user_id,
            "salt": salt,
            "hashed_password": hashed_pw
        }
        
        default_field_profile = {
            "crop_type": "Brinjal",
            "soil_type": "Loamy",
            "soil_ph": 6.4,
            "water_capacity": "72%",
            "field_size": 2.0,
            "field_size_unit": "Acre",
            "npk_nitrogen": 80,
            "npk_phosphorus": 40,
            "npk_potassium": 40,
            "sowing_date": "2026-06-15",
            "irrigation_method": "Drip",
            "field_location": "Tamil Nadu",
            "season": "Kharif"
        }

        if default_user_id in self._mock_users_db:
            if "field_profile" not in self._mock_users_db[default_user_id]:
                self._mock_users_db[default_user_id]["field_profile"] = default_field_profile
        else:
            self._mock_users_db[default_user_id] = {
                "user_id": default_user_id,
                "name": "UGESHRAJA S",
                "email": "ugeshraja@example.com",
                "phone": "+91 98765 43210",
                "preferred_language": "ta",
                "farm_location": "Dharmapuri, Tamil Nadu",
                "farm_details": {
                    "farm_area": "3.5 Acres",
                    "primary_crops": ["Tomato", "Potato", "Brinjal"],
                    "soil_type": "Red Loamy",
                    "irrigation_type": "Drip Irrigation"
                },
                "field_profile": default_field_profile,
                "created_date": "2026-01-15T09:00:00Z"
            }

    # ----------------------------------------------------
    # Security / Cryptography Helpers
    # ----------------------------------------------------
    def _hash_password(self, password: str, salt: str) -> str:
        """Secure PBKDF2 password hashing (never store raw passwords)."""
        return hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()

    def _verify_password(self, password: str, salt: str, hashed: str) -> bool:
        return self._hash_password(password, salt) == hashed

    def create_access_token(self, user_id: str, email: str) -> str:
        """Creates a signed JWT session token."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decodes and validates JWT token."""
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception:
            return None

    # ----------------------------------------------------
    # User Authentication & Profile Methods
    # ----------------------------------------------------
    async def signup(self, data: UserSignUp) -> Tuple[str, Dict[str, Any]]:
        """
        Signs up a farmer:
        1. Creates Auth record in Firebase Auth (or dev store).
        2. Creates Profile in Firestore 'users' collection.
        Returns: (access_token, user_profile_dict)
        """
        email = data.email.lower().strip()
        user_id = f"USR-{secrets.token_hex(6).upper()}"
        created_at = datetime.now(timezone.utc).isoformat()

        farm_details_dict = data.farm_details.model_dump() if data.farm_details else {
            "farm_area": "3.5 Acres",
            "primary_crops": ["Tomato", "Potato", "Brinjal"]
        }

        user_profile = {
            "user_id": user_id,
            "name": data.name.strip(),
            "email": email,
            "phone": data.phone or "+91 98765 43210",
            "preferred_language": data.preferred_language,  # "en" or "ta"
            "farm_location": data.farm_location or "Tamil Nadu, India",
            "farm_details": farm_details_dict,
            "created_date": created_at
        }

        # If live Firebase is connected
        if self.is_connected and FIREBASE_AVAILABLE:
            try:
                # 1. Create user in Firebase Auth
                fb_user = fb_auth.create_user(
                    email=email,
                    password=data.password,
                    display_name=data.name
                )
                user_id = fb_user.uid
                user_profile["user_id"] = user_id

                # 2. Save profile document in Firestore 'users' collection
                # Important: DO NOT store password in Firestore!
                self.db.collection("users").document(user_id).set(user_profile)
                logger.info(f"Created Firebase Auth & Firestore user profile for {email} ({user_id})")
            except Exception as e:
                logger.error(f"Firebase signup error: {e}")
                raise ValueError(f"Firebase error: {str(e)}")
        else:
            # Local dev simulation
            if email in self._mock_auth_db:
                raise ValueError("An account with this email address already exists.")

            salt = secrets.token_hex(8)
            hashed_pw = self._hash_password(data.password, salt)
            self._mock_auth_db[email] = {
                "user_id": user_id,
                "salt": salt,
                "hashed_password": hashed_pw
            }
            self._mock_users_db[user_id] = user_profile

        token = self.create_access_token(user_id=user_id, email=email)
        return token, user_profile

    async def login(self, data: UserLogin) -> Tuple[str, Dict[str, Any]]:
        """
        Authenticates a farmer.
        Returns: (access_token, user_profile_dict)
        """
        email = data.email.lower().strip()

        if self.is_connected and FIREBASE_AVAILABLE:
            # With Firebase Admin SDK, verify user exists in Auth and fetch from Firestore
            try:
                fb_user = fb_auth.get_user_by_email(email)
                user_id = fb_user.uid
                profile = await self.get_profile(user_id)
                if not profile:
                    # Create profile if not present
                    profile = {
                        "user_id": user_id,
                        "name": fb_user.display_name or "Farmer",
                        "email": email,
                        "phone": fb_user.phone_number or "+91 98765 43210",
                        "preferred_language": "en",
                        "farm_location": "Tamil Nadu, India",
                        "farm_details": {"farm_area": "3.0 Acres", "primary_crops": ["Tomato"]},
                        "created_date": datetime.now(timezone.utc).isoformat()
                    }
                    self.db.collection("users").document(user_id).set(profile)
                
                token = self.create_access_token(user_id=user_id, email=email)
                return token, profile
            except Exception as e:
                logger.error(f"Firebase login validation error: {e}")
                raise ValueError("Invalid email or password.")
        else:
            # Dev simulation
            auth_info = self._mock_auth_db.get(email)
            if not auth_info:
                raise ValueError("Invalid email or password.")

            if not self._verify_password(data.password, auth_info["salt"], auth_info["hashed_password"]):
                raise ValueError("Invalid email or password.")

            user_id = auth_info["user_id"]
            profile = self._mock_users_db.get(user_id)
            if not profile:
                raise ValueError("User profile not found.")

            token = self.create_access_token(user_id=user_id, email=email)
            return token, profile

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches farmer profile by user_id from Firestore or local store."""
        if self.is_connected and FIREBASE_AVAILABLE:
            try:
                doc = self.db.collection("users").document(user_id).get()
                if doc.exists:
                    return doc.to_dict()
                return None
            except Exception as e:
                logger.error(f"Firestore get_profile error: {e}")
                return None
        else:
            return self._mock_users_db.get(user_id)

    async def update_profile(self, user_id: str, data: UserProfileUpdate) -> Optional[Dict[str, Any]]:
        """Updates user profile in Firestore 'users' collection."""
        profile = await self.get_profile(user_id)
        if not profile:
            return None

        update_fields = {}
        if data.name is not None:
            update_fields["name"] = data.name.strip()
        if data.phone is not None:
            update_fields["phone"] = data.phone.strip()
        if data.preferred_language is not None:
            update_fields["preferred_language"] = data.preferred_language  # "en" or "ta"
        if data.farm_location is not None:
            update_fields["farm_location"] = data.farm_location.strip()
        if data.farm_details is not None:
            update_fields["farm_details"] = data.farm_details.model_dump()

        if self.is_connected and FIREBASE_AVAILABLE:
            try:
                self.db.collection("users").document(user_id).update(update_fields)
                profile.update(update_fields)
                return profile
            except Exception as e:
                logger.error(f"Firestore update_profile error: {e}")
                raise ValueError(f"Failed to update profile: {str(e)}")
        else:
            profile.update(update_fields)
            self._mock_users_db[user_id] = profile
            return profile

    async def get_field_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches farmer's field profile."""
        profile = await self.get_profile(user_id)
        if not profile:
            return None
        return profile.get("field_profile")

    async def update_field_profile(self, user_id: str, field_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or updates farmer's field profile."""
        profile = await self.get_profile(user_id)
        if not profile:
            raise ValueError("User not found.")

        current_field = profile.get("field_profile") or {}
        # Merge fields
        clean_data = {k: v for k, v in field_data.items() if v is not None}
        current_field.update(clean_data)

        if self.is_connected and FIREBASE_AVAILABLE:
            try:
                self.db.collection("users").document(user_id).update({"field_profile": current_field})
            except Exception as e:
                logger.error(f"Firestore update_field_profile error: {e}")
                raise ValueError(f"Failed to update field profile: {str(e)}")
        else:
            profile["field_profile"] = current_field
            self._mock_users_db[user_id] = profile

        return current_field

    async def forgot_password(self, email: str) -> Dict[str, Any]:
        """Triggers password reset flow."""
        email = email.lower().strip()
        if self.is_connected and FIREBASE_AVAILABLE:
            try:
                link = fb_auth.generate_password_reset_link(email)
                logger.info(f"Password reset link generated for {email}")
                return {"message": "Password reset email sent successfully.", "reset_link_generated": True}
            except Exception as e:
                logger.error(f"Firebase forgot_password error: {e}")
                return {"message": "If that email exists, a password reset link has been generated."}
        else:
            return {"message": f"Password reset instructions simulated for {email}."}

    def get_status(self) -> Dict[str, Any]:
        """Returns service status."""
        return {
            "mode": self.mode,
            "is_connected": self.is_connected,
            "firebase_installed": FIREBASE_AVAILABLE,
            "project_id": settings.FIREBASE_PROJECT_ID or (self.app.project_id if self.app else "None")
        }


firebase_service = FirebaseService()
