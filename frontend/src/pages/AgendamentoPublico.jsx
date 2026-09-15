import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AgendamentoPublico() {
  const [petshop, setPetshop] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [form, setForm] = useState({
    tutor_nome: '',
    tutor_telefone: '',
    tutor_email: '',
    pet_nome: '',
    pet_especie: 'cachorro',
    pet_raca: '',
    servico_id: '',
    data_agendada: new Date().toISOString().split('T')[0],
    hora_agendada: '09:00',
    observacoes: ''
  });

  useEffect(() => {
    api.get('/publico/info').then(({ data }) => {
      setPetshop(data);
      if (data.servicos?.length > 0) {
        setForm(f => ({ ...f, servico_id: data.servicos[0].id }));
      }
      setCarregando(false);
    }).catch(() => setCarregando(false));
  }, []);

  async function agendar(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/publico/agendar', form);
      setSucesso(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao realizar agendamento');
    }
  }

  if (carregando) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados do Pet Shop...</div>;
  }

  if (sucesso) {
    return (
      <div style={{ maxWidth: 540, margin: '40px auto', padding: 24, textAlign: 'center', background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 24, color: 'var(--secondary)', marginBottom: 8 }}>Agendamento Confirmado!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          Recebemos o seu agendamento e nossa equipe já está preparando tudo para receber o seu pet!
        </p>

        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)', textAlign: 'left', marginBottom: 24, fontSize: 14 }}>
          <p style={{ margin: 0 }}>Protocolo: <strong>{sucesso.protocolo}</strong></p>
          <p style={{ margin: '4px 0 0' }}>Pet: <strong>🐾 {form.pet_nome}</strong></p>
          <p style={{ margin: '4px 0 0' }}>Data: <strong>{new Date(form.data_agendada + 'T00:00:00').toLocaleDateString('pt-BR')} às {form.hora_agendada}</strong></p>
          <p style={{ margin: '4px 0 0' }}>Local: <strong>{petshop?.endereco}</strong></p>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSucesso(null)}>
          Fazer Outro Agendamento
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff7ed 0%, #f8fafc 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        
        {/* Banner do Pet Shop */}
        <div style={{ background: 'var(--secondary)', color: '#fff', padding: '28px 24px', textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 54, height: 54, background: 'var(--primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', boxShadow: 'var(--shadow-glow)' }}>
            🐾
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{petshop?.nome || 'PetShop Pro'}</h1>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{petshop?.endereco}</p>
          <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
            ⏰ {petshop?.horario_funcionamento}
          </div>
        </div>

        {/* Formulário de Agendamento */}
        <form onSubmit={agendar} style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--secondary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            1. Seus Dados (Tutor)
          </h2>

          <div className="form-group">
            <label>Seu Nome Completo *</label>
            <input placeholder="Ex: Ana Silva" value={form.tutor_nome} onChange={(e) => setForm({ ...form, tutor_nome: e.target.value })} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp / Celular *</label>
              <input placeholder="(11) 99999-9999" value={form.tutor_telefone} onChange={(e) => setForm({ ...form, tutor_telefone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email (Opcional)</label>
              <input type="email" placeholder="seu@email.com" value={form.tutor_email} onChange={(e) => setForm({ ...form, tutor_email: e.target.value })} />
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--secondary)', margin: '24px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            2. Dados do seu Pet
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label>Nome do Pet *</label>
              <input placeholder="Ex: Thor" value={form.pet_nome} onChange={(e) => setForm({ ...form, pet_nome: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Espécie *</label>
              <select value={form.pet_especie} onChange={(e) => setForm({ ...form, pet_especie: e.target.value })}>
                <option value="cachorro">🐶 Cachorro</option>
                <option value="gato">🐱 Gato</option>
                <option value="outro">🐾 Outro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Raça do Pet</label>
            <input placeholder="Ex: Golden Retriever, Poodle, SRD (Vira-lata)" value={form.pet_raca} onChange={(e) => setForm({ ...form, pet_raca: e.target.value })} />
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--secondary)', margin: '24px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            3. Escolha o Serviço & Horário
          </h2>

          <div className="form-group">
            <label>Serviço Desejado *</label>
            <select value={form.servico_id} onChange={(e) => setForm({ ...form, servico_id: e.target.value })} required>
              {petshop?.servicos?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nome} - R$ {parseFloat(s.preco_promocional || s.preco_base).toFixed(2).replace('.', ',')} ({s.duracao_minutos} min)
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data Preferida *</label>
              <input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Horário *</label>
              <select value={form.hora_agendada} onChange={(e) => setForm({ ...form, hora_agendada: e.target.value })} required>
                <option>08:00</option>
                <option>09:00</option>
                <option>10:00</option>
                <option>11:00</option>
                <option>13:30</option>
                <option>14:30</option>
                <option>15:30</option>
                <option>16:30</option>
                <option>17:30</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Observações Especiais (Alergias, Cuidados Especiais)</label>
            <textarea rows="2" placeholder="Ex: Pet idoso, cuidado com a orelha direita." value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 12 }}>
            📅 Confirmar Meu Agendamento
          </button>
        </form>
      </div>
    </div>
  );
}
