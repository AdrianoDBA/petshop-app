#!/usr/bin/env node

/**
 * Utilitário para verificar e auditar qualquer chave de licença do PetShop Pro.
 * 
 * Uso:
 *   node scripts/verificar-licenca.js "<TOKEN_DA_CHAVE>"
 */

import { validarLicenca } from '../src/services/licenseService.js';

const chave = process.argv[2];

if (!chave) {
  console.log('\n❌ Uso: node scripts/verificar-licenca.js "<CHAVE_DA_LICENCA>"\n');
  process.exit(1);
}

console.log('\n=============================================================');
console.log('🔍 AUDITORIA E VALIDAÇÃO DE LICENÇA - PETSHOP PRO');
console.log('=============================================================');

const res = validarLicenca(chave);

if (!res.valida && !res.expirada) {
  console.log('❌ STATUS: CHAVE INVÁLIDA OU ADULTERADA');
  console.log(`Motivo: ${res.motivo}`);
} else {
  const p = res.payload;
  console.log(`✅ ASSINATURA:  VÁLIDA (Autêntica e Criptograficamente Íntegra)`);
  console.log(`👤 Cliente:     ${p.c}`);
  if (p.d) console.log(`📄 Documento:   ${p.d}`);
  console.log(`📦 Plano:       ${p.t.toUpperCase()}`);
  console.log(`📅 Vencimento:  ${p.v.split('-').reverse().join('/')}`);

  if (res.expirada) {
    console.log(`\n🚨 STATUS ATUAL: LICENÇA EXPIRADA (${res.motivo})`);
  } else {
    const dataVal = new Date(p.v + 'T23:59:59');
    const dias = Math.ceil((dataVal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    console.log(`⏳ Dias Restantes: ${dias} dia(s)`);
    console.log(`\n🟢 STATUS ATUAL: LICENÇA ATIVA E REGULAR`);
  }
}

console.log('=============================================================\n');
