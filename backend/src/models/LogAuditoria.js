import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LogAuditoria = sequelize.define('LogAuditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  acao: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  tabela: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  registro_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dados_anteriores: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_novos: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_origem: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'logs_auditoria',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false
});

export default LogAuditoria;
