import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listUsers, updateRole } from '../controllers/admin.controller.js';
const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateRole);
export default router;
