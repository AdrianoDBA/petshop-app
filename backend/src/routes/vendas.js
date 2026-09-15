import express from 'express';
import { listar, detalhar, criar, comprovante } from '../controllers/vendaController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.get('/:id', detalhar);
router.post('/', criar);
router.get('/:id/comprovante', comprovante);

export default router;
