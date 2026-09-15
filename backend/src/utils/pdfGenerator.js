import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Caixa, ItensCaixa, Cliente } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

export async function gerarComprovante(caixaId) {
  try {
    const transacao = await Caixa.findOne({
      where: { id: caixaId },
      include: [{ model: Cliente, as: 'cliente' }]
    });
    if (!transacao) throw new Error('Lançamento não encontrado');
    const itens = await ItensCaixa.findAll({ where: { caixa_id: caixaId } });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const caminho = path.join(reportsDir, `comprovante_${caixaId}.pdf`);
    const stream = fs.createWriteStream(caminho);

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(caminho));
      stream.on('error', (err) => reject(err));
      doc.on('error', (err) => reject(err));

      doc.pipe(stream);

      // Cabeçalho
      doc.fillColor('#7c3aed').fontSize(24).text('🐾 PetShop Manager', { align: 'center' });
      doc.moveDown(0.3);
      doc.fillColor('#666').fontSize(10).text('Comprovante de Caixa - Lançamento', { align: 'center' });
      doc.moveDown(0.5);
      doc.strokeColor('#7c3aed').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Dados do caixa
      doc.fillColor('#000').fontSize(12);
      doc.text(`Lançamento Nº: ${String(caixaId).padStart(6, '0')}`, { align: 'right' });
      doc.text(`Data: ${new Date(transacao.criado_em).toLocaleString('pt-BR')}`, { align: 'right' });
      doc.moveDown(1);

      // Descrição
      doc.fillColor('#7c3aed').fontSize(14).text('Descrição do Lançamento');
      doc.fillColor('#000').fontSize(11);
      doc.text(`${transacao.descricao}`);
      doc.text(`Categoria: ${transacao.categoria.replace('_', ' ')}`);
      doc.moveDown(1);

      // Dados do cliente (se houver)
      if (transacao.cliente) {
        doc.fillColor('#7c3aed').fontSize(14).text('Cliente');
        doc.fillColor('#000').fontSize(11);
        doc.text(`Nome: ${transacao.cliente.nome}`);
        if (transacao.cliente.cpf) doc.text(`CPF: ${transacao.cliente.cpf}`);
        doc.text(`Telefone: ${transacao.cliente.telefone}`);
        if (transacao.cliente.email) doc.text(`Email: ${transacao.cliente.email}`);
        if (transacao.cliente.endereco) doc.text(`Endereço: ${transacao.cliente.endereco}`);
        doc.moveDown(1);
      }

      // Itens (se houver)
      if (itens.length > 0) {
        doc.fillColor('#7c3aed').fontSize(14).text('Detalhes');
        doc.moveDown(0.5);

        // Cabeçalho da tabela
        const tableTop = doc.y;
        doc.fillColor('#7c3aed').fontSize(10);
        doc.text('Item', 50, tableTop, { width: 250 });
        doc.text('Qtd', 310, tableTop, { width: 50, align: 'center' });
        doc.text('Unit.', 370, tableTop, { width: 80, align: 'right' });
        doc.text('Subtotal', 460, tableTop, { width: 80, align: 'right' });
        doc.moveDown(0.5);
        doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        // Linhas
        doc.fillColor('#000').fontSize(10);
        for (const item of itens) {
          const y = doc.y;
          doc.text(item.nome, 50, y, { width: 250 });
          doc.text(String(item.quantidade), 310, y, { width: 50, align: 'center' });
          doc.text(`R$ ${parseFloat(item.preco_unitario).toFixed(2)}`, 370, y, { width: 80, align: 'right' });
          doc.text(`R$ ${parseFloat(item.subtotal).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
          doc.moveDown(0.7);
        }

        doc.moveDown(0.5);
        doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
      }

      // Totais
      const val = parseFloat(transacao.valor) || 0;
      const subtotal = itens.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || val;
      const total = val;
      const desconto = Math.max(0, subtotal - total);

      const totalY = doc.y;
      doc.text('Subtotal:', 370, totalY, { width: 80, align: 'right' });
      doc.text(`R$ ${subtotal.toFixed(2)}`, 460, totalY, { width: 80, align: 'right' });
      
      if (desconto > 0) {
        doc.moveDown(0.5);
        const descY = doc.y;
        doc.text('Desconto:', 370, descY, { width: 80, align: 'right' });
        doc.text(`- R$ ${desconto.toFixed(2)}`, 460, descY, { width: 80, align: 'right' });
      }
      
      doc.moveDown(0.5);
      const totalFinalY = doc.y;
      doc.fillColor('#7c3aed').fontSize(14).text('VALOR:', 370, totalFinalY, { width: 80, align: 'right' });
      doc.text(`R$ ${total.toFixed(2)}`, 460, totalFinalY, { width: 80, align: 'right' });

      doc.moveDown(0.5);
      if (transacao.forma_pagamento) {
        doc.fillColor('#000').fontSize(11);
        doc.text(`Forma de pagamento: ${transacao.forma_pagamento}`);
      }

      doc.moveDown(2);
      doc.fillColor('#666').fontSize(9).text(
        'Obrigado pela preferência! 🐶🐱 Cuide sempre do seu pet com carinho.',
        { align: 'center' }
      );

      doc.end();
    });
  } catch (err) {
    throw err;
  }
}
