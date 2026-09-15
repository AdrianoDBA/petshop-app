import bcrypt from 'bcrypt';
import sequelize from '../config/database.js';
import {
  Usuario, Cliente, Pet, Servico, Agendamento, Produto, MovimentoEstoque,
  Caixa, ItensCaixa, ProntuarioVeterinario, Pacote, AssinaturaCliente,
  Comissao, MensagemWhatsApp
} from '../models/index.js';

console.log(`🌱 Populando banco de dados [${sequelize.getDialect().toUpperCase()}]...`);

try {
  await sequelize.sync({ force: true });
  console.log('✅ Tabelas sincronizadas e limpas com sucesso');

  // 1. Usuários
  const senhaHash = await bcrypt.hash('admin123', 10);
  const senhaTosador = await bcrypt.hash('tosador123', 10);

  const admin = await Usuario.create({ nome: 'Administrador Hashiko', usuario: 'admin', senha_hash: senhaHash, perfil: 'admin', email: 'admin@petshop.com' });
  const carla = await Usuario.create({ nome: 'Dra. Carla Mendes', usuario: 'carla', senha_hash: senhaHash, perfil: 'veterinario', email: 'carla.vet@petshop.com' });
  const maria = await Usuario.create({ nome: 'Maria Silva', usuario: 'maria', senha_hash: senhaHash, perfil: 'atendente', email: 'maria@petshop.com' });
  const joao = await Usuario.create({ nome: 'João Souza', usuario: 'joao', senha_hash: senhaTosador, perfil: 'tosador', email: 'joao@petshop.com' });
  console.log('✓ 4 usuários criados');

  // 2. Serviços
  const banho = await Servico.create({ nome: 'Banho Tradicional', preco_base: 50.00, categoria: 'banho', duracao_minutos: 45, comissao_percentual: 20 });
  const tosa = await Servico.create({ nome: 'Tosa na Tesoura', preco_base: 80.00, categoria: 'tosa', duracao_minutos: 60, comissao_percentual: 25 });
  const banhoTosa = await Servico.create({ nome: 'Banho + Tosa Completa', preco_base: 120.00, categoria: 'tosa', duracao_minutos: 90, comissao_percentual: 25 });
  const tosaHig = await Servico.create({ nome: 'Tosa Higiênica', preco_base: 40.00, categoria: 'tosa', duracao_minutos: 30, comissao_percentual: 20 });
  const banhoMed = await Servico.create({ nome: 'Banho Medicamentoso', preco_base: 70.00, categoria: 'banho', duracao_minutos: 60, comissao_percentual: 20 });
  const consultaVet = await Servico.create({ nome: 'Consulta Veterinária', preco_base: 150.00, categoria: 'consulta', duracao_minutos: 40, comissao_percentual: 50 });
  const vacinacaoVet = await Servico.create({ nome: 'Aplicação de Vacina', preco_base: 90.00, categoria: 'vacina', duracao_minutos: 20, comissao_percentual: 30 });
  const daycare = await Servico.create({ nome: 'Diária Daycare / Creche', preco_base: 65.00, categoria: 'daycare', duracao_minutos: 480, comissao_percentual: 15 });
  console.log('✓ 8 serviços configurados');

  // 3. Pacotes & Planos Mensais
  const pct4Banhos = await Pacote.create({
    nome: 'Pacote 4x Banhos Mensais (P/M)',
    descricao: '4 banhos completos com hidratação e tosa higiênica no mês',
    servico_id: banho.id,
    quantidade_sessoes: 4,
    validade_dias: 30,
    preco_total: 160.00, // De 200 por 160 (20% desc)
    desconto_percentual: 20
  });

  const pctBanhoTosa = await Pacote.create({
    nome: 'Plano Premium Banho & Tosa Quinzenal',
    descricao: '2 banhos + 2 tosas higiênicas completas',
    servico_id: banhoTosa.id,
    quantidade_sessoes: 4,
    validade_dias: 30,
    preco_total: 249.90,
    desconto_percentual: 25
  });
  console.log('✓ Pacotes de serviços cadastrados');

  // 4. Produtos
  const produtosSeed = [
    { nome: 'Ração Premium Cães Adultos 15kg', preco_custo: 85.00, preco_venda: 140.00, quantidade: 18, categoria: 'racao', numero_lote: 'RC-9988', data_validade: '2027-08-20' },
    { nome: 'Ração Gatos Castrados 10kg', preco_custo: 68.00, preco_venda: 115.00, quantidade: 14, categoria: 'racao', numero_lote: 'RG-5544', data_validade: '2027-09-15' },
    { nome: 'Shampoo Hipoalergênico 500ml', preco_custo: 14.00, preco_venda: 32.00, quantidade: 22, categoria: 'higiene', numero_lote: 'SH-2026', data_validade: '2028-01-10' },
    { nome: 'Condicionador Brilho Pet 500ml', preco_custo: 16.00, preco_venda: 35.00, quantidade: 16, categoria: 'higiene', numero_lote: 'CD-1122', data_validade: '2028-02-15' },
    { nome: 'Antipulgas & Carrapatos Simparic 20mg', preco_custo: 55.00, preco_venda: 95.00, quantidade: 25, categoria: 'medicamento', numero_lote: 'SMP-8877', data_validade: '2027-11-30' },
    { nome: 'Coleira Guia Retrátil 5m', preco_custo: 25.00, preco_venda: 58.00, quantidade: 10, categoria: 'acessorio', numero_lote: 'GU-001', data_validade: null },
    { nome: 'Brinquedo Mordedor Resistente', preco_custo: 9.00, preco_venda: 24.00, quantidade: 30, categoria: 'brinquedo', numero_lote: 'BR-332', data_validade: null },
    { nome: 'Petisco Bifinho Carne 500g', preco_custo: 4.50, preco_venda: 12.00, quantidade: 45, categoria: 'petisco', numero_lote: 'PET-776', data_validade: '2026-10-05' },
    { nome: 'Areia Sanitária Ultra Absorvente 4kg', preco_custo: 12.00, preco_venda: 28.00, quantidade: 3, categoria: 'higiene', numero_lote: 'AR-990', data_validade: null } // Estoque baixo!
  ];

  const prodsCriados = [];
  for (const p of produtosSeed) {
    const pr = await Produto.create(p);
    prodsCriados.push(pr);
  }
  console.log('✓ 9 produtos em estoque cadastrados');

  // 5. Clientes
  const c1 = await Cliente.create({ nome: 'Adriano Costa', cpf: '123.456.789-00', telefone: '(11) 98888-8888', email: 'adriano@exemplo.com', endereco: 'Rua das Flores, 123' });
  const c2 = await Cliente.create({ nome: 'Ana Souza', cpf: '222.333.444-55', telefone: '(11) 97777-7777', email: 'ana@exemplo.com', endereco: 'Av. Paulista, 1500' });
  const c3 = await Cliente.create({ nome: 'Carlos Lima', cpf: '333.444.555-66', telefone: '(11) 96666-6666', email: 'carlos@exemplo.com', endereco: 'Rua Augusta, 450' });
  console.log('✓ 3 clientes criados');

  // 6. Pets
  const petsSeed = [
    { cliente_id: c1.id, nome: 'Rex', especie: 'cachorro', raca: 'Golden Retriever', sexo: 'M', peso_kg: 28.5, cor: 'Dourado', status_presenca: 'ausente', vacinas_em_dia: true, alergias: 'Nenhuma conhecida' },
    { cliente_id: c1.id, nome: 'Mia', especie: 'gato', raca: 'Siamês', sexo: 'F', peso_kg: 4.2, cor: 'Escama de Peixe', status_presenca: 'presente', vacinas_em_dia: true, alergias: 'Sensibilidade a frango' },
    { cliente_id: c2.id, nome: 'Thor', especie: 'cachorro', raca: 'Labrador', sexo: 'M', peso_kg: 32.0, cor: 'Caramelo', status_presenca: 'ausente', vacinas_em_dia: true },
    { cliente_id: c3.id, nome: 'Luna', especie: 'cachorro', raca: 'Poodle Toy', sexo: 'F', peso_kg: 4.8, cor: 'Branco', status_presenca: 'ausente', vacinas_em_dia: true },
    { cliente_id: c3.id, nome: 'Felix', especie: 'gato', raca: 'SRD', sexo: 'M', peso_kg: 5.1, cor: 'Cinza', status_presenca: 'ausente', vacinas_em_dia: false }
  ];

  const petsCriados = [];
  for (const pet of petsSeed) {
    const p = await Pet.create(pet);
    petsCriados.push(p);
  }
  console.log('✓ 5 pets criados');

  // 7. Assinaturas de Pacotes
  const ass1 = await AssinaturaCliente.create({
    cliente_id: c1.id,
    pet_id: petsCriados[0].id, // Rex
    pacote_id: pct4Banhos.id,
    sessoes_totais: 4,
    sessoes_utilizadas: 3,
    data_inicio: '2026-08-01',
    data_validade: '2026-08-31',
    status: 'ativo',
    valor_pago: 160.00,
    observacoes: '3 de 4 banhos utilizados neste mês.'
  });

  const ass2 = await AssinaturaCliente.create({
    cliente_id: c2.id,
    pet_id: petsCriados[2].id, // Thor
    pacote_id: pctBanhoTosa.id,
    sessoes_totais: 4,
    sessoes_utilizadas: 2,
    data_inicio: '2026-08-10',
    data_validade: '2026-09-10',
    status: 'ativo',
    valor_pago: 249.90,
    observacoes: '2 de 4 sessões usadas.'
  });
  console.log('✓ Assinaturas ativas criadas');

  // 8. Prontuários Veterinários
  await ProntuarioVeterinario.create({
    pet_id: petsCriados[0].id,
    usuario_id: carla.id,
    tipo: 'vacina',
    titulo: 'Aplicação Anual V10 Polivalente & Antirrábica',
    queixa_principal: 'Imunização preventiva anual',
    diagnostico: 'Animal hígido e com ótimo escore corporal',
    vacinas_aplicadas: 'V10 Vanguard HTLP 5/CV-L (Lote #V10-9988)',
    data_proxima_dose: '2027-08-15',
    peso_atual: 28.5,
    temperatura: 38.5,
    crmv_veterinario: 'CRMV-SP 45.892',
    observacoes: 'Próxima revacinação agendada para agosto de 2027.'
  });

  await ProntuarioVeterinario.create({
    pet_id: petsCriados[0].id,
    usuario_id: carla.id,
    tipo: 'medicamento',
    titulo: 'Receituário Dermatológico & Controle de Alergia',
    queixa_principal: 'Prurido podal e eritema abdominal',
    diagnostico: 'Dermatite atópica leve',
    prescricao_medicamentos: '1. Apoquel 5.4mg - 1 comprimido a cada 12h por 5 dias.\n2. Shampoo Dermocalm - 2 banhos por semana durante 3 semanas.',
    peso_atual: 28.5,
    temperatura: 38.4,
    crmv_veterinario: 'CRMV-SP 45.892'
  });
  console.log('✓ Prontuários clínicos e vacinas registradas');

  // 9. Agendamentos & Caixa
  const hojeStr = new Date().toISOString().split('T')[0];
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];

  const ag1 = await Agendamento.create({
    pet_id: petsCriados[0].id,
    servico_id: banho.id,
    usuario_id: joao.id,
    data_agendada: hojeStr,
    hora_agendada: '09:00',
    status: 'concluido',
    preco_praticado: 50.00
  });

  const ag2 = await Agendamento.create({
    pet_id: petsCriados[1].id,
    servico_id: banhoTosa.id,
    usuario_id: joao.id,
    data_agendada: hojeStr,
    hora_agendada: '10:30',
    status: 'em_andamento',
    preco_praticado: 120.00
  });

  const ag3 = await Agendamento.create({
    pet_id: petsCriados[2].id,
    servico_id: consultaVet.id,
    usuario_id: carla.id,
    data_agendada: amanhaStr,
    hora_agendada: '14:00',
    status: 'agendado',
    preco_praticado: 150.00
  });

  // Lançamentos de Caixa
  const cx1 = await Caixa.create({
    tipo: 'entrada',
    valor: 50.00,
    descricao: 'Serviço Banho Tradicional - Pet: Rex',
    forma_pagamento: 'PIX',
    categoria: 'servico',
    cliente_id: c1.id,
    agendamento_id: ag1.id,
    usuario_id: maria.id,
    status: 'pago'
  });

  const cx2 = await Caixa.create({
    tipo: 'entrada',
    valor: 160.00,
    descricao: 'Assinatura Pacote 4x Banhos - Pet: Rex',
    forma_pagamento: 'Cartão de Crédito',
    categoria: 'servico',
    cliente_id: c1.id,
    usuario_id: maria.id,
    status: 'pago'
  });

  // Comissões
  await Comissao.create({
    usuario_id: joao.id,
    agendamento_id: ag1.id,
    caixa_id: cx1.id,
    valor_servico: 50.00,
    percentual_comissao: 20.00,
    valor_comissao: 10.00,
    status: 'pendente'
  });

  // Mensagens WhatsApp
  await MensagemWhatsApp.create({
    cliente_id: c2.id,
    pet_id: petsCriados[2].id,
    tipo: 'lembrete_24h',
    telefone_destino: '11977777777',
    texto_mensagem: 'Olá, Ana! 🐾 Confirmando a Consulta Veterinária do Thor amanhã às 14:00. Podemos confirmar?',
    status_envio: 'enviado'
  });

  console.log('✓ Lançamentos de caixa, comissões e automações de WhatsApp gerados!');
  console.log(`\n🎉 Banco de dados [${sequelize.getDialect().toUpperCase()}] populado com sucesso!`);
  console.log('\n📋 Credenciais de Acesso:');
  console.log('   admin / admin123 (Administrador)');
  console.log('   carla / admin123 (Médica Veterinária)');
  console.log('   maria / admin123 (Atendente)');
  console.log('   joao / tosador123 (Tosador)');

  process.exit(0);
} catch (err) {
  console.error('❌ Erro durante o seed do banco:', err);
  process.exit(1);
}
