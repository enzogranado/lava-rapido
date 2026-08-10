'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Award, Calendar, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });

interface ServiceBreakdown {
  serviceName: string;
  quantity: number;
  revenue: number;
}

export default function FinanceiroPage() {
  const [range, setRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{
    chartData: Array<{ date: string; revenue: number; count: number; ticketMedio: number }>;
    totalRevenue: number;
    totalCount: number;
    overallTicketMedio: number;
  } | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue');
  const { showToast } = useToast();

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [revRes, svcRes] = await Promise.all([
        fetch(`/api/financial/revenue?range=${range}`),
        fetch(`/api/financial/by-service?range=${range}`),
      ]);

      if (revRes.ok) setRevenueData(await revRes.json());
      if (svcRes.ok) setServiceBreakdown(await svcRes.json());
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [range]);

  const sortedBreakdown = [...serviceBreakdown].sort((a, b) =>
    sortBy === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle Financeiro & Receita</h1>
          <p className="page-subtitle">Acompanhe as entradas do caixa, evolução do ticket médio e ranking de serviços</p>
        </div>
        <div className="filter-chips">
          {(['7d', '30d', '3m', '6m', '1y'] as const).map((r) => (
            <button
              key={r}
              className={`filter-chip ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === '7d' ? '7 dias' : r === '30d' ? '30 dias' : r === '3m' ? '3 meses' : r === '6m' ? '6 meses' : '1 ano'}
            </button>
          ))}
        </div>
      </div>

      {loading || !revenueData ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(revenueData.totalRevenue)}</div>
              <div className="stat-card-label">Receita no Período</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(0, 136, 230, 0.15)', color: '#0088e6' }}>
                <Calendar size={22} />
              </div>
              <div className="stat-card-value">{revenueData.totalCount}</div>
              <div className="stat-card-label">Atendimentos Concluídos</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Award size={22} />
              </div>
              <div className="stat-card-value">{formatCurrency(revenueData.overallTicketMedio)}</div>
              <div className="stat-card-label">Ticket Médio do Período</div>
            </div>
          </div>

          {/* Revenue Chart over Time */}
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Evolução da Receita (R$)</h3>
            </div>
            <div style={{ height: '320px', width: '100%' }}>
              <LineChart
                data={{
                  labels: revenueData.chartData.map((d) => d.date),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: revenueData.chartData.map((d) => d.revenue),
                      borderColor: '#22c55e',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                  },
                }}
              />
            </div>
          </div>

          {/* Revenue by Service Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Receita por Serviço</h3>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${sortBy === 'revenue' ? 'active' : ''}`}
                  onClick={() => setSortBy('revenue')}
                >
                  Maior Receita
                </button>
                <button
                  className={`filter-chip ${sortBy === 'quantity' ? 'active' : ''}`}
                  onClick={() => setSortBy('quantity')}
                >
                  Maior Quantidade
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th style={{ textAlign: 'right' }}>Quantidade Vendida</th>
                    <th style={{ textAlign: 'right' }}>Receita Gerada</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.serviceName}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ height: '260px', marginTop: '24px' }}>
              <BarChart
                data={{
                  labels: sortedBreakdown.map((i) => i.serviceName),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: sortedBreakdown.map((i) => i.revenue),
                      backgroundColor: '#0088e6',
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
