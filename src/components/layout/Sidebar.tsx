'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  Wrench,
  DollarSign,
  BarChart3,
  MessageCircle,
  Settings,
  X,
  Droplets,
  ShieldCheck,
  LogOut,
  History,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Atendimentos (Hoje)', href: '/atendimentos', icon: Car, section: 'Operação' },
  { label: 'Histórico de Lavagens', href: '/historico', icon: History },
  { label: 'Clientes & Veículos', href: '/clientes', icon: Users },
  { label: 'Serviços', href: '/servicos', icon: Wrench },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign, section: 'Gestão' },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle, section: 'Comunicação' },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, section: 'Sistema' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

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

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Droplets size={22} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">{session?.tenantName || 'Lava Rápido'}</div>
            <div className="sidebar-logo-sub">Sistema de Gestão</div>
          </div>
          <button
            className="modal-close sidebar-close-btn"
            onClick={onClose}
            aria-label="Fechar Menu"
            id="sidebar-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {session?.role === 'SUPER_ADMIN' ? (
            <div>
              <div className="sidebar-section-label" style={{ color: '#a855f7' }}>Gestão da Plataforma</div>
              
              <Link
                href="/admin"
                className={`sidebar-link ${pathname === '/admin' ? 'active' : ''}`}
                onClick={onClose}
                style={{ color: '#c084fc' }}
              >
                <ShieldCheck className="sidebar-link-icon" size={20} color="#a855f7" />
                Painel Master
              </Link>
            </div>
          ) : (
            navItems.map((item) => (
              <div key={item.href}>
                {item.section && (
                  <div className="sidebar-section-label">{item.section}</div>
                )}
                <Link
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon className="sidebar-link-icon" size={20} />
                  {item.label}
                </Link>
              </div>
            ))
          )}
        </nav>

        {/* Footer with Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          {session && (
            <div style={{ marginBottom: '12px', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.name}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            id="sidebar-logout-btn"
          >
            <LogOut size={16} />
            Sair da Conta
          </button>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-overlay {
          display: none;
        }
        @media (max-width: 1024px) {
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99;
          }
        }
      `}</style>
    </>
  );
}
