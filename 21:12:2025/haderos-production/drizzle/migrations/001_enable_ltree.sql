-- Migration: Enable ltree extension
-- Description: Enable PostgreSQL ltree extension for hierarchical path operations
-- Date: 2025-12-29

-- Enable ltree extension
CREATE EXTENSION IF NOT EXISTS ltree;

-- Verify extension is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'ltree'
    ) THEN
        RAISE EXCEPTION 'ltree extension could not be enabled';
    END IF;
END
$$;

-- Create ltree operator class for GIN index (if not exists)
CREATE INDEX IF NOT EXISTS ltree_ops_idx ON pg_opclass(opcname) WHERE opcname = 'gist_ltree_ops';

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';
