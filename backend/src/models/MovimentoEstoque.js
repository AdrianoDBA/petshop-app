import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MovimentoEstoque = sequelize.define('MovimentoEstoque', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['entrada', 'saida', 'ajuste', 'devolucao']]
    }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  documento_referencia: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'movimentos_estoque',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false
});

export default MovimentoEstoque;
