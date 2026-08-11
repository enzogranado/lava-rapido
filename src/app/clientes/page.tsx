'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  CarFront,
  Eye,
  Trash2,
  X,
  Car,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
  vehicles: Array<{ id: string; model: string; plate: string; color?: string }>;
  totalSpent: number;
  lastVisit: string | null;
  totalVisits: number;
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'totalSpent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  // New Customer & Vehicle Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, sortBy, sortOrder]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast('Nome e telefone são obrigatórios', 'warning');
      return;
    }

    if (!vehicleModel || !vehiclePlate) {
      showToast('Modelo e placa do veículo são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          notes,
          vehicleModel,
          vehiclePlate,
          vehicleColor,
        }),
      });

      if (res.ok) {
        showToast('Cliente e veículo cadastrados com sucesso!', 'success');
        setShowModal(false);
        setName('');
        setPhone('');
        setVehicleModel('');
        setVehiclePlate('');
        setVehicleColor('');
        setNotes('');
        fetchCustomers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao cadastrar cliente', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao cadastrar cliente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, customerName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${customerName}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cliente excluído', 'success');
        fetchCustomers();
      } else {
        showToast('Erro ao excluir cliente', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir cliente', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes & Veículos</h1>
          <p className="page-subtitle">Cadastro completo de clientes e seus respectivos carros em um só lugar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search className="search-bar-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, modelo ou placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>Ordenar por:</span>
          <button
            className={`filter-chip ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => {
              if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('name'); setSortOrder('asc'); }
            }}
          >
            Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`filter-chip ${sortBy === 'lastVisit' ? 'active' : ''}`}
            onClick={() => {
              if (sortBy === 'lastVisit') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('lastVisit'); setSortOrder('desc'); }
            }}
          >
            Última Visita {sortBy === 'lastVisit' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`filter-chip ${sortBy === 'totalSpent' ? 'active' : ''}`}
            onClick={() => {
              if (sortBy === 'totalSpent') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('totalSpent'); setSortOrder('desc'); }
            }}
          >
            Maior Valor Gasto {sortBy === 'totalSpent' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={36} />
          </div>
          <div className="empty-state-title">Nenhum cliente encontrado</div>
          <div className="empty-state-description">Cadastre seus clientes com o veículo para iniciar os atendimentos.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Veículo(s) & Placa</th>
                <th>Última Visita</th>
                <th style={{ textAlign: 'right' }}>Total Visitas</th>
                <th style={{ textAlign: 'right' }}>Total Gasto</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clientes/${c.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    {c.vehicles.length === 0 ? (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Nenhum veículo</span>
                    ) : (
                      c.vehicles.map((v) => (
                        <div key={v.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
                          <Car size={14} color="var(--color-primary-400)" />
                          <span>{v.model}</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                            {v.plate}
                          </span>
                        </div>
                      ))
                    )}
                  </td>
                  <td>{c.lastVisit ? formatDate(c.lastVisit) : 'Nunca'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.totalVisits}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <Link href={`/clientes/${c.id}`} className="btn btn-secondary btn-sm" title="Ver Perfil">
                        <Eye size={14} />
                        Perfil
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
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

      {/* Modal: Novo Cliente + Veículo */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Novo Cliente & Veículo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body">
                {/* Informações do Cliente */}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-400)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                  👤 Dados do Cliente
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: (11) 99999-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Informações do Veículo */}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-400)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginTop: '12px' }}>
                  🚗 Dados do Veículo
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Modelo do Carro *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Honda HR-V"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Placa *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: ABC1D23"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cor (opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Branco"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observações (opcional)</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '60px' }}
                    placeholder="Ex: Prefere cera líquida, bancos de couro..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Cadastrando...' : 'Cadastrar Cliente & Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
