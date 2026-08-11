'use client';

import { useState, useEffect } from 'react';
import { CarFront, Search, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  color?: string;
  notes?: string;
  customer: { id: string; name: string; phone: string };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}`);
      if (res.ok) setVehicles(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar veículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search]);

  const openModal = () => {
    fetchCustomers();
    setCustomerId('');
    setModel('');
    setPlate('');
    setColor('');
    setShowModal(true);
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !model || !plate) {
      showToast('Cliente, modelo e placa são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, model, plate, color }),
      });

      if (res.ok) {
        showToast('Veículo cadastrado com sucesso!', 'success');
        setShowModal(false);
        fetchVehicles();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao cadastrar veículo', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao cadastrar veículo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string, modelPlate: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${modelPlate}"?`)) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Veículo excluído', 'success');
        fetchVehicles();
      } else {
        showToast('Erro ao excluir veículo', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir veículo', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Veículos</h1>
          <p className="page-subtitle">Veículos vinculados a cada cliente para busca rápida por placa</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search className="search-bar-icon" size={18} />
        <input
          type="text"
          placeholder="Buscar por placa, modelo ou dono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CarFront size={36} />
          </div>
          <div className="empty-state-title">Nenhum veículo encontrado</div>
          <div className="empty-state-description">Cadastre os veículos dos seus clientes para agilizar a entrada.</div>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={18} /> Novo Veículo
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Cor</th>
                <th>Proprietário</th>
                <th>Telefone</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                    {v.plate}
                  </td>
                  <td style={{ fontWeight: 600 }}>{v.model}</td>
                  <td>{v.color || '-'}</td>
                  <td>{v.customer.name}</td>
                  <td>{v.customer.phone}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteVehicle(v.id, `${v.model} (${v.plate})`)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Novo Veículo */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Novo Veículo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente Proprietário *</label>
                  <select
                    className="form-input form-select"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

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
                    placeholder="Ex: Prata"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
    </div>
  );
}
