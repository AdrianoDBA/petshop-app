import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MensagemWhatsApp = sequelize.define('MensagemWhatsApp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pet_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(30),
    defaultValue: 'lembrete_24h',
    validate: {
      isIn: [['lembrete_24h', 'pet_pronto', 'aniversario', 'vacina_vencendo', 'pos_venda', 'avulso']]
    }
  },
  telefone_destino: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  texto_mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status_envio: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendente',
    validate: {
      isIn: [['pendente', 'enviado', 'erro']]
    }
  },
  data_envio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mensagens_whatsapp',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default MensagemWhatsApp;
