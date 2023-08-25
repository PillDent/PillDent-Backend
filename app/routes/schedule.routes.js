import express from 'express';

import {
  addSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller.js';

import { authMiddleware } from '../middlewares/authentication.middlewares.js';

const router = express.Router();

router.get('/schedule/:username', authMiddleware, getSchedule);
router.post('/schedule/:username', authMiddleware, addSchedule);
router.put('/schedule/:username/:scheduleId', authMiddleware, updateSchedule);

router.delete(
  '/schedule/:username/:scheduleId',
  authMiddleware,
  deleteSchedule
);

export default router;
