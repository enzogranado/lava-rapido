'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, Edit2, Trash2, X, Check, Power, Repeat } from 'lucide-react';
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

interface MonthlyPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  washesIncluded: number | null;
  active: boolean;
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

  // Monthly plans (Mensalistas) state
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MonthlyPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState<number | ''>('');
  const [planWashesIncluded, setPlanWashesIncluded] = useState<number | ''>('');
  const [planActive, setPlanActive] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(false);

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

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch('/api/monthly-plans');
      if (res.ok) setPlans(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar planos mensais', 'error');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchPlans();
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

  // Monthly plans (Mensalistas) handlers — mirrors the service handlers above
  const openNewPlanModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanWashesIncluded('');
    setPlanActive(true);
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan: MonthlyPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice(plan.price);
    setPlanWashesIncluded(plan.washesIncluded ?? '');
    setPlanActive(plan.active);
    setShowPlanModal(true);
  };

  const handleTogglePlanActive = async (plan: MonthlyPlan) => {
    try {
      const res = await fetch(`/api/monthly-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !plan.active }),
      });
      if (res.ok) {
        showToast(`Plano "${plan.name}" ${!plan.active ? 'ativado' : 'desativado'} com sucesso`, 'success');
        fetchPlans();
      } else {
        showToast('Erro ao atualizar status do plano', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar plano', 'error');
    }
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || planPrice === '') {
      showToast('Nome e preço são obrigatórios', 'warning');
      return;
    }

    try {
      setSubmittingPlan(true);
      const url = editingPlan ? `/api/monthly-plans/${editingPlan.id}` : '/api/monthly-plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          description: planDescription,
          price: Number(planPrice),
          washesIncluded: planWashesIncluded === '' ? null : Number(planWashesIncluded),
          active: planActive,
        }),
      });

      if (res.ok) {
        showToast(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano mensal criado com sucesso!', 'success');
        setShowPlanModal(false);
        fetchPlans();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao salvar plano', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar plano', 'error');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string, planNameToDelete: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${planNameToDelete}"?`)) return;

    try {
      const res = await fetch(`/api/monthly-plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plano excluído', 'success');
        fetchPlans();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao excluir plano', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir plano', 'error');
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

      <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Wrench size={18} color="var(--color-primary-400)" /> Serviços Avulsos
      </h2>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
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

      {/* Planos Mensais (Mensalistas) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={18} color="var(--color-primary-400)" /> Planos Mensais (Mensalistas)
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={openNewPlanModal}>
          <Plus size={16} /> Criar Plano
        </button>
      </div>
      <p className="page-subtitle" style={{ marginTop: '-12px' }}>
        Planos recorrentes vendidos a clientes mensalistas. Gerencie quem está assinado em{' '}
        <a href="/mensalistas" style={{ color: 'var(--color-primary-400)' }}>Mensalistas</a>.
      </p>

      {loadingPlans ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Repeat size={36} />
          </div>
          <div className="empty-state-title">Nenhum plano mensal cadastrado</div>
          <div className="empty-state-description">Crie planos recorrentes para oferecer aos seus clientes mensalistas.</div>
          <button className="btn btn-primary" onClick={openNewPlanModal}>
            <Plus size={18} /> Criar Plano
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {plans.map((p) => (
            <div key={p.id} className="service-card">
              <div className="service-card-header">
                <div>
                  <div className="service-card-name">{p.name}</div>
                  <span className={`badge ${p.active ? 'badge-success' : 'badge-neutral'}`} style={{ marginTop: '4px' }}>
                    {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                  </span>
                  <span className="badge badge-info" style={{ marginTop: '4px', marginLeft: '6px' }}>
                    <Repeat size={12} /> Mensal
                  </span>
                </div>
                <div className="service-card-price">{formatCurrency(p.price)}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/mês</span></div>
              </div>

              <p className="service-card-description">
                {p.washesIncluded ? `${p.washesIncluded} lavagens incluídas por mês` : 'Lavagens ilimitadas'}
                {p.description ? ` — ${p.description}` : ''}
              </p>

              <div className="service-card-footer">
                <button
                  className={`btn ${p.active ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                  onClick={() => handleTogglePlanActive(p)}
                  title={p.active ? 'Desativar plano' : 'Ativar plano'}
                >
                  <Power size={14} color={p.active ? 'var(--color-danger)' : 'var(--color-success)'} />
                  {p.active ? 'Desativar' : 'Ativar'}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditPlanModal(p)}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDeletePlan(p.id, p.name)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar / Editar Plano Mensal */}
      {showPlanModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingPlan ? 'Editar Plano Mensal' : 'Novo Plano Mensal'}</h2>
              <button className="modal-close" onClick={() => setShowPlanModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitPlan}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Plano *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Plano Mensal 4 Lavagens"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preço Mensal (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Ex: 150.00"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lavagens Incluídas / Mês</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Deixe em branco = ilimitado"
                      value={planWashesIncluded}
                      onChange={(e) => setPlanWashesIncluded(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição (opcional)</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Ex: Vale para lavagem completa, 1x por semana."
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className={`toggle ${planActive ? 'active' : ''}`}
                    onClick={() => setPlanActive(!planActive)}
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    Status: {planActive ? '🟢 Ativo (disponível para novas assinaturas)' : '🔴 Inativo'}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPlan}>
                  {submittingPlan ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
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
