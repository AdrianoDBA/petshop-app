import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Servico = sequelize.define('Servico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      isIn: [['banho', 'tosa', 'veterinario', 'consulta', 'vacina', 'hospedagem', 'daycare', 'taxidog', 'outro']]
    }
  },
  preco_base: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  preco_promocional: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  duracao_minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  comissao_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'servicos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Servico;
