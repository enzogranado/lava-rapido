'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  DollarSign,
  Wrench,
} from 'lucide-react';

const navItems = [
  { label: 'Início', href: '/', icon: LayoutDashboard },
  { label: 'Atendimentos', href: '/atendimentos', icon: Car },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Serviços', href: '/servicos', icon: Wrench },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
];

export default function MobileNav() {
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
            <item.icon className="mobile-nav-icon" size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
