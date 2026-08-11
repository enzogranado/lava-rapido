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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('dashboard_unlocked');
      }
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
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Abrir Menu">
          <Menu size={20} />
        </button>
        <div className="header-title-wrapper">
          <h1 className="header-title">{pageInfo.title}</h1>
          <p className="header-subtitle">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        {session && (
          <div className="header-tenant-badge">
            {session.role === 'SUPER_ADMIN' ? (
              <ShieldCheck size={16} color="#a855f7" className="flex-shrink-0" />
            ) : (
              <Store size={16} color="var(--color-primary-400)" className="flex-shrink-0" />
            )}
            <span className="header-tenant-name">
              {session.tenantName || session.name}
            </span>
          </div>
        )}

        <span className="header-date">{currentDate}</span>
        
        {onNewWash && pathname !== '/admin' && (
          <button className="btn btn-primary header-action-btn" onClick={onNewWash} id="header-new-wash-btn">
            <Plus size={18} />
            <span className="btn-label-desktop">Novo Atendimento</span>
            <span className="btn-label-mobile">Novo</span>
          </button>
        )}

        {session && (
          <button
            className="btn btn-secondary btn-sm header-logout-btn"
            onClick={handleLogout}
            title="Sair da conta"
            id="header-logout-btn"
          >
            <LogOut size={16} />
            <span className="btn-label-desktop">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
}
