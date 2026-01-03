/**
 * Category Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';

export const categoryRoutes = Router();

interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  parentId?: string;
  image?: string;
  order: number;
  isActive: boolean;
}

const categories = new Map<string, Category>();

// Initialize with sample categories
const sampleCategories: Category[] = [
  { id: 'cat-001', nameEn: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', order: 1, isActive: true },
  { id: 'cat-002', nameEn: 'Fashion', nameAr: 'أزياء', slug: 'fashion', order: 2, isActive: true },
  { id: 'cat-003', nameEn: 'Home & Garden', nameAr: 'المنزل والحديقة', slug: 'home-garden', order: 3, isActive: true },
  { id: 'cat-004', nameEn: 'Sports', nameAr: 'رياضة', slug: 'sports', order: 4, isActive: true }
];
sampleCategories.forEach(c => categories.set(c.id, c));

// GET /api/categories
categoryRoutes.get('/', (req, res) => {
  const categoryList = Array.from(categories.values())
    .filter(c => c.isActive)
    .sort((a, b) => a.order - b.order);

  res.json({ categories: categoryList });
});

// GET /api/categories/:id
categoryRoutes.get('/:id', (req, res) => {
  const category = categories.get(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ category });
});

// POST /api/categories
categoryRoutes.post('/', (req, res) => {
  const { nameEn, nameAr, slug, parentId, image, order } = req.body;

  const category: Category = {
    id: nanoid(),
    nameEn,
    nameAr,
    slug,
    parentId,
    image,
    order: order || categories.size + 1,
    isActive: true
  };

  categories.set(category.id, category);
  res.status(201).json({ category });
});

// PUT /api/categories/:id
categoryRoutes.put('/:id', (req, res) => {
  const category = categories.get(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const updated = { ...category, ...req.body };
  categories.set(req.params.id, updated);
  res.json({ category: updated });
});

// DELETE /api/categories/:id
categoryRoutes.delete('/:id', (req, res) => {
  if (!categories.has(req.params.id)) {
    return res.status(404).json({ error: 'Category not found' });
  }
  categories.delete(req.params.id);
  res.json({ success: true });
});
