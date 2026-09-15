import express from 'express';
import { listar, pagar, resumoPorProfissional } from '../controllers/comissaoController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.get('/resumo', resumoPorProfissional);
router.put('/:id/pagar', pagar);

export default router;
