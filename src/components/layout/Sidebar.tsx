'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Atendimentos', href: '/atendimentos', icon: Car, section: 'Operação' },
  { label: 'Clientes & Veículos', href: '/clientes', icon: Users },
  { label: 'Serviços', href: '/servicos', icon: Wrench },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign, section: 'Gestão' },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle, section: 'Comunicação' },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, section: 'Sistema' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setSession(data.user);
      })
      .catch(() => {});
  }, [pathname]);

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

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
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
            className="modal-close"
            onClick={onClose}
            style={{ marginLeft: 'auto', display: 'none' }}
            id="sidebar-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {session?.role === 'SUPER_ADMIN' && (
            <div>
              <div className="sidebar-section-label" style={{ color: '#a855f7' }}>Plataforma Admin</div>
              <Link
                href="/admin"
                className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={onClose}
                style={{ color: '#c084fc' }}
              >
                <ShieldCheck className="sidebar-link-icon" size={20} color="#a855f7" />
                Painel Admin
              </Link>
            </div>
          )}

          {navItems.map((item) => (
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
          ))}
        </nav>
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
