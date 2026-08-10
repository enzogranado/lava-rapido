'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, Edit2, Trash2, X, Check, Power } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { showToast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar serviços', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openNewModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setActive(true);
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price);
    setActive(service.active);
    setShowModal(true);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });

      if (res.ok) {
        showToast(
          `Serviço "${service.name}" ${!service.active ? 'ativado' : 'desativado'} com sucesso`,
          'success'
        );
        fetchServices();
      } else {
        showToast('Erro ao atualizar status do serviço', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar serviço', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '') {
      showToast('Nome e preço são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price: Number(price), active }),
      });

      if (res.ok) {
        showToast(
          editingService
            ? 'Serviço e preço atualizados com sucesso!'
            : 'Serviço criado com sucesso!',
          'success'
        );
        setShowModal(false);
        fetchServices();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao salvar serviço', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar serviço', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${serviceName}"?`)) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Serviço excluído', 'success');
        fetchServices();
      } else {
        showToast('Erro ao excluir serviço', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir serviço', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Personalização de Serviços</h1>
          <p className="page-subtitle">Configure exatamente quais serviços seu lava-rápido oferece e quanto cobra por cada um</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Criar Serviço
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Wrench size={36} />
          </div>
          <div className="empty-state-title">Nenhum serviço cadastrado</div>
          <div className="empty-state-description">Cadastre seus serviços e preços para poder registrar atendimentos.</div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} /> Criar Serviço
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {services.map((s) => (
            <div key={s.id} className="service-card">
              <div className="service-card-header">
                <div>
                  <div className="service-card-name">{s.name}</div>
                  <span className={`badge ${s.active ? 'badge-success' : 'badge-neutral'}`} style={{ marginTop: '4px' }}>
                    {s.active ? '🟢 Ativo' : '🔴 Inativo'}
                  </span>
                </div>
                <div className="service-card-price">{formatCurrency(s.price)}</div>
              </div>

              {s.description && (
                <p className="service-card-description">{s.description}</p>
              )}

              <div className="service-card-footer">
                <button
                  className={`btn ${s.active ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                  onClick={() => handleToggleActive(s)}
                  title={s.active ? 'Desativar serviço' : 'Ativar serviço'}
                >
                  <Power size={14} color={s.active ? 'var(--color-danger)' : 'var(--color-success)'} />
                  {s.active ? 'Desativar' : 'Ativar'}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(s)}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDelete(s.id, s.name)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar / Editar Serviço */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Serviço *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Lavagem Completa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preço Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 80.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                  />
                  <span className="form-hint">
                    Alterações de preço não modificam o valor de atendimentos antigos já registrados.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição (opcional)</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Ex: Lavagem externa + limpeza interna + acabamento."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className={`toggle ${active ? 'active' : ''}`}
                    onClick={() => setActive(!active)}
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    Status: {active ? '🟢 Ativo (disponível nos atendimentos)' : '🔴 Inativo'}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingService ? 'Atualizar Preço / Serviço' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
