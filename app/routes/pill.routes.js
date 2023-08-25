import express from 'express';

import {
  getHomeData,
  searchPill,
  getAllCategories,
  getPillById,
} from '../controllers/pill.controller.js';

const router = express.Router();

router.get('/home', getHomeData);
router.get('/search', searchPill);
router.get('/category', getAllCategories);
router.get('/pills/:pillId', getPillById);

export default router;
