-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS project_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title          text NOT NULL DEFAULT '',
  files          jsonb NOT NULL DEFAULT '[]',
  label          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_versions_project_idx
  ON project_versions(project_id, created_at DESC);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON project_versions
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "owner_insert" ON project_versions
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "owner_delete" ON project_versions
  FOR DELETE USING (author_id = auth.uid());
