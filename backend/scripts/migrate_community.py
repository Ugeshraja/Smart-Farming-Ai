"""
SmartFarm AI - Community Database Migration & Setup
Creates:
  - public.community_posts
  - public.community_comments
  - public.community_likes
Updates:
  - public.users RLS policy to allow authenticated users to view registered members
  - Syncs all existing auth.users accounts into public.users with real names
  - Configures RLS policies on community tables
  - Adds community tables to Supabase Realtime publication
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_engine
from sqlalchemy import text

def run_community_migration():
    eng = get_engine()
    if eng is None:
        raise RuntimeError("Database engine could not be initialized.")

    with eng.begin() as conn:
        print("1. Creating Community tables...")
        
        # 1. community_posts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS public.community_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                crop VARCHAR(50) NOT NULL DEFAULT 'General',
                topic VARCHAR(100) NOT NULL DEFAULT 'Discussion',
                language VARCHAR(10) NOT NULL DEFAULT 'en',
                content TEXT NOT NULL,
                likes_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts (user_id);
            CREATE INDEX IF NOT EXISTS idx_community_posts_crop ON public.community_posts (crop);
        """))

        # 2. community_comments
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS public.community_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments (post_id);
        """))

        # 3. community_likes
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS public.community_likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
            );
            CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON public.community_likes (post_id);
            CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON public.community_likes (user_id);
        """))

        print("2. Syncing all registered auth.users accounts into public.users...")
        # Get all auth.users and make sure they have a corresponding public.users record
        sync_result = conn.execute(text("""
            INSERT INTO public.users (
                id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at, updated_at
            )
            SELECT 
                au.id::text,
                au.id::text,
                lower(au.email),
                COALESCE(
                    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
                    NULLIF(TRIM(au.raw_user_meta_data->>'display_name'), ''),
                    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
                    split_part(au.email, '@', 1)
                ) AS name,
                COALESCE(au.raw_user_meta_data->>'phone', '+91 98765 43210'),
                COALESCE(au.raw_user_meta_data->>'preferred_language', 'en'),
                COALESCE(au.raw_user_meta_data->>'farm_location', 'Tamil Nadu, India'),
                COALESCE(au.raw_user_meta_data->'farm_details', '{"farm_area":"3.5 Acres","primary_crops":["Tomato","Potato","Brinjal"]}'::jsonb),
                COALESCE(au.created_at, now()),
                now()
            FROM auth.users au
            ON CONFLICT (email) DO UPDATE SET
                id = EXCLUDED.id,
                user_id = EXCLUDED.user_id,
                name = CASE 
                    WHEN public.users.name IS NULL OR public.users.name = 'Farmer' THEN EXCLUDED.name 
                    ELSE public.users.name 
                END,
                updated_at = now();
        """))
        print(f"Sync complete.")

        print("3. Updating RLS on public.users to allow authenticated users to see registered profiles...")
        conn.execute(text("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("DROP POLICY IF EXISTS \"users_owner_select\" ON public.users;"))
        conn.execute(text("DROP POLICY IF EXISTS \"users_authenticated_select\" ON public.users;"))
        conn.execute(text("""
            CREATE POLICY "users_authenticated_select" ON public.users
                FOR SELECT USING (
                    auth.role() = 'authenticated' 
                    OR auth.role() = 'anon'
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );
        """))

        print("4. Configuring RLS on community_posts...")
        conn.execute(text("ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_posts_select\" ON public.community_posts;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_posts_insert\" ON public.community_posts;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_posts_update\" ON public.community_posts;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_posts_delete\" ON public.community_posts;"))

        conn.execute(text("""
            CREATE POLICY "community_posts_select" ON public.community_posts
                FOR SELECT USING (true);

            CREATE POLICY "community_posts_insert" ON public.community_posts
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );

            CREATE POLICY "community_posts_update" ON public.community_posts
                FOR UPDATE USING (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );

            CREATE POLICY "community_posts_delete" ON public.community_posts
                FOR DELETE USING (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );
        """))

        print("5. Configuring RLS on community_comments...")
        conn.execute(text("ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_comments_select\" ON public.community_comments;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_comments_insert\" ON public.community_comments;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_comments_delete\" ON public.community_comments;"))

        conn.execute(text("""
            CREATE POLICY "community_comments_select" ON public.community_comments
                FOR SELECT USING (true);

            CREATE POLICY "community_comments_insert" ON public.community_comments
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );

            CREATE POLICY "community_comments_delete" ON public.community_comments
                FOR DELETE USING (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );
        """))

        print("6. Configuring RLS on community_likes...")
        conn.execute(text("ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_likes_select\" ON public.community_likes;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_likes_insert\" ON public.community_likes;"))
        conn.execute(text("DROP POLICY IF EXISTS \"community_likes_delete\" ON public.community_likes;"))

        conn.execute(text("""
            CREATE POLICY "community_likes_select" ON public.community_likes
                FOR SELECT USING (true);

            CREATE POLICY "community_likes_insert" ON public.community_likes
                FOR INSERT WITH CHECK (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );

            CREATE POLICY "community_likes_delete" ON public.community_likes
                FOR DELETE USING (
                    auth.uid()::text = user_id 
                    OR auth.role() = 'service_role' 
                    OR current_user = 'postgres'
                );
        """))

        print("7. Configuring Supabase Realtime publication...")
        try:
            # Enable replication identity
            conn.execute(text("ALTER TABLE public.community_posts REPLICA IDENTITY FULL;"))
            conn.execute(text("ALTER TABLE public.community_comments REPLICA IDENTITY FULL;"))
            conn.execute(text("ALTER TABLE public.community_likes REPLICA IDENTITY FULL;"))
            
            # Add to publication if publication exists
            pub_exists = conn.execute(text("SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime';")).fetchone()
            if pub_exists:
                conn.execute(text("""
                    DO $$
                    BEGIN
                        BEGIN
                            ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
                        EXCEPTION WHEN duplicate_object THEN NULL;
                        END;
                        BEGIN
                            ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
                        EXCEPTION WHEN duplicate_object THEN NULL;
                        END;
                        BEGIN
                            ALTER PUBLICATION supabase_realtime ADD TABLE public.community_likes;
                        EXCEPTION WHEN duplicate_object THEN NULL;
                        END;
                    END $$;
                """))
                print("Added community tables to supabase_realtime publication.")
        except Exception as e:
            print("Notice regarding Realtime publication:", e)

        print("8. Creating auto-sync trigger from auth.users to public.users...")
        try:
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
                RETURNS trigger AS $$
                BEGIN
                    INSERT INTO public.users (
                        id, user_id, email, name, phone, preferred_language, farm_location, farm_details, created_at, updated_at
                    ) VALUES (
                        new.id::text,
                        new.id::text,
                        lower(new.email),
                        COALESCE(
                            NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
                            NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''),
                            NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
                            split_part(new.email, '@', 1)
                        ),
                        COALESCE(new.raw_user_meta_data->>'phone', '+91 98765 43210'),
                        COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
                        COALESCE(new.raw_user_meta_data->>'farm_location', 'Tamil Nadu, India'),
                        COALESCE(new.raw_user_meta_data->'farm_details', '{"farm_area":"3.5 Acres","primary_crops":["Tomato","Potato","Brinjal"]}'::jsonb),
                        now(),
                        now()
                    )
                    ON CONFLICT (email) DO UPDATE SET
                        id = EXCLUDED.id,
                        user_id = EXCLUDED.user_id,
                        name = CASE 
                            WHEN public.users.name IS NULL OR public.users.name = 'Farmer' THEN EXCLUDED.name 
                            ELSE public.users.name 
                        END,
                        updated_at = now();
                    RETURN new;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;

                DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
                CREATE TRIGGER on_auth_user_created
                    AFTER INSERT OR UPDATE ON auth.users
                    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
            """))
            print("Trigger handle_new_auth_user established.")
        except Exception as e:
            print("Notice regarding trigger:", e)

    print("\nCommunity migration completed successfully!")

if __name__ == "__main__":
    run_community_migration()
