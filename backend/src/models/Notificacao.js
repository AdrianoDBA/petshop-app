import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notificacao = sequelize.define('Notificacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  destinatario: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendente'
  },
  tentativas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  enviado_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notificacoes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false
});

export default Notificacao;
