'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  DollarSign,
  Wrench,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  onMenuToggle?: () => void;
}

const navItems = [
  { label: 'Início', href: '/', icon: LayoutDashboard },
  { label: 'Atendimentos', href: '/atendimentos', icon: Car },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Serviços', href: '/servicos', icon: Wrench },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
];

export default function MobileNav({ onMenuToggle }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <item.icon className="mobile-nav-icon" size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
        {onMenuToggle && (
          <button
            type="button"
            className="mobile-nav-item mobile-nav-menu-btn"
            onClick={onMenuToggle}
            aria-label="Abrir Menu Completo"
          >
            <Menu className="mobile-nav-icon" size={20} />
            <span>Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
}
