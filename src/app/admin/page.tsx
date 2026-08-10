'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store,
  DollarSign,
  Calendar,
  Users,
  Search,
  Power,
  CheckCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building,
  UserCheck,
  FileText,
  KeyRound,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface TenantMetric {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string;
  ownerName: string;
  active: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  monthlyFee: number;
  lastPaymentDate: string | null;
  dashboardPin?: string;
  pendingPinChange?: string | null;
  pinChangeReason?: string | null;
  pinChangeStatus?: string | null;
  createdAt: string;
  counts: {
    customers: number;
    vehicles: number;
    washes: number;
  };
  revenueMonth: number;
  washesMonth: number;
  revenueWeek: number;
  revenueTotal: number;
}

interface GlobalCustomer {
  id: string;
  name: string;
  phone: string;
  tenantName: string;
  tenantId: string;
  totalVisits: number;
  totalSpent: number;
  createdAt: string;
}

interface AdminSummary {
  totalTenants: number;
  activeTenants: number;
  pendingApprovals: number;
  pinRequestsCount?: number;
  revenueMonth: number;
  washesMonth: number;
  revenueTotal: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'tenants' | 'customers'>('overview');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [pendingTenants, setPendingTenants] = useState<TenantMetric[]>([]);
  const [approvedTenants, setApprovedTenants] = useState<TenantMetric[]>([]);
  const [pinChangeRequests, setPinChangeRequests] = useState<TenantMetric[]>([]);
  const [allTenants, setAllTenants] = useState<TenantMetric[]>([]);
  const [globalCustomers, setGlobalCustomers] = useState<GlobalCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTenant, setSearchTenant] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const { showToast } = useToast();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPendingTenants(data.pendingTenants || []);
        setApprovedTenants(data.approvedTenants || []);
        setPinChangeRequests(data.pinChangeRequests || []);
        setAllTenants(data.tenants || []);
        setGlobalCustomers(data.globalCustomers || []);
      } else {
        showToast('Acesso restrito a administradores', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do painel admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTenantAction = async (
    tenantId: string,
    action: 'APPROVE' | 'REJECT' | 'TOGGLE_ACTIVE' | 'SET_PAYMENT_STATUS' | 'APPROVE_PIN_CHANGE' | 'REJECT_PIN_CHANGE',
    extraData?: any
  ) => {
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, action, ...extraData }),
      });

      if (res.ok) {
        if (action === 'APPROVE') showToast('Lava-Rápido aprovado com sucesso!', 'success');
        if (action === 'REJECT') showToast('Cadastro de Lava-Rápido recusado.', 'info');
        if (action === 'TOGGLE_ACTIVE') showToast('Status de acesso alterado.', 'success');
        if (action === 'SET_PAYMENT_STATUS') showToast('Status da mensalidade atualizado.', 'success');
        if (action === 'APPROVE_PIN_CHANGE') showToast('Troca de PIN aprovada com sucesso!', 'success');
        if (action === 'REJECT_PIN_CHANGE') showToast('Solicitação de troca de PIN recusada.', 'info');
        fetchAdminData();
      } else {
        showToast('Erro ao executar ação no lava-rápido', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão com o servidor', 'error');
    }
  };

  const filteredTenants = allTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTenant.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTenant.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTenant.toLowerCase())
  );

  const filteredCustomers = globalCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.phone.includes(searchCustomer) ||
      c.tenantName.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={30} color="#a855f7" />
            Painel Administrador Master
          </h1>
          <p className="page-subtitle">
            Aprovação de fichas cadastrais, controle de mensalidades, vendas e visão unificada da plataforma
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ gap: '8px' }}
        >
          <Building size={18} />
          Visão Geral
        </button>

        <button
          className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('approvals')}
          style={{ gap: '8px', position: 'relative' }}
        >
          <Clock size={18} />
          Aprovações Pendentes
          {pendingTenants.length > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: '4px'
            }}>
              {pendingTenants.length}
            </span>
          )}
        </button>

        <button
          className={`btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tenants')}
          style={{ gap: '8px' }}
        >
          <CreditCard size={18} />
          Lava-Rápidos & Mensalidades
        </button>

        <button
          className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('customers')}
          style={{ gap: '8px' }}
        >
          <Users size={18} />
          Clientes da Plataforma ({globalCustomers.length})
        </button>
      </div>

      {loading || !summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                    <Store size={22} />
                  </div>
                  <div className="stat-card-value">{summary.totalTenants}</div>
                  <div className="stat-card-label">Lava-Rápidos Aprovados ({summary.activeTenants} ativos)</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <Clock size={22} />
                  </div>
                  <div className="stat-card-value">{summary.pendingApprovals}</div>
                  <div className="stat-card-label">Fichas Cadastrais Pendentes</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                    <DollarSign size={22} />
                  </div>
                  <div className="stat-card-value">{formatCurrency(summary.revenueMonth)}</div>
                  <div className="stat-card-label">Vendas Globais no Mês</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
                    <Calendar size={22} />
                  </div>
                  <div className="stat-card-value">{summary.washesMonth}</div>
                  <div className="stat-card-label">Lavagens no Mês (Plataforma)</div>
                </div>
              </div>

              {/* Pendentes Highlight Banner if any */}
              {pendingTenants.length > 0 && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Clock size={28} color="#ef4444" />
                    <div>
                      <h4 style={{ fontWeight: 700, color: '#f0f4f8' }}>Existem {pendingTenants.length} Ficha(s) Cadastral(is) aguardando aprovação!</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Novos lava-rápidos se registraram e precisam da liberação para acessar o sistema.</p>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setActiveTab('approvals')}>
                    Ver Fichas Pendentes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APROVAÇÕES PENDENTES (FICHAS CADASTRAIS) */}
          {activeTab === 'approvals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Fichas Cadastrais em Análise ({pendingTenants.length})</h3>
              </div>

              {pendingTenants.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                  <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                  <h4>Nenhuma ficha pendente de aprovação!</h4>
                  <p style={{ fontSize: '0.875rem', marginTop: '6px' }}>Todos os lava-rápidos cadastrados já foram analisados.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                  {pendingTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      style={{
                        background: 'rgba(22, 28, 48, 0.9)',
                        border: '1px solid rgba(0, 136, 230, 0.25)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                            Aguardando Aprovação
                          </span>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f0f4f8' }}>{tenant.name}</h4>
                          <span style={{ fontSize: '0.8125rem', color: '#38bdf8' }}>slug: {tenant.slug}</span>
                        </div>
                        <FileText size={28} color="#0088e6" />
                      </div>

                      <div style={{
                        background: 'rgba(13, 18, 32, 0.6)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div><strong style={{ color: '#94a3b8' }}>Proprietário:</strong> <span style={{ color: '#f0f4f8' }}>{tenant.ownerName}</span></div>
                        <div><strong style={{ color: '#94a3b8' }}>E-mail de Acesso:</strong> <span style={{ color: '#f0f4f8' }}>{tenant.email}</span></div>
                        <div><strong style={{ color: '#94a3b8' }}>Telefone/WhatsApp:</strong> <span style={{ color: '#f0f4f8' }}>{tenant.phone || 'Não informado'}</span></div>
                        <div><strong style={{ color: '#94a3b8' }}>Data do Cadastro:</strong> <span style={{ color: '#f0f4f8' }}>{formatDate(tenant.createdAt)}</span></div>
                        <div><strong style={{ color: '#94a3b8' }}>Mensalidade Acordada:</strong> <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatCurrency(tenant.monthlyFee)} /mês</span></div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button
                          className="btn btn-success"
                          style={{ flex: 1, padding: '10px', justifyContent: 'center', fontWeight: 700 }}
                          onClick={() => handleTenantAction(tenant.id, 'APPROVE')}
                        >
                          <CheckCircle2 size={16} /> Aprovar & Liberar
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '10px', justifyContent: 'center' }}
                          onClick={() => handleTenantAction(tenant.id, 'REJECT')}
                          title="Recusar cadastro"
                        >
                          <XCircle size={16} /> Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SEÇÃO DE SOLICITAÇÕES DE TROCA DE PIN DO DASHBOARD */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={22} color="#a855f7" />
                  Solicitações de Troca de PIN do Dashboard ({pinChangeRequests.length})
                </h3>

                {pinChangeRequests.length === 0 ? (
                  <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Nenhuma solicitação de troca de PIN pendente no momento.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {pinChangeRequests.map((tenant) => (
                      <div
                        key={tenant.id}
                        style={{
                          background: 'rgba(22, 28, 48, 0.9)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          borderRadius: '16px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.75rem', marginBottom: '8px' }}>
                              Troca de PIN Solicitada
                            </span>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f0f4f8' }}>{tenant.name}</h4>
                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>E-mail: {tenant.email}</span>
                          </div>
                          <KeyRound size={28} color="#a855f7" />
                        </div>

                        <div style={{
                          background: 'rgba(13, 18, 32, 0.6)',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          fontSize: '0.875rem'
                        }}>
                          <div>
                            <strong style={{ color: '#94a3b8' }}>PIN Atual:</strong>{' '}
                            <span style={{ color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>{tenant.dashboardPin || '1234'}</span>
                          </div>
                          <div>
                            <strong style={{ color: '#94a3b8' }}>Novo PIN Solicitado:</strong>{' '}
                            <span style={{ color: '#22c55e', fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.1em' }}>
                              {tenant.pendingPinChange}
                            </span>
                          </div>
                          <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <strong style={{ color: '#38bdf8' }}>Motivo Informado pelo Cliente:</strong>
                            <p style={{ color: '#f0f4f8', marginTop: '4px', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                              &quot;{tenant.pinChangeReason || 'Sem motivo detalhado'}&quot;
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1, background: '#22c55e', borderColor: '#22c55e', gap: '6px' }}
                            onClick={() => handleTenantAction(tenant.id, 'APPROVE_PIN_CHANGE')}
                          >
                            <CheckCircle2 size={16} /> Aprovar Novo PIN
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '6px' }}
                            onClick={() => handleTenantAction(tenant.id, 'REJECT_PIN_CHANGE')}
                          >
                            <XCircle size={16} /> Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LAVA-RÁPIDOS & MENSALIDADES */}
          {activeTab === 'tenants' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Lava-Rápidos & Controle de Mensalidades</h3>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Buscar por lava-rápido..."
                    value={searchTenant}
                    onChange={(e) => setSearchTenant(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lava-Rápido</th>
                      <th>Contato</th>
                      <th style={{ textAlign: 'right' }}>Vendas (Mês)</th>
                      <th style={{ textAlign: 'right' }}>Vendas (Total)</th>
                      <th>Status Cadastro</th>
                      <th>Mensalidade</th>
                      <th>Acesso</th>
                      <th style={{ textAlign: 'right' }}>Ações de Controle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{tenant.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>slug: {tenant.slug}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tenant.ownerName}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{tenant.email}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                          {formatCurrency(tenant.revenueMonth)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(tenant.revenueTotal)}
                        </td>
                        <td>
                          {tenant.status === 'APPROVED' && <span className="badge badge-success">Aprovado</span>}
                          {tenant.status === 'PENDING' && <span className="badge badge-warning">Pendente</span>}
                          {tenant.status === 'REJECTED' && <span className="badge badge-danger">Recusado</span>}
                        </td>
                        <td>
                          <select
                            value={tenant.paymentStatus}
                            onChange={(e) =>
                              handleTenantAction(tenant.id, 'SET_PAYMENT_STATUS', {
                                paymentStatus: e.target.value,
                              })
                            }
                            style={{
                              background: '#0d1220',
                              color: tenant.paymentStatus === 'PAID' ? '#22c55e' : tenant.paymentStatus === 'OVERDUE' ? '#ef4444' : '#eab308',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="PAID">🟢 Pago (Em dia)</option>
                            <option value="PENDING">🟡 Pendente</option>
                            <option value="OVERDUE">🔴 Em Atraso (Bloquear)</option>
                          </select>
                        </td>
                        <td>
                          {tenant.active ? (
                            <span className="badge badge-success">Liberado</span>
                          ) : (
                            <span className="badge badge-danger">Bloqueado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={`btn btn-sm ${tenant.active ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleTenantAction(tenant.id, 'TOGGLE_ACTIVE', { active: !tenant.active })}
                          >
                            <Power size={14} />
                            {tenant.active ? 'Bloquear Acesso' : 'Liberar Acesso'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TODOS OS CLIENTES FINAIS DA PLATAFORMA */}
          {activeTab === 'customers' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Clientes Cadastrados na Plataforma</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Visão de todos os clientes cadastrados pelos lava-rápidos parceiros</p>
                </div>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Buscar cliente, telefone ou lava-rápido..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone / WhatsApp</th>
                      <th>Lava-Rápido Pertencente</th>
                      <th style={{ textAlign: 'right' }}>Total de Visitas</th>
                      <th style={{ textAlign: 'right' }}>Total Gasto em Lavagens</th>
                      <th>Cadastrado Em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cust.name}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{cust.phone}</td>
                          <td>
                            <span className="badge badge-info" style={{ fontWeight: 600 }}>
                              {cust.tenantName}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{cust.totalVisits}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>
                            {formatCurrency(cust.totalSpent)}
                          </td>
                          <td>{formatDate(cust.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
