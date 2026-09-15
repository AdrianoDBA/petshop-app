import express from 'express';
import { listarHistorico, gerarLembretesAmanha, registrarEnvio, resumoStats } from '../controllers/whatsappController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/historico', listarHistorico);
router.get('/lembretes-amanha', gerarLembretesAmanha);
router.post('/registrar-envio', registrarEnvio);
router.get('/stats', resumoStats);

export default router;
