import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Pet = sequelize.define('Pet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  especie: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['cachorro', 'gato', 'ave', 'roedor', 'reptil', 'outro']]
    }
  },
  raca: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cor: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  sexo: {
    type: DataTypes.CHAR(1),
    allowNull: true,
    validate: {
      isIn: [['M', 'F']]
    }
  },
  peso_kg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  idade_anos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  castrado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vacinas_em_dia: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  alergias: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vacinas_detalhes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status_presenca: {
    type: DataTypes.STRING(10),
    defaultValue: 'ausente',
    validate: {
      isIn: [['presente', 'ausente', 'hospedado']]
    }
  },
  data_checkin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_checkout: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pets',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Pet;
