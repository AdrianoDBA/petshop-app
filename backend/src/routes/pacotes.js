import express from 'express';
import { listar, criar, listarAssinaturas, venderPacote, debitarSessao } from '../controllers/pacoteController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.post('/', criar);
router.get('/assinaturas', listarAssinaturas);
router.post('/vender', venderPacote);
router.post('/assinaturas/:id/debitar', debitarSessao);

export default router;
