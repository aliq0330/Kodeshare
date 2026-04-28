-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS article_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id     uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title          text NOT NULL DEFAULT '',
  subtitle       text NOT NULL DEFAULT '',
  cover_image    text,
  blocks         jsonb NOT NULL DEFAULT '[]',
  label          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_versions_article_idx
  ON article_versions(article_id, created_at DESC);

ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON article_versions
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "owner_insert" ON article_versions
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "owner_delete" ON article_versions
  FOR DELETE USING (author_id = auth.uid());
