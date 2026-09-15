import express from 'express';
import { listar, executar, salvarConfiguracao, baixar } from '../controllers/backupController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = express.Router();

router.use(autenticar);
// Apenas perfis administrativos podem gerenciar backups
router.use(autorizar('admin'));

router.get('/', listar);
router.post('/executar', executar);
router.post('/configurar', salvarConfiguracao);
router.get('/download/:arquivo', baixar);

export default router;
