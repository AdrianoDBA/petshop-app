import express from 'express';
import { listar as listarAgendamentos, criar, atualizarStatus, excluir } from '../controllers/agendamentoController.js';
import { listar as listarServicos } from '../controllers/servicoController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listarAgendamentos);
router.get('/servicos', listarServicos);
router.post('/', criar);
router.put('/:id/status', atualizarStatus);
router.delete('/:id', excluir);

export default router;
