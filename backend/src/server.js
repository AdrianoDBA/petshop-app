import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import clienteRoutes from './routes/clientes.js';
import petRoutes from './routes/pets.js';
import agendamentoRoutes from './routes/agendamentos.js';
import estoqueRoutes from './routes/estoque.js';
import caixaRoutes from './routes/caixa.js';
import vendaRoutes from './routes/vendas.js';
import relatorioRoutes from './routes/relatorios.js';
import usuarioRoutes from './routes/usuarios.js';
import prontuarioRoutes from './routes/prontuarios.js';
import pacoteRoutes from './routes/pacotes.js';
import whatsappRoutes from './routes/whatsapp.js';
import comissaoRoutes from './routes/comissoes.js';
import publicoRoutes from './routes/publico.js';
import onboardingRoutes from './routes/onboarding.js';
import licencaRoutes from './routes/licenca.js';
import backupRoutes from './routes/backup.js';
import { startNotificationScheduler } from './utils/notifier.js';
import { iniciarAgendadorBackup } from './services/backupService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas solicitações feitas a partir deste IP, tente novamente mais tarde'
  }
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Sincroniza banco de dados Sequelize (Postgres ou SQLite)
try {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log(`✅ Banco de dados [${sequelize.getDialect().toUpperCase()}] conectado e sincronizado com sucesso!`);
} catch (err) {
  console.error('❌ Erro ao conectar banco de dados:', err.message);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      message: 'PetShop Pro API Enterprise funcionando!',
      dialect: sequelize.getDialect(),
      version: '2.0.0'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/prontuarios', prontuarioRoutes);
app.use('/api/pacotes', pacoteRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/comissoes', comissaoRoutes);
app.use('/api/publico', publicoRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/licenca', licencaRoutes);
app.use('/api/backup', backupRoutes);

// Servir arquivos estáticos do Frontend (React PWA)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor', detalhes: err.message });
});

// Inicia agendadores em background (Notificações e Backups automáticos)
startNotificationScheduler();
iniciarAgendadorBackup();

const server = app.listen(PORT, () => {
  console.log(`🐾 PetShop Pro Enterprise rodando em http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Porta ${PORT} já está em uso.`);
    process.exit(1);
  }
  throw err;
});

function handleShutdown() {
  console.log('\n🐾 Encerrando o servidor...');
  sequelize.close().then(() => {
    server.close(() => {
      console.log('🐾 Servidor finalizado com sucesso.');
      process.exit(0);
    });
  }).catch(() => process.exit(1));
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);