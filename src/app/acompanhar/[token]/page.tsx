'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Droplets, Car, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatTime, timeDuration, STATUS_STEPS } from '@/lib/utils';

interface TrackingInfo {
  businessName: string;
  customerFirstName: string;
  status: string;
  vehicle: { model: string; plate: string; color?: string | null };
  items: Array<{ name: string; quantity: number }>;
  total: number;
  createdAt: string;
}

const POLL_INTERVAL_MS = 10000;

const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 50% 35%, #16203d 0%, #0a0e1a 75%)',
  padding: '32px 16px',
  boxSizing: 'border-box',
};

export default function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<TrackingInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/tracking/${token}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
        setNotFound(false);
        setServerError(false);
        setLastUpdated(new Date());
      } else if (res.status === 404) {
        setNotFound(true);
      } else {
        setServerError(true);
      }
    } catch (err) {
      console.error(err);
      setServerError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <XCircle size={48} color="var(--color-danger)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Link inválido ou expirado</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9375rem' }}>
            Não encontramos nenhum atendimento com este link. Confira o link enviado pelo WhatsApp ou entre em contato com o lava-rápido.
          </p>
        </div>
      </div>
    );
  }

  if (serverError || !data) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <RefreshCw size={40} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Não foi possível carregar agora</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9375rem' }}>
            Estamos tentando novamente automaticamente. Se o problema continuar, tente recarregar a página em alguns instantes.
          </p>
        </div>
      </div>
    );
  }

  const isCancelled = data.status === 'CANCELLED';
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.id === data.status);
  const currentStep = STATUS_STEPS[currentStepIdx];

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Branding header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Droplets size={20} color="white" />
          </div>
          <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.businessName}</span>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
          Olá, {data.customerFirstName}! Acompanhe seu atendimento em tempo real.
        </p>

        {/* Vehicle card */}
        <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Car size={22} color="var(--color-primary-400)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {data.vehicle.model}{data.vehicle.color ? ` (${data.vehicle.color})` : ''}
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary-400)', fontSize: '0.875rem' }}>
              {data.vehicle.plate}
            </div>
          </div>
        </div>

        {isCancelled ? (
          <div className="card" style={{ padding: '20px', textAlign: 'center', borderLeft: '4px solid var(--color-danger)' }}>
            <XCircle size={32} color="var(--color-danger)" />
            <div style={{ fontWeight: 800, fontSize: '1.0625rem', marginTop: '8px', color: 'var(--text-primary)' }}>
              Atendimento Cancelado
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Este atendimento foi cancelado. Fale com o lava-rápido se tiver dúvidas.
            </p>
          </div>
        ) : (
          <>
            {/* Current status highlight */}
            <div className="card" style={{ padding: '20px', textAlign: 'center', borderLeft: `4px solid ${currentStep?.color}` }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                Status Atual
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: currentStep?.color, marginTop: '4px' }}>
                {currentStep?.shortLabel}
              </div>
              {data.status === 'READY' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                  Seu carro está pronto! 🎉 Pode vir buscar quando quiser.
                </p>
              )}
              {data.status === 'DELIVERED' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                  Carro entregue. Obrigado pela preferência! 🚗✨
                </p>
              )}
            </div>

            {/* 4-step tracker */}
            <div className="card" style={{ padding: '20px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const isLast = idx === STATUS_STEPS.length - 1;
                  return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '64px' }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDone || isCurrent ? step.color : 'var(--bg-tertiary)',
                            boxShadow: isCurrent ? `0 0 0 4px ${step.color}33` : 'none',
                            color: isDone || isCurrent ? 'white' : 'var(--text-tertiary)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            textAlign: 'center',
                            color: isCurrent ? step.color : 'var(--text-tertiary)',
                            fontWeight: isCurrent ? 700 : 500,
                            lineHeight: 1.2,
                          }}
                        >
                          {step.shortLabel}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          style={{
                            flex: 1,
                            height: '2px',
                            marginTop: '13px',
                            background: isDone ? step.color : 'var(--glass-border)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Services + total */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Serviços
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {data.items.map((item, idx) => (
              <span key={idx} className="badge badge-neutral">
                {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-400)' }}>{formatCurrency(data.total)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            <span>Entrada às {formatTime(data.createdAt)} · há {timeDuration(data.createdAt)}</span>
          </div>
        </div>

        {/* Auto-refresh footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={12} />
          <span>Atualizado automaticamente{lastUpdated ? ` às ${formatTime(lastUpdated)}` : ''}</span>
        </div>
      </div>
    </div>
  );
}
