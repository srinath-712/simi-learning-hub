-- =============================================================================
-- Simi Learning Hub — Production Database Schema & Setup
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- =============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Plans table
create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10,2) default 0,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Insert default Free plan if not present
insert into public.plans (name, price, description)
values ('Free', 0, 'Default free access plan')
on conflict do nothing;

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('head', 'tutor', 'member')),
  approval_status text not null default 'approved' check (approval_status in ('approved', 'pending', 'rejected')),
  plan_id uuid references public.plans(id),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'unpaid', 'pending')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects table (Courses)
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  color_theme text default '#6366f1',
  order_index integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Content table (Videos, PDFs, Notes, YouTube, Instagram)
create table if not exists public.content (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid references public.subjects(id) on delete cascade,
  type text not null check (type in ('notes', 'video', 'youtube', 'instagram')),
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_path text,   -- Storage path: "{subject_id}/{content_id}/{sanitized_filename}"
  file_size bigint,
  external_url text,
  is_published boolean default false,
  is_pinned boolean default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Member progress
create table if not exists public.member_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  content_id uuid references public.content(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(user_id, content_id)
);

-- =============================================================================
-- TRIGGERS & AUTOMATION
-- =============================================================================

-- Auto-create profile on auth signup with Role & Head approval handling
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
  initial_status text;
  free_plan_id uuid;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'member');
  
  -- Tutors start as pending until Head approves them. Members and Head start as approved.
  if requested_role = 'tutor' then
    initial_status := 'pending';
  else
    initial_status := 'approved';
  end if;

  select id into free_plan_id from public.plans where name = 'Free' limit 1;

  insert into public.profiles (id, email, name, role, approval_status, plan_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    requested_role,
    initial_status,
    free_plan_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-refresh updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();

drop trigger if exists content_updated_at on public.content;
create trigger content_updated_at before update on public.content
  for each row execute procedure public.update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.content enable row level security;
alter table public.plans enable row level security;
alter table public.member_progress enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile name" on public.profiles;
create policy "Users can update own profile name" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Head and Tutors can view all profiles" on public.profiles;
create policy "Head and Tutors can view all profiles" on public.profiles for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'head' or (role = 'tutor' and approval_status = 'approved'))
  )
);

drop policy if exists "Head can update any profile" on public.profiles;
create policy "Head can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'head')
);

-- Subjects Policies (Courses)
drop policy if exists "Authenticated users can view subjects" on public.subjects;
create policy "Authenticated users can view subjects" on public.subjects for select using (auth.role() = 'authenticated');

drop policy if exists "Head and Approved Tutors can manage subjects" on public.subjects;
create policy "Head and Approved Tutors can manage subjects" on public.subjects for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'head' or (role = 'tutor' and approval_status = 'approved'))
  )
);

-- Content Policies (Videos, Notes, PDFs)
drop policy if exists "Members view published content" on public.content;
create policy "Members view published content" on public.content for select using (
  is_published = true and auth.role() = 'authenticated'
);

drop policy if exists "Head and Approved Tutors manage content" on public.content;
create policy "Head and Approved Tutors manage content" on public.content for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'head' or (role = 'tutor' and approval_status = 'approved'))
  )
);

-- Plans Policies
drop policy if exists "Authenticated users view plans" on public.plans;
create policy "Authenticated users view plans" on public.plans for select using (auth.role() = 'authenticated');

-- Member Progress Policies
drop policy if exists "Users manage own progress" on public.member_progress;
create policy "Users manage own progress" on public.member_progress for all using (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage → Buckets)
-- =============================================================================
-- Create 'notes' (Public) and 'videos' (Public or Authenticated) buckets:

insert into storage.buckets (id, name, public)
values ('notes', 'notes', true), ('videos', 'videos', true)
on conflict (id) do update set public = true;

-- Storage Policies for 'notes' and 'videos' buckets
drop policy if exists "Public access to notes" on storage.objects;
create policy "Public access to notes" on storage.objects for select using (bucket_id = 'notes' or bucket_id = 'videos');

drop policy if exists "Head and Tutors upload storage" on storage.objects;
create policy "Head and Tutors upload storage" on storage.objects for insert with check (
  (bucket_id = 'notes' or bucket_id = 'videos') and
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'head' or (role = 'tutor' and approval_status = 'approved'))
  )
);

drop policy if exists "Head and Tutors delete storage" on storage.objects;
create policy "Head and Tutors delete storage" on storage.objects for delete using (
  (bucket_id = 'notes' or bucket_id = 'videos') and
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'head' or (role = 'tutor' and approval_status = 'approved'))
  )
);

-- =============================================================================
-- HEAD ADMIN SEED ACCOUNT: simi2suns@gmail.com / password12345678
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- =============================================================================

create extension if not exists "pgcrypto";

DO $$
DECLARE
  new_user_id uuid := uuid_generate_v4();
BEGIN
  -- 1. Insert into auth.users if not already created
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'simi2suns@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'simi2suns@gmail.com',
      crypt('password12345678', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Head Admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 2. Create or update profile as Head Admin
  INSERT INTO public.profiles (id, email, name, role, approval_status, updated_at)
  SELECT id, email, 'Head Admin', 'head', 'approved', now()
  FROM auth.users
  WHERE email = 'simi2suns@gmail.com'
  ON CONFLICT (id) DO UPDATE 
  SET role = 'head', approval_status = 'approved', name = 'Head Admin';
END $$;
