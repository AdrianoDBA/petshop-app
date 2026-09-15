import bcrypt from 'bcrypt';
import sequelize from '../config/database.js';
import {
  Usuario, Cliente, Pet, Servico, Agendamento, Produto, MovimentoEstoque,
  Caixa, ItensCaixa, ProntuarioVeterinario, Pacote, AssinaturaCliente,
  Comissao, MensagemWhatsApp
} from '../models/index.js';

console.log(`🐾 Gerando 2 ANOS de movimentação empresarial no PetShop Pro [${sequelize.getDialect().toUpperCase()}]...`);

const NOMES_CLIENTES = [
  'Adriano Costa', 'Ana Souza', 'Carlos Lima', 'Beatriz Ferreira', 'Rodrigo Alves',
  'Juliana Martins', 'Lucas Ribeiro', 'Camila Santos', 'Felipe Oliveira', 'Mariana Rocha',
  'Gabriel Barbosa', 'Larissa Mendes', 'Eduardo Pereira', 'Fernanda Carvalho', 'Thiago Gomes',
  'Renata Castro', 'Marcelo Dias', 'Patricia Cardoso', 'Bruno Moreira', 'Aline Nunes',
  'Diego Ramos', 'Vanessa Teixeira', 'Gustavo Monteiro', 'Sabrina Duarte', 'Leonardo Freitas',
  'Heloisa Vieira', 'Matheus Cunha', 'Debora Moura', 'Rafael Silveira', 'Jessica Borges',
  'Leandro Cavalcanti', 'Bianca Farias', 'Vinicius Pacheco', 'Carolina Melo', 'Fabio Guimarães',
  'Priscila Antunes', 'Renan Peixoto', 'Tatiane Rezende', 'Alexandre Viana', 'Milena Siqueira'
];

const NOMES_PETS_CAES = [
  'Rex', 'Thor', 'Luna', 'Mel', 'Bob', 'Theo', 'Nina', 'Amora', 'Pipoca', 'Belinha',
  'Spike', 'Zeus', 'Lola', 'Marley', 'Chico', 'Pingo', 'Toby', 'Frida', 'Simba', 'Maya',
  'Max', 'Bidu', 'Pretinha', 'Luke', 'Pérola', 'Apollo', 'Bela', 'Duque', 'Cacau', 'Bento'
];

const NOMES_PETS_GATOS = [
  'Mia', 'Felix', 'Tom', 'Garfield', 'Salem', 'Oliver', 'Mimi', 'Frajola', 'Chloé', 'Soneca',
  'Gatíneo', 'Nala', 'Whiskas', 'Fumaça', 'Simba Cat', 'Penélope', 'Misty', 'Zeca', 'Bisa', 'Puma'
];

const RACAS_CAES = [
  'Golden Retriever', 'Shih Tzu', 'Poodle Toy', 'Labrador', 'Spitz Alemão (Lulu)',
  'Bulldog Francês', 'Yorkshire Terrier', 'Dachshund (Salsicha)', 'Beagle', 'SRD (Vira-lata)'
];

const RACAS_GATOS = [
  'Siamês', 'Persa', 'Maine Coon', 'Ragdoll', 'Bengal', 'SRD (Gato Comum)'
];

const CORES = ['Caramelo', 'Branco', 'Preto', 'Dourado', 'Cinza', 'Bicolor', 'Tricolor', 'Marrom'];

const VACINAS_DISPONIVEIS = [
  { nome: 'V10 Polivalente Vanguard', lote: 'V10-2025-A', dias: 365 },
  { nome: 'Antirrábica Defensor', lote: 'ARB-8899-X', dias: 365 },
  { nome: 'Giardíase Giardiavax', lote: 'GD-4455-B', dias: 365 },
  { nome: 'Bronchi-Shield Gripe Canina', lote: 'GP-1122-C', dias: 365 },
  { nome: 'V5 Felina Quíntupla (FeLV)', lote: 'FELV-7788', dias: 365 }
];

const MEDICAMENTOS_EXEMPLOS = [
  {
    titulo: 'Consulta Dermatológica & Controle de Alergia',
    queixa: 'Prurido constante nas patas e vermelhidão abdominal.',
    diagnostico: 'Dermatite atópica sazonal por alérgenos ambientais.',
    prescricao: '1. Apoquel 5.4mg - Administrar 1 comprimido a cada 12h por 5 dias, depois 1 comprimido a cada 24h por mais 10 dias.\n2. Shampoo Dermocalm - 2 banhos por semana durante 3 semanas.',
    obs: 'Retorno em 20 dias para reavaliação de pele.'
  },
  {
    titulo: 'Exame de Rotina & Profilaxia Gastrointestinal',
    queixa: 'Check-up anual preventivo e desparasitação.',
    diagnostico: 'Animal saudável, sem alterações em auscultação cardiopulmonar.',
    prescricao: '1. Drontal Plus (1 comprimido para cada 10kg) - Dose única repetindo em 15 dias.\n2. Simparic 20mg - 1 comprimido palatável para prevenção de pulgas e carrapatos.',
    obs: 'Manter vacinação e vermifugação atualizadas.'
  },
  {
    titulo: 'Consulta Oftalmológica & Ceratoconjuntivite',
    queixa: 'Secreção ocular bilateral e animal piscando com frequência.',
    diagnostico: 'Conjuntivite bacteriana leve.',
    prescricao: '1. Colírio Tobramicina 0.3% - Pingar 1 gota em cada olho a cada 8h por 7 dias.\n2. Limpeza prévia com soro fisiológico estéril.',
    obs: 'Evitar exposição a poeira e vento direto.'
  }
];

try {
  await sequelize.sync({ force: true });
  console.log('✅ Banco de dados limpo e estruturado.');

  // 1. Criar Usuários
  const senhaHash = await bcrypt.hash('admin123', 8);
  const senhaTosador = await bcrypt.hash('tosador123', 8);

  const admin = await Usuario.create({ nome: 'Administrador Hashiko', usuario: 'admin', senha_hash: senhaHash, perfil: 'admin', email: 'admin@petshop.com' });
  const carla = await Usuario.create({ nome: 'Dra. Carla Mendes', usuario: 'carla', senha_hash: senhaHash, perfil: 'veterinario', email: 'carla.vet@petshop.com' });
  const maria = await Usuario.create({ nome: 'Maria Silva', usuario: 'maria', senha_hash: senhaHash, perfil: 'atendente', email: 'maria@petshop.com' });
  const joao = await Usuario.create({ nome: 'João Souza', usuario: 'joao', senha_hash: senhaTosador, perfil: 'tosador', email: 'joao@petshop.com' });
  console.log('✓ 4 colaboradores registrados.');

  // 2. Criar Serviços
  const banho = await Servico.create({ nome: 'Banho Tradicional', preco_base: 50.00, categoria: 'banho', duracao_minutos: 45, comissao_percentual: 20 });
  const tosa = await Servico.create({ nome: 'Tosa na Tesoura', preco_base: 80.00, categoria: 'tosa', duracao_minutos: 60, comissao_percentual: 25 });
  const banhoTosa = await Servico.create({ nome: 'Banho + Tosa Completa', preco_base: 120.00, categoria: 'tosa', duracao_minutos: 90, comissao_percentual: 25 });
  const tosaHig = await Servico.create({ nome: 'Tosa Higiênica', preco_base: 40.00, categoria: 'tosa', duracao_minutos: 30, comissao_percentual: 20 });
  const banhoMed = await Servico.create({ nome: 'Banho Medicamentoso', preco_base: 70.00, categoria: 'banho', duracao_minutos: 60, comissao_percentual: 20 });
  const consultaVet = await Servico.create({ nome: 'Consulta Veterinária', preco_base: 150.00, categoria: 'consulta', duracao_minutos: 40, comissao_percentual: 50 });
  const vacinacaoVet = await Servico.create({ nome: 'Aplicação de Vacina', preco_base: 90.00, categoria: 'vacina', duracao_minutos: 20, comissao_percentual: 30 });
  const daycare = await Servico.create({ nome: 'Diária Daycare / Creche', preco_base: 65.00, categoria: 'daycare', duracao_minutos: 480, comissao_percentual: 15 });

  const todosServicos = [banho, tosa, banhoTosa, tosaHig, banhoMed, consultaVet, vacinacaoVet, daycare];
  console.log('✓ 8 serviços configurados.');

  // 3. Criar Pacotes
  const pct4Banhos = await Pacote.create({
    nome: 'Pacote 4x Banhos Mensais (P/M)',
    descricao: '4 banhos com hidratação e tosa higiênica',
    servico_id: banho.id,
    quantidade_sessoes: 4,
    validade_dias: 30,
    preco_total: 160.00,
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
  console.log('✓ Pacotes recorrentes criados.');

  // 4. Criar Produtos de Estoque
  const produtosSeed = [
    { nome: 'Ração Premium Cães Adultos 15kg', preco_custo: 85.00, preco_venda: 140.00, quantidade: 28, categoria: 'racao', numero_lote: 'RC-9988', data_validade: '2027-08-20' },
    { nome: 'Ração Gatos Castrados 10kg', preco_custo: 68.00, preco_venda: 115.00, quantidade: 22, categoria: 'racao', numero_lote: 'RG-5544', data_validade: '2027-09-15' },
    { nome: 'Shampoo Hipoalergênico Dermocalm 500ml', preco_custo: 14.00, preco_venda: 32.00, quantidade: 35, categoria: 'higiene', numero_lote: 'SH-2026', data_validade: '2028-01-10' },
    { nome: 'Condicionador Brilho & Maciez Pet 500ml', preco_custo: 16.00, preco_venda: 35.00, quantidade: 25, categoria: 'higiene', numero_lote: 'CD-1122', data_validade: '2028-02-15' },
    { nome: 'Antipulgas Simparic 20mg (10 a 20kg)', preco_custo: 55.00, preco_venda: 95.00, quantidade: 40, categoria: 'medicamento', numero_lote: 'SMP-8877', data_validade: '2027-11-30' },
    { nome: 'Antipulgas Bravecto 20 a 40kg', preco_custo: 120.00, preco_venda: 195.00, quantidade: 18, categoria: 'medicamento', numero_lote: 'BRV-331', data_validade: '2028-03-20' },
    { nome: 'Vermífugo Drontal Plus 4 Comprimidos', preco_custo: 28.00, preco_venda: 54.00, quantidade: 32, categoria: 'medicamento', numero_lote: 'DRN-442', data_validade: '2027-10-15' },
    { nome: 'Coleira Guia Retrátil 5 Metros', preco_custo: 25.00, preco_venda: 58.00, quantidade: 15, categoria: 'acessorio', numero_lote: 'GU-001', data_validade: null },
    { nome: 'Brinquedo Mordedor Resistente Pet', preco_custo: 9.00, preco_venda: 24.00, quantidade: 50, categoria: 'brinquedo', numero_lote: 'BR-332', data_validade: null },
    { nome: 'Petisco Bifinho Carne Macia 500g', preco_custo: 4.50, preco_venda: 12.00, quantidade: 80, categoria: 'petisco', numero_lote: 'PET-776', data_validade: '2026-12-05' },
    { nome: 'Areia Sanitária Ultra Absorvente 4kg', preco_custo: 12.00, preco_venda: 28.00, quantidade: 4, categoria: 'higiene', numero_lote: 'AR-990', data_validade: null }
  ];

  const produtosCriados = [];
  for (const p of produtosSeed) {
    const prod = await Produto.create(p);
    produtosCriados.push(prod);
  }
  console.log(`✓ ${produtosCriados.length} produtos de estoque cadastrados.`);

  // 5. Criar 40 Clientes e 60 Pets
  const clientesCriados = [];
  const petsCriados = [];

  for (let i = 0; i < NOMES_CLIENTES.length; i++) {
    const nome = NOMES_CLIENTES[i];
    const cpf = `${100 + i}.${200 + i}.${300 + i}-${String(i).padStart(2, '0')}`;
    const tel = `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const email = `${nome.toLowerCase().replace(/\s+/g, '.')}@exemplo.com`;
    const end = `Rua das Palmeiras, ${100 + i * 5} - São Paulo/SP`;

    const cliente = await Cliente.create({ nome, cpf, telefone: tel, email, endereco: end });
    clientesCriados.push(cliente);

    // 1 a 2 pets por cliente
    const qtdPets = (i % 3 === 0) ? 2 : 1;
    for (let pIdx = 0; pIdx < qtdPets; pIdx++) {
      const isCao = (pIdx + i) % 4 !== 0;
      const petNome = isCao 
        ? NOMES_PETS_CAES[(i + pIdx) % NOMES_PETS_CAES.length]
        : NOMES_PETS_GATOS[(i + pIdx) % NOMES_PETS_GATOS.length];
      const especie = isCao ? 'cachorro' : 'gato';
      const raca = isCao ? RACAS_CAES[(i + pIdx) % RACAS_CAES.length] : RACAS_GATOS[(i + pIdx) % RACAS_GATOS.length];
      const cor = CORES[(i + pIdx) % CORES.length];
      const peso = isCao ? (4.0 + (i % 25) * 1.2).toFixed(1) : (3.5 + (i % 5) * 0.4).toFixed(1);

      const pet = await Pet.create({
        cliente_id: cliente.id,
        nome: petNome,
        especie,
        raca,
        sexo: (i + pIdx) % 2 === 0 ? 'M' : 'F',
        peso_kg: parseFloat(peso),
        cor,
        status_presenca: i === 0 ? 'presente' : 'ausente',
        vacinas_em_dia: i % 5 !== 0,
        alergias: i % 7 === 0 ? 'Alergia a carne bovina' : 'Nenhuma'
      });
      petsCriados.push(pet);
    }
  }
  console.log(`✓ ${clientesCriados.length} clientes e ${petsCriados.length} pets cadastrados.`);

  // 6. Gerar Assinaturas Ativas de Pacotes
  for (let aIdx = 0; aIdx < 12; aIdx++) {
    const pet = petsCriados[aIdx];
    const pct = aIdx % 2 === 0 ? pct4Banhos : pctBanhoTosa;
    const usadas = (aIdx % 4) + 1;

    await AssinaturaCliente.create({
      cliente_id: pet.cliente_id,
      pet_id: pet.id,
      pacote_id: pct.id,
      sessoes_totais: pct.quantidade_sessoes,
      sessoes_utilizadas: usadas >= 4 ? 4 : usadas,
      data_inicio: '2026-08-01',
      data_validade: '2026-08-31',
      status: usadas >= 4 ? 'esgotado' : 'ativo',
      valor_pago: pct.preco_total,
      observacoes: `${usadas} de ${pct.quantidade_sessoes} sessões consumidas no mês.`
    });
  }
  console.log('✓ 12 assinaturas de pacotes ativas registradas.');

  // 7. Gerar 2 Anos de Histórico (2024-08-25 até 2026-08-25 = ~104 Semanas, ~30 atendimentos/semana)
  console.log('⏳ Gerando ~3.120 agendamentos e transações de caixa ao longo de 24 meses...');

  const dataBase = new Date('2024-08-25T08:00:00');
  const dataHoje = new Date('2026-08-25T18:00:00');
  const formasPagamento = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];
  const horarios = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  let totalAgendamentos = 0;
  let totalProntuarios = 0;
  let totalReceitaCaixa = 0;

  let dataCursor = new Date(dataBase);

  while (dataCursor <= dataHoje) {
    const diaSemana = dataCursor.getDay(); // 0 = Domingo
    if (diaSemana !== 0) { // Petshop funciona de Segunda a Sábado
      const atendimentosHoje = 4 + (totalAgendamentos % 3); // 4 a 6 atendimentos por dia = ~30/semana

      for (let k = 0; k < atendimentosHoje; k++) {
        const petIdx = (totalAgendamentos * 7 + k) % petsCriados.length;
        const pet = petsCriados[petIdx];
        const servicoIdx = (totalAgendamentos + k) % todosServicos.length;
        const servico = todosServicos[servicoIdx];

        let profissional = joao;
        if (servico.categoria === 'consulta' || servico.categoria === 'vacina') {
          profissional = carla;
        } else if (k % 2 === 0) {
          profissional = maria;
        }

        const dataStr = dataCursor.toISOString().split('T')[0];
        const horaStr = horarios[(k * 2) % horarios.length];
        const isPast = dataCursor < dataHoje;
        const status = isPast ? 'concluido' : (k === 0 ? 'em_andamento' : 'agendado');

        // Cria Agendamento
        const ag = await Agendamento.create({
          pet_id: pet.id,
          servico_id: servico.id,
          usuario_id: profissional.id,
          data_agendada: dataStr,
          hora_agendada: horaStr,
          status,
          preco_praticado: servico.preco_base,
          forma_pagamento: formasPagamento[(totalAgendamentos + k) % formasPagamento.length],
          criado_em: dataCursor
        });
        totalAgendamentos++;

        if (status === 'concluido') {
          // Cria Entrada no Caixa
          const cx = await Caixa.create({
            tipo: 'entrada',
            valor: servico.preco_base,
            descricao: `Serviço ${servico.nome} - Pet: ${pet.nome}`,
            forma_pagamento: ag.forma_pagamento,
            categoria: 'servico',
            cliente_id: pet.cliente_id,
            agendamento_id: ag.id,
            usuario_id: profissional.id,
            status: 'pago',
            criado_em: dataCursor
          });
          totalReceitaCaixa += parseFloat(servico.preco_base);

          await ItensCaixa.create({
            caixa_id: cx.id,
            tipo: 'servico',
            item_id: servico.id,
            nome: servico.nome,
            quantidade: 1,
            preco_unitario: servico.preco_base,
            subtotal: servico.preco_base
          });

          // Cria Comissão para o Colaborador
          const percComissao = servico.comissao_percentual || 20;
          const valComissao = (servico.preco_base * percComissao) / 100;

          await Comissao.create({
            usuario_id: profissional.id,
            agendamento_id: ag.id,
            caixa_id: cx.id,
            valor_servico: servico.preco_base,
            percentual_comissao: percComissao,
            valor_comissao: valComissao,
            status: isPast ? 'pago' : 'pendente',
            data_pagamento: isPast ? dataStr : null,
            criado_em: dataCursor
          });

          // Se for consulta médica ou vacina, registra Prontuário Clínico
          if (servico.categoria === 'consulta') {
            const medEx = MEDICAMENTOS_EXEMPLOS[totalProntuarios % MEDICAMENTOS_EXEMPLOS.length];
            await ProntuarioVeterinario.create({
              pet_id: pet.id,
              usuario_id: carla.id,
              agendamento_id: ag.id,
              tipo: 'consulta',
              titulo: medEx.titulo,
              queixa_principal: medEx.queixa,
              diagnostico: medEx.diagnostico,
              prescricao_medicamentos: medEx.prescricao,
              peso_atual: pet.peso_kg,
              temperatura: 38.5,
              crmv_veterinario: 'CRMV-SP 45.892',
              observacoes: medEx.obs,
              criado_em: dataCursor
            });
            totalProntuarios++;
          } else if (servico.categoria === 'vacina') {
            const vacEx = VACINAS_DISPONIVEIS[totalProntuarios % VACINAS_DISPONIVEIS.length];
            const proxDose = new Date(dataCursor);
            proxDose.setDate(proxDose.getDate() + vacEx.dias);

            await ProntuarioVeterinario.create({
              pet_id: pet.id,
              usuario_id: carla.id,
              agendamento_id: ag.id,
              tipo: 'vacina',
              titulo: `Imunização: ${vacEx.nome}`,
              queixa_principal: 'Vacinação preventiva anual de rotina',
              diagnostico: 'Animal saudável e apto à imunização.',
              vacinas_aplicadas: `${vacEx.nome} (Lote #${vacEx.lote})`,
              data_proxima_dose: proxDose.toISOString().split('T')[0],
              peso_atual: pet.peso_kg,
              temperatura: 38.4,
              crmv_veterinario: 'CRMV-SP 45.892',
              observacoes: 'Revacinação programada para 12 meses.',
              criado_em: dataCursor
            });
            totalProntuarios++;
          }
        }
      }

      // A cada 3 dias, simula uma venda de produtos no PDV (Ração, shampoo, brinquedo)
      if (totalAgendamentos % 3 === 0) {
        const prod = produtosCriados[(totalAgendamentos / 3) % produtosCriados.length];
        const qtdVendida = 1 + (totalAgendamentos % 2);
        const totalVenda = prod.preco_venda * qtdVendida;

        const cxVenda = await Caixa.create({
          tipo: 'entrada',
          valor: totalVenda,
          descricao: `Venda PDV: ${qtdVendida}x ${prod.nome}`,
          forma_pagamento: formasPagamento[totalAgendamentos % formasPagamento.length],
          categoria: 'venda_produto',
          cliente_id: clientesCriados[totalAgendamentos % clientesCriados.length].id,
          usuario_id: maria.id,
          status: 'pago',
          criado_em: dataCursor
        });

        await ItensCaixa.create({
          caixa_id: cxVenda.id,
          tipo: 'produto',
          item_id: prod.id,
          nome: prod.nome,
          quantidade: qtdVendida,
          preco_unitario: prod.preco_venda,
          subtotal: totalVenda
        });

        await MovimentoEstoque.create({
          produto_id: prod.id,
          tipo: 'saida',
          quantidade: qtdVendida,
          preco_unitario: prod.preco_venda,
          motivo: `Venda Caixa #${cxVenda.id}`,
          usuario_id: maria.id,
          criado_em: dataCursor
        });
      }

      // No início de cada mês, lança custos operacionais (Aluguel, Luz/Água/Internet, Folha, Impostos)
      if (dataCursor.getDate() === 5) {
        await Caixa.create({
          tipo: 'saida',
          valor: 2500.00,
          descricao: 'Pagamento de Aluguel do Imóvel Comercial',
          forma_pagamento: 'Transferência',
          categoria: 'aluguel',
          usuario_id: admin.id,
          status: 'pago',
          criado_em: dataCursor
        });

        await Caixa.create({
          tipo: 'saida',
          valor: 650.00,
          descricao: 'Contas de Consumo: Energia Elétrica, Água e Internet Fibra',
          forma_pagamento: 'Boleto',
          categoria: 'luz_agua_internet',
          usuario_id: admin.id,
          status: 'pago',
          criado_em: dataCursor
        });

        await Caixa.create({
          tipo: 'saida',
          valor: 1800.00,
          descricao: 'Reabastecimento Mensal de Estoque com Distribuidor',
          forma_pagamento: 'Boleto',
          categoria: 'compra_produto',
          usuario_id: admin.id,
          status: 'pago',
          criado_em: dataCursor
        });
      }
    }

    // Avança 1 dia
    dataCursor.setDate(dataCursor.getDate() + 1);
  }

  // 8. Mensagens WhatsApp Recentes
  for (let m = 0; m < 25; m++) {
    const c = clientesCriados[m % clientesCriados.length];
    const p = petsCriados[m % petsCriados.length];
    await MensagemWhatsApp.create({
      cliente_id: c.id,
      pet_id: p.id,
      tipo: m % 2 === 0 ? 'lembrete_24h' : 'pet_pronto',
      telefone_destino: c.telefone.replace(/\D/g, ''),
      texto_mensagem: `Olá, ${c.nome}! 🐾 Passando para confirmar o agendamento de banho e tosa do ${p.nome}. Te esperamos!`,
      status_envio: 'enviado',
      data_envio: new Date()
    });
  }

  console.log('\n🎉 SIMULAÇÃO DE 2 ANOS CONCLUÍDA COM ÊXITO!');
  console.log(`📊 Estatísticas Geradas:`);
  console.log(`   • Agendamentos Totais: ${totalAgendamentos}`);
  console.log(`   • Prontuários & Vacinas: ${totalProntuarios}`);
  console.log(`   • Clientes Ativos: ${clientesCriados.length}`);
  console.log(`   • Pets Atendidos: ${petsCriados.length}`);
  console.log(`   • Receita Bruta Movimentada: R$ ${totalReceitaCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log('\n📋 Credenciais para Acesso:');
  console.log('   admin / admin123 (Administrador)');
  console.log('   carla / admin123 (Médica Veterinária)');
  console.log('   maria / admin123 (Atendente)');
  console.log('   joao / tosador123 (Tosador)');

  process.exit(0);
} catch (err) {
  console.error('❌ Erro durante o seed de 2 anos:', err);
  process.exit(1);
}
