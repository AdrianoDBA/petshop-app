import express from 'express';
import { obterInfoPetshop, agendamentoOnline } from '../controllers/publicoController.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/info', obterInfoPetshop);
router.post('/agendar', agendamentoOnline);

export default router;
