import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function BannerLicenca() {
  const [licenca, setLicenca] = useState(null);

  useEffect(() => {
    api.get('/licenca')
      .then(({ data }) => setLicenca(data))
      .catch(() => {});
  }, []);

  if (!licenca || (!licenca.aviso_expiracao && !licenca.expirada)) {
    return null;
  }

  const ehExpirada = licenca.expirada;

  return (
    <div style={{
      background: ehExpirada ? '#b91c1c' : '#d97706',
      color: '#ffffff',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: '600',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 999
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{ehExpirada ? '🚨' : '⏳'}</span>
        <span>
          {ehExpirada ? (
            <>Sua licença do PetShop Pro expirou! Renove para desbloquear novos agendamentos e faturamento.</>
          ) : (
            <>Atenção: Sua licença do PetShop Pro vence em <strong>{licenca.dias_restantes} dia(s)</strong> ({licenca.validade ? licenca.validade.split('-').reverse().join('/') : ''}).</>
          )}
        </span>
      </div>

      <Link
        to="/licenca"
        style={{
          background: '#ffffff',
          color: ehExpirada ? '#b91c1c' : '#b45309',
          padding: '4px 12px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: '700'
        }}
      >
        {ehExpirada ? 'Renovar Agora' : 'Ver Detalhes / Renovar'}
      </Link>
    </div>
  );
}
