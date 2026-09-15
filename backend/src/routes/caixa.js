import express from 'express';
import { listar, resumoSaldo, transacaoManual, vendaProduto, compraProduto, servicoCheckout, detalhar, comprovante } from '../controllers/caixaController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/', listar);
router.get('/saldo/resumo', resumoSaldo);
router.post('/transacao', transacaoManual);
router.post('/venda-produto', vendaProduto);
router.post('/compra-produto', compraProduto);
router.post('/servico-checkout', servicoCheckout);
router.get('/:id', detalhar);
router.get('/:id/comprovante', comprovante);

export default router;
