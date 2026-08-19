'use client';

import { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  CheckCircle2,
  DollarSign,
  Search,
  Plus,
  X,
  Check,
  Zap,
  CreditCard,
  Banknote,
  Repeat,
  Layers,
  MessageCircle,
  ShieldCheck,
  Key,
  Settings,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Phone,
  FileText,
  History,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate, formatDateTime, whatsappLink, openWhatsAppDirect, buildParkingEntryMessage } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface ParkingTicket {
  id: string;
  plate: string;
  model: string;
  color?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status: 'PARKED' | 'COMPLETED' | 'CANCELLED';
  entryTime: string;
  exitTime?: string | null;
  pickupCode: string;
  pickupCodeBypassed: boolean;
  trackingToken?: string | null;
  hourlyRateSnapshot: number;
  additionalHourlyRateSnapshot: number;
  totalStayMinutes?: number | null;
  stayFee: number;
  washFee: number;
  discount: number;
  total: number;
  paymentMethod?: string | null;
  notes?: string | null;
  spotNumber?: string | null;
  calculatedMinutes?: number;
  calculatedStayFee?: number;
  calculatedTotal?: number;
  customer?: { id: string; name: string; phone: string } | null;
  vehicle?: { id: string; model: string; plate: string } | null;
}

interface ParkingStats {
  occupiedSpots: number;
  totalSpots: number;
  availableSpots: number;
  todayEntriesCount: number;
  todayCompletedCount: number;
  todayRevenue: number;
}

interface ParkingRates {
  hourlyRate: number;
  additionalRate: number;
  dailyRate: number;
  graceMinutes: number;
}

const PAYMENT_OPTIONS = [
  { id: 'MONEY', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
  { id: 'PIX', label: 'PIX', icon: Zap, color: '#06b6d4' },
  { id: 'DEBIT', label: 'Cartão de Débito', icon: CreditCard, color: '#38bdf8' },
  { id: 'CREDIT', label: 'Cartão de Crédito', icon: CreditCard, color: '#a855f7' },
  { id: 'MENSALISTA', label: 'Mensalista / Faturado', icon: Repeat, color: '#6366f1' },
];

export default function EstacionamentoPage() {
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [stats, setStats] = useState<ParkingStats | null>(null);
  const [rates, setRates] = useState<ParkingRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PARKED' | 'COMPLETED' | 'ALL'>('PARKED');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  // Modal: Entrada de Veículo (Check-in)
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryPlate, setEntryPlate] = useState('');
  const [entryModel, setEntryModel] = useState('');
  const [entryColor, setEntryColor] = useState('');
  const [entryCustomerName, setEntryCustomerName] = useState('');
  const [entryCustomerPhone, setEntryCustomerPhone] = useState('');
  const [entrySpotNumber, setEntrySpotNumber] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  // Auto-fill state on plate typing
  const [lookupLoading, setLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [plateSuggestions, setPlateSuggestions] = useState<Array<{
    plate: string;
    model: string;
    color: string;
    customerName: string;
    customerPhone: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal: Saída de Veículo (Checkout & Código)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ParkingTicket | null>(null);
  const [checkoutCode, setCheckoutCode] = useState('');
  const [checkoutBypass, setCheckoutBypass] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('MONEY');
  const [checkoutWashFee, setCheckoutWashFee] = useState<number | ''>(0);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number | ''>(0);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Modal: Configuração de Tarifas
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [editHourlyRate, setEditHourlyRate] = useState<number | ''>(10);
  const [editAdditionalRate, setEditAdditionalRate] = useState<number | ''>(5);
  const [editDailyRate, setEditDailyRate] = useState<number | ''>(50);
  const [editGraceMinutes, setEditGraceMinutes] = useState<number | ''>(15);
  const [editTotalSpots, setEditTotalSpots] = useState<number | ''>(30);
  const [ratesSubmitting, setRatesSubmitting] = useState(false);

  // Live timer tick every 15s to update real-time stay calculations
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchParkingData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parking?status=${activeTab}&search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        setStats(data.stats || null);
        setRates(data.rates || null);
        if (data.rates && editHourlyRate === 10) {
          setEditHourlyRate(data.rates.hourlyRate);
          setEditAdditionalRate(data.rates.additionalRate);
          setEditDailyRate(data.rates.dailyRate);
          setEditGraceMinutes(data.rates.graceMinutes);
          if (data.stats) setEditTotalSpots(data.stats.totalSpots);
        }
      } else {
        showToast(data.error || 'Erro ao carregar dados do estacionamento', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do estacionamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, [activeTab, searchTerm]);

  // Recalculate fees locally on every timer tick
  const getStayDurationFormatted = (entryTimeStr: string, exitTimeStr?: string | null) => {
    const start = new Date(entryTimeStr).getTime();
    const end = exitTimeStr ? new Date(exitTimeStr).getTime() : nowTimestamp;
    const diffMs = Math.max(0, end - start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins > 0 ? `${String(mins).padStart(2, '0')}m` : '00m'}`;
  };

  const getDynamicFee = (ticket: ParkingTicket) => {
    if (ticket.status !== 'PARKED') return ticket.total;

    const hourly = ticket.hourlyRateSnapshot || rates?.hourlyRate || 10;
    const addRate = ticket.additionalHourlyRateSnapshot || rates?.additionalRate || 5;
    const grace = rates?.graceMinutes || 15;

    const start = new Date(ticket.entryTime).getTime();
    const diffMs = Math.max(0, nowTimestamp - start);
    const totalMinutes = Math.ceil(diffMs / (1000 * 60));

    if (totalMinutes <= grace) return 0;
    if (totalMinutes <= 60) return hourly;

    const remainingMinutes = totalMinutes - 60;
    const additionalHours = Math.ceil(remainingMinutes / 60);
    return hourly + additionalHours * addRate;
  };

  // Handle Plate change with instant auto-lookup from DB
  const handlePlateChange = async (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setEntryPlate(clean);
    setAutoFilled(false);

    if (clean.length >= 3) {
      try {
        setLookupLoading(true);
        const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.matches && data.matches.length > 0) {
            setPlateSuggestions(data.matches);
            setShowSuggestions(true);
          } else {
            setPlateSuggestions([]);
            setShowSuggestions(false);
          }

          if (data.exactMatch) {
            setEntryModel(data.exactMatch.model || '');
            setEntryColor(data.exactMatch.color || '');
            setEntryCustomerName(data.exactMatch.customerName || '');
            setEntryCustomerPhone(data.exactMatch.customerPhone || '');
            setAutoFilled(true);
            setShowSuggestions(false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLookupLoading(false);
      }
    } else {
      setPlateSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item: { plate: string; model: string; color: string; customerName: string; customerPhone: string }) => {
    setEntryPlate(item.plate);
    setEntryModel(item.model || '');
    setEntryColor(item.color || '');
    setEntryCustomerName(item.customerName || '');
    setEntryCustomerPhone(item.customerPhone || '');
    setAutoFilled(true);
    setShowSuggestions(false);
  };

  // Open entry modal
  const openEntryModal = () => {
    setEntryPlate('');
    setEntryModel('');
    setEntryColor('');
    setEntryCustomerName('');
    setEntryCustomerPhone('');
    setEntrySpotNumber('');
    setEntryNotes('');
    setAutoFilled(false);
    setPlateSuggestions([]);
    setShowSuggestions(false);
    setShowEntryModal(true);
  };

  // Open checkout modal
  const openCheckoutModal = (t: ParkingTicket) => {
    setSelectedTicket(t);
    setCheckoutCode('');
    setCheckoutBypass(false);
    setCheckoutPaymentMethod('MONEY');
    setCheckoutWashFee(t.washFee || 0);
    setCheckoutDiscount(0);
    setCheckoutNotes(t.notes || '');
    setShowCheckoutModal(true);
  };

  // Submit vehicle check-in
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPlate || !entryModel) {
      showToast('Informe a placa e o modelo do veículo', 'warning');
      return;
    }

    const phoneDigits = entryCustomerPhone.replace(/\D/g, '');
    if (!entryCustomerPhone || phoneDigits.length < 10) {
      showToast('O WhatsApp do cliente é obrigatório para registrar a entrada e gerar o código de retirada (mínimo 10 dígitos com DDD)', 'warning');
      return;
    }

    try {
      setEntrySubmitting(true);
      const res = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: entryPlate.toUpperCase().trim(),
          model: entryModel.trim(),
          color: entryColor.trim() || undefined,
          customerName: entryCustomerName.trim() || undefined,
          customerPhone: entryCustomerPhone.trim(),
          spotNumber: entrySpotNumber.trim() || undefined,
          notes: entryNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Entrada do veículo ${data.plate} registrada! Código de retirada: ${data.pickupCode}`, 'success');
        setShowEntryModal(false);
        fetchParkingData();

        // Dispatch WhatsApp ticket
        const entryTimeFormatted = formatTime(new Date());
        const msg = buildParkingEntryMessage(
          undefined,
          entryCustomerName || 'Cliente',
          entryModel,
          data.plate,
          data.pickupCode,
          entryTimeFormatted
        );
        openWhatsAppDirect(entryCustomerPhone, msg);
      } else {
        showToast(data.error || 'Erro ao registrar entrada', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao registrar entrada', 'error');
    } finally {
      setEntrySubmitting(false);
    }
  };

  // Submit vehicle checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    if (!checkoutBypass && !checkoutCode) {
      showToast('Informe o código de retirada de 4 dígitos ou marque "Confio no cliente"', 'warning');
      return;
    }

    try {
      setCheckoutSubmitting(true);
      const res = await fetch(`/api/parking/${selectedTicket.id}/checkout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCode: checkoutCode.trim(),
          bypassCode: checkoutBypass,
          paymentMethod: checkoutPaymentMethod,
          washFee: Number(checkoutWashFee) || 0,
          discount: Number(checkoutDiscount) || 0,
          notes: checkoutNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Saída do veículo ${selectedTicket.plate} confirmada! Pagamento de ${formatCurrency(data.total)} registrado.`, 'success');
        setShowCheckoutModal(false);
        fetchParkingData();
      } else {
        showToast(data.error || 'Erro ao finalizar saída', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao finalizar saída', 'error');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Submit rates update
  const handleRatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRatesSubmitting(true);
      const res = await fetch('/api/parking/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingHourlyRate: Number(editHourlyRate) || 10,
          parkingAdditionalHourlyRate: Number(editAdditionalRate) || 5,
          parkingDailyRate: Number(editDailyRate) || 50,
          parkingGraceMinutes: Number(editGraceMinutes) || 15,
          parkingSpots: Number(editTotalSpots) || 30,
        }),
      });

      if (res.ok) {
        showToast('Tarifas e capacidade atualizadas com sucesso!', 'success');
        setShowRatesModal(false);
        fetchParkingData();
      } else {
        showToast('Erro ao salvar tarifas', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar tarifas', 'error');
    } finally {
      setRatesSubmitting(false);
    }
  };

  const occupancyRate = stats && stats.totalSpots > 0 ? Math.round((stats.occupiedSpots / stats.totalSpots) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Estacionamento & Pátio</h1>
          <p className="page-subtitle">Controle de entrada de veículos, vagas em tempo real, permanência e código de retirada</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowRatesModal(true)}>
            <Settings size={18} /> Tarifas & Vagas
          </button>
          <button className="btn btn-primary" onClick={openEntryModal}>
            <Plus size={18} /> Nova Entrada (Check-in)
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Occupancy Card */}
          <div
            className="card"
            style={{
              padding: '16px',
              borderLeft: `4px solid ${occupancyRate > 85 ? '#ef4444' : occupancyRate > 60 ? '#f59e0b' : '#38bdf8'}`,
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-400)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
              <span>Vagas Ocupadas</span>
              <span>{occupancyRate}% lotado</span>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.occupiedSpots} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>/ {stats.totalSpots} vagas</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${occupancyRate}%`, height: '100%', background: occupancyRate > 85 ? '#ef4444' : '#38bdf8', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Available spots */}
          <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--color-success)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
              Vagas Disponíveis
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.availableSpots}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Prontas para receber veículos
            </div>
          </div>

          {/* Today revenue */}
          <div className="card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              Faturamento de Hoje
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {stats.todayCompletedCount} saídas finalizadas
            </div>
          </div>

          {/* Today entries */}
          <div className="card" style={{ padding: '16px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>
              Total de Entradas Hoje
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.todayEntriesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Veículos movimentados
            </div>
          </div>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: '380px' }}>
          <Search className="search-bar-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, cliente ou vaga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <button className={`filter-chip ${activeTab === 'PARKED' ? 'active' : ''}`} onClick={() => setActiveTab('PARKED')}>
            No Pátio Agora ({tickets.filter((t) => t.status === 'PARKED').length})
          </button>
          <button className={`filter-chip ${activeTab === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveTab('COMPLETED')}>
            Histórico de Saídas
          </button>
          <button className={`filter-chip ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
            Todos
          </button>
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Car size={36} />
          </div>
          <div className="empty-state-title">
            {activeTab === 'PARKED' ? 'Nenhum veículo estacionado no pátio' : 'Nenhum registro encontrado'}
          </div>
          <div className="empty-state-description">
            {activeTab === 'PARKED' ? 'Clique no botão abaixo para registrar a entrada de um veículo.' : 'Sem movimentações correspondentes ao filtro.'}
          </div>
          <button className="btn btn-primary" onClick={openEntryModal}>
            <Plus size={18} /> Nova Entrada (Check-in)
          </button>
        </div>
      ) : activeTab === 'PARKED' ? (
        /* LIVE YARD CARDS GRID */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {tickets
            .filter((t) => t.status === 'PARKED')
            .map((ticket) => {
              const currentFee = getDynamicFee(ticket);
              const durationStr = getStayDurationFormatted(ticket.entryTime);

              return (
                <div
                  key={ticket.id}
                  className="card card-hover"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--glass-border)',
                    borderTop: '4px solid #38bdf8',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Plate & Spot Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div
                        style={{
                          background: '#0f172a',
                          border: '2px solid #38bdf8',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        <span style={{ fontSize: '0.625rem', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.1em' }}>BRASIL</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.125rem', color: '#ffffff', letterSpacing: '0.08em' }}>
                          {ticket.plate}
                        </span>
                      </div>

                      {ticket.spotNumber ? (
                        <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                          Vaga {ticket.spotNumber}
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>Pátio Rotativo</span>
                      )}
                    </div>

                    {/* Vehicle details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Car size={18} color="var(--color-primary-400)" />
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{ticket.model}</strong>
                      {ticket.color && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>• {ticket.color}</span>}
                    </div>

                    {/* Customer info */}
                    {ticket.customerName && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} />
                        <span>{ticket.customerName}</span>
                        {ticket.customerPhone && (
                          <a
                            href={whatsappLink(ticket.customerPhone)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-whatsapp btn-sm"
                            style={{ padding: '2px 6px', fontSize: '0.6875rem', borderRadius: '4px', marginLeft: '4px' }}
                            title="WhatsApp"
                          >
                            <MessageCircle size={11} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Security Pickup Code Badge */}
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8125rem',
                        marginBottom: '14px',
                      }}
                    >
                      <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={14} /> Código de Retirada:
                      </span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.1em', color: '#f59e0b' }}>
                        {ticket.pickupCode}
                      </strong>
                    </div>

                    {/* Live Time & Live Fee */}
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '12px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Entrada: {formatTime(ticket.entryTime)}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                          ⏱️ {durationStr}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Valor Atual</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary-400)' }}>
                          {formatCurrency(currentFee)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                    onClick={() => openCheckoutModal(ticket)}
                  >
                    <CheckCircle2 size={16} /> Dar Saída (Checkout)
                  </button>
                </div>
              );
            })}
        </div>
      ) : (
        /* TABLE VIEW FOR HISTORY OR ALL */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Cliente</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Tempo Total</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#0f172a', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                      {t.plate}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.model} {t.color && <span style={{ color: 'var(--text-tertiary)' }}>({t.color})</span>}</td>
                  <td>{t.customerName || '—'}</td>
                  <td>{formatDateTime(t.entryTime)}</td>
                  <td>{t.exitTime ? formatDateTime(t.exitTime) : <span style={{ color: '#38bdf8', fontWeight: 600 }}>No pátio</span>}</td>
                  <td style={{ fontWeight: 700 }}>{getStayDurationFormatted(t.entryTime, t.exitTime)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-400)' }}>
                    {formatCurrency(t.status === 'PARKED' ? getDynamicFee(t) : t.total)}
                  </td>
                  <td>{t.paymentMethod || '—'}</td>
                  <td>
                    {t.status === 'PARKED' ? (
                      <span className="badge badge-primary">No Pátio</span>
                    ) : (
                      <span className="badge badge-success">Finalizado</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {t.status === 'PARKED' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openCheckoutModal(t)}>
                        Dar Saída
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nova Entrada (Check-in) */}
      {showEntryModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="var(--color-primary-400)" />
                  Entrada de Veículo no Estacionamento
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Geração automática de código de retirada de 4 dígitos e comprovante
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowEntryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEntrySubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Placa do Veículo *</label>
                      {lookupLoading && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary-400)' }}>
                          Buscando cadastro...
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: ABC1D23"
                      maxLength={8}
                      value={entryPlate}
                      onChange={(e) => handlePlateChange(e.target.value)}
                      onFocus={() => {
                        if (plateSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      required
                      autoFocus
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && plateSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          background: '#0d1220',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '10px',
                          marginTop: '4px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '6px 10px', fontSize: '0.6875rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          Veículos cadastrados encontrados (clique para preencher):
                        </div>
                        {plateSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectSuggestion(item)}
                            style={{
                              padding: '10px 12px',
                              borderBottom: idx < plateSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <strong style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9375rem' }}>{item.plate}</strong>
                              <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', marginLeft: '8px' }}>{item.model}</span>
                              {item.color && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}> • {item.color}</span>}
                            </div>
                            {item.customerName && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.customerName}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Modelo do Veículo *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Honda Civic"
                      value={entryModel}
                      onChange={(e) => setEntryModel(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Auto-filled Success Banner */}
                {autoFilled && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      borderRadius: '8px',
                      color: '#22c55e',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    <Sparkles size={16} />
                    <span>✨ Veículo e cliente identificados no sistema! Os dados foram preenchidos automaticamente.</span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cor do Veículo (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Prata, Preto, Branco"
                      value={entryColor}
                      onChange={(e) => setEntryColor(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número da Vaga (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: A12, Vaga 05"
                      value={entrySpotNumber}
                      onChange={(e) => setEntrySpotNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome do Cliente</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: João Silva"
                      value={entryCustomerName}
                      onChange={(e) => setEntryCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-primary-400)', fontWeight: 700 }}>
                      WhatsApp do Cliente * (Obrigatório)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ex: (11) 99999-0000"
                      value={entryCustomerPhone}
                      onChange={(e) => setEntryCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observações / Avarias Pré-existentes</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Ex: Pequeno risco na porta direita, chave deixada na recepção..."
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                  />
                </div>

                {/* Rates info banner */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '12px', borderRadius: '10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#38bdf8' }}>Tarifas vigentes:</strong> 1ª hora: {formatCurrency(rates?.hourlyRate || 10)} • Horas adicionais: {formatCurrency(rates?.additionalRate || 5)} • Tolerância: {rates?.graceMinutes || 15} min.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEntryModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={entrySubmitting || !entryPlate || !entryModel}>
                  {entrySubmitting ? 'Registrando...' : (
                    <>
                      <Check size={18} /> Registrar Entrada & Gerar Código
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Saída de Veículo (Checkout & Código de Segurança) */}
      {showCheckoutModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="var(--color-primary-400)" />
                  Saída de Veículo & Pagamento
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Validação obrigatória do código de retirada informado pelo cliente
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Vehicle & Time summary */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedTicket.model}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Placa: <strong style={{ color: 'var(--color-primary-400)', fontFamily: 'monospace' }}>{selectedTicket.plate}</strong>
                      {selectedTicket.spotNumber && ` • Vaga: ${selectedTicket.spotNumber}`}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Entrada: {formatTime(selectedTicket.entryTime)} • Tempo: <strong>{getStayDurationFormatted(selectedTicket.entryTime)}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total da Estadia</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary-400)' }}>
                      {formatCurrency(getDynamicFee(selectedTicket))}
                    </div>
                  </div>
                </div>

                {/* Security Code Verification Box */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Key size={16} /> Código de Retirada do Cliente *
                    </label>
                    <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                      Gerado: {selectedTicket.pickupCode}
                    </span>
                  </div>

                  {!checkoutBypass ? (
                    <input
                      type="text"
                      maxLength={4}
                      className="form-input"
                      placeholder="Digite os 4 dígitos informados pelo cliente..."
                      value={checkoutCode}
                      onChange={(e) => setCheckoutCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{ fontSize: '1.5rem', letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center', color: '#f59e0b' }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600 }}>
                      Modo de confiança ativado: O veículo será liberado sem validação numérica do código.
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={checkoutBypass}
                      onChange={(e) => setCheckoutBypass(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-400)' }}
                    />
                    <span><strong>Confio no cliente</strong> (liberar retirada sem validar código)</span>
                  </label>
                </div>

                {/* Additional Wash or Service Fee */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Lavagem / Serviço Extra (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0,00"
                      value={checkoutWashFee}
                      onChange={(e) => setCheckoutWashFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Desconto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0,00"
                      value={checkoutDiscount}
                      onChange={(e) => setCheckoutDiscount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {PAYMENT_OPTIONS.map((method) => {
                      const selected = checkoutPaymentMethod === method.id;
                      const IconComp = method.icon;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setCheckoutPaymentMethod(method.id)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '10px',
                            border: selected ? `2px solid ${method.color}` : '1px solid var(--glass-border)',
                            background: selected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <IconComp size={16} style={{ color: selected ? method.color : 'inherit' }} />
                          <span>{method.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final calculated total */}
                <div style={{ background: 'var(--gradient-primary-soft)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Total a Cobrar:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fff' }}>
                    {formatCurrency(
                      Math.max(
                        0,
                        getDynamicFee(selectedTicket) + (Number(checkoutWashFee) || 0) - (Number(checkoutDiscount) || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success btn-lg" disabled={checkoutSubmitting}>
                  {checkoutSubmitting ? 'Confirmando...' : (
                    <>
                      <CheckCircle2 size={18} /> Confirmar Saída & Recebimento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuração de Tarifas e Vagas */}
      {showRatesModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={20} color="var(--color-primary-400)" />
                  Tarifas e Capacidade do Estacionamento
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Defina os valores cobrados por hora, frações, diárias e total de vagas
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowRatesModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRatesSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor da 1ª Hora (R$) *</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      className="form-input"
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Adicional / Fração (R$) *</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      className="form-input"
                      value={editAdditionalRate}
                      onChange={(e) => setEditAdditionalRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor da Diária (R$)</label>
                    <input
                      type="number"
                      step="1.00"
                      min="0"
                      className="form-input"
                      value={editDailyRate}
                      onChange={(e) => setEditDailyRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tolerância Gratuita (Minutos)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="Ex: 15"
                      value={editGraceMinutes}
                      onChange={(e) => setEditGraceMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacidade Total de Vagas do Pátio *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Ex: 30"
                    value={editTotalSpots}
                    onChange={(e) => setEditTotalSpots(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRatesModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={ratesSubmitting}>
                  {ratesSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
