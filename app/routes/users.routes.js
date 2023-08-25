import express from 'express';
import { authMiddleware } from '../middlewares/authentication.middlewares.js';

import {
  getUserProfile,
  updateProfile,
  deleteUserById,
} from '../controllers/users.controller.js';

const router = express.Router();

// Profile User Routes
router.get('/:username/profile', authMiddleware, getUserProfile);
router.put('/:username/profile', authMiddleware, updateProfile);
router.delete('/users/:username/profile', authMiddleware, deleteUserById);

export default router;
