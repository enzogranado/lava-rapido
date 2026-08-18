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
  Sparkles,
  Wrench,
  Droplets,
  Layers,
  Receipt,
  CheckCircle2,
  Calendar,
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

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  active: boolean;
}

interface MensalistaExtra {
  id: string;
  description: string;
  amount: number;
  category: 'WASH' | 'SERVICE' | 'REPAIR' | 'OTHER' | string;
  status: 'PENDING' | 'PAID';
  billingMonth?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  service?: { id: string; name: string; price: number } | null;
  wash?: {
    id: string;
    status: string;
    total: number;
    vehicle?: { model: string; plate: string };
  } | null;
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
  extras?: MensalistaExtra[];
  pendingExtrasCount?: number;
  pendingExtrasTotal?: number;
  totalMonthAmount?: number;
}

const PAYMENT_OPTIONS = [
  { id: 'MONEY', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
  { id: 'PIX', label: 'PIX', icon: Zap, color: '#06b6d4' },
  { id: 'DEBIT', label: 'Débito', icon: CreditCard, color: '#38bdf8' },
  { id: 'CREDIT', label: 'Crédito', icon: CreditCard, color: '#a855f7' },
];

const CATEGORY_OPTIONS = [
  { id: 'WASH', label: 'Lavagem', icon: Droplets, color: '#38bdf8' },
  { id: 'SERVICE', label: 'Estética / Serviço', icon: Sparkles, color: '#a855f7' },
  { id: 'REPAIR', label: 'Reparo / Manutenção', icon: Wrench, color: '#f59e0b' },
  { id: 'OTHER', label: 'Outro Extra', icon: Layers, color: '#10b981' },
];

export default function MensalistasPage() {
  const [mensalistas, setMensalistas] = useState<MensalistaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ATIVO' | 'ATRASADO' | 'CANCELADO' | 'INATIVO'>('ALL');
  const { showToast } = useToast();

  // Modal: Novo / Editar Mensalista
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dueDay, setDueDay] = useState<number | ''>(5);
  const [notes, setNotes] = useState('');
  const [editStatus, setEditStatus] = useState('ATIVO');
  const [submitting, setSubmitting] = useState(false);

  // Inline quick registration
  const [isRegisteringQuick, setIsRegisteringQuick] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickModel, setQuickModel] = useState('');
  const [quickPlate, setQuickPlate] = useState('');

  // Modal: Lançar Extra / Lavagem
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraTargetMensalista, setExtraTargetMensalista] = useState<MensalistaRecord | null>(null);
  const [extraType, setExtraType] = useState<'SERVICE' | 'CUSTOM'>('SERVICE');
  const [extraSelectedServiceId, setExtraSelectedServiceId] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraAmount, setExtraAmount] = useState<number | ''>('');
  const [extraCategory, setExtraCategory] = useState<string>('WASH');
  const [extraNotes, setExtraNotes] = useState('');
  const [extraSubmitting, setExtraSubmitting] = useState(false);

  // Modal: Extrato / Detalhes de Extras
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementMensalista, setStatementMensalista] = useState<MensalistaRecord | null>(null);

  const fetchMensalistas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mensalistas');
      if (res.ok) {
        const data = await res.json();
        setMensalistas(data);
        // If statement modal is open, keep its data synchronized
        if (statementMensalista) {
          const updated = data.find((m: MensalistaRecord) => m.id === statementMensalista.id);
          if (updated) setStatementMensalista(updated);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar mensalistas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services?active=true');
      if (res.ok) {
        const data = await res.json();
        setServicesList(data);
      }
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
    }
  };

  useEffect(() => {
    fetchMensalistas();
    fetchServices();
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

  // Open modal to add extra service/wash
  const openAddExtraModal = (m: MensalistaRecord) => {
    setExtraTargetMensalista(m);
    setExtraType('SERVICE');
    setExtraSelectedServiceId(servicesList.length > 0 ? servicesList[0].id : '');
    setExtraDescription(servicesList.length > 0 ? servicesList[0].name : '');
    setExtraAmount(servicesList.length > 0 ? servicesList[0].price : '');
    setExtraCategory('WASH');
    setExtraNotes('');
    setShowExtraModal(true);
  };

  // Open statement modal
  const openStatementModal = (m: MensalistaRecord) => {
    setStatementMensalista(m);
    setShowStatementModal(true);
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

  const handleAddExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTargetMensalista) return;

    if (!extraDescription || extraDescription.trim() === '') {
      showToast('Informe uma descrição para o serviço/extra', 'warning');
      return;
    }
    if (!extraAmount || Number(extraAmount) <= 0) {
      showToast('Informe um valor válido maior que zero', 'warning');
      return;
    }

    try {
      setExtraSubmitting(true);
      const res = await fetch(`/api/mensalistas/${extraTargetMensalista.id}/extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: extraType === 'SERVICE' ? extraSelectedServiceId || null : null,
          description: extraDescription.trim(),
          amount: Number(extraAmount),
          category: extraCategory,
          notes: extraNotes.trim() || null,
        }),
      });

      if (res.ok) {
        showToast(`Extra adicionado à mensalidade de ${extraTargetMensalista.customer.name}!`, 'success');
        setShowExtraModal(false);
        fetchMensalistas();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao adicionar extra', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar extra', 'error');
    } finally {
      setExtraSubmitting(false);
    }
  };

  const handleToggleExtraStatus = async (mensalistaId: string, extraId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PENDING' ? 'PAID' : 'PENDING';
    try {
      const res = await fetch(`/api/mensalistas/${mensalistaId}/extras/${extraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(newStatus === 'PAID' ? 'Item marcado como pago!' : 'Item reaberto como pendente!', 'success');
        fetchMensalistas();
      } else {
        showToast('Erro ao atualizar status do extra', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status do extra', 'error');
    }
  };

  const handleDeleteExtra = async (mensalistaId: string, extraId: string) => {
    if (!confirm('Deseja realmente excluir este lançamento extra da mensalidade?')) return;
    try {
      const res = await fetch(`/api/mensalistas/${mensalistaId}/extras/${extraId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Item extra removido com sucesso!', 'success');
        fetchMensalistas();
      } else {
        showToast('Erro ao remover extra', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover extra', 'error');
    }
  };

  const handleMarkPaid = async (m: MensalistaRecord) => {
    const pendingAmount = m.pendingExtrasTotal || 0;
    const totalAmount = m.totalMonthAmount || m.plan.price;

    let confirmMsg = `Confirmar recebimento da mensalidade de ${m.customer.name}?`;
    if (pendingAmount > 0) {
      confirmMsg = `Confirmar recebimento total de ${formatCurrency(totalAmount)} (Plano: ${formatCurrency(m.plan.price)} + ${m.pendingExtrasCount} extra(s): ${formatCurrency(pendingAmount)}) de ${m.customer.name}?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/mensalistas/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markPaid: true, markExtrasPaid: true }),
      });
      if (res.ok) {
        showToast(`Pagamento total de ${m.customer.name} registrado com sucesso!`, 'success');
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
  const totalBaseMRR = mensalistas.filter((m) => m.status === 'ATIVO').reduce((sum, m) => sum + m.plan.price, 0);
  const totalPendingExtras = mensalistas.filter((m) => m.status === 'ATIVO').reduce((sum, m) => sum + (m.pendingExtrasTotal || 0), 0);
  const totalRevenueMonth = totalBaseMRR + totalPendingExtras;

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WASH':
        return <Droplets size={14} color="#38bdf8" />;
      case 'SERVICE':
        return <Sparkles size={14} color="#a855f7" />;
      case 'REPAIR':
        return <Wrench size={14} color="#f59e0b" />;
      default:
        return <Layers size={14} color="#10b981" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensalistas</h1>
          <p className="page-subtitle">Clientes com plano mensal recorrente, lavagens e serviços extras adicionais</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Novo Mensalista
        </button>
      </div>

      {/* Overview KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
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

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={12} /> Extras / Lavagens do Mês
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(totalPendingExtras)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Serviços adicionais a cobrar
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--color-primary-400)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={12} /> Total Previsto (Plano + Extras)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(totalRevenueMonth)}<span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>/mês</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Base recorrente: {formatCurrency(totalBaseMRR)}
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
                <th>Plano Contratado</th>
                <th style={{ textAlign: 'right' }}>Total no Mês</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const pendingExtras = m.pendingExtrasTotal || 0;
                const extrasCount = m.pendingExtrasCount || 0;
                const totalMonth = m.totalMonthAmount || m.plan.price;

                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{m.customer.name}</div>
                    </td>
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
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{m.plan.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Base: {formatCurrency(m.plan.price)}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: pendingExtras > 0 ? '#38bdf8' : 'var(--text-primary)' }}>
                          {formatCurrency(totalMonth)}
                        </span>
                        {pendingExtras > 0 ? (
                          <button
                            type="button"
                            onClick={() => openStatementModal(m)}
                            className="badge badge-primary"
                            style={{
                              cursor: 'pointer',
                              border: 'none',
                              padding: '2px 6px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Clique para ver o extrato de extras"
                          >
                            <Droplets size={10} /> +{formatCurrency(pendingExtras)} ({extrasCount} extra{extrasCount > 1 ? 's' : ''})
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Sem extras</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>Todo dia {m.dueDay}</div>
                      {m.lastPaymentDate && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Últ. pgto: {formatDate(m.lastPaymentDate)}
                        </div>
                      )}
                    </td>
                    <td>
                      {m.paymentMethod
                        ? PAYMENT_OPTIONS.find((p) => p.id === m.paymentMethod)?.label || m.paymentMethod
                        : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>—</span>}
                    </td>
                    <td>{renderStatusBadge(m)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {/* Add extra service/wash button */}
                        {m.status === 'ATIVO' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Lançar lavagem, serviço ou conserto extra na mensalidade"
                            onClick={() => openAddExtraModal(m)}
                            style={{ gap: '4px', padding: '4px 8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                          >
                            <Plus size={14} /> Extra
                          </button>
                        )}

                        {/* Statement / Details button */}
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Ver extrato completo da mensalidade e extras"
                          onClick={() => openStatementModal(m)}
                        >
                          <Receipt size={14} />
                        </button>

                        {/* Settle / Mark paid button */}
                        {m.status === 'ATIVO' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title={`Marcar pagamento de ${formatCurrency(totalMonth)} recebido`}
                            onClick={() => handleMarkPaid(m)}
                          >
                            <DollarSign size={14} /> Pago
                          </button>
                        )}

                        {/* Edit subscription */}
                        <button className="btn btn-ghost btn-sm" title="Editar assinatura" onClick={() => openEditModal(m)}>
                          <Edit size={14} />
                        </button>

                        {/* Toggle active / cancelled */}
                        <button
                          className="btn btn-ghost btn-sm"
                          title={m.status === 'CANCELADO' ? 'Reativar assinatura' : 'Cancelar assinatura'}
                          style={{ color: m.status === 'CANCELADO' ? 'var(--color-success)' : 'var(--color-warning)' }}
                          onClick={() => handleToggleStatus(m)}
                        >
                          {m.status === 'CANCELADO' ? <RotateCcw size={14} /> : <Ban size={14} />}
                        </button>

                        {/* Delete subscription */}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Lançar Lavagem / Serviço Extra */}
      {showExtraModal && extraTargetMensalista && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="var(--color-primary-400)" />
                  Lançar Serviço / Extra na Mensalidade
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Cliente: <strong>{extraTargetMensalista.customer.name}</strong> • Plano: {extraTargetMensalista.plan.name}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowExtraModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExtraSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Mode selector: predefined service vs custom item */}
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: extraType === 'SERVICE' ? 'var(--color-primary-600)' : 'transparent',
                      color: extraType === 'SERVICE' ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    onClick={() => {
                      setExtraType('SERVICE');
                      if (servicesList.length > 0) {
                        setExtraSelectedServiceId(servicesList[0].id);
                        setExtraDescription(servicesList[0].name);
                        setExtraAmount(servicesList[0].price);
                        setExtraCategory('WASH');
                      }
                    }}
                  >
                    <Droplets size={15} /> Serviço Cadastrado
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: extraType === 'CUSTOM' ? 'var(--color-primary-600)' : 'transparent',
                      color: extraType === 'CUSTOM' ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    onClick={() => {
                      setExtraType('CUSTOM');
                      setExtraSelectedServiceId('');
                      setExtraDescription('');
                      setExtraAmount('');
                      setExtraCategory('REPAIR');
                    }}
                  >
                    <Wrench size={15} /> Reparo / Item Personalizado
                  </button>
                </div>

                {extraType === 'SERVICE' ? (
                  <div className="form-group">
                    <label className="form-label">Selecione o Serviço *</label>
                    {servicesList.length === 0 ? (
                      <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                        Nenhum serviço cadastrado. Alterne para a aba de item personalizado.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                        {servicesList.map((srv) => {
                          const isSel = extraSelectedServiceId === srv.id;
                          return (
                            <div
                              key={srv.id}
                              className={`checkbox-item ${isSel ? 'selected' : ''}`}
                              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onClick={() => {
                                setExtraSelectedServiceId(srv.id);
                                setExtraDescription(srv.name);
                                setExtraAmount(srv.price);
                              }}
                            >
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{srv.name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary-400)', fontSize: '0.875rem' }}>
                                {formatCurrency(srv.price)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Descrição do Serviço / Conserto *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Troca de lâmpada, Conserto de retrovisor, Higienização interna..."
                      value={extraDescription}
                      onChange={(e) => setExtraDescription(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Category Selection */}
                <div className="form-group">
                  <label className="form-label">Categoria do Lançamento</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSel = extraCategory === cat.id;
                      const IconComp = cat.icon;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setExtraCategory(cat.id)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '10px',
                            border: isSel ? `2px solid ${cat.color}` : '1px solid var(--glass-border)',
                            background: isSel ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <IconComp size={16} style={{ color: isSel ? cat.color : 'inherit' }} />
                          <span>{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Amount input */}
                <div className="form-group">
                  <label className="form-label">Valor a ser acrescido na mensalidade (R$) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      style={{ paddingLeft: '38px', fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-400)' }}
                      placeholder="0,00"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Observações (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Realizado em 18/08, solicitado pelo cliente"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                  />
                </div>

                {/* Impact Preview */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '12px 16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <span>Plano Base:</span>
                    <strong>{formatCurrency(extraTargetMensalista.plan.price)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#38bdf8', marginTop: '4px' }}>
                    <span>+ Este Lançamento:</span>
                    <strong>+{formatCurrency(Number(extraAmount) || 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '8px' }}>
                    <span>Novo Total do Mês:</span>
                    <span style={{ color: 'var(--color-primary-400)' }}>
                      {formatCurrency(extraTargetMensalista.plan.price + (extraTargetMensalista.pendingExtrasTotal || 0) + (Number(extraAmount) || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExtraModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={extraSubmitting || !extraAmount}>
                  {extraSubmitting ? 'Lançando...' : (
                    <>
                      <Check size={18} /> Adicionar à Mensalidade
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extrato da Mensalidade e Gestão de Extras */}
      {showStatementModal && statementMensalista && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={20} color="var(--color-primary-400)" />
                  Extrato e Detalhes da Mensalidade
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Cliente: <strong>{statementMensalista.customer.name}</strong> • {statementMensalista.customer.phone}
                  {statementMensalista.vehicle && ` • ${statementMensalista.vehicle.model} [${statementMensalista.vehicle.plate}]`}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowStatementModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Bill summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Plano Contratado
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formatCurrency(statementMensalista.plan.price)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {statementMensalista.plan.name} (Dia {statementMensalista.dueDay})
                  </div>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Extras Pendentes
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    +{formatCurrency(statementMensalista.pendingExtrasTotal || 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {statementMensalista.pendingExtrasCount || 0} serviço(s) adicional(is)
                  </div>
                </div>

                <div style={{ background: 'var(--gradient-primary-soft)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-primary-500)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-300)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total a Pagar no Mês
                  </div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                    {formatCurrency(statementMensalista.totalMonthAmount || statementMensalista.plan.price)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {statementMensalista.status === 'ATIVO' ? (statementMensalista.isOverdue ? '⚠️ Em atraso' : '✅ Assinatura ativa') : 'Inativo'}
                  </div>
                </div>
              </div>

              {/* Extras list section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={16} color="var(--color-primary-400)" />
                    Lançamentos Extras deste Cliente ({statementMensalista.extras?.length || 0})
                  </h3>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowStatementModal(false);
                      openAddExtraModal(statementMensalista);
                    }}
                  >
                    <Plus size={14} /> Lançar Novo Extra
                  </button>
                </div>

                {!statementMensalista.extras || statementMensalista.extras.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '10px', color: 'var(--text-tertiary)' }}>
                    Nenhum serviço ou lavagem extra lançado para este mensalista até o momento.
                  </div>
                ) : (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                    <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Categoria</th>
                          <th>Descrição</th>
                          <th style={{ textAlign: 'right' }}>Valor</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementMensalista.extras.map((ex) => (
                          <tr key={ex.id}>
                            <td>{formatDate(ex.createdAt)}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                {getCategoryIcon(ex.category)}
                                {CATEGORY_OPTIONS.find((c) => c.id === ex.category)?.label || ex.category}
                              </span>
                            </td>
                            <td>
                              <strong>{ex.description}</strong>
                              {ex.notes && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ex.notes}</div>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: ex.status === 'PENDING' ? '#38bdf8' : 'var(--text-primary)' }}>
                              {formatCurrency(ex.amount)}
                            </td>
                            <td>
                              {ex.status === 'PENDING' ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>A Cobrar</span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Pago</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title={ex.status === 'PENDING' ? 'Marcar como quitado/pago' : 'Reabrir como pendente'}
                                  onClick={() => handleToggleExtraStatus(statementMensalista.id, ex.id, ex.status)}
                                  style={{ color: ex.status === 'PENDING' ? 'var(--color-success)' : 'var(--color-warning)' }}
                                >
                                  {ex.status === 'PENDING' ? <Check size={14} /> : <RotateCcw size={14} />}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--color-danger)' }}
                                  title="Excluir este lançamento"
                                  onClick={() => handleDeleteExtra(statementMensalista.id, ex.id)}
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
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowStatementModal(false)}>
                Fechar
              </button>
              {statementMensalista.status === 'ATIVO' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowStatementModal(false);
                    handleMarkPaid(statementMensalista);
                  }}
                >
                  <DollarSign size={16} /> Registrar Pagamento Total ({formatCurrency(statementMensalista.totalMonthAmount || statementMensalista.plan.price)})
                </button>
              )}
            </div>
          </div>
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
