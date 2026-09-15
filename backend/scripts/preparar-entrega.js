#!/usr/bin/env node

/**
 * Script utilitário para preparar o software para entrega a um NOVO CLIENTE.
 * Limpa todos os dados de testes/simulação, deixando o banco limpo e pronto
 * para o Assistente de Configuração Inicial (Onboarding).
 */

import sequelize from '../src/config/database.js';

console.log('\n=============================================================');
console.log('🐾 PREPARANDO PETSHOP PRO PARA ENTREGA A NOVO CLIENTE 🐾');
console.log('=============================================================');

try {
  await sequelize.authenticate();
  console.log('✓ Conexão com banco de dados estabelecida.');

  // Sincroniza e recria todas as tabelas vazias
  await sequelize.sync({ force: true });
  console.log('✓ Todas as tabelas foram recriadas totalmente vazias (Zero clientes, pets ou vendas).');

  console.log('\n✅ SOFTWARE PRONTO PARA O CLIENTE!');
  console.log('Quando o cliente abrir o sistema pela primeira vez, ele será');
  console.log('recepcionado pelo Assistente de Configuração (Onboarding Wizard)');
  console.log('para preencher o nome da loja, WhatsApp, criar seu usuário Admin');
  console.log('e ativar a licença comercial.');
  console.log('=============================================================\n');
  process.exit(0);
} catch (err) {
  console.error('❌ Erro ao preparar banco para entrega:', err.message);
  process.exit(1);
}
