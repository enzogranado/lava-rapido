'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, Plus, LogOut, Store, ShieldCheck, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  onNewWash?: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão geral do seu lava-rápido' },
  '/atendimentos': { title: 'Atendimentos', subtitle: 'Gerencie os atendimentos em andamento' },
  '/clientes': { title: 'Clientes', subtitle: 'Cadastro e histórico de clientes' },
  '/veiculos': { title: 'Veículos', subtitle: 'Veículos cadastrados' },
  '/servicos': { title: 'Serviços', subtitle: 'Configure seus serviços e preços' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Controle de receita e caixa' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Análises e métricas do negócio' },
  '/whatsapp': { title: 'WhatsApp', subtitle: 'Histórico de mensagens enviadas' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Configurações do sistema' },
  '/admin': { title: 'Painel Administrador', subtitle: 'Gestão global de lava-rápidos da plataforma' },
};

export default function Header({ onMenuToggle, onNewWash }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(
        new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(new Date())
      );
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setSession(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const basePath = '/' + (pathname.split('/')[1] || '');
  const pageInfo = pageTitles[basePath] || pageTitles[pathname] || { title: 'Página', subtitle: '' };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{pageInfo.title}</h1>
          <p className="header-subtitle">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="header-right" style={{ gap: '16px' }}>
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {session.role === 'SUPER_ADMIN' ? (
              <ShieldCheck size={16} color="#a855f7" />
            ) : (
              <Store size={16} color="var(--color-primary-400)" />
            )}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {session.tenantName || session.name}
            </span>
          </div>
        )}

        <span className="header-date" style={{ textTransform: 'capitalize' }}>{currentDate}</span>
        
        {onNewWash && pathname !== '/admin' && (
          <button className="btn btn-primary" onClick={onNewWash} id="header-new-wash-btn">
            <Plus size={18} />
            Novo Atendimento
          </button>
        )}

        {session && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Sair da conta"
            style={{ color: 'var(--text-tertiary)', padding: '8px' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
