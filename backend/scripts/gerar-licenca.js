#!/usr/bin/env node

/**
 * Script utilitário para o desenvolvedor / vendedor gerar chaves de licença comercial do PetShop Pro.
 * 
 * Uso:
 *   node scripts/gerar-licenca.js --cliente "Pet Shop Central" --dias 30
 *   node scripts/gerar-licenca.js --cliente "Clínica PetVida" --dias 365 --tipo anual --doc "12.345.678/0001-90"
 *   node scripts/gerar-licenca.js --cliente "Pet Amigo" --tipo vitalicio
 */

import { gerarLicenca } from '../src/services/licenseService.js';

const args = process.argv.slice(2);
function getArg(name, def = null) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
}

const cliente = getArg('cliente') || 'Pet Shop Demo';
const dias = parseInt(getArg('dias', '30'), 10);
const tipo = getArg('tipo', 'mensal'); // mensal, anual, vitalicio, trial
const doc = getArg('doc', '');

const chave = gerarLicenca({ cliente, documento: doc, dias, tipo });

console.log('\n=============================================================');
console.log('🐾 PETSHOP PRO ENTERPRISE - GERADOR DE LICENÇA COMERCIAL 🐾');
console.log('=============================================================');
console.log(`👤 Cliente:     ${cliente}`);
if (doc) console.log(`📄 CNPJ/CPF:    ${doc}`);
console.log(`📦 Plano:       ${tipo.toUpperCase()}`);
console.log(`⏳ Duração:     ${tipo === 'vitalicio' ? 'Vitalícia (50 anos)' : `${dias} dias`}`);
console.log('-------------------------------------------------------------');
console.log('🔑 CHAVE DE ATIVAÇÃO PARA O CLIENTE:');
console.log(`\n${chave}\n`);
console.log('=============================================================');
console.log('💡 Instruções para o cliente:');
console.log('1. No PetShop Pro, acesse "Configurações > Licença" ou a tela de Onboarding.');
console.log('2. Cole a chave de ativação acima e clique em "Ativar Licença".');
console.log('=============================================================\n');
