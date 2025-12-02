// Rutas de alertas: lectura publica y configuracion/resolve para admins.
import express from 'express';
import {
  listAlerts,
  resolveAlert,
  getAlertConfig,
  updateAlertConfig,
  alertFeed
} from '../controllers/alert.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listAlerts);
router.get('/feed', requireAuth, alertFeed);
router.get('/config', requireAuth, requireAdmin, getAlertConfig);
router.put('/config', requireAuth, requireAdmin, updateAlertConfig);
router.patch('/:id/resolve', requireAuth, requireAdmin, resolveAlert);

export default router;




