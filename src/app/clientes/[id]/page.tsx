'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  CarFront,
  Calendar,
  DollarSign,
  Plus,
  X,
  Award,
  RefreshCw,
  Clock,
  Edit,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
  totalSpent: number;
  totalVisits: number;
  ticketMedio: number;
  lastVisit: string | null;
  mostUsedService: string;
  avgFrequency: number;
  vehicles: Array<{ id: string; model: string; plate: string; color?: string }>;
  washes: Array<{
    id: string;
    createdAt: string;
    status: string;
    total: number;
    vehicle: { model: string; plate: string };
    items: Array<{ id: string; serviceNameSnapshot: string; unitPrice: number }>;
  }>;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const { showToast } = useToast();

  // Add vehicle form
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Customer form state
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [submittingEditCustomer, setSubmittingEditCustomer] = useState(false);

  // Edit Vehicle form state
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editColor, setEditColor] = useState('');
  const [submittingEditVehicle, setSubmittingEditVehicle] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        setCustomer(await res.json());
      } else {
        showToast('Cliente não encontrado', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !plate) {
      showToast('Modelo e placa são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id, model, plate, color }),
      });

      if (res.ok) {
        showToast('Veículo cadastrado com sucesso!', 'success');
        setShowVehicleModal(false);
        setModel('');
        setPlate('');
        setColor('');
        fetchCustomer();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao cadastrar veículo', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar veículo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCustomerModal = () => {
    if (!customer) return;
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setEditNotes(customer.notes || '');
    setShowEditCustomerModal(true);
  };

  const handleUpdateCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editPhone) {
      showToast('Nome e telefone são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmittingEditCustomer(true);
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone, notes: editNotes }),
      });

      if (res.ok) {
        showToast('Dados do cliente atualizados com sucesso!', 'success');
        setShowEditCustomerModal(false);
        fetchCustomer();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao atualizar cliente', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar cliente', 'error');
    } finally {
      setSubmittingEditCustomer(false);
    }
  };

  const openEditVehicleModal = (v: { id: string; model: string; plate: string; color?: string }) => {
    setEditingVehicleId(v.id);
    setEditModel(v.model || '');
    setEditPlate(v.plate || '');
    setEditColor(v.color || '');
    setShowEditVehicleModal(true);
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModel || !editPlate) {
      showToast('Modelo e placa são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmittingEditVehicle(true);
      const res = await fetch(`/api/vehicles/${editingVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: editModel, plate: editPlate, color: editColor }),
      });

      if (res.ok) {
        showToast('Veículo atualizado com sucesso!', 'success');
        setShowEditVehicleModal(false);
        fetchCustomer();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao atualizar veículo', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar veículo', 'error');
    } finally {
      setSubmittingEditVehicle(false);
    }
  };

  if (loading || !customer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <Link href="/clientes" className="btn btn-ghost btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Voltar para Clientes
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">
              <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {customer.phone} • Cadastrado em {formatDate(customer.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={openEditCustomerModal}>
              <Edit size={16} /> Editar Cliente
            </button>
            <button className="btn btn-primary" onClick={() => setShowVehicleModal(true)}>
              <Plus size={18} /> Adicionar Veículo
            </button>
          </div>
        </div>
      </div>

      {/* Intelligence Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-card-value">{formatCurrency(customer.totalSpent)}</div>
          <div className="stat-card-label">Total Gasto</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <RefreshCw size={22} />
          </div>
          <div className="stat-card-value">{customer.totalVisits}</div>
          <div className="stat-card-label">Quantidade de Visitas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Award size={22} />
          </div>
          <div className="stat-card-value">{formatCurrency(customer.ticketMedio)}</div>
          <div className="stat-card-label">Ticket Médio do Cliente</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className="stat-card-value">
            {customer.avgFrequency > 0 ? `${customer.avgFrequency.toFixed(0)} dias` : 'N/A'}
          </div>
          <div className="stat-card-label">Frequência Média de Visita</div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CarFront size={20} color="var(--color-primary-400)" />
          Veículos Cadastrados ({customer.vehicles.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {customer.vehicles.map((v) => (
            <div key={v.id} style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{v.model}</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--color-primary-400)', fontWeight: 700, marginTop: '4px' }}>
                  {v.plate}
                </div>
                {v.color && <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Cor: {v.color}</div>}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                title="Editar Veículo"
                onClick={() => openEditVehicleModal(v)}
                style={{ padding: '4px 8px' }}
              >
                <Edit size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wash History */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>
          Histórico de Serviços ({customer.washes.length})
        </h3>

        {customer.washes.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Nenhum atendimento registrado ainda.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Veículo</th>
                  <th>Serviços</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.washes.map((w) => (
                  <tr key={w.id}>
                    <td>{formatDate(w.createdAt)}</td>
                    <td style={{ fontWeight: 600 }}>{w.vehicle.model} ({w.vehicle.plate})</td>
                    <td>{w.items.map((i) => i.serviceNameSnapshot).join(', ')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                      {formatCurrency(w.total)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${w.status === 'DELIVERED' ? 'success' : w.status === 'READY' ? 'purple' : 'warning'}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Veículo */}
      {showVehicleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Novo Veículo</h2>
              <button className="modal-close" onClick={() => setShowVehicleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Modelo do Carro *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Honda HR-V"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: ABC1D23"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cor (opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Branco"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Editar Cliente */}
      {showEditCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowEditCustomerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Dados do Cliente</h2>
              <button className="modal-close" onClick={() => setShowEditCustomerModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomerDetails}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações (Opcional)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditCustomerModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEditCustomer}>
                  {submittingEditCustomer ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Veículo */}
      {showEditVehicleModal && (
        <div className="modal-overlay" onClick={() => setShowEditVehicleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Dados do Veículo</h2>
              <button className="modal-close" onClick={() => setShowEditVehicleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateVehicle}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Modelo do Carro *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cor (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditVehicleModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEditVehicle}>
                  {submittingEditVehicle ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
