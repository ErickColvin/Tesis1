import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listUsers, updateRole, updatePermissions } from '../controllers/admin.controller.js';
const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateRole);
router.patch('/users/:id/permissions', updatePermissions);
export default router;
