import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Pacote = sequelize.define('Pacote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  servico_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantidade_sessoes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4
  },
  validade_dias: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  preco_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  desconto_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pacotes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Pacote;
