import express from 'express';
import { listar, criar, detalhar } from '../controllers/prontuarioController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.post('/', autorizar('admin', 'gerente', 'veterinario'), criar);
router.get('/:id', detalhar);

export default router;
