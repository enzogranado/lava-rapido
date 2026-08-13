'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Award, Calendar, BarChart2, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });

interface ServiceBreakdown {
  serviceName: string;
  quantity: number;
  revenue: number;
}

export default function FinanceiroPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const [range, setRange] = useState<'1d' | '7d' | '30d' | '3m' | '6m' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{
    chartData: Array<{ date: string; revenue: number; count: number; ticketMedio: number }>;
    totalRevenue: number;
    totalCount: number;
    overallTicketMedio: number;
  } | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue');
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role === 'SUPER_ADMIN') {
          setIsUnlocked(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (pinInput.trim().length !== 4) {
      setPinError('O PIN de segurança deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    try {
      setVerifyingPin(true);
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        showToast('Métricas financeiras desbloqueadas com sucesso!', 'success');
      } else {
        setPinError(data.error || 'PIN incorreto. Acesso negado.');
      }
    } catch (err) {
      console.error(err);
      setPinError('Erro ao verificar o PIN de segurança.');
    } finally {
      setVerifyingPin(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [revRes, svcRes] = await Promise.all([
        fetch(`/api/financial/revenue?range=${range}`),
        fetch(`/api/financial/by-service?range=${range}`),
      ]);

      if (revRes.ok) setRevenueData(await revRes.json());
      if (svcRes.ok) setServiceBreakdown(await svcRes.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchFinancialData();
    }
  }, [range, isUnlocked]);

  const sortedBreakdown = [...serviceBreakdown].sort((a, b) =>
    sortBy === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity
  );

  if (!isUnlocked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(22, 28, 48, 0.9)',
          border: '1px solid rgba(0, 136, 230, 0.3)',
          borderRadius: '24px',
          padding: '36px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 136, 230, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(0, 136, 230, 0.35)'
          }}>
            <Lock size={32} color="#ffffff" />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0f4f8' }}>Módulo Financeiro Protegido</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '6px', lineHeight: 1.5 }}>
              Digite o PIN numérico de 4 dígitos para acessar o módulo de gestão financeira do lava-rápido.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPinText ? 'text' : 'password'}
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: pinError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  fontWeight: 700,
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPinText(!showPinText)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPinText ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {pinError && (
              <div style={{
                color: '#f87171',
                fontSize: '0.8125rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 14px',
                borderRadius: '10px'
              }}>
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingPin || pinInput.length !== 4}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: (verifyingPin || pinInput.length !== 4) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 20px rgba(0, 136, 230, 0.3)'
              }}
            >
              <KeyRound size={18} />
              {verifyingPin ? 'Verificando PIN...' : 'Desbloquear Módulo Financeiro'}
            </button>
          </form>

          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
            Dica: Se esqueceu o PIN, solicite a alteração nas Configurações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle Financeiro & Receita</h1>
          <p className="page-subtitle">Acompanhe as entradas do caixa, evolução do ticket médio e ranking de serviços</p>
        </div>
        <div className="filter-chips">
          {(['1d', '7d', '30d', '3m', '6m', '1y'] as const).map((r) => (
            <button
              key={r}
              className={`filter-chip ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === '1d' ? 'Hoje' : r === '7d' ? '7 dias' : r === '30d' ? '30 dias' : r === '3m' ? '3 meses' : r === '6m' ? '6 meses' : '1 ano'}
            </button>
          ))}
        </div>
      </div>

      {loading || !revenueData ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(revenueData.totalRevenue)}</div>
              <div className="stat-card-label">Receita no Período</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
                <Calendar size={22} />
              </div>
              <div className="stat-card-value">{revenueData.totalCount}</div>
              <div className="stat-card-label">Atendimentos Concluídos</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Award size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(revenueData.overallTicketMedio)}</div>
              <div className="stat-card-label">Ticket Médio do Período</div>
            </div>
          </div>

          {/* Revenue Chart over Time */}
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Evolução da Receita (R$)</h3>
            </div>
            <div className="chart-canvas-wrapper">
              <LineChart
                data={{
                  labels: revenueData.chartData.map((d) => d.date),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: revenueData.chartData.map((d) => d.revenue),
                      borderColor: '#22c55e',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#22c55e',
                      pointRadius: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#111627',
                      titleColor: '#f0f4f8',
                      bodyColor: '#94a3b8',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderWidth: 1,
                      padding: 10,
                      callbacks: {
                        label: (context) => ` Receita: ${formatCurrency(context.parsed.y ?? 0)}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.04)' },
                      ticks: {
                        color: '#94a3b8',
                        autoSkip: true,
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        minRotation: 0,
                        font: { size: 10 },
                      },
                    },
                    y: {
                      grid: { color: 'rgba(255, 255, 255, 0.04)' },
                      ticks: {
                        color: '#94a3b8',
                        font: { size: 10 },
                        callback: (val) => {
                          const num = Number(val);
                          if (num >= 1000) return `R$ ${(num / 1000).toFixed(1).replace('.0', '')}k`;
                          return `R$ ${num}`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Revenue by Service Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Receita por Serviço</h3>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${sortBy === 'revenue' ? 'active' : ''}`}
                  onClick={() => setSortBy('revenue')}
                >
                  Maior Receita
                </button>
                <button
                  className={`filter-chip ${sortBy === 'quantity' ? 'active' : ''}`}
                  onClick={() => setSortBy('quantity')}
                >
                  Maior Quantidade
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th style={{ textAlign: 'right' }}>Quantidade Vendida</th>
                    <th style={{ textAlign: 'right' }}>Receita Gerada</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.serviceName}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ height: '260px', marginTop: '24px' }}>
              <BarChart
                data={{
                  labels: sortedBreakdown.map((i) => i.serviceName),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: sortedBreakdown.map((i) => i.revenue),
                      backgroundColor: '#0088e6',
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
