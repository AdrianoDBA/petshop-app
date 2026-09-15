import express from 'express';
import { listar, listarBaixoEstoque, listarAVencer, detalhar, criar, atualizar, movimentar, excluir, listarMovimentacoes } from '../controllers/estoqueController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/produtos', listar);
router.get('/produtos/baixo-estoque', listarBaixoEstoque);
router.get('/produtos/a-vencer', listarAVencer);
router.get('/produtos/:id', detalhar);
router.post('/produtos', criar);
router.put('/produtos/:id', atualizar);
router.post('/produtos/:id/movimentar', movimentar);
router.delete('/produtos/:id', excluir);
router.get('/movimentacoes', listarMovimentacoes);

export default router;
