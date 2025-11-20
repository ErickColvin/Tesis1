import express from 'express';
import { createProducts, listProducts, updateProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.post('/', createProducts);
router.get('/', listProducts);
router.patch('/:sku', updateProduct);

export default router;

