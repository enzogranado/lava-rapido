'use client';

import { useState, useEffect } from 'react';
import { History, Search, Calendar, DollarSign, Car, MessageCircle, FileText, Filter, CheckCircle2, Droplets } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, STATUS_LABELS, STATUS_COLORS, buildReadyMessage, openWhatsAppDirect } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface WashItem {
  id: string;
  serviceNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface Wash {
  id: string;
  tenantId: string;
  customerId: string;
  vehicleId: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  deliveredAt?: string;
  customer: { id: string; name: string; phone: string };
  vehicle: { id: string; model: string; plate: string; color?: string };
  items: WashItem[];
}

export default function HistoricoPage() {
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('30d'); // today, 7d, 30d, all
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>('');
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (period !== 'all') queryParams.append('period', period);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/washes?${queryParams.toString()}`);
      if (res.ok) {
        setWashes(await res.json());
      } else {
        showToast('Erro ao carregar histórico', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao carregar histórico', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.whatsappMessageTemplate) {
          setWhatsappTemplate(data.whatsappMessageTemplate);
        }
      })
      .catch(() => {});
  }, [period, statusFilter]);

  const filteredWashes = washes.filter((w) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      w.vehicle.plate.toLowerCase().includes(search) ||
      w.vehicle.model.toLowerCase().includes(search) ||
      w.customer.name.toLowerCase().includes(search) ||
      w.customer.phone.includes(search)
    );
  });

  const totalRevenue = filteredWashes
    .filter((w) => w.status === 'DELIVERED')
    .reduce((sum, w) => sum + w.total, 0);

  const totalDelivered = filteredWashes.filter((w) => w.status === 'DELIVERED').length;
  const ticketMedio = totalDelivered > 0 ? totalRevenue / totalDelivered : 0;

  const handleSendWhatsapp = (wash: Wash) => {
    const messageText = buildReadyMessage(
      whatsappTemplate,
      wash.customer.name,
      wash.vehicle.model,
      wash.vehicle.plate
    );

    // Open WhatsApp directly without async delay
    openWhatsAppDirect(wash.customer.phone, messageText);
    showToast('Abrindo WhatsApp...', 'success');

    // Register log in background
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ washId: wash.id }),
    }).catch((err) => console.error('Error logging WhatsApp send:', err));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={28} color="#0088e6" />
            Histórico Completo de Atendimentos
          </h1>
          <p className="page-subtitle">
            Registro histórico de todos os serviços prestados, relatórios e comprovantes
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
            <Car size={22} />
          </div>
          <div className="stat-card-value">{filteredWashes.length}</div>
          <div className="stat-card-label">Total de Lavagens no Período</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-card-label">Faturamento Total Concluído</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Droplets size={22} />
          </div>
          <div className="stat-card-value">{formatCurrency(ticketMedio)}</div>
          <div className="stat-card-label">Ticket Médio por Veículo</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          
          {/* Search Input */}
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search className="search-bar-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa, modelo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Group */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Period selector */}
            <select
              className="input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontWeight: 600 }}
            >
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="all">Todo o Histórico</option>
            </select>

            {/* Status Filter */}
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontWeight: 600 }}
            >
              <option value="ALL">Todos os Status</option>
              <option value="WAITING">Aguardando</option>
              <option value="IN_SERVICE">Em Serviço</option>
              <option value="READY">Pronto</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="loading-spinner" />
          </div>
        ) : filteredWashes.length === 0 ? (
          <div className="empty-state">
            <History size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
            <div className="empty-state-title">Nenhuma lavagem encontrada</div>
            <div className="empty-state-description">Nenhum atendimento corresponde aos filtros selecionados.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Veículo</th>
                  <th>Cliente</th>
                  <th>Serviços Prestados</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWashes.map((wash) => (
                  <tr key={wash.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatDate(wash.createdAt)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatTime(wash.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="plate-badge" style={{ fontSize: '0.8125rem', padding: '2px 8px' }}>
                          {wash.vehicle.plate}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{wash.vehicle.model}</div>
                          {wash.vehicle.color && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{wash.vehicle.color}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{wash.customer.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        {wash.customer.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {wash.items.map((item) => (
                          <div key={item.id} style={{ fontSize: '0.8125rem' }}>
                            • {item.serviceNameSnapshot}
                            {item.quantity > 1 && (
                              <span style={{ color: 'var(--color-primary-400)', fontWeight: 700 }}>
                                {' '}x{item.quantity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-400)', fontSize: '0.9375rem' }}>
                      {formatCurrency(wash.total)}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: STATUS_COLORS[wash.status] ? `${STATUS_COLORS[wash.status]}20` : 'rgba(255,255,255,0.1)',
                          color: STATUS_COLORS[wash.status] || 'var(--text-primary)',
                          border: `1px solid ${STATUS_COLORS[wash.status] || 'transparent'}`,
                        }}
                      >
                        {STATUS_LABELS[wash.status] || wash.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleSendWhatsapp(wash)}
                        title="Reenviar aviso por WhatsApp"
                        style={{ color: '#25D366' }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
