import sequelize from '../config/database.js';
import Usuario from './Usuario.js';
import Cliente from './Cliente.js';
import Pet from './Pet.js';
import Servico from './Servico.js';
import Agendamento from './Agendamento.js';
import Produto from './Produto.js';
import MovimentoEstoque from './MovimentoEstoque.js';
import Caixa from './Caixa.js';
import ItensCaixa from './ItensCaixa.js';
import LogAuditoria from './LogAuditoria.js';
import Configuracao from './Configuracao.js';
import Notificacao from './Notificacao.js';
import ProntuarioVeterinario from './ProntuarioVeterinario.js';
import Pacote from './Pacote.js';
import AssinaturaCliente from './AssinaturaCliente.js';
import Comissao from './Comissao.js';
import MensagemWhatsApp from './MensagemWhatsApp.js';

// --- Relacionamentos (Associations) ---

// Clientes & Pets
Cliente.hasMany(Pet, { foreignKey: 'cliente_id', as: 'pets' });
Pet.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'tutor' });

// Prontuários Veterinários
Pet.hasMany(ProntuarioVeterinario, { foreignKey: 'pet_id', as: 'prontuarios' });
ProntuarioVeterinario.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
ProntuarioVeterinario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'veterinario' });
ProntuarioVeterinario.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento' });

// Pets, Servicos, Usuarios & Agendamentos
Pet.hasMany(Agendamento, { foreignKey: 'pet_id', as: 'agendamentos' });
Agendamento.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });

Servico.hasMany(Agendamento, { foreignKey: 'servico_id', as: 'agendamentos' });
Agendamento.belongsTo(Servico, { foreignKey: 'servico_id', as: 'servico' });

Usuario.hasMany(Agendamento, { foreignKey: 'usuario_id', as: 'agendamentos' });
Agendamento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'profissional' });

// Pacotes & Assinaturas
Pacote.belongsTo(Servico, { foreignKey: 'servico_id', as: 'servico' });
Servico.hasMany(Pacote, { foreignKey: 'servico_id', as: 'pacotes' });

AssinaturaCliente.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(AssinaturaCliente, { foreignKey: 'cliente_id', as: 'assinaturas' });

AssinaturaCliente.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
Pet.hasMany(AssinaturaCliente, { foreignKey: 'pet_id', as: 'assinaturas' });

AssinaturaCliente.belongsTo(Pacote, { foreignKey: 'pacote_id', as: 'pacote' });
Pacote.hasMany(AssinaturaCliente, { foreignKey: 'pacote_id', as: 'assinaturas' });

// Comissões
Comissao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'profissional' });
Usuario.hasMany(Comissao, { foreignKey: 'usuario_id', as: 'comissoes' });

Comissao.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento' });
Comissao.belongsTo(Caixa, { foreignKey: 'caixa_id', as: 'caixa' });

// Mensagens WhatsApp
MensagemWhatsApp.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
MensagemWhatsApp.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });

// Caixa Relacionamentos
Caixa.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Caixa.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento' });
Caixa.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Caixa.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

Caixa.hasMany(ItensCaixa, { foreignKey: 'caixa_id', as: 'itens' });
ItensCaixa.belongsTo(Caixa, { foreignKey: 'caixa_id', as: 'caixa' });

// MovimentosEstoque Relacionamentos
Produto.hasMany(MovimentoEstoque, { foreignKey: 'produto_id', as: 'movimentos' });
MovimentoEstoque.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });
MovimentoEstoque.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Logs de Auditoria
LogAuditoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Notificações
Agendamento.hasMany(Notificacao, { foreignKey: 'agendamento_id', as: 'notificacoes' });
Notificacao.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento' });

export {
  sequelize,
  Usuario,
  Cliente,
  Pet,
  Servico,
  Agendamento,
  Produto,
  MovimentoEstoque,
  Caixa,
  ItensCaixa,
  LogAuditoria,
  Configuracao,
  Notificacao,
  ProntuarioVeterinario,
  Pacote,
  AssinaturaCliente,
  Comissao,
  MensagemWhatsApp
};
