import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comissao = sequelize.define('Comissao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  caixa_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  valor_servico: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  percentual_comissao: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  valor_comissao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendente',
    validate: {
      isIn: [['pendente', 'pago', 'cancelado']]
    }
  },
  data_pagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'comissoes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Comissao;
