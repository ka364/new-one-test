-- Migration: Create hierarchy tables with ltree
-- Description: Create scaling_hierarchy table using ltree for efficient hierarchical queries
-- Date: 2025-12-29

-- Create scaling_hierarchy table
CREATE TABLE IF NOT EXISTS scaling_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL UNIQUE,
    parent_path ltree,
    hierarchy_id UUID, -- FK to specific entity (factory_id, merchant_id, etc.)
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN (
        'root', 'factory', 'merchant', 'marketer', 
        'developer', 'employee', 'customer'
    )),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_parent_path CHECK (
        parent_path IS NULL OR hierarchy_path <@ parent_path || text2ltree(ltree2text(hierarchy_path) || '.*')
    )
);

-- Create GIN index for ltree path queries (most important for performance)
CREATE INDEX idx_hierarchy_path_gin ON scaling_hierarchy USING GIN (hierarchy_path);

-- Create GIST index for parent_path queries
CREATE INDEX idx_hierarchy_parent_path_gist ON scaling_hierarchy USING GIST (parent_path);

-- Create BTREE indexes for common queries
CREATE INDEX idx_hierarchy_node_type ON scaling_hierarchy(node_type);
CREATE INDEX idx_hierarchy_is_active ON scaling_hierarchy(is_active);
CREATE INDEX idx_hierarchy_code ON scaling_hierarchy(code) WHERE code IS NOT NULL;
CREATE INDEX idx_hierarchy_hierarchy_id ON scaling_hierarchy(hierarchy_id) WHERE hierarchy_id IS NOT NULL;

-- Create composite index for common filtered queries
CREATE INDEX idx_hierarchy_type_active ON scaling_hierarchy(node_type, is_active);

-- Create index for metadata JSONB queries
CREATE INDEX idx_hierarchy_metadata_gin ON scaling_hierarchy USING GIN (metadata);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hierarchy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hierarchy_updated_at
    BEFORE UPDATE ON scaling_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

-- Create function to get all descendants
CREATE OR REPLACE FUNCTION get_hierarchy_descendants(path_param ltree)
RETURNS TABLE (
    id UUID,
    hierarchy_path ltree,
    parent_path ltree,
    node_type VARCHAR,
    name VARCHAR,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.hierarchy_path,
        h.parent_path,
        h.node_type,
        h.name,
        nlevel(h.hierarchy_path) - nlevel(path_param) as depth
    FROM scaling_hierarchy h
    WHERE h.hierarchy_path <@ path_param
    AND h.hierarchy_path != path_param
    ORDER BY h.hierarchy_path;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all ancestors
CREATE OR REPLACE FUNCTION get_hierarchy_ancestors(path_param ltree)
RETURNS TABLE (
    id UUID,
    hierarchy_path ltree,
    parent_path ltree,
    node_type VARCHAR,
    name VARCHAR,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.hierarchy_path,
        h.parent_path,
        h.node_type,
        h.name,
        nlevel(path_param) - nlevel(h.hierarchy_path) as depth
    FROM scaling_hierarchy h
    WHERE path_param <@ h.hierarchy_path
    AND h.hierarchy_path != path_param
    ORDER BY h.hierarchy_path;
END;
$$ LANGUAGE plpgsql;

-- Create function to get direct children
CREATE OR REPLACE FUNCTION get_hierarchy_children(path_param ltree)
RETURNS TABLE (
    id UUID,
    hierarchy_path ltree,
    parent_path ltree,
    node_type VARCHAR,
    name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.hierarchy_path,
        h.parent_path,
        h.node_type,
        h.name
    FROM scaling_hierarchy h
    WHERE h.parent_path = path_param
    ORDER BY h.hierarchy_path;
END;
$$ LANGUAGE plpgsql;

-- Insert root node
INSERT INTO scaling_hierarchy (
    hierarchy_path,
    parent_path,
    node_type,
    name,
    code,
    description,
    is_active
) VALUES (
    '1'::ltree,
    NULL,
    'root',
    'الجذر',
    'ROOT',
    'العقدة الجذرية لنظام التوسع 7×7',
    true
) ON CONFLICT (hierarchy_path) DO NOTHING;

-- Add comments
COMMENT ON TABLE scaling_hierarchy IS 'Hierarchical structure for 7x7 scaling system using ltree';
COMMENT ON COLUMN scaling_hierarchy.hierarchy_path IS 'ltree path for efficient hierarchical queries (e.g., 1.3.5)';
COMMENT ON COLUMN scaling_hierarchy.parent_path IS 'ltree path of parent node';
COMMENT ON COLUMN scaling_hierarchy.hierarchy_id IS 'Foreign key to specific entity table';
COMMENT ON COLUMN scaling_hierarchy.metadata IS 'JSONB field for flexible entity-specific data';
COMMENT ON INDEX idx_hierarchy_path_gin IS 'GIN index for fast descendant/ancestor queries';
COMMENT ON INDEX idx_hierarchy_parent_path_gist IS 'GIST index for parent path queries';
