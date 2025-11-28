import express from 'express';
import { createProducts, listProducts, updateProduct } from '../controllers/product.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', requireAdmin, createProducts);
router.get('/', listProducts);
router.patch('/:sku', requireAdmin, updateProduct);

export default router;
