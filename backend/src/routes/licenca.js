import express from 'express';
import { status, ativar } from '../controllers/licencaController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = express.Router();

// A consulta de status pode ser feita sem auth ou com auth para exibir no login/onboarding
router.get('/', status);

// Apenas admin pode ativar/trocar licença no painel, ou liberado durante o setup
router.post('/ativar', ativar);

export default router;
