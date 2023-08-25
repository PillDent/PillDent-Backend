import express from 'express';

import {
  getHomeData,
  searchPill,
  getAllCategories,
  getPillById,
  scanPill,
} from '../controllers/pill.controller.js';

import { authMiddleware } from '../middlewares/authentication.middlewares.js';

const router = express.Router();

router.get('/home', getHomeData);
router.get('/search', searchPill);
router.get('/category', getAllCategories);
router.get('/pills/:pillId', getPillById);
router.post('/piils/:username/', authMiddleware, scanPill);

export default router;
