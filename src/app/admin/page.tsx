'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Store, DollarSign, Calendar, Users, Search, Power, CheckCircle, AlertTriangle } from 'lucide-react';
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

interface AdminSummary {
  totalTenants: number;
  activeTenants: number;
  revenueMonth: number;
  washesMonth: number;
  revenueTotal: number;
}

export default function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [tenants, setTenants] = useState<TenantMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTenants(data.tenants);
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

  const toggleTenantStatus = async (tenantId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, active: !currentActive }),
      });

      if (res.ok) {
        showToast(`Status do lava-rápido alterado com sucesso`, 'success');
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, active: !currentActive } : t))
        );
      } else {
        showToast('Erro ao alterar status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao alterar status', 'error');
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#a855f7" />
            Painel Administrador da Plataforma
          </h1>
          <p className="page-subtitle">
            Gerenciamento global de lava-rápidos cadastrados, faturamento consolidado e status dos clientes
          </p>
        </div>
      </div>

      {loading || !summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Store size={22} />
              </div>
              <div className="stat-card-value">{summary.totalTenants}</div>
              <div className="stat-card-label">Lava-Rápidos Cadastrados ({summary.activeTenants} ativos)</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(summary.revenueMonth)}</div>
              <div className="stat-card-label">Faturamento Global no Mês</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
                <Calendar size={22} />
              </div>
              <div className="stat-card-value">{summary.washesMonth}</div>
              <div className="stat-card-label">Lavagens no Mês (Plataforma)</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Users size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(summary.revenueTotal)}</div>
              <div className="stat-card-label">Faturamento Histórico Total</div>
            </div>
          </div>

          {/* Tenants Table Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Lava-Rápidos Cadastrados na Plataforma</h3>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar lava-rápido ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    <th>Proprietário / Contato</th>
                    <th>Cadastrado Em</th>
                    <th style={{ textAlign: 'right' }}>Lavagens (Mês)</th>
                    <th style={{ textAlign: 'right' }}>Receita (Semana)</th>
                    <th style={{ textAlign: 'right' }}>Receita (Mês)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
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
                        {tenant.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tenant.phone}</div>}
                      </td>
                      <td>{formatDate(tenant.createdAt)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{tenant.washesMonth}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(tenant.revenueWeek)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                        {formatCurrency(tenant.revenueMonth)}
                      </td>
                      <td>
                        {tenant.active ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Ativo
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Inativo
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={`btn btn-sm ${tenant.active ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                          title={tenant.active ? 'Desativar acesso' : 'Ativar acesso'}
                        >
                          <Power size={14} />
                          {tenant.active ? 'Bloquear' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
