'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<'atendimentos' | 'financeiro' | 'clientes'>('atendimentos');
  const [period, setPeriod] = useState<'30d' | '3m' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { showToast } = useToast();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/stats`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar relatórios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleExportCSV = () => {
    showToast('Exportação em CSV será liberada na próxima versão', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios Operacionais & Executivos</h1>
          <p className="page-subtitle">Consolidado do desempenho da lavagem, fluxo de clientes e faturamento</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'atendimentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('atendimentos')}
        >
          Relatório de Atendimentos
        </button>
        <button
          className={`tab ${activeTab === 'financeiro' ? 'active' : ''}`}
          onClick={() => setActiveTab('financeiro')}
        >
          Relatório Financeiro
        </button>
        <button
          className={`tab ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('clientes')}
        >
          Relatório de Clientes
        </button>
      </div>

      {loading || !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'atendimentos' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumo de Atendimentos</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-value">{data.washesMonth}</div>
                  <div className="stat-card-label">Lavagens no Mês</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{data.washesToday}</div>
                  <div className="stat-card-label">Lavagens Hoje</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{data.customersToday}</div>
                  <div className="stat-card-label">Clientes Hoje</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financeiro' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumo Financeiro</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-value">{formatCurrency(data.revenueMonth)}</div>
                  <div className="stat-card-label">Receita no Mês</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{formatCurrency(data.revenueToday)}</div>
                  <div className="stat-card-label">Receita de Hoje</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{formatCurrency(data.ticketMedioMonth)}</div>
                  <div className="stat-card-label">Ticket Médio</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumo da Carteira de Clientes</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-value">{data.totalCustomers}</div>
                  <div className="stat-card-label">Total de Clientes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{data.recurrentCustomersCount}</div>
                  <div className="stat-card-label">Clientes Recorrentes (3+ visitas)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{data.inactiveCustomersCount}</div>
                  <div className="stat-card-label">Clientes Inativos (&gt;45 dias)</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
