'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, MessageCircle, Clock, Store } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ConfiguracoesPage() {
  const [businessName, setBusinessName] = useState('');
  const [inactiveDaysLimit, setInactiveDaysLimit] = useState(45);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setBusinessName(data.businessName || 'Meu Lava Rápido');
        setInactiveDaysLimit(data.inactiveDaysLimit || 45);
        setWhatsappTemplate(
          data.whatsappMessageTemplate ||
            'Olá, {nome}! 🚗✨\n\nSeu {modelo} — placa {placa} — ficou pronto e já está disponível para retirada.\n\nObrigado por confiar em nosso lava-rápido! 🚿'
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          inactiveDaysLimit,
          whatsappMessageTemplate: whatsappTemplate,
        }),
      });

      if (res.ok) {
        showToast('Configurações salvas com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar configurações', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao salvar configurações', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações do Sistema</h1>
          <p className="page-subtitle">Personalize as regras operacionais e templates de mensagem</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} color="var(--color-primary-400)" />
            Dados do Estabelecimento
          </h3>

          <div className="form-group">
            <label className="form-label">Nome do Lava-Rápido</label>
            <input
              type="text"
              className="form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--color-warning)" />
            Regra de Retenção de Clientes
          </h3>

          <div className="form-group">
            <label className="form-label">Considerar cliente INATIVO após quantos dias sem visitar?</label>
            <input
              type="number"
              className="form-input"
              value={inactiveDaysLimit}
              onChange={(e) => setInactiveDaysLimit(parseInt(e.target.value, 10) || 45)}
              required
            />
            <span className="form-hint">
              Clientes que não realizarem um atendimento entregue durante esse número de dias aparecerão na lista &quot;Clientes que precisam de atenção&quot;.
            </span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} color="#25D366" />
            Template da Mensagem WhatsApp (Carro Pronto)
          </h3>

          <div className="form-group">
            <label className="form-label">Mensagem Padrão de Envio</label>
            <textarea
              className="form-input form-textarea"
              style={{ minHeight: '120px' }}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              required
            />
            <span className="form-hint">
              Campos automáticos substituídos: <code>{'{nome}'}</code>, <code>{'{modelo}'}</code>, <code>{'{placa}'}</code>
            </span>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            <Save size={20} />
            {submitting ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
