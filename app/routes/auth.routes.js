import express from 'express';
// import { authMiddleware } from '../middlewares/authentication.middlewares.js';

import {
  login,
  register,
  logout,
  forgetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

// Register router
router.post('/register', register);

// Login router
router.post('/login', login);

// Forget Password router
router.post('/password-reset', forgetPassword);

// Logout router
router.post('/logout', logout);

export default router;
