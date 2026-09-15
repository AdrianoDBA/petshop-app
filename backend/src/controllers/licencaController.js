import { obterStatusLicenca, ativarLicenca } from '../services/licenseService.js';

export async function status(req, res) {
  try {
    const licenca = await obterStatusLicenca();
    res.json(licenca);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar status da licença' });
  }
}

export async function ativar(req, res) {
  const { chave } = req.body;
  if (!chave || typeof chave !== 'string') {
    return res.status(400).json({ error: 'Chave de ativação é obrigatória.' });
  }

  try {
    const novaLicenca = await ativarLicenca(chave);
    res.json({
      message: 'Licença ativada com sucesso!',
      licenca: novaLicenca
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Chave de licença inválida' });
  }
}

/**
 * Middleware para bloquear operações de criação/alteração caso a licença esteja expirada
 */
export async function bloquearSeLicencaExpirada(req, res, next) {
  // Rotas de consulta GET ou rota de ativação de licença são sempre permitidas
  if (req.method === 'GET' || req.path.includes('/licenca') || req.path.includes('/auth')) {
    return next();
  }

  try {
    const statusLicenca = await obterStatusLicenca();
    if (statusLicenca.expirada) {
      return res.status(403).json({
        error: 'Sua licença do PetShop Pro expirou. Por favor, renove ou insira uma nova chave para continuar registrando novas movimentações.',
        licenca: statusLicenca
      });
    }
    next();
  } catch (err) {
    next();
  }
}
