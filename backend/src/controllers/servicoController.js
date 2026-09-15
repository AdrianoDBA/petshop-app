import { Servico } from '../models/index.js';

export async function listar(req, res) {
  try {
    const servicos = await Servico.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });
    // Formata o preco_base como preco para manter compatibilidade com o frontend
    const formatados = servicos.map(s => {
      const sJson = s.toJSON();
      sJson.preco = s.preco_base;
      return sJson;
    });
    res.json(formatados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar serviços', detalhes: err.message });
  }
}
