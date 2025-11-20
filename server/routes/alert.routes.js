import express from 'express';
import { listAlerts, resolveAlert } from '../controllers/alert.controller.js';

const router = express.Router();

router.get('/', listAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;

