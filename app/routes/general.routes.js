import express from 'express';

import { testApp } from '../controllers/general.controller.js';

const router = express.Router();

// Main Path Info
router.get('/', testApp);

export default router;
