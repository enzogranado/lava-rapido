'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  X,
  Check,
  UserPlus,
  Car,
  CreditCard,
  Banknote,
  Zap,
  MessageCircle,
  FileText,
  DollarSign,
  Edit,
  Trash2,
  Repeat,
  AlertTriangle,
  RotateCcw,
  Ban,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate, whatsappLink } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  vehicles: Array<{ id: string; model: string; plate: string }>;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  washesIncluded: number | null;
  active: boolean;
}

interface MensalistaRecord {
  id: string;
  status: string;
  isOverdue: boolean;
  paymentMethod?: string | null;
  dueDay: number;
  lastPaymentDate?: string | null;
  startedAt: string;
  cancelledAt?: string | null;
  notes?: string | null;
  customer: { id: string; name: string; phone: string };
  vehicle?: { id: string; model: string; plate: string } | null;
  plan: { id: string; name: string; price: number; washesIncluded: number | null };
}

const PAYMENT_OPTIONS = [
  { id: 'MONEY', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
  { id: 'PIX', label: 'PIX', icon: Zap, color: '#06b6d4' },
  { id: 'DEBIT', label: 'Débito', icon: CreditCard, color: '#38bdf8' },
  { id: 'CREDIT', label: 'Crédito', icon: CreditCard, color: '#a855f7' },
];

export default function MensalistasPage() {
  const [mensalistas, setMensalistas] = useState<MensalistaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ATIVO' | 'ATRASADO' | 'CANCELADO' | 'INATIVO'>('ALL');
  const { showToast } = useToast();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dueDay, setDueDay] = useState<number | ''>(5);
  const [notes, setNotes] = useState('');
  const [editStatus, setEditStatus] = useState('ATIVO');
  const [submitting, setSubmitting] = useState(false);

  // Inline quick registration (same pattern as Atendimentos)
  const [isRegisteringQuick, setIsRegisteringQuick] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickModel, setQuickModel] = useState('');
  const [quickPlate, setQuickPlate] = useState('');

  const fetchMensalistas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mensalistas');
      if (res.ok) setMensalistas(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar mensalistas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensalistas();
  }, []);

  const fetchModalData = async () => {
    const [custRes, planRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/monthly-plans?active=true'),
    ]);
    const custData = custRes.ok ? await custRes.json() : [];
    const planData = planRes.ok ? await planRes.json() : [];
    setCustomers(custData);
    setPlans(planData);
    return { customers: custData as Customer[], plans: planData as Plan[] };
  };

  const resetModalForm = () => {
    setSelectedCustomer(null);
    setSelectedVehicleId('');
    setSelectedPlanId('');
    setPaymentMethod('');
    setDueDay(5);
    setNotes('');
    setEditStatus('ATIVO');
    setIsRegisteringQuick(false);
    setCustomerSearch('');
    setQuickName('');
    setQuickPhone('');
    setQuickModel('');
    setQuickPlate('');
  };

  const openNewModal = async () => {
    resetModalForm();
    setEditingId(null);
    setShowModal(true);
    await fetchModalData();
  };

  const openEditModal = async (m: MensalistaRecord) => {
    resetModalForm();
    setEditingId(m.id);
    setSelectedVehicleId(m.vehicle?.id || '');
    setSelectedPlanId(m.plan.id);
    setPaymentMethod(m.paymentMethod || '');
    setDueDay(m.dueDay);
    setNotes(m.notes || '');
    setEditStatus(m.status);
    setShowModal(true);

    const { customers: fresh } = await fetchModalData();
    const full = fresh.find((c) => c.id === m.customer.id);
    setSelectedCustomer(
      full || { id: m.customer.id, name: m.customer.name, phone: m.customer.phone, vehicles: m.vehicle ? [m.vehicle] : [] }
    );
  };

  const handleQuickRegister = async () => {
    if (!quickName || !quickPhone) {
      showToast('Preencha nome e telefone para cadastrar', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickName,
          phone: quickPhone,
          vehicleModel: quickModel || undefined,
          vehiclePlate: quickPlate || undefined,
        }),
      });

      if (res.ok) {
        const newCustomer = await res.json();
        showToast('Cliente cadastrado com sucesso!', 'success');
        setCustomers((prev) => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);
        if (newCustomer.vehicles?.length > 0) setSelectedVehicleId(newCustomer.vehicles[0].id);
        setIsRegisteringQuick(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro no cadastro rápido', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro no cadastro rápido', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !selectedCustomer) {
      showToast('Selecione ou cadastre um cliente', 'warning');
      return;
    }
    if (!selectedPlanId) {
      showToast('Selecione um plano mensal', 'warning');
      return;
    }
    if (!dueDay || dueDay < 1 || dueDay > 28) {
      showToast('Informe um dia de vencimento entre 1 e 28', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const basePayload = {
        vehicleId: selectedVehicleId || null,
        planId: selectedPlanId,
        paymentMethod: paymentMethod || null,
        dueDay,
        notes,
      };

      const res = editingId
        ? await fetch(`/api/mensalistas/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, status: editStatus }),
          })
        : await fetch('/api/mensalistas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, customerId: selectedCustomer!.id }),
          });

      if (res.ok) {
        showToast(editingId ? 'Assinatura atualizada com sucesso!' : 'Mensalista cadastrado com sucesso!', 'success');
        setShowModal(false);
        fetchMensalistas();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao salvar mensalista', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao salvar mensalista', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (m: MensalistaRecord) => {
    try {
      const res = await fetch(`/api/mensalistas/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markPaid: true }),
      });
      if (res.ok) {
        showToast(`Pagamento de ${m.customer.name} registrado!`, 'success');
        fetchMensalistas();
      } else {
        showToast('Erro ao registrar pagamento', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar pagamento', 'error');
    }
  };

  const handleToggleStatus = async (m: MensalistaRecord) => {
    const newStatus = m.status === 'CANCELADO' ? 'ATIVO' : 'CANCELADO';
    if (newStatus === 'CANCELADO' && !confirm(`Cancelar a assinatura de ${m.customer.name}?`)) return;

    try {
      const res = await fetch(`/api/mensalistas/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(newStatus === 'CANCELADO' ? 'Assinatura cancelada' : 'Assinatura reativada', 'success');
        fetchMensalistas();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao atualizar status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleDelete = async (m: MensalistaRecord) => {
    if (!confirm(`Tem certeza que deseja excluir o registro de mensalista de "${m.customer.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/mensalistas/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Registro excluído', 'success');
        fetchMensalistas();
      } else {
        showToast('Erro ao excluir', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir', 'error');
    }
  };

  const filtered = mensalistas.filter((m) => {
    const matchSearch =
      m.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.customer.phone.includes(searchTerm) ||
      (m.vehicle?.plate || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ATRASADO') return m.status === 'ATIVO' && m.isOverdue;
    return m.status === activeFilter;
  });

  const countAtivos = mensalistas.filter((m) => m.status === 'ATIVO').length;
  const countAtrasados = mensalistas.filter((m) => m.status === 'ATIVO' && m.isOverdue).length;
  const countCancelados = mensalistas.filter((m) => m.status === 'CANCELADO').length;
  const mrr = mensalistas.filter((m) => m.status === 'ATIVO').reduce((sum, m) => sum + m.plan.price, 0);

  const renderStatusBadge = (m: MensalistaRecord) => {
    if (m.status === 'ATIVO' && m.isOverdue) {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={12} /> Atrasado
        </span>
      );
    }
    if (m.status === 'ATIVO') return <span className="badge badge-success">Ativo</span>;
    if (m.status === 'CANCELADO') return <span className="badge badge-neutral">Cancelado</span>;
    return <span className="badge badge-warning">Inativo</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensalistas</h1>
          <p className="page-subtitle">Clientes com plano mensal recorrente — cadastro, status e pagamento</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Novo Mensalista
        </button>
      </div>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div
          className={`card ${activeFilter === 'ATIVO' ? 'card-highlight' : ''}`}
          style={{ cursor: 'pointer', padding: '16px', borderLeft: '4px solid var(--color-success)' }}
          onClick={() => setActiveFilter('ATIVO')}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
            Ativos
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {countAtivos}
          </div>
        </div>

        <div
          className={`card ${activeFilter === 'ATRASADO' ? 'card-highlight' : ''}`}
          style={{ cursor: 'pointer', padding: '16px', borderLeft: '4px solid var(--color-danger)' }}
          onClick={() => setActiveFilter('ATRASADO')}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
            Em Atraso
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {countAtrasados}
          </div>
        </div>

        <div
          className={`card ${activeFilter === 'CANCELADO' ? 'card-highlight' : ''}`}
          style={{ cursor: 'pointer', padding: '16px', borderLeft: '4px solid var(--text-tertiary)' }}
          onClick={() => setActiveFilter('CANCELADO')}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Cancelados
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {countCancelados}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--color-primary-400)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={12} /> Receita Recorrente Estimada
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(mrr)}<span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>/mês</span>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: '380px' }}>
          <Search className="search-bar-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <button className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`} onClick={() => setActiveFilter('ALL')}>
            Todos ({mensalistas.length})
          </button>
          <button className={`filter-chip ${activeFilter === 'ATIVO' ? 'active' : ''}`} onClick={() => setActiveFilter('ATIVO')}>
            Ativos ({countAtivos})
          </button>
          <button className={`filter-chip ${activeFilter === 'ATRASADO' ? 'active' : ''}`} onClick={() => setActiveFilter('ATRASADO')}>
            Atrasados ({countAtrasados})
          </button>
          <button className={`filter-chip ${activeFilter === 'CANCELADO' ? 'active' : ''}`} onClick={() => setActiveFilter('CANCELADO')}>
            Cancelados ({countCancelados})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Repeat size={36} />
          </div>
          <div className="empty-state-title">Nenhum mensalista encontrado</div>
          <div className="empty-state-description">Cadastre clientes com plano mensal recorrente para vê-los aqui.</div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} /> Novo Mensalista
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Veículo</th>
                <th>Plano</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.customer.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{m.customer.phone}</span>
                      <a
                        href={whatsappLink(m.customer.phone)}
                        target="_blank"
                        rel="noreferrer"
                        title="Conversar no WhatsApp"
                        className="btn btn-whatsapp btn-sm"
                        style={{ padding: '3px 7px', fontSize: '0.75rem', borderRadius: '6px' }}
                      >
                        <MessageCircle size={13} />
                      </a>
                    </div>
                  </td>
                  <td>
                    {m.vehicle ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={14} color="var(--color-primary-400)" />
                        <span>{m.vehicle.model}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                          {m.vehicle.plate}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>—</span>
                    )}
                  </td>
                  <td>{m.plan.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                    {formatCurrency(m.plan.price)}
                  </td>
                  <td>Todo dia {m.dueDay}{m.lastPaymentDate && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Últ. pagamento: {formatDate(m.lastPaymentDate)}
                    </div>
                  )}</td>
                  <td>
                    {m.paymentMethod
                      ? PAYMENT_OPTIONS.find((p) => p.id === m.paymentMethod)?.label || m.paymentMethod
                      : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>—</span>}
                  </td>
                  <td>{renderStatusBadge(m)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      {m.status === 'ATIVO' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Marcar pagamento deste mês como recebido"
                          onClick={() => handleMarkPaid(m)}
                        >
                          <DollarSign size={14} /> Pago
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" title="Editar assinatura" onClick={() => openEditModal(m)}>
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={m.status === 'CANCELADO' ? 'Reativar assinatura' : 'Cancelar assinatura'}
                        style={{ color: m.status === 'CANCELADO' ? 'var(--color-success)' : 'var(--color-warning)' }}
                        onClick={() => handleToggleStatus(m)}
                      >
                        {m.status === 'CANCELADO' ? <RotateCcw size={14} /> : <Ban size={14} />}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        title="Excluir registro"
                        onClick={() => handleDelete(m)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Novo / Editar Mensalista */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Editar Assinatura' : 'Novo Mensalista'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Customer selection — only for new subscriptions */}
                {!editingId && (
                  <>
                    {!selectedCustomer && !isRegisteringQuick && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>1. Selecionar Cliente</label>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRegisteringQuick(true)}>
                          <UserPlus size={14} /> + Cadastrar Novo Cliente
                        </button>
                      </div>
                    )}

                    {isRegisteringQuick ? (
                      <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--color-primary-400)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--color-primary-400)' }}>Cadastro Rápido de Cliente</strong>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsRegisteringQuick(false)}>
                            Cancelar
                          </button>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Nome do Cliente *</label>
                            <input type="text" className="form-input" placeholder="Ex: João Silva" value={quickName} onChange={(e) => setQuickName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Telefone / WhatsApp *</label>
                            <input type="text" className="form-input" placeholder="Ex: (11) 99999-0000" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Modelo do Carro (opcional)</label>
                            <input type="text" className="form-input" placeholder="Ex: Honda HR-V" value={quickModel} onChange={(e) => setQuickModel(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Placa (opcional)</label>
                            <input type="text" className="form-input" placeholder="Ex: ABC1D23" value={quickPlate} onChange={(e) => setQuickPlate(e.target.value)} />
                          </div>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={handleQuickRegister} disabled={submitting}>
                          Salvar Cliente e Continuar
                        </button>
                      </div>
                    ) : !selectedCustomer ? (
                      <div>
                        <div className="search-bar" style={{ maxWidth: '100%' }}>
                          <Search className="search-bar-icon" size={18} />
                          <input
                            type="text"
                            placeholder="Buscar cliente por nome, telefone ou placa..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                          />
                        </div>
                        <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '8px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                          {customers
                            .filter(
                              (c) =>
                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                c.phone.includes(customerSearch) ||
                                c.vehicles.some((v) => v.plate.toLowerCase().includes(customerSearch.toLowerCase()))
                            )
                            .map((c) => (
                              <div
                                key={c.id}
                                style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  if (c.vehicles.length > 0) setSelectedVehicleId(c.vehicles[0].id);
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: '0.9375rem' }}>{c.name}</strong> ({c.phone})
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Carro(s): {c.vehicles.map((v) => `${v.model} [${v.plate}]`).join(', ') || 'Nenhum'}
                                  </div>
                                </div>
                                <span className="btn btn-secondary btn-sm">Selecionar &rarr;</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}

                {selectedCustomer && (
                  <div style={{ background: 'var(--gradient-primary-soft)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1.0625rem', color: 'var(--text-primary)' }}>{selectedCustomer.name}</strong>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{selectedCustomer.phone}</div>
                    </div>
                    {!editingId && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>
                        Trocar Cliente
                      </button>
                    )}
                  </div>
                )}

                {/* Vehicle (optional) */}
                {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Veículo Coberto pelo Plano (opcional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div
                        className={`checkbox-item ${selectedVehicleId === '' ? 'selected' : ''}`}
                        onClick={() => setSelectedVehicleId('')}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Nenhum específico</span>
                      </div>
                      {selectedCustomer.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className={`checkbox-item ${selectedVehicleId === v.id ? 'selected' : ''}`}
                          onClick={() => setSelectedVehicleId(v.id)}
                        >
                          <Car size={20} color="var(--color-primary-400)" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{v.model}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 700 }}>{v.plate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan selection */}
                {(selectedCustomer || editingId) && (
                  <div className="form-group">
                    <label className="form-label">Plano Mensal *</label>
                    {plans.length === 0 ? (
                      <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                        Nenhum plano ativo cadastrado. Crie um plano em Serviços → Planos Mensais primeiro.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {plans.map((p) => (
                          <div
                            key={p.id}
                            className={`checkbox-item ${selectedPlanId === p.id ? 'selected' : ''}`}
                            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                            onClick={() => setSelectedPlanId(p.id)}
                          >
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>{p.name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary-400)' }}>{formatCurrency(p.price)}/mês</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              {p.washesIncluded ? `${p.washesIncluded} lavagens/mês` : 'Lavagens ilimitadas'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment method */}
                {(selectedCustomer || editingId) && (
                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {PAYMENT_OPTIONS.map((method) => {
                        const selected = paymentMethod === method.id;
                        const IconComp = method.icon;
                        return (
                          <div
                            key={method.id}
                            onClick={() => setPaymentMethod(selected ? '' : method.id)}
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              border: selected ? `2px solid ${method.color}` : '1px solid var(--glass-border)',
                              background: selected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            <IconComp size={18} style={{ color: selected ? method.color : 'inherit' }} />
                            <span>{method.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Due day + status */}
                {(selectedCustomer || editingId) && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Dia de Vencimento (1-28) *</label>
                      <input
                        type="number"
                        min={1}
                        max={28}
                        className="form-input"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      />
                    </div>
                    {editingId && (
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="form-input"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <option value="ATIVO">Ativo</option>
                          <option value="INATIVO">Inativo</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {(selectedCustomer || editingId) && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} />
                      <span>Observações (Opcional)</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Ex: Combinado de pagar todo início de mês, desconto especial, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', fontSize: '0.875rem' }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || (!editingId && !selectedCustomer)}>
                  {submitting ? 'Salvando...' : (
                    <>
                      <Check size={18} /> {editingId ? 'Salvar Alterações' : 'Cadastrar Mensalista'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
