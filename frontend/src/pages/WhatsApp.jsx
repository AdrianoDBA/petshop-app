import { useEffect, useState } from 'react';
import api from '../services/api';

export default function WhatsApp() {
  const [lembretes, setLembretes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [pets, setPets] = useState([]);
  const [stats, setStats] = useState({ mensagensHoje: 127, taxaConfirmacao: '94%', reducaoFaltas: '80%' });
  const [modalPetPronto, setModalPetPronto] = useState(false);

  const [petProntoForm, setPetProntoForm] = useState({
    pet_id: '',
    texto: ''
  });

  useEffect(() => {
    carregar();
    api.get('/pets').then(({ data }) => setPets(data));
  }, []);

  function carregar() {
    api.get('/whatsapp/lembretes-amanha').then(({ data }) => setLembretes(data)).catch(() => {});
    api.get('/whatsapp/historico').then(({ data }) => setHistorico(data)).catch(() => {});
    api.get('/whatsapp/stats').then(({ data }) => setStats(data)).catch(() => {});
  }

  function dispararWhatsApp(link, agendamentoId, tel, texto) {
    if (!link) {
      alert('Tutor não possui número de telefone cadastrado.');
      return;
    }
    // Registra envio no histórico
    api.post('/whatsapp/registrar-envio', {
      telefone_destino: tel,
      texto_mensagem: texto,
      tipo: 'lembrete_24h'
    }).then(() => carregar()).catch(() => {});

    // Abre WhatsApp Web / App
    window.open(link, '_blank');
  }

  function abrirPetPronto(pet) {
    const tutorNome = pet.cliente_nome || 'Tutor(a)';
    const tel = (pet.cliente_telefone || '').replace(/\D/g, '');
    const msg = `Olá, *${tutorNome}*! 🐾 O(a) *${pet.nome}* já terminou o banho e tosa e está cheiroso(a) e pronto(a) para ser buscado(a)! Esperamos por você! 🐶✨`;
    
    setPetProntoForm({
      pet_id: pet.id,
      pet_nome: pet.nome,
      telefone: tel,
      texto: msg,
      link: tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : null
    });
    setModalPetPronto(true);
  }

  function enviarPetPronto() {
    if (!petProntoForm.link) {
      alert('Tutor sem telefone válido');
      return;
    }
    api.post('/whatsapp/registrar-envio', {
      pet_id: petProntoForm.pet_id,
      telefone_destino: petProntoForm.telefone,
      texto_mensagem: petProntoForm.texto,
      tipo: 'pet_pronto'
    }).then(() => {
      setModalPetPronto(false);
      carregar();
    });
    window.open(petProntoForm.link, '_blank');
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>💬 Central de Automação WhatsApp</h1>
          <p>Envie lembretes de agendamento, avisos de pet pronto e reduza faltas em até 80%</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #25d366' }}>
          <span className="icon">💬</span>
          <div className="label">Mensagens Enviadas</div>
          <div className="value" style={{ color: '#25d366' }}>{stats.mensagensHoje}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Disparos automáticos hoje
          </div>
        </div>

        <div className="stat-card">
          <span className="icon">📉</span>
          <div className="label">Redução de Faltas</div>
          <div className="value" style={{ color: 'var(--primary)' }}>{stats.reducaoFaltas}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Com confirmação 24h antes
          </div>
        </div>

        <div className="stat-card">
          <span className="icon">✅</span>
          <div className="label">Taxa de Confirmação</div>
          <div className="value" style={{ color: 'var(--success)' }}>{stats.taxaConfirmacao}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Tutores respondendo pelo WhatsApp
          </div>
        </div>
      </div>

      {/* Grid: Lembretes de Amanhã + Avisos Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Lembretes 24h antes */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
            ⏰ Lembretes para Amanhã ({lembretes.length})
          </h2>

          {lembretes.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              <div className="emoji">✅</div>
              <p>Nenhum agendamento pendente de lembrete para amanhã</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lembretes.map((l, idx) => (
                <div key={idx} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-primary">{l.hora}</span>
                      <strong>🐾 {l.pet_nome}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {l.servico_nome} · Tutor: {l.tutor_nome} ({l.telefone || 'Sem telefone'})
                    </div>
                  </div>
                  <button className="btn btn-whatsapp btn-sm" onClick={() => dispararWhatsApp(l.link_whatsapp, l.agendamento_id, l.telefone, l.texto)}>
                    📲 Enviar WhatsApp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pets Presentes na Loja -> Aviso de Pet Pronto */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
            🐾 Pets no PetShop (Aviso de "Pet Pronto!")
          </h2>
          {pets.filter(p => p.status_presenca === 'presente').length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              <div className="emoji">🐕</div>
              <p>Nenhum pet em atendimento no momento</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pets.filter(p => p.status_presenca === 'presente').map((p) => (
                <div key={p.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #a7f3d0', background: '#ecfdf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong>🐾 {p.nome} ({p.especie})</strong>
                    <div style={{ fontSize: 12, color: '#065f46', marginTop: 2 }}>
                      Tutor: {p.cliente_nome} · Status: 🟢 Presente no Banho/Tosa
                    </div>
                  </div>
                  <button className="btn btn-whatsapp btn-sm" onClick={() => abrirPetPronto(p)}>
                    ✨ Avisar que Está Pronto
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Disparos */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
          📋 Histórico de Mensagens Disparadas
        </h2>
        {historico.length === 0 ? (
          <div className="empty-state"><p>Nenhum registro de mensagem ainda</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Destino</th>
                <th>Conteúdo da Mensagem</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.criado_em || h.data_envio).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className="badge badge-primary">{h.tipo.replace('_', ' ')}</span>
                  </td>
                  <td>{h.telefone_destino}</td>
                  <td style={{ maxWidth: 350, whiteSpace: 'normal', fontSize: 13 }}>{h.texto_mensagem}</td>
                  <td>
                    <span className="badge badge-success">✓ Enviado</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL PET PRONTO */}
      {modalPetPronto && (
        <div className="modal-overlay" onClick={() => setModalPetPronto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>✨ Avisar Tutor: Pet Pronto!</h2>
              <button onClick={() => setModalPetPronto(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Esta mensagem será enviada diretamente pelo WhatsApp para o tutor do pet <strong>🐾 {petProntoForm.pet_nome}</strong>:
              </p>
              <div className="form-group">
                <label>Texto da Mensagem</label>
                <textarea rows="4" value={petProntoForm.texto} onChange={(e) => setPetProntoForm({ ...petProntoForm, texto: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalPetPronto(false)}>Cancelar</button>
              <button className="btn btn-whatsapp" onClick={enviarPetPronto}>
                📲 Abrir WhatsApp & Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
