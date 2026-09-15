import express from 'express';
import { listar, detalhar, criar, atualizar, excluir, checkin, checkout } from '../controllers/petController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.get('/:id', detalhar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);
router.post('/:id/checkin', checkin);
router.post('/:id/checkout', checkout);

export default router;
