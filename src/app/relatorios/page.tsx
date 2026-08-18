'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Zap,
  CreditCard,
  Banknote,
  Repeat,
  Layers,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Car,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface PaymentMethodStat {
  id: string;
  label: string;
  color: string;
  icon: string;
  count: number;
  countPercentage: number;
  revenue: number;
  percentage: number;
  ticketMedio: number;
}

interface PaymentTransaction {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleModel: string;
  vehiclePlate: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

interface PaymentReportData {
  totalRevenue: number;
  totalCount: number;
  overallTicketMedio: number;
  topMethod: PaymentMethodStat | null;
  methods: PaymentMethodStat[];
  recentPayments: PaymentTransaction[];
}

export default function RelatoriosPage() {
  // PIN lock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState<'financeiro' | 'atendimentos' | 'clientes'>('financeiro');
  const [period, setPeriod] = useState<'1d' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<PaymentReportData | null>(null);
  const { showToast } = useToast();

  // Check if previously unlocked in this session or if SUPER_ADMIN
  useEffect(() => {
    const sessionUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('relatorios_unlocked') === 'true';
    if (sessionUnlocked) {
      setIsUnlocked(true);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role === 'SUPER_ADMIN') {
          setIsUnlocked(true);
          sessionStorage.setItem('relatorios_unlocked', 'true');
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
        sessionStorage.setItem('relatorios_unlocked', 'true');
        showToast('Relatórios desbloqueados com sucesso!', 'success');
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

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [statsRes, paymentRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/financial/by-payment-method?range=${period}`),
      ]);

      if (statsRes.ok) setStatsData(await statsRes.json());
      if (paymentRes.ok) setPaymentData(await paymentRes.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar relatórios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchReportData();
    }
  }, [period, isUnlocked]);

  const handleExportCSV = () => {
    if (!paymentData || paymentData.methods.length === 0) {
      showToast('Nenhum dado para exportar', 'warning');
      return;
    }

    try {
      const headers = ['Forma de Pagamento', 'Quantidade de Transações', '% do Volume', 'Faturamento Total (R$)', '% do Faturamento', 'Ticket Médio (R$)'];
      const rows = paymentData.methods.map((m) => [
        `"${m.label}"`,
        m.count,
        `"${m.countPercentage}%"`,
        `"${m.revenue.toFixed(2)}"`,
        `"${m.percentage}%"`,
        `"${m.ticketMedio.toFixed(2)}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_formas_pagamento_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Relatório CSV exportado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar arquivo CSV', 'error');
    }
  };

  const getPaymentIcon = (id: string, size = 16) => {
    switch (id?.toUpperCase()) {
      case 'PIX':
        return <Zap size={size} color="#06b6d4" />;
      case 'CREDIT':
        return <CreditCard size={size} color="#a855f7" />;
      case 'DEBIT':
        return <CreditCard size={size} color="#38bdf8" />;
      case 'MONEY':
        return <Banknote size={size} color="#22c55e" />;
      case 'MENSALISTA':
        return <Repeat size={size} color="#6366f1" />;
      default:
        return <Layers size={size} color="#94a3b8" />;
    }
  };

  const getPaymentLabel = (id: string) => {
    switch (id?.toUpperCase()) {
      case 'PIX':
        return 'PIX';
      case 'CREDIT':
        return 'Cartão de Crédito';
      case 'DEBIT':
        return 'Cartão de Débito';
      case 'MONEY':
        return 'Dinheiro';
      case 'MENSALISTA':
        return 'Faturado / Mensalista';
      default:
        return 'Outro / Não Informado';
    }
  };

  // Locked Screen View
  if (!isUnlocked) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(22, 28, 48, 0.92)',
            border: '1px solid rgba(0, 136, 230, 0.3)',
            borderRadius: '24px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 136, 230, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0, 136, 230, 0.35)',
            }}
          >
            <Lock size={34} color="#ffffff" />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0f4f8' }}>Relatórios Protegidos</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '6px', lineHeight: 1.5 }}>
              Digite o PIN de segurança de 4 dígitos para acessar o consolidado financeiro e relatórios executivos.
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
                  transition: 'all 0.2s ease',
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
                  padding: '4px',
                }}
              >
                {showPinText ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {pinError && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '0.8125rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                }}
              >
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
                opacity: verifyingPin || pinInput.length !== 4 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 20px rgba(0, 136, 230, 0.3)',
              }}
            >
              {verifyingPin ? 'Verificando...' : 'Acessar Relatórios'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios Operacionais & Financeiros</h1>
          <p className="page-subtitle">Consolidado de faturamento, formas de pagamento e desempenho da esteira</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs & Period filter bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button
            className={`tab ${activeTab === 'financeiro' ? 'active' : ''}`}
            onClick={() => setActiveTab('financeiro')}
          >
            <DollarSign size={16} /> Relatório Financeiro & Pagamentos
          </button>
          <button
            className={`tab ${activeTab === 'atendimentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('atendimentos')}
          >
            <BarChart3 size={16} /> Relatório de Atendimentos
          </button>
          <button
            className={`tab ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={16} /> Relatório de Clientes
          </button>
        </div>

        {/* Period selection */}
        {activeTab === 'financeiro' && (
          <div className="filter-chips">
            {[
              { id: '1d', label: 'Hoje' },
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: '3m', label: '3 Meses' },
              { id: '6m', label: '6 Meses' },
              { id: '1y', label: '1 Ano' },
              { id: 'all', label: 'Tudo' },
            ].map((p) => (
              <button
                key={p.id}
                className={`filter-chip ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id as any)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* TAB 1: RELATÓRIO FINANCEIRO & FORMAS DE PAGAMENTO */}
          {activeTab === 'financeiro' && paymentData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary-400)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-400)', textTransform: 'uppercase' }}>
                    Faturamento no Período
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formatCurrency(paymentData.totalRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {paymentData.totalCount} pagamentos registrados
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #06b6d4' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={13} /> Principal Forma de Pagamento
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {paymentData.topMethod ? paymentData.topMethod.label : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#06b6d4', marginTop: '2px', fontWeight: 600 }}>
                    {paymentData.topMethod
                      ? `${formatCurrency(paymentData.topMethod.revenue)} (${paymentData.topMethod.percentage}% do total)`
                      : 'Sem registros'}
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>
                    Ticket Médio
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formatCurrency(paymentData.overallTicketMedio)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Por atendimento entregue
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #a855f7' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>
                    Volume Total de Transações
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {paymentData.totalCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Veículos finalizados
                  </div>
                </div>
              </div>

              {/* Visual Distribution Progress Bar */}
              {paymentData.totalRevenue > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={18} color="var(--color-primary-400)" />
                    Distribuição Visual por Forma de Pagamento
                  </h3>

                  {/* Multi-segment bar */}
                  <div
                    style={{
                      display: 'flex',
                      height: '24px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      marginBottom: '16px',
                    }}
                  >
                    {paymentData.methods
                      .filter((m) => m.percentage > 0)
                      .map((m) => (
                        <div
                          key={m.id}
                          style={{
                            width: `${m.percentage}%`,
                            background: m.color,
                            height: '100%',
                            transition: 'width 0.4s ease',
                          }}
                          title={`${m.label}: ${formatCurrency(m.revenue)} (${m.percentage}%)`}
                        />
                      ))}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {paymentData.methods
                      .filter((m) => m.count > 0)
                      .map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color }} />
                          <strong style={{ color: 'var(--text-primary)' }}>{m.label}:</strong>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(m.revenue)} ({m.percentage}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TABLE: Gestão de Formas de Pagamento */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Tabela de Gerenciamento por Forma de Pagamento
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Detalhamento de transações, faturamento e representatividade de cada método
                    </p>
                  </div>
                </div>

                <div className="table-container" style={{ margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Forma de Pagamento</th>
                        <th style={{ textAlign: 'center' }}>Qtd. Pagamentos</th>
                        <th style={{ textAlign: 'center' }}>% das Transações</th>
                        <th style={{ textAlign: 'right' }}>Faturamento (R$)</th>
                        <th>% do Faturamento</th>
                        <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentData.methods.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: `${m.color}20`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {getPaymentIcon(m.id, 16)}
                              </div>
                              <span style={{ fontWeight: 700 }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {m.count}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                              {m.countPercentage}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: m.revenue > 0 ? m.color : 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
                            {formatCurrency(m.revenue)}
                          </td>
                          <td style={{ minWidth: '160px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${m.percentage}%`,
                                    height: '100%',
                                    background: m.color,
                                    borderRadius: '4px',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '36px', color: 'var(--text-secondary)' }}>
                                {m.percentage}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(m.ticketMedio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.03)', fontWeight: 800 }}>
                        <td>Total Geral</td>
                        <td style={{ textAlign: 'center' }}>{paymentData.totalCount}</td>
                        <td style={{ textAlign: 'center' }}>100%</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-primary-400)' }}>
                          {formatCurrency(paymentData.totalRevenue)}
                        </td>
                        <td>100%</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(paymentData.overallTicketMedio)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* TABLE: Extrato dos Últimos Pagamentos Recebidos */}
              {paymentData.recentPayments && paymentData.recentPayments.length > 0 && (
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                      Extrato dos Últimos Pagamentos Recebidos ({paymentData.recentPayments.length})
                    </h3>
                  </div>
                  <div className="table-container" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>Data / Hora</th>
                          <th>Cliente</th>
                          <th>Veículo</th>
                          <th>Forma de Pagamento</th>
                          <th style={{ textAlign: 'right' }}>Valor Recebido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentData.recentPayments.map((p) => (
                          <tr key={p.id}>
                            <td>{formatDate(p.createdAt)}</td>
                            <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                                {p.vehiclePlate}
                              </span>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>{p.vehicleModel}</span>
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                {getPaymentIcon(p.paymentMethod, 14)}
                                {getPaymentLabel(p.paymentMethod)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-400)' }}>
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RELATÓRIO DE ATENDIMENTOS */}
          {activeTab === 'atendimentos' && statsData && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumo Operacional de Atendimentos</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.washesMonth}</div>
                  <div className="stat-card-label">Lavagens no Mês</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.washesToday}</div>
                  <div className="stat-card-label">Lavagens Hoje</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.customersToday}</div>
                  <div className="stat-card-label">Clientes Hoje</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RELATÓRIO DE CLIENTES */}
          {activeTab === 'clientes' && statsData && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumo da Carteira de Clientes</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.totalCustomers}</div>
                  <div className="stat-card-label">Total de Clientes Cadastrados</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.recurrentCustomersCount}</div>
                  <div className="stat-card-label">Clientes Recorrentes (3+ visitas)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statsData.inactiveCustomersCount}</div>
                  <div className="stat-card-label">Clientes Inativos (&gt;45 dias)</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
