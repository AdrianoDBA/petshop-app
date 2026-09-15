import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  codigo_barras: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco_custo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  preco_venda: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantidade: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  estoque_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  estoque_maximo: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  unidade_medida: {
    type: DataTypes.STRING(10),
    defaultValue: 'un'
  },
  peso_kg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  fornecedor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  data_validade: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  numero_lote: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  localizacao: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'produtos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Produto;
