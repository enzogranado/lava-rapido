'use client';

import { usePathname } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
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
};

export default function Header({ onMenuToggle, onNewWash }: HeaderProps) {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState('');

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

  // Find matching page title (handle dynamic routes)
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
      <div className="header-right">
        <span className="header-date" style={{ textTransform: 'capitalize' }}>{currentDate}</span>
        {onNewWash && (
          <button className="btn btn-primary" onClick={onNewWash} id="header-new-wash-btn">
            <Plus size={18} />
            Novo Atendimento
          </button>
        )}
      </div>
    </header>
  );
}
