import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Agendamento = sequelize.define('Agendamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pet_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servico_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  data_agendada: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_agendada: {
    type: DataTypes.STRING(8),
    allowNull: false
  },
  data_realizacao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hora_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hora_fim: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'agendado',
    validate: {
      isIn: [['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show']]
    }
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco_praticado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  forma_pagamento: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  parcelas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  checkin_realizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  checkout_automatico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'agendamentos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Agendamento;
