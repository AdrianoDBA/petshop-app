import express from 'express';
import { dashboard, faturamento, servicosMaisRealizados, clientesTop, produtosMaisVendidos, taxaRetencaoClientes } from '../controllers/relatoriosController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();
router.use(autenticar);

router.get('/dashboard', dashboard);
router.get('/faturamento', faturamento);
router.get('/servicos-mais-realizados', servicosMaisRealizados);
router.get('/clientes-top', clientesTop);
router.get('/produtos-mais-vendidos', produtosMaisVendidos);
router.get('/taxa-retencao', taxaRetencaoClientes);

export default router;
