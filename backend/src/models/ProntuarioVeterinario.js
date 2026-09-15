import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProntuarioVeterinario = sequelize.define('ProntuarioVeterinario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pet_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(20),
    defaultValue: 'consulta',
    validate: {
      isIn: [['consulta', 'vacina', 'medicamento', 'exame', 'retorno']]
    }
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  queixa_principal: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescricao_medicamentos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vacinas_aplicadas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_proxima_dose: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  peso_atual: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  temperatura: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true
  },
  crmv_veterinario: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'prontuarios_veterinarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default ProntuarioVeterinario;
