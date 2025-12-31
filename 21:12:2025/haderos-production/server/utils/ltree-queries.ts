/**
 * ltree Query Utilities
 * 
 * Helper functions for working with PostgreSQL ltree hierarchical paths
 * Provides type-safe wrappers around ltree operators and common queries
 */

import { sql, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

/**
 * ltree Operators
 */
export const LTreeOperators = {
  /**
   * Check if path1 is an ancestor of path2 (path2 <@ path1)
   * Example: '1.3' <@ '1' => true
   */
  isDescendantOf: (pathColumn: PgColumn, ancestorPath: string): SQL => {
    return sql`${pathColumn} <@ ${ancestorPath}::ltree`;
  },

  /**
   * Check if path1 is a descendant of path2 (path1 @> path2)
   * Example: '1' @> '1.3' => true
   */
  isAncestorOf: (pathColumn: PgColumn, descendantPath: string): SQL => {
    return sql`${pathColumn} @> ${descendantPath}::ltree`;
  },

  /**
   * Match path against lquery pattern
   * Example: '1.3.5' ~ '1.*.5' => true
   */
  matches: (pathColumn: PgColumn, pattern: string): SQL => {
    return sql`${pathColumn} ~ ${pattern}::lquery`;
  },

  /**
   * Get all descendants (including self)
   * Example: WHERE hierarchy_path <@ '1.3'
   */
  getAllDescendants: (pathColumn: PgColumn, path: string): SQL => {
    return sql`${pathColumn} <@ ${path}::ltree`;
  },

  /**
   * Get all ancestors (including self)
   * Example: WHERE '1.3.5' <@ hierarchy_path
   */
  getAllAncestors: (pathColumn: PgColumn, path: string): SQL => {
    return sql`${path}::ltree <@ ${pathColumn}`;
  },

  /**
   * Get direct children only
   * Example: WHERE parent_path = '1.3'
   */
  getDirectChildren: (parentPathColumn: PgColumn, path: string): SQL => {
    return sql`${parentPathColumn} = ${path}::ltree`;
  },

  /**
   * Get path depth (number of levels)
   * Example: nlevel('1.3.5') => 3
   */
  getDepth: (pathColumn: PgColumn): SQL => {
    return sql`nlevel(${pathColumn})`;
  },

  /**
   * Get subpath (slice of path)
   * Example: subpath('1.3.5.7', 1, 2) => '3.5'
   */
  getSubpath: (pathColumn: PgColumn, start: number, end?: number): SQL => {
    if (end !== undefined) {
      return sql`subpath(${pathColumn}, ${start}, ${end})`;
    }
    return sql`subpath(${pathColumn}, ${start})`;
  },

  /**
   * Get parent path
   * Example: subpath('1.3.5', 0, -1) => '1.3'
   */
  getParentPath: (pathColumn: PgColumn): SQL => {
    return sql`subpath(${pathColumn}, 0, -1)`;
  },

  /**
   * Concatenate paths
   * Example: '1.3' || '5.7' => '1.3.5.7'
   */
  concat: (path1: string, path2: string): SQL => {
    return sql`${path1}::ltree || ${path2}::ltree`;
  },
};

/**
 * Common ltree Queries
 */
export const LTreeQueries = {
  /**
   * Get all descendants with their depth relative to the root path
   */
  getDescendantsWithDepth: (
    pathColumn: PgColumn,
    rootPath: string
  ): SQL => {
    return sql`
      ${pathColumn} <@ ${rootPath}::ltree
      AND ${pathColumn} != ${rootPath}::ltree
    `;
  },

  /**
   * Get descendants up to a certain depth
   */
  getDescendantsToDepth: (
    pathColumn: PgColumn,
    rootPath: string,
    maxDepth: number
  ): SQL => {
    const rootDepth = rootPath.split('.').length;
    const targetDepth = rootDepth + maxDepth;
    return sql`
      ${pathColumn} <@ ${rootPath}::ltree
      AND nlevel(${pathColumn}) <= ${targetDepth}
    `;
  },

  /**
   * Get only leaf nodes (nodes with no children)
   * Requires a subquery or join
   */
  isLeafNode: (
    pathColumn: PgColumn,
    tableName: string
  ): SQL => {
    return sql`
      NOT EXISTS (
        SELECT 1 FROM ${sql.identifier(tableName)} child
        WHERE child.parent_path = ${pathColumn}
      )
    `;
  },

  /**
   * Calculate relative depth from root
   */
  calculateRelativeDepth: (
    pathColumn: PgColumn,
    rootPath: string
  ): SQL => {
    return sql`nlevel(${pathColumn}) - nlevel(${rootPath}::ltree)`;
  },

  /**
   * Get siblings (nodes with same parent)
   */
  getSiblings: (
    pathColumn: PgColumn,
    parentPathColumn: PgColumn,
    currentPath: string
  ): SQL => {
    const parentPath = currentPath.split('.').slice(0, -1).join('.');
    return sql`
      ${parentPathColumn} = ${parentPath}::ltree
      AND ${pathColumn} != ${currentPath}::ltree
    `;
  },
};

/**
 * ltree Path Utilities
 */
export const LTreePath = {
  /**
   * Parse ltree path into array of labels
   */
  parse: (path: string): string[] => {
    return path.split('.');
  },

  /**
   * Build ltree path from array of labels
   */
  build: (labels: string[]): string => {
    return labels.join('.');
  },

  /**
   * Get parent path
   */
  getParent: (path: string): string | null => {
    const parts = path.split('.');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('.');
  },

  /**
   * Get depth (number of levels)
   */
  getDepth: (path: string): number => {
    return path.split('.').length;
  },

  /**
   * Check if path1 is ancestor of path2
   */
  isAncestorOf: (ancestorPath: string, descendantPath: string): boolean => {
    return descendantPath.startsWith(ancestorPath + '.');
  },

  /**
   * Check if path1 is descendant of path2
   */
  isDescendantOf: (descendantPath: string, ancestorPath: string): boolean => {
    return descendantPath.startsWith(ancestorPath + '.');
  },

  /**
   * Get all ancestor paths
   */
  getAncestors: (path: string): string[] => {
    const parts = path.split('.');
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      ancestors.push(parts.slice(0, i).join('.'));
    }
    return ancestors;
  },

  /**
   * Append child to path
   */
  appendChild: (parentPath: string, childLabel: string): string => {
    return `${parentPath}.${childLabel}`;
  },

  /**
   * Validate ltree path format
   */
  isValid: (path: string): boolean => {
    // ltree labels must be alphanumeric or underscore, max 255 chars per label
    const labelRegex = /^[A-Za-z0-9_]{1,255}$/;
    const parts = path.split('.');
    return parts.length > 0 && parts.every(part => labelRegex.test(part));
  },

  /**
   * Generate next sibling path
   * Example: '1.3' => '1.4'
   */
  getNextSibling: (path: string): string => {
    const parts = path.split('.');
    const lastPart = parseInt(parts[parts.length - 1]);
    parts[parts.length - 1] = (lastPart + 1).toString();
    return parts.join('.');
  },

  /**
   * Get common ancestor of two paths
   */
  getCommonAncestor: (path1: string, path2: string): string | null => {
    const parts1 = path1.split('.');
    const parts2 = path2.split('.');
    const commonParts: string[] = [];
    
    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        commonParts.push(parts1[i]);
      } else {
        break;
      }
    }
    
    return commonParts.length > 0 ? commonParts.join('.') : null;
  },
};

/**
 * Aggregation Helpers for ltree hierarchies
 */
export const LTreeAggregation = {
  /**
   * Sum values for all descendants
   */
  sumDescendants: (
    valueColumn: PgColumn,
    pathColumn: PgColumn,
    rootPath: string
  ): SQL => {
    return sql`
      SUM(CASE 
        WHEN ${pathColumn} <@ ${rootPath}::ltree 
        THEN ${valueColumn} 
        ELSE 0 
      END)
    `;
  },

  /**
   * Count descendants
   */
  countDescendants: (
    pathColumn: PgColumn,
    rootPath: string
  ): SQL => {
    return sql`
      COUNT(CASE 
        WHEN ${pathColumn} <@ ${rootPath}::ltree 
          AND ${pathColumn} != ${rootPath}::ltree
        THEN 1 
      END)
    `;
  },

  /**
   * Group by depth level
   */
  groupByDepth: (pathColumn: PgColumn): SQL => {
    return sql`nlevel(${pathColumn})`;
  },

  /**
   * Group by parent
   */
  groupByParent: (pathColumn: PgColumn): SQL => {
    return sql`subpath(${pathColumn}, 0, -1)`;
  },
};

/**
 * Type definitions
 */
export interface HierarchyNode {
  id: string;
  hierarchyPath: string;
  parentPath: string | null;
  name: string;
  nodeType: string;
  depth: number;
}

export interface HierarchyTreeNode extends HierarchyNode {
  children: HierarchyTreeNode[];
}

/**
 * Build tree structure from flat list of nodes
 */
export function buildHierarchyTree(
  nodes: HierarchyNode[]
): HierarchyTreeNode[] {
  const nodeMap = new Map<string, HierarchyTreeNode>();
  const rootNodes: HierarchyTreeNode[] = [];

  // Create map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.hierarchyPath, { ...node, children: [] });
  });

  // Build tree structure
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.hierarchyPath)!;
    if (node.parentPath && nodeMap.has(node.parentPath)) {
      const parent = nodeMap.get(node.parentPath)!;
      parent.children.push(treeNode);
    } else {
      rootNodes.push(treeNode);
    }
  });

  return rootNodes;
}

/**
 * Flatten tree structure to list
 */
export function flattenHierarchyTree(
  tree: HierarchyTreeNode[]
): HierarchyNode[] {
  const result: HierarchyNode[] = [];
  
  function traverse(node: HierarchyTreeNode) {
    const { children, ...nodeData } = node;
    result.push(nodeData);
    children.forEach(traverse);
  }
  
  tree.forEach(traverse);
  return result;
}

/**
 * Example usage:
 * 
 * // Get all descendants
 * const descendants = await db.select()
 *   .from(scalingHierarchy)
 *   .where(LTreeOperators.isDescendantOf(scalingHierarchy.hierarchyPath, '1.3'));
 * 
 * // Get descendants up to depth 2
 * const limitedDescendants = await db.select()
 *   .from(scalingHierarchy)
 *   .where(LTreeQueries.getDescendantsToDepth(scalingHierarchy.hierarchyPath, '1.3', 2));
 * 
 * // Sum expenses for all descendants
 * const totalExpenses = await db.select({
 *   total: LTreeAggregation.sumDescendants(expenses.amount, expenses.hierarchyPath, '1.3')
 * }).from(expenses);
 */
