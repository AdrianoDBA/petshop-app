import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Configuracao = sequelize.define('Configuracao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chave: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'configuracoes',
  timestamps: true,
  createdAt: false,
  updatedAt: 'atualizado_em'
});

export default Configuracao;
