import express from 'express';
import { listar, criar, atualizar, excluir } from '../controllers/usuarioController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', autorizar('admin'), listar);
router.post('/', autorizar('admin'), criar);
router.put('/:id', autorizar('admin'), atualizar);
router.delete('/:id', autorizar('admin'), excluir);

export default router;
