'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  CarFront,
  Droplets,
  Calendar,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  Clock,
  MessageCircle,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
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

interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  washesToday: number;
  washesMonth: number;
  customersToday: number;
  recurrentCustomersCount: number;
  inactiveCustomersCount: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  countMonthWashes: number;
  ticketMedioMonth: number;
  avgVisitsPerCustomer: string;
  inactiveCustomersList: Array<{
    id: string;
    name: string;
    phone: string;
    lastVisit: string | null;
    daysWithoutVisit: number | null;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('30d');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'count'>('revenue');
  const [chartRawData, setChartRawData] = useState<any[]>([]);
  const [chartSummary, setChartSummary] = useState<{ totalRevenue: number; totalCount: number } | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: any[] } | null>(null);
  const { showToast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (range: string) => {
    try {
      const res = await fetch(`/api/financial/revenue?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setChartRawData(data.chartData || []);
        setChartSummary({
          totalRevenue: data.totalRevenue || 0,
          totalCount: data.totalCount || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchChartData(chartRange);
  }, [chartRange]);

  useEffect(() => {
    if (!chartRawData.length) return;
    const labels = chartRawData.map((d: any) => d.date);

    if (chartMetric === 'revenue') {
      const revenues = chartRawData.map((d: any) => d.revenue);
      setChartData({
        labels,
        datasets: [
          {
            label: 'Receita (R$)',
            data: revenues,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      });
    } else {
      const counts = chartRawData.map((d: any) => d.count);
      setChartData({
        labels,
        datasets: [
          {
            label: 'Atendimentos',
            data: counts,
            borderColor: '#0088e6',
            backgroundColor: 'rgba(0, 136, 230, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      });
    }
  }, [chartRawData, chartMetric]);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Top Section - Destaque de Receita */}
      <div className="revenue-grid">
        {/* Receita do Mês */}
        <div className="revenue-card revenue-card-primary animate-fadeInUp">
          <div className="revenue-card-label">Receita do Mês</div>
          <div className="revenue-card-value">{formatCurrency(stats.revenueMonth)}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} />
            Calculado com atendimentos entregues
          </div>
        </div>

        {/* Atendimentos do Mês */}
        <div className="revenue-card revenue-card-secondary animate-fadeInUp delay-1">
          <div className="revenue-card-label">Atendimentos no Mês</div>
          <div className="revenue-card-value">{stats.washesMonth}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Total de veículos lavados
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="revenue-card revenue-card-secondary animate-fadeInUp delay-2">
          <div className="revenue-card-label">Ticket Médio</div>
          <div className="revenue-card-value">{formatCurrency(stats.ticketMedioMonth)}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Receita total / nº de atendimentos
          </div>
        </div>
      </div>

      {/* 2. Grid de Stats Cards */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="var(--color-primary-400)" />
          Indicadores Rápidos
        </h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Users size={22} />
            </div>
            <div className="stat-card-value">{stats.totalCustomers}</div>
            <div className="stat-card-label">Clientes Cadastrados</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <CarFront size={22} />
            </div>
            <div className="stat-card-value">{stats.totalVehicles}</div>
            <div className="stat-card-label">Veículos Cadastrados</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <Droplets size={22} />
            </div>
            <div className="stat-card-value">{stats.washesToday}</div>
            <div className="stat-card-label">Lavagens Hoje</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Calendar size={22} />
            </div>
            <div className="stat-card-value">{stats.washesMonth}</div>
            <div className="stat-card-label">Lavagens no Período</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <UserCheck size={22} />
            </div>
            <div className="stat-card-value">{stats.customersToday}</div>
            <div className="stat-card-label">Clientes Atendidos Hoje</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <RefreshCw size={22} />
            </div>
            <div className="stat-card-value">{stats.recurrentCustomersCount}</div>
            <div className="stat-card-label">Clientes Recorrentes (3+ visitas)</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <UserX size={22} />
            </div>
            <div className="stat-card-value">{stats.inactiveCustomersCount}</div>
            <div className="stat-card-label">Clientes Inativos (&gt;45 dias)</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-card-value">{formatCurrency(stats.revenueToday)}</div>
            <div className="stat-card-label">Receita de Hoje</div>
          </div>
        </div>
      </div>

      {/* 3. Gráfico de Fluxo de Caixa */}
      <div className="chart-container">
        <div className="chart-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color={chartMetric === 'revenue' ? '#22c55e' : '#0088e6'} />
              Fluxo do Caixa & Atendimentos
            </h3>
            {chartSummary && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Total acumulado no período: <strong style={{ color: '#22c55e' }}>{formatCurrency(chartSummary.totalRevenue)}</strong> • Atendimentos: <strong style={{ color: '#06b6d4' }}>{chartSummary.totalCount}</strong>
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Metric Switcher */}
            <div className="filter-chips">
              <button
                className={`filter-chip ${chartMetric === 'revenue' ? 'active' : ''}`}
                onClick={() => setChartMetric('revenue')}
              >
                💵 Fluxo (R$)
              </button>
              <button
                className={`filter-chip ${chartMetric === 'count' ? 'active' : ''}`}
                onClick={() => setChartMetric('count')}
              >
                🚗 Atendimentos
              </button>
            </div>

            {/* Range Switcher */}
            <div className="filter-chips">
              {(['7d', '30d', '3m', '6m', '1y'] as const).map((range) => (
                <button
                  key={range}
                  className={`filter-chip ${chartRange === range ? 'active' : ''}`}
                  onClick={() => setChartRange(range)}
                >
                  {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : range === '3m' ? '3 meses' : range === '6m' ? '6 meses' : '1 ano'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '320px', width: '100%', marginTop: '16px' }}>
          {chartData ? (
            <LineChart
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1a1f35',
                    titleColor: '#f0f4f8',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                      label: (context) => {
                        const val = context.parsed.y ?? 0;
                        if (chartMetric === 'revenue') {
                          return ` Receita: ${formatCurrency(val)}`;
                        }
                        return ` Atendimentos: ${val}`;
                      },
                    },
                  },
                },
                scales: {
                  x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                  y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => {
                        if (chartMetric === 'revenue') {
                          return `R$ ${value}`;
                        }
                        return value;
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      </div>

      {/* 4. Clientes que Precisam de Atenção */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserX size={20} color="var(--color-danger)" />
          Clientes que Precisam de Atenção (Inativos)
        </h3>

        {stats.inactiveCustomersList.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Nenhum cliente inativo no momento. Parabéns!</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Última Visita</th>
                  <th style={{ textAlign: 'right' }}>Dias sem Visitar</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {stats.inactiveCustomersList.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.lastVisit ? formatDate(c.lastVisit) : 'Nunca'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-danger">
                        <Clock size={12} />
                        {c.daysWithoutVisit ? `${c.daysWithoutVisit} dias` : 'Sem visitas'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${c.name}! Sentimos sua falta aqui no lava-rápido. Que tal agendar uma lavagem hoje? 🚗✨`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-whatsapp btn-sm"
                      >
                        <MessageCircle size={14} />
                        Avisar pelo WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
