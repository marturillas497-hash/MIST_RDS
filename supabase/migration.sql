-- ============================================================
-- MIST-RDS Supabase Migration
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLES
-- ============================================================

-- departments (seed reference table)
CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- profiles (one per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'research_adviser', 'student')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- student_metadata
CREATE TABLE IF NOT EXISTS public.student_metadata (
  profile_id  uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_number   text UNIQUE,
  adviser_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  year_level  text,
  section     text
);

-- abstracts (institutional research library)
CREATE TABLE IF NOT EXISTS public.abstracts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL UNIQUE,
  abstract_text text NOT NULL,
  authors       text,
  year          integer,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  accession_id  text UNIQUE,
  embedding     vector(384),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- similarity_reports
CREATE TABLE IF NOT EXISTS public.similarity_reports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  adviser_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  input_title        text NOT NULL,
  input_description  text NOT NULL,
  similarity_score   float8 NOT NULL DEFAULT 0,
  risk_level         text NOT NULL DEFAULT 'GREEN' CHECK (risk_level IN ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  ai_recommendations text,
  results_json       jsonb,
  status             text NOT NULL DEFAULT 'pending',
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- abstract_views
CREATE TABLE IF NOT EXISTS public.abstract_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abstract_id uuid NOT NULL REFERENCES public.abstracts(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS abstracts_embedding_idx
  ON public.abstracts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS similarity_reports_student_id_idx
  ON public.similarity_reports(student_id);

CREATE INDEX IF NOT EXISTS similarity_reports_adviser_id_idx
  ON public.similarity_reports(adviser_id);

CREATE INDEX IF NOT EXISTS abstract_views_abstract_id_idx
  ON public.abstract_views(abstract_id);

CREATE INDEX IF NOT EXISTS abstract_views_viewer_id_idx
  ON public.abstract_views(viewer_id);

-- ============================================================
-- RPC: match_abstracts
-- Called by /api/analyze to find semantically similar abstracts
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_abstracts(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.0,
  match_count     int   DEFAULT 5
)
RETURNS TABLE (
  id               uuid,
  title            text,
  abstract_text    text,
  authors          text,
  year             integer,
  department_id    uuid,
  accession_id     text,
  similarity       float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    a.id,
    a.title,
    a.abstract_text,
    a.authors,
    a.year,
    a.department_id,
    a.accession_id,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.abstracts a
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abstracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similarity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abstract_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments      ENABLE ROW LEVEL SECURITY;

-- departments: readable by all authenticated users
CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated USING (true);

-- profiles: users can read their own; service role bypasses
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_select_all_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "profiles_select_adviser_students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_metadata sm
      WHERE sm.profile_id = profiles.id
        AND sm.adviser_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'research_adviser')
    )
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- student_metadata
CREATE POLICY "student_metadata_select_own"
  ON public.student_metadata FOR SELECT
  TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY "student_metadata_select_adviser"
  ON public.student_metadata FOR SELECT
  TO authenticated
  USING (adviser_id = auth.uid());

CREATE POLICY "student_metadata_select_admin"
  ON public.student_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "student_metadata_insert_own"
  ON public.student_metadata FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "student_metadata_update_own"
  ON public.student_metadata FOR UPDATE
  TO authenticated USING (auth.uid() = profile_id);

-- abstracts: all authenticated can read, only service role writes
CREATE POLICY "abstracts_select_authenticated"
  ON public.abstracts FOR SELECT
  TO authenticated USING (true);

-- similarity_reports
CREATE POLICY "reports_select_own"
  ON public.similarity_reports FOR SELECT
  TO authenticated USING (student_id = auth.uid());

CREATE POLICY "reports_select_adviser"
  ON public.similarity_reports FOR SELECT
  TO authenticated
  USING (adviser_id = auth.uid());

CREATE POLICY "reports_select_admin"
  ON public.similarity_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "reports_insert_student"
  ON public.similarity_reports FOR INSERT
  TO authenticated WITH CHECK (student_id = auth.uid());

-- abstract_views
CREATE POLICY "views_select_admin"
  ON public.abstract_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "views_insert_student"
  ON public.abstract_views FOR INSERT
  TO authenticated WITH CHECK (viewer_id = auth.uid());

-- ============================================================
-- SEED: DEPARTMENTS
-- ============================================================

INSERT INTO public.departments (code, name) VALUES
  ('BSA',         'Bachelor of Science in Agriculture'),
  ('BSCRIM',      'Bachelor of Science in Criminology'),
  ('BPA',         'Bachelor of Public Administration'),
  ('BSIS',        'Bachelor of Science in Information Systems'),
  ('BSE',         'Bachelor of Science in Entrepreneurship'),
  ('ACT',         'Associate in Computer Technology'),
  ('BS Midwifery','Bachelor of Science in Midwifery')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- DONE
-- Paste your admin user's UUID below and run to create the
-- admin profile (after the admin signs up via /login):
--
-- INSERT INTO public.profiles (id, full_name, role, status)
-- VALUES ('<YOUR_ADMIN_AUTH_UUID>', 'Administrator', 'admin', 'active');
-- ============================================================
