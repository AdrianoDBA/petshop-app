import express from 'express';
import { checarStatus, concluir } from '../controllers/onboardingController.js';

const router = express.Router();

router.get('/status', checarStatus);
router.post('/concluir', concluir);

export default router;
