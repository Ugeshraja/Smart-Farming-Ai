import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_engine
from sqlalchemy import text

eng = get_engine()
with eng.connect() as conn:
    tables = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'auth') ORDER BY table_schema, table_name;")).fetchall()
    print("=== Tables in DB ===")
    for t in tables:
        print(f"{t[0]}.{t[1]}")
    
    print("\n=== Public Users in DB ===")
    users = conn.execute(text("SELECT id, user_id, email, name, created_at FROM public.users;")).fetchall()
    for u in users:
        print(u)

    print("\n=== Auth Users in DB ===")
    auth_users = conn.execute(text("SELECT id, email, raw_user_meta_data, created_at FROM auth.users;")).fetchall()
    for au in auth_users:
        print(au)

    print("\n=== RLS Policies on public tables ===")
    policies = conn.execute(text("SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';")).fetchall()
    for p in policies:
        print(f"Table: {p[1]} | Policy: {p[2]} | Cmd: {p[5]} | Qual: {p[6]}")

    print("\n=== Supabase Realtime Publication ===")
    try:
        pub_tables = conn.execute(text("SELECT pubname, schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';")).fetchall()
        for pt in pub_tables:
            print(f"Pub: {pt[0]} -> {pt[1]}.{pt[2]}")
    except Exception as e:
        print("Realtime pub query notice:", e)
