import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, me } from '../controllers/authController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter com margem adequada para ambientes web e testes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 tentativas
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login a partir deste IP. Por favor, aguarde alguns minutos antes de tentar novamente.'
  }
});

router.post('/login', loginLimiter, login);
router.get('/me', autenticar, me);

export default router;
