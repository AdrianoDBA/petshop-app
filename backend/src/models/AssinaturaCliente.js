import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AssinaturaCliente = sequelize.define('AssinaturaCliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pet_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pacote_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sessoes_totais: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sessoes_utilizadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  data_validade: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'ativo',
    validate: {
      isIn: [['ativo', 'esgotado', 'vencido', 'cancelado']]
    }
  },
  valor_pago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'assinaturas_clientes',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default AssinaturaCliente;
