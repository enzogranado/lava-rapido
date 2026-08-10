'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, CheckCheck, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface WhatsAppLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  error?: string;
  createdAt: string;
  customer: { name: string; phone: string };
  wash?: { vehicle: { model: string; plate: string } };
}

export default function WhatsappPage() {
  const [messages, setMessages] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/messages');
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar histórico do WhatsApp', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Comunicação WhatsApp</h1>
          <p className="page-subtitle">Histórico de mensagens automáticas de aviso de carro pronto e reativação</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMessages}>
          <RefreshCw size={16} /> Atualizar Lista
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25D366' }}>
            <MessageCircle size={36} />
          </div>
          <div className="empty-state-title">Nenhuma mensagem enviada ainda</div>
          <div className="empty-state-description">
            Quando você avisar um cliente que o carro ficou pronto, o registro aparecerá aqui.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Veículo</th>
                <th>Mensagem</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    {formatDateTime(m.createdAt)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.customer.name}</td>
                  <td>{m.phone}</td>
                  <td>{m.wash ? `${m.wash.vehicle.model} (${m.wash.vehicle.plate})` : '-'}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.message}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {m.status === 'DELIVERED' || m.status === 'SENT' ? (
                      <span className="badge badge-success">
                        <CheckCheck size={14} /> Enviada
                      </span>
                    ) : (
                      <span className="badge badge-danger" title={m.error || 'Erro'}>
                        <AlertCircle size={14} /> Falha
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
