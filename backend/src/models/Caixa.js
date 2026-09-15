import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Caixa = sequelize.define('Caixa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['entrada', 'saida']]
    }
  },
  categoria: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['servico', 'produto', 'despesa_operacional', 'despesa_fixa', 'aluguel', 'luz_agua_internet', 'salarios', 'impostos', 'investimento', 'receita_extra', 'outro', 'venda_produto', 'compra_produto', 'pet_negociacao']]
    }
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  forma_pagamento: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  parcelas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  parcela_atual: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  data_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  data_pagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  documento_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pago',
    validate: {
      isIn: [['pendente', 'pago', 'cancelado', 'parcial']]
    }
  }
}, {
  tableName: 'caixa',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Caixa;
