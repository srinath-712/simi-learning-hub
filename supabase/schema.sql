-- =============================================================================
-- Simi Learning Hub — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Plans table
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10,2) default 0,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Insert default Free plan
insert into public.plans (name, price, description) values ('Free', 0, 'Default free access plan');

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('tutor', 'member')),
  plan_id uuid references public.plans(id) default (select id from public.plans where name = 'Free' limit 1),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'unpaid', 'pending')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects table
create table public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  color_theme text default '#6366f1',
  order_index integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Content table
create table public.content (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid references public.subjects(id) on delete cascade,
  type text not null check (type in ('notes', 'video', 'youtube', 'instagram')),
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_path text,   -- bucket-relative: "{subject_id}/{content_id}/{sanitized_filename}"
  file_size bigint,
  external_url text,
  is_published boolean default false,
  is_pinned boolean default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Member progress (v1.1 blueprint — table exists, not used in MVP UI)
create table public.member_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  content_id uuid references public.content(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(user_id, content_id)
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at auto-refresh
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();
create trigger content_updated_at before update on public.content
  for each row execute procedure public.update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.content enable row level security;
alter table public.plans enable row level security;
alter table public.member_progress enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own name/avatar" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Tutors can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);
create policy "Tutors can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);

-- Subjects
create policy "Anyone authenticated can view subjects" on public.subjects for select using (auth.role() = 'authenticated');
create policy "Tutors can manage subjects" on public.subjects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);

-- Content
create policy "Members see published content" on public.content for select using (
  is_published = true and auth.role() = 'authenticated'
);
create policy "Tutors see all content" on public.content for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);
create policy "Tutors can manage content" on public.content for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);

-- Plans
create policy "Anyone authenticated can view plans" on public.plans for select using (auth.role() = 'authenticated');
create policy "Tutors can manage plans" on public.plans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);

-- Member progress
create policy "Users can view own progress" on public.member_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.member_progress for insert with check (auth.uid() = user_id);
create policy "Tutors can view all progress" on public.member_progress for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
);

-- =============================================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage → New Bucket)
-- Or execute via Supabase Management API:
-- =============================================================================
-- insert into storage.buckets (id, name, public) values ('notes', 'notes', true);
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
--
-- Storage policies (set via Dashboard → Storage → Policies):
--   notes: authenticated users can read, tutors can insert/update/delete
--   videos: authenticated users can read, tutors can insert/update/delete
