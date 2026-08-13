'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Car,
  Clock,
  CheckCircle,
  MessageCircle,
  X,
  Search,
  Check,
  ChevronRight,
  Filter,
  UserPlus,
  Key,
  ShieldCheck,
  DollarSign,
  Lock,
  List,
  FileText,
  CreditCard,
  Banknote,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatTime, timeDuration, STATUS_LABELS, buildReadyMessage, buildEntryCodeMessage, openWhatsAppDirect, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  vehicles: Array<{ id: string; model: string; plate: string }>;
}

interface WashItem {
  id: string;
  serviceNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface Wash {
  id: string;
  customerId: string;
  vehicleId: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  pickupCode?: string;
  paymentMethod?: string;
  pickupCodeBypassed?: boolean;
  createdAt: string;
  completedAt?: string;
  customer: { id: string; name: string; phone: string };
  vehicle: { id: string; model: string; plate: string; color?: string };
  items: WashItem[];
}

const STATUS_STEPS = [
  { id: 'WAITING', label: '1. Aguardando', shortLabel: 'Aguardando', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'IN_SERVICE', label: '2. Em Serviço', shortLabel: 'Em Serviço', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'READY', label: '3. Pronto', shortLabel: 'Pronto', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  { id: 'DELIVERED', label: '4. Entregue', shortLabel: 'Entregue', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
];

export default function AtendimentosPage() {
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ACTIVE'); // ACTIVE, ALL, or specific status
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  // Modal State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServices, setSelectedServices] = useState<
    Array<{ serviceId: string; unitPrice: number; quantity: number }>
  >([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Delivery & Security Code Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryWash, setDeliveryWash] = useState<Wash | null>(null);
  const [deliveryPickupCode, setDeliveryPickupCode] = useState('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'MONEY' | 'PIX' | 'DEBIT' | 'CREDIT'>('MONEY');
  const [deliveryBypass, setDeliveryBypass] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Inline Quick Registration state (Inside Modal)
  const [isRegisteringQuick, setIsRegisteringQuick] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickModel, setQuickModel] = useState('');
  const [quickPlate, setQuickPlate] = useState('');

  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null);

  const fetchWashes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/washes?mode=today_operational');
      if (res.ok) {
        setWashes(await res.json());
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar atendimentos do dia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async () => {
    try {
      const [custRes, servRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/services?active=true'),
      ]);
      if (custRes.ok) setCustomers(await custRes.json());
      if (servRes.ok) setServices(await servRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const [whatsappTemplate, setWhatsappTemplate] = useState<string>('');

  useEffect(() => {
    fetchWashes();
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.whatsappMessageTemplate) {
          setWhatsappTemplate(data.whatsappMessageTemplate);
        }
      })
      .catch(() => {});
  }, []);

  const openNewWashModal = () => {
    fetchModalData();
    setSelectedCustomer(null);
    setSelectedVehicleId('');
    setSelectedServices([]);
    setDiscount(0);
    setNotes('');
    setCustomerSearch('');
    setIsRegisteringQuick(false);
    setShowModal(true);
  };

  // 1-Click Status Update
  const handleStatusChange = async (washId: string, newStatus: string) => {
    if (newStatus === 'DELIVERED') {
      const targetWash = washes.find((w) => w.id === washId);
      if (targetWash) {
        setDeliveryWash(targetWash);
        setDeliveryPickupCode('');
        setDeliveryPaymentMethod('MONEY');
        setDeliveryBypass(false);
        setShowDeliveryModal(true);
        return;
      }
    }

    try {
      const res = await fetch(`/api/washes/${washId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Carro atualizado para: ${STATUS_LABELS[newStatus]}`, 'success');
        fetchWashes();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Erro ao alterar status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao alterar status', 'error');
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryWash) return;

    if (!deliveryBypass && deliveryWash.pickupCode) {
      if (!deliveryPickupCode || deliveryPickupCode.trim() !== deliveryWash.pickupCode.trim()) {
        showToast('Código de retirada incorreto! Informe os 4 dígitos enviados ao cliente ou marque "Confio no cliente".', 'error');
        return;
      }
    }

    try {
      setSubmittingDelivery(true);
      const res = await fetch(`/api/washes/${deliveryWash.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          pickupCode: deliveryPickupCode,
          bypassCode: deliveryBypass,
          paymentMethod: deliveryPaymentMethod,
        }),
      });

      if (res.ok) {
        showToast('Veículo entregue e pagamento registrado com sucesso!', 'success');
        setShowDeliveryModal(false);
        setDeliveryWash(null);
        fetchWashes();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao registrar entrega', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao registrar entrega', 'error');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleSendPickupCode = (wash: Wash) => {
    const messageText = buildEntryCodeMessage(
      wash.customer.name,
      wash.vehicle.model,
      wash.vehicle.plate,
      wash.pickupCode
    );

    openWhatsAppDirect(wash.customer.phone, messageText);
    showToast(`Abrindo WhatsApp para enviar código a ${wash.customer.name}...`, 'success');

    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ washId: wash.id }),
    }).catch((err) => console.error('Error logging WhatsApp message send:', err));
  };

  const handleSendWhatsApp = (wash: Wash) => {
    const messageText = buildReadyMessage(
      whatsappTemplate,
      wash.customer.name,
      wash.vehicle.model,
      wash.vehicle.plate,
      wash.pickupCode
    );

    // Open WhatsApp directly without async delay or popup blockers
    openWhatsAppDirect(wash.customer.phone, messageText);
    showToast('Abrindo WhatsApp para enviar aviso...', 'success');

    // Asynchronously log send in background
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ washId: wash.id }),
    }).catch((err) => console.error('Error logging WhatsApp message send:', err));
  };

  // Quick Customer + Vehicle creation inline inside wash registration
  const handleQuickRegister = async () => {
    if (!quickName || !quickPhone || !quickModel || !quickPlate) {
      showToast('Preencha nome, telefone, modelo e placa para cadastrar', 'warning');
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
          vehicleModel: quickModel,
          vehiclePlate: quickPlate,
        }),
      });

      if (res.ok) {
        const newCustomer = await res.json();
        showToast('Cliente e veículo cadastrados com sucesso!', 'success');
        setCustomers((prev) => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);
        if (newCustomer.vehicles.length > 0) {
          setSelectedVehicleId(newCustomer.vehicles[0].id);
        }
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

  // Service toggle & price edit
  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === service.id);
      if (exists) {
        return prev.filter((s) => s.serviceId !== service.id);
      }
      return [...prev, { serviceId: service.id, unitPrice: service.price, quantity: 1 }];
    });
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, unitPrice: price } : s))
    );
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCreateWash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('Selecione ou cadastre um cliente', 'warning');
      return;
    }
    if (!selectedVehicleId) {
      showToast('Selecione um veículo', 'warning');
      return;
    }
    if (selectedServices.length === 0) {
      showToast('Selecione pelo menos um serviço', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/washes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          vehicleId: selectedVehicleId,
          items: selectedServices,
          discount,
          notes,
        }),
      });

      if (res.ok) {
        const createdWash = await res.json();
        showToast('Atendimento criado com sucesso! Carro em esteira.', 'success');
        setShowModal(false);
        fetchWashes();

        if (createdWash?.pickupCode && createdWash?.customer?.phone) {
          handleSendPickupCode(createdWash);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao criar atendimento', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter washes
  const filteredWashes = washes.filter((w) => {
    // Search match
    const matchSearch =
      w.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customer.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'ACTIVE') {
      return w.status !== 'DELIVERED' && w.status !== 'CANCELLED';
    }
    if (activeFilter === 'ALL') return true;
    return w.status === activeFilter;
  });

  const countByStatus = (statusId: string) => washes.filter((w) => w.status === statusId).length;
  const countActive = washes.filter((w) => w.status !== 'DELIVERED' && w.status !== 'CANCELLED').length;
  const readyWashes = washes.filter((w) => w.status === 'READY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel Operacional — Carros no Lava Rápido</h1>
          <p className="page-subtitle">Visualização rápida e alteração de status em 1-clique</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openNewWashModal}>
          <Plus size={20} />
          + Registrar Entrada de Carro
        </button>
      </div>

      {/* Overview Status Counter Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div
          className={`card ${activeFilter === 'ACTIVE' ? 'card-highlight' : ''}`}
          style={{ cursor: 'pointer', padding: '16px' }}
          onClick={() => setActiveFilter('ACTIVE')}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-400)', textTransform: 'uppercase' }}>
            Em Pátio (Ativos)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {countActive} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>carros</span>
          </div>
        </div>

        {STATUS_STEPS.map((step) => (
          <div
            key={step.id}
            className="card"
            style={{
              cursor: 'pointer',
              padding: '16px',
              borderLeft: `4px solid ${step.color}`,
              background: activeFilter === step.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
            }}
            onClick={() => setActiveFilter(step.id)}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: step.color, textTransform: 'uppercase' }}>
              {step.shortLabel}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {countByStatus(step.id)}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: '380px' }}>
          <Search className="search-bar-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar placa (ex: ABC1D23), modelo ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${activeFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ACTIVE')}
          >
            No Pátio ({countActive})
          </button>
          <button
            className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            Todos de Hoje ({washes.length})
          </button>
          {STATUS_STEPS.map((s) => (
            <button
              key={s.id}
              className={`filter-chip ${activeFilter === s.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(s.id)}
            >
              {s.shortLabel} ({countByStatus(s.id)})
            </button>
          ))}
          <Link
            href="/historico"
            className="filter-chip"
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', textDecoration: 'none', marginLeft: 'auto' }}
          >
            Ver Histórico Completo →
          </Link>
        </div>
      </div>

      {/* Main List of Vehicles with 1-Click Status Controls */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : filteredWashes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Car size={36} />
          </div>
          <div className="empty-state-title">Nenhum veículo nesta visualização</div>
          <div className="empty-state-description">Nenhum carro no pátio com o filtro selecionado.</div>
          <button className="btn btn-primary" onClick={openNewWashModal}>
            <Plus size={18} /> Registrar Entrada
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredWashes.map((wash) => {
            const currentStepIdx = STATUS_STEPS.findIndex((s) => s.id === wash.status);
            const isReady = wash.status === 'READY';
            const isDelivered = wash.status === 'DELIVERED';

            return (
              <div
                key={wash.id}
                className={`card ${isReady ? 'ready-car-card' : ''}`}
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderLeft: `6px solid ${STATUS_STEPS.find((s) => s.id === wash.status)?.color || 'var(--glass-border)'}`,
                }}
              >
                {/* Header of Vehicle Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '2px solid var(--color-primary-400)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                        PLACA
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-400)', letterSpacing: '0.05em' }}>
                        {wash.vehicle.plate}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{wash.vehicle.model}</span>
                        {wash.vehicle.color && (
                          <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>
                            ({wash.vehicle.color})
                          </span>
                        )}
                        {wash.pickupCode && (
                          <span
                            style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Código de Retirada do Cliente"
                          >
                            <Key size={12} /> Código: {wash.pickupCode}
                          </span>
                        )}
                        {wash.paymentMethod && (
                          <span
                            className="badge badge-success"
                            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                          >
                            {PAYMENT_METHOD_LABELS[wash.paymentMethod]?.label || wash.paymentMethod}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>Cliente: <strong>{wash.customer.name}</strong> ({wash.customer.phone})</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Clock size={14} /> Entrada: {formatTime(wash.createdAt)} ({timeDuration(wash.createdAt)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total & WhatsApp Quick Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Cobrado</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-400)' }}>
                        {formatCurrency(wash.total)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {wash.pickupCode && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendPickupCode(wash)}
                          title="Enviar código de retirada via WhatsApp ao cliente"
                          style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                        >
                          <MessageCircle size={16} />
                          Enviar Código
                        </button>
                      )}

                      {isReady && (
                        <button
                          className="btn btn-whatsapp"
                          onClick={() => handleSendWhatsApp(wash)}
                        >
                          <MessageCircle size={18} />
                          Avisar Pronto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services Tag List */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Serviços:</span>
                  {wash.items.map((item) => (
                    <span key={item.id} className="badge badge-neutral" style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
                      {item.serviceNameSnapshot} ({formatCurrency(item.unitPrice)})
                    </span>
                  ))}
                </div>

                {/* Notes / Avarias Display */}
                {wash.notes && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.8125rem',
                      color: '#fef3c7',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <FileText size={14} style={{ color: '#f59e0b', marginTop: '2px' }} />
                    <span style={{ fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>Obs / Avarias:</span>
                    <span>{wash.notes}</span>
                  </div>
                )}

                {/* 1-CLICK INTERACTIVE PIPELINE BAR */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    Alterar Status da Lavagem (Clique para Mudar):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const isCurrent = wash.status === step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          className="btn"
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.8125rem',
                            borderRadius: '8px',
                            background: isCurrent ? step.color : 'rgba(255,255,255,0.03)',
                            color: isCurrent ? 'white' : 'var(--text-secondary)',
                            border: isCurrent ? `2px solid ${step.color}` : '1px solid var(--glass-border)',
                            fontWeight: isCurrent ? 800 : 500,
                            boxShadow: isCurrent ? `0 0 12px ${step.color}55` : 'none',
                          }}
                          onClick={() => handleStatusChange(wash.id, step.id)}
                        >
                          {isCurrent && <Check size={14} style={{ marginRight: '4px' }} />}
                          {step.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Entrada de Carro */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Entrada de Carro</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWash}>
              <div className="modal-body">
                {/* Mode toggle: Existing vs Quick Registration */}
                {!selectedCustomer && !isRegisteringQuick && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>1. Selecionar Cliente e Carro</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsRegisteringQuick(true)}
                    >
                      <UserPlus size={14} /> + Cadastrar Novo Cliente com Veículo
                    </button>
                  </div>
                )}

                {/* Inline Quick Registration Mode */}
                {isRegisteringQuick ? (
                  <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--color-primary-400)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--color-primary-400)' }}>Cadastro Rápido de Cliente + Veículo</strong>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsRegisteringQuick(false)}>
                        Cancelar
                      </button>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nome do Cliente *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: João Silva"
                          value={quickName}
                          onChange={(e) => setQuickName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Telefone / WhatsApp *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: (11) 99999-0000"
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Modelo do Carro *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Honda HR-V"
                          value={quickModel}
                          onChange={(e) => setQuickModel(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Placa *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: ABC1D23"
                          value={quickPlate}
                          onChange={(e) => setQuickPlate(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleQuickRegister}
                      disabled={submitting}
                    >
                      Salvar Cliente e Selecionar para Lavagem
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
                ) : (
                  <div style={{ background: 'var(--gradient-primary-soft)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1.0625rem', color: 'var(--text-primary)' }}>{selectedCustomer.name}</strong>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{selectedCustomer.phone}</div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>
                      Trocar Cliente
                    </button>
                  </div>
                )}

                {/* Select Vehicle if customer selected */}
                {selectedCustomer && (
                  <div className="form-group">
                    <label className="form-label">Veículo que Entrou na Lavagem</label>
                    {selectedCustomer.vehicles.length === 0 ? (
                      <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                        Este cliente não possui veículo cadastrado.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {selectedCustomer.vehicles.map((v) => (
                          <div
                            key={v.id}
                            className={`checkbox-item ${selectedVehicleId === v.id ? 'selected' : ''}`}
                            onClick={() => setSelectedVehicleId(v.id)}
                          >
                            <Car size={22} color="var(--color-primary-400)" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{v.model}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 700 }}>
                                {v.plate}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Services Selection */}
                {selectedCustomer && selectedVehicleId && (
                  <div className="form-group">
                    <label className="form-label">Serviços Contratados Nesta Visita</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {services.map((svc) => {
                        const selected = selectedServices.find((s) => s.serviceId === svc.id);
                        return (
                          <div
                            key={svc.id}
                            className={`checkbox-item ${selected ? 'selected' : ''}`}
                            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                          >
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => toggleService(svc)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" className="checkbox-input" checked={!!selected} onChange={() => {}} />
                                <span style={{ fontWeight: 600 }}>{svc.name}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary-400)' }}>
                                {formatCurrency(svc.price)}
                              </span>
                            </div>

                            {selected && (
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Valor cobrado:</span>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
                                  value={selected.unitPrice}
                                  onChange={(e) => updateServicePrice(svc.id, parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Observações / Avarias do Veículo */}
                {selectedCustomer && selectedVehicleId && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} />
                      <span>Observações / Avarias do Veículo (Opcional)</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Ex: Arranhão no para-choque traseiro, mancha no banco do motorista, deixar chave na recepção..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', fontSize: '0.875rem' }}
                    />
                  </div>
                )}

                {/* Subtotal & Discount */}
                {selectedServices.length > 0 && (
                  <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                      <span>Subtotal:</span>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Desconto (R$):</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '120px', padding: '4px 8px' }}
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-400)', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                      <span>Total Final:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || selectedServices.length === 0}>
                  {submitting ? 'Registrando...' : 'Colocar Carro na Lavagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delivery & Security Code Modal */}
      {showDeliveryModal && deliveryWash && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} /> Finalizar Entrega & Pagamento
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  Selecione o método de pagamento e informe o código de segurança do cliente.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDeliveryModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Summary Card */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {deliveryWash.vehicle.model}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Placa: <strong style={{ color: 'var(--color-primary-400)', fontFamily: 'monospace' }}>{deliveryWash.vehicle.plate}</strong> • Cliente: {deliveryWash.customer.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Valor Total</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--color-primary-400)' }}>
                    {formatCurrency(deliveryWash.total)}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={16} /> Forma de Pagamento Realizada *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'MONEY', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
                    { id: 'PIX', label: 'PIX', icon: Zap, color: '#06b6d4' },
                    { id: 'DEBIT', label: 'Cartão de Débito', icon: CreditCard, color: '#38bdf8' },
                    { id: 'CREDIT', label: 'Cartão de Crédito', icon: CreditCard, color: '#a855f7' },
                  ].map((method) => {
                    const selected = deliveryPaymentMethod === method.id;
                    const IconComp = method.icon;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setDeliveryPaymentMethod(method.id as any)}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          border: selected ? `2px solid ${method.color}` : '1px solid var(--glass-border)',
                          background: selected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontWeight: 700,
                          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <IconComp size={18} style={{ color: selected ? method.color : 'inherit' }} />
                        <span>{method.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Pickup Code Input */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> Código de Retirada do Cliente
                  </label>
                  {deliveryWash.pickupCode && (
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                      Código gerado: {deliveryWash.pickupCode}
                    </span>
                  )}
                </div>

                {!deliveryBypass ? (
                  <input
                    type="text"
                    maxLength={4}
                    className="form-input"
                    placeholder="Digite os 4 dígitos informados pelo cliente..."
                    value={deliveryPickupCode}
                    onChange={(e) => setDeliveryPickupCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ fontSize: '1.25rem', letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center' }}
                  />
                ) : (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                    Modo de confiança ativado: O veículo será liberado sem validação numérica do código.
                  </div>
                )}

                {/* Bypass Option */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={deliveryBypass}
                    onChange={(e) => setDeliveryBypass(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-400)' }}
                  />
                  <span><strong>Confio no cliente</strong> (liberar retirada sem validar o código)</span>
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeliveryModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success btn-lg" disabled={submittingDelivery}>
                  {submittingDelivery ? 'Registrando Entrega...' : 'Confirmar Entrega & Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
