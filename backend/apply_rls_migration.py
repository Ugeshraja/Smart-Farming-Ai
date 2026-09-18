"""
SmartFarm AI - Database Migration & RLS Setup
Applies Row Level Security (RLS) policies and ensures Supabase Auth user integration.
"""

import sys
sys.path.insert(0, r'c:\Users\ugesh\.gemini\antigravity\scratch\smartfarm-ai\backend')

from database.connection import get_engine
from sqlalchemy import text

def run_migration():
    eng = get_engine()
    with eng.begin() as conn:
        print("1. Ensuring pgcrypto extension...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))

        print("2. Ensuring demo user exists in auth.users...")
        # Check if ugeshraja@example.com exists in auth.users
        demo_auth = conn.execute(text("SELECT id FROM auth.users WHERE lower(email) = 'ugeshraja@example.com';")).fetchone()
        if not demo_auth:
            demo_row = conn.execute(text("""
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
                    '00000000-0000-0000-0000-000000000001',
                    'authenticated',
                    'authenticated',
                    'ugeshraja@example.com',
                    crypt('password123', gen_salt('bf')),
                    now(),
                    '{"provider":"email","providers":["email"]}'::jsonb,
                    '{"name":"UGESHRAJA S"}'::jsonb,
                    now(),
                    now()
                ) RETURNING id;
            """)).fetchone()
            demo_uid = str(demo_row[0])
            print(f"Created demo auth.users with UID: {demo_uid}")
        else:
            demo_uid = str(demo_auth[0])
            print(f"Demo auth.users already exists with UID: {demo_uid}")

        print("3. Syncing public.users with auth.users UID for demo user...")
        conn.execute(text("""
            INSERT INTO public.users (
                id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at, updated_at
            ) VALUES (
                :uid, :uid, 'ugeshraja@example.com', 'UGESHRAJA S', '+91 98765 43210', 'ta', 'Dharmapuri, Tamil Nadu',
                '{"farm_area": "3.5 Acres", "primary_crops": ["Tomato", "Potato", "Brinjal"]}'::jsonb,
                now(), now()
            )
            ON CONFLICT (email) DO UPDATE SET
                id = EXCLUDED.id,
                user_id = EXCLUDED.user_id,
                updated_at = now();
        """), {"uid": demo_uid})

        # Also ensure demo field is associated with demo_uid
        conn.execute(text("""
            UPDATE public.fields
            SET user_id = :uid
            WHERE user_id = 'USR-UGESH-001' OR user_id = :uid;
        """), {"uid": demo_uid})

        print("4. Enabling Row Level Security (RLS) on user tables...")
        conn.execute(text("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE public.disease_predictions ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;"))

        print("5. Configuring RLS policies...")
        tables = ['users', 'fields', 'disease_predictions', 'ai_reports']

        # Drop existing policies on these tables if any
        for tbl in tables:
            pols = conn.execute(text(f"""
                SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = '{tbl}';
            """)).fetchall()
            for p in pols:
                pname = p[0]
                conn.execute(text(f"DROP POLICY IF EXISTS \"{pname}\" ON public.{tbl};"))
                print(f"Dropped old policy: {pname} on {tbl}")

        # Policies for public.users
        conn.execute(text("""
            CREATE POLICY "users_owner_select" ON public.users
                FOR SELECT USING (
                    auth.uid()::text = user_id OR auth.uid()::text = id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "users_owner_insert" ON public.users
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id OR auth.uid()::text = id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "users_owner_update" ON public.users
                FOR UPDATE USING (
                    auth.uid()::text = user_id OR auth.uid()::text = id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "users_owner_delete" ON public.users
                FOR DELETE USING (
                    auth.uid()::text = user_id OR auth.uid()::text = id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
        """))
        print("Created RLS policies on public.users.")

        # Policies for public.fields
        conn.execute(text("""
            CREATE POLICY "fields_owner_select" ON public.fields
                FOR SELECT USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "fields_owner_insert" ON public.fields
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "fields_owner_update" ON public.fields
                FOR UPDATE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "fields_owner_delete" ON public.fields
                FOR DELETE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
        """))
        print("Created RLS policies on public.fields.")

        # Policies for public.disease_predictions
        conn.execute(text("""
            CREATE POLICY "predictions_owner_select" ON public.disease_predictions
                FOR SELECT USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "predictions_owner_insert" ON public.disease_predictions
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "predictions_owner_update" ON public.disease_predictions
                FOR UPDATE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "predictions_owner_delete" ON public.disease_predictions
                FOR DELETE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
        """))
        print("Created RLS policies on public.disease_predictions.")

        # Policies for public.ai_reports
        conn.execute(text("""
            CREATE POLICY "reports_owner_select" ON public.ai_reports
                FOR SELECT USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "reports_owner_insert" ON public.ai_reports
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "reports_owner_update" ON public.ai_reports
                FOR UPDATE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
            CREATE POLICY "reports_owner_delete" ON public.ai_reports
                FOR DELETE USING (
                    auth.uid()::text = user_id OR auth.role() = 'service_role' OR current_user = 'postgres'
                );
        """))
        print("Created RLS policies on public.ai_reports.")

    print("\nMigration completed successfully!")

if __name__ == "__main__":
    run_migration()
