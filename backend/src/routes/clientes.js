import express from 'express';
import { listar, detalhar, criar, atualizar, excluir } from '../controllers/clienteController.js';
import { autenticar } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
router.use(autenticar);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

router.get('/', listar);
router.get('/:id', detalhar);
router.post('/', [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('cpf').optional({ nullable: true }).isString().withMessage('CPF deve ser uma string'),
  body('rg').optional({ nullable: true }).isString().withMessage('RG deve ser uma string'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Email inválido'),
  body('cep').optional({ nullable: true }).isString().withMessage('CEP deve ser uma string')
], validate, criar);
router.put('/:id', [
  param('id').isInt().withMessage('ID inválido'),
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('cpf').optional({ nullable: true }).isString().withMessage('CPF deve ser uma string'),
  body('rg').optional({ nullable: true }).isString().withMessage('RG deve ser uma string'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Email inválido'),
  body('cep').optional({ nullable: true }).isString().withMessage('CEP deve ser uma string')
], validate, atualizar);
router.delete('/:id', excluir);

export default router;
