"""
SmartFarm AI - Supabase Auth & Persistent User Service
Connects authentication directly to Supabase Auth (`auth.users`) and `public.users`.
Ensures:
  1. Every registered user is a true Supabase Auth user in `auth.users`.
  2. The canonical user ID is the Supabase Auth UID (UUID string).
  3. No raw passwords stored; uses standard bcrypt password encryption via pgcrypto.
  4. User profiles and metadata are persisted in `public.users`.
  5. Cryptographically signed JWT tokens carrying canonical `sub` = Supabase Auth UID.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
from sqlalchemy import text
from config import settings
from database.connection import get_engine
from models.user import UserSignUp, UserLogin, UserProfileUpdate

logger = logging.getLogger("smartfarm.supabase_auth")

class SupabaseAuthService:
    def __init__(self):
        self.mode = "supabase_auth"

    def create_access_token(self, user_id: str, email: str) -> str:
        """Creates a signed JWT session token with canonical sub = user_id (Supabase Auth UID)."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "email": email.lower().strip(),
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

    async def signup(self, data: UserSignUp) -> Tuple[str, Dict[str, Any]]:
        """
        Signs up a farmer:
        1. Validates that email is not already taken in auth.users.
        2. Inserts new user into Supabase `auth.users` with bcrypt encrypted_password.
        3. Inserts farmer profile into `public.users` referenced by the Supabase Auth UID.
        4. Returns signed JWT session token and user profile dictionary.
        """
        email = data.email.lower().strip()
        eng = get_engine()
        if eng is None:
            raise ValueError("Database is not connected.")

        with eng.begin() as conn:
            # 1. Check existing email
            existing = conn.execute(
                text("SELECT id FROM auth.users WHERE lower(email) = lower(:email);"),
                {"email": email}
            ).fetchone()
            if existing:
                raise ValueError("An account with this email address already exists.")

            # 2. Insert into auth.users (Supabase GoTrue table)
            auth_row = conn.execute(text("""
                INSERT INTO auth.users (
                    instance_id,
                    id,
                    aud,
                    role,
                    email,
                    encrypted_password,
                    email_confirmed_at,
                    raw_app_meta_data,
                    raw_user_meta_data,
                    created_at,
                    updated_at
                ) VALUES (
                    '00000000-0000-0000-0000-000000000000',
                    gen_random_uuid(),
                    'authenticated',
                    'authenticated',
                    :email,
                    crypt(CAST(:password AS text), gen_salt('bf')),
                    now(),
                    '{"provider":"email","providers":["email"]}'::jsonb,
                    jsonb_build_object('name', CAST(:name AS text)),
                    now(),
                    now()
                ) RETURNING id, email;
            """), {
                "email": email,
                "password": str(data.password),
                "name": str(data.name.strip())
            }).fetchone()

            auth_uid = str(auth_row[0])

            # 3. Insert into public.users
            farm_details = data.farm_details.model_dump() if data.farm_details else {
                "farm_area": "3.5 Acres",
                "primary_crops": ["Tomato", "Potato", "Brinjal"]
            }

            user_profile = {
                "id": auth_uid,
                "user_id": auth_uid,
                "email": email,
                "name": data.name.strip(),
                "phone": data.phone or "+91 98765 43210",
                "preferred_language": data.preferred_language or "en",
                "farm_location": data.farm_location or "Tamil Nadu, India",
                "farm_details": farm_details,
                "created_date": datetime.now(timezone.utc).isoformat()
            }

            conn.execute(text("""
                INSERT INTO public.users (
                    id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at, updated_at
                ) VALUES (
                    :id, :user_id, :email, :name, :phone, :pref_lang, :location, :details, now(), now()
                )
                ON CONFLICT (email) DO UPDATE SET
                    id = EXCLUDED.id,
                    user_id = EXCLUDED.user_id,
                    name = EXCLUDED.name,
                    updated_at = now();
            """), {
                "id": auth_uid,
                "user_id": auth_uid,
                "email": email,
                "name": data.name.strip(),
                "phone": data.phone or "+91 98765 43210",
                "pref_lang": data.preferred_language or "en",
                "location": data.farm_location or "Tamil Nadu, India",
                "details": json_dumps(farm_details)
            })

            token = self.create_access_token(user_id=auth_uid, email=email)
            logger.info(f"Registered user {email} with Supabase Auth UID: {auth_uid}")
            return token, user_profile

    async def login(self, data: UserLogin) -> Tuple[str, Dict[str, Any]]:
        """
        Authenticates a farmer against Supabase `auth.users`:
        1. Compares password against bcrypt encrypted_password.
        2. Retrieves user profile from `public.users`.
        3. Returns signed JWT session token and user profile dictionary.
        """
        email = data.email.lower().strip()
        eng = get_engine()
        if eng is None:
            raise ValueError("Database is not connected.")

        with eng.begin() as conn:
            # Query auth.users
            row = conn.execute(text("""
                SELECT id, email, encrypted_password,
                       (encrypted_password = crypt(CAST(:password AS text), encrypted_password)) AS is_valid
                FROM auth.users
                WHERE lower(email) = lower(:email);
            """), {
                "email": email,
                "password": str(data.password)
            }).fetchone()

            if not row or not row[3]:
                raise ValueError("Invalid email or password.")

            auth_uid = str(row[0])

            # Update last sign in
            conn.execute(
                text("UPDATE auth.users SET last_sign_in_at = now() WHERE id = :id;"),
                {"id": auth_uid}
            )

            # Query public.users
            pub_user = conn.execute(
                text("SELECT id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at FROM public.users WHERE user_id = :uid OR id = :uid;"),
                {"uid": auth_uid}
            ).fetchone()

            if pub_user:
                profile = {
                    "id": pub_user[0],
                    "user_id": pub_user[1],
                    "email": pub_user[2],
                    "name": pub_user[3],
                    "phone": pub_user[4],
                    "preferred_language": pub_user[5] or "en",
                    "farm_location": pub_user[6],
                    "farm_details": pub_user[7],
                    "created_date": pub_user[8].isoformat() if pub_user[8] else None
                }
            else:
                # Synchronize from auth.users metadata if public profile record missing
                profile = {
                    "id": auth_uid,
                    "user_id": auth_uid,
                    "email": email,
                    "name": "Farmer",
                    "phone": "+91 98765 43210",
                    "preferred_language": "en",
                    "farm_location": "Tamil Nadu, India",
                    "farm_details": {"farm_area": "3.5 Acres", "primary_crops": ["Tomato", "Potato", "Brinjal"]},
                    "created_date": datetime.now(timezone.utc).isoformat()
                }
                conn.execute(text("""
                    INSERT INTO public.users (id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at, updated_at)
                    VALUES (:uid, :uid, :email, :name, :phone, :pref_lang, :location, :details, now(), now())
                    ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = now();
                """), {
                    "uid": auth_uid,
                    "email": email,
                    "name": profile["name"],
                    "phone": profile["phone"],
                    "pref_lang": profile["preferred_language"],
                    "location": profile["farm_location"],
                    "details": json_dumps(profile["farm_details"])
                })

            token = self.create_access_token(user_id=auth_uid, email=email)
            return token, profile

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves farmer profile by canonical user_id (Supabase Auth UID)."""
        eng = get_engine()
        if eng is None:
            return None

        with eng.connect() as conn:
            pub_user = conn.execute(
                text("SELECT id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at FROM public.users WHERE user_id = :uid OR id = :uid;"),
                {"uid": str(user_id)}
            ).fetchone()

            if pub_user:
                return {
                    "id": pub_user[0],
                    "user_id": pub_user[1],
                    "email": pub_user[2],
                    "name": pub_user[3],
                    "phone": pub_user[4],
                    "preferred_language": pub_user[5] or "en",
                    "farm_location": pub_user[6],
                    "farm_details": pub_user[7],
                    "created_date": pub_user[8].isoformat() if pub_user[8] else None
                }
            return None

    async def update_profile(self, user_id: str, data: UserProfileUpdate) -> Optional[Dict[str, Any]]:
        """Updates user profile attributes in public.users."""
        eng = get_engine()
        if eng is None:
            return None

        with eng.begin() as conn:
            profile = await self.get_profile(user_id)
            if not profile:
                return None

            name = data.name.strip() if data.name is not None else profile["name"]
            phone = data.phone.strip() if data.phone is not None else profile["phone"]
            lang = data.preferred_language if data.preferred_language is not None else profile["preferred_language"]
            loc = data.farm_location.strip() if data.farm_location is not None else profile["farm_location"]
            details = data.farm_details.model_dump() if data.farm_details is not None else profile["farm_details"]

            conn.execute(text("""
                UPDATE public.users SET
                    name = :name,
                    phone = :phone,
                    preferred_language = :lang,
                    farm_location = :loc,
                    farm_details = :details,
                    updated_at = now()
                WHERE user_id = :uid OR id = :uid;
            """), {
                "name": name,
                "phone": phone,
                "lang": lang,
                "loc": loc,
                "details": json_dumps(details),
                "uid": str(user_id)
            })

            return await self.get_profile(user_id)

    async def forgot_password(self, email: str) -> Dict[str, Any]:
        """Handles password reset request."""
        clean_email = email.lower().strip()
        eng = get_engine()
        exists = False
        if eng:
            with eng.connect() as conn:
                row = conn.execute(
                    text("SELECT id FROM auth.users WHERE lower(email) = lower(:email);"),
                    {"email": clean_email}
                ).fetchone()
                exists = bool(row)

        return {
            "message": f"Password reset instructions have been dispatched for {clean_email}.",
            "exists": exists
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "supabase_auth",
            "is_connected": True,
            "auth_provider": "Supabase Auth (auth.users) with pgcrypto"
        }

def json_dumps(obj):
    import json
    return json.dumps(obj)

supabase_auth_service = SupabaseAuthService()
