'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Droplets,
  CheckCircle2,
  ArrowRight,
  Play,
  Car,
  Clock,
  MessageCircle,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  ChevronDown,
  Sparkles,
  Check,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'O sistema precisa de instalação no computador?',
      a: 'Não! O Lava Rápido OS funciona 100% online na nuvem. Você pode acessar pelo navegador do seu celular, tablet, notebook ou computador de mesa de onde estiver.',
    },
    {
      q: 'Como funciona o envio de mensagens pelo WhatsApp?',
      a: 'Com um único clique no botão "Avisar Cliente", o sistema gera a mensagem personalizada com o nome do cliente, modelo do veículo e placa, abrindo diretamente o WhatsApp Web no PC ou o app no celular.',
    },
    {
      q: 'Existe limite de cadastros de clientes ou veículos?',
      a: 'Não! O cadastro de clientes, veículos e serviços executados é totalmente ilimitado em todos os nossos planos.',
    },
    {
      q: 'Existe contrato de fidelidade ou taxa de cancelamento?',
      a: 'Nenhum contrato ou fidelidade. Você paga mês a mês a assinatura simples de R$ 149.90 e pode cancelar quando quiser sem multas.',
    },
    {
      q: 'Minha equipe consegue usar ao mesmo tempo em dispositivos diferentes?',
      a: 'Sim! Vários funcionários podem acessar o sistema ao mesmo tempo. O pátio pode cadastrar novos carros no celular enquanto o caixa acompanha os pagamentos no computador.',
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0e1a', color: '#f0f4f8', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. Header / Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          background: 'rgba(10, 14, 26, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0, 136, 230, 0.4)',
              }}
            >
              <Droplets size={22} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Lava Rápido <span style={{ color: '#06b6d4' }}>OS</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
            className="desktop-nav"
          >
            <a href="#como-funciona" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Como Funciona
            </a>
            <a href="#beneficios" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Benefícios
            </a>
            <a href="#funcionalidades" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Funcionalidades
            </a>
            <a href="#planos" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>
              Planos
            </a>
            <a href="#faq" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/login"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(0, 136, 230, 0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        id="hero"
        style={{
          position: 'relative',
          padding: '80px 24px 100px',
          background: 'radial-gradient(circle at 50% 20%, #16264c 0%, #0a0e1a 70%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left Column: Headline & CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                fontSize: '0.875rem',
                fontWeight: 600,
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8',
                }}
              />
              PLATAFORMA DE GESTÃO AUTOMOTIVA
            </div>

            <h1
              style={{
                fontSize: '3.25rem',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                letterSpacing: '-0.03em',
              }}
            >
              Gestão de lava-rápido <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>inteligente.</span><br />
              Do pátio ao faturamento em segundos.
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '540px' }}>
              Controle veículos no pátio em tempo real, avise clientes pelo WhatsApp com 1 clique e acompanhe o faturamento do seu lava-rápido de forma simples.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Link
                href="/cadastro"
                style={{
                  padding: '16px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '1.0625rem',
                  fontWeight: 800,
                  boxShadow: '0 10px 30px rgba(0, 136, 230, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'transform 0.2s ease',
                }}
              >
                Criar conta grátis <ArrowRight size={20} />
              </Link>
              <a
                href="#como-funciona"
                style={{
                  padding: '16px 28px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f0f4f8',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={16} fill="#ffffff" /> Ver como funciona
              </a>
            </div>

            {/* Checkmark Features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', fontSize: '0.875rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#38bdf8" /> Sem necessidade de cartão
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#38bdf8" /> Aviso de WhatsApp em 1-clique
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#38bdf8" /> Sem contrato de fidelidade
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#38bdf8" /> Suporte VIP via WhatsApp
              </div>
            </div>
          </div>

          {/* Right Column: Interactive UI Mockup Preview */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
                borderRadius: '30px',
                filter: 'blur(40px)',
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(6, 182, 212, 0.15)',
              }}
            >
              {/* Fake Window Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '0.8125rem', color: '#94a3b8', marginLeft: '12px', fontWeight: 600 }}>Painel Operacional — Lava Rápido OS</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>AO VIVO</span>
              </div>

              {/* Status Stats Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>EM SERVIÇO</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>3 carros</div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>PRONTO</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>2 carros</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>FATURADO HOJE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>R$ 480,00</div>
                </div>
              </div>

              {/* Mock Car Card Ready for WhatsApp */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.875rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
                      EAY0236
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9375rem' }}>Honda HR-V</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enzo Granado (+55 11 99422-4921)</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                    PRONTO
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>Lavagem Completa + Cera (R$ 80,00)</span>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: '#25D366',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                    }}
                  >
                    <MessageCircle size={14} /> Avisar Cliente
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. Infinite Scrolling Marquee Banner */}
      <section style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.6)', padding: '18px 0', overflow: 'hidden' }}>
        <div className="marquee-track" style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[
            'LAVA-RÁPIDO',
            'ESTÉTICA AUTOMOTIVA',
            'DETAILED CAR CARE',
            'LAVA-JATO',
            'CENTRO AUTOMOTIVO',
            'HIGIENIZAÇÃO & POLIMENTO',
            'POSTO DE SERVIÇOS',
            'PROTEÇÃO DE PINTURA',
            'LIMPEZA TÉCNICA DE MOTOR',
            'ENCERAMENTO VIP',
            'LAVA-RÁPIDO',
            'ESTÉTICA AUTOMOTIVA',
            'DETAILED CAR CARE',
            'LAVA-JATO',
            'CENTRO AUTOMOTIVO',
            'HIGIENIZAÇÃO & POLIMENTO',
            'POSTO DE SERVIÇOS',
            'PROTEÇÃO DE PINTURA',
            'LIMPEZA TÉCNICA DE MOTOR',
            'ENCERAMENTO VIP',
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
              <span style={{ color: '#06b6d4' }}>✦</span> {item}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Section: Como Funciona */}
      <section id="como-funciona" style={{ padding: '100px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FLUXO SIMPLIFICADO</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>Como o Lava Rápido OS funciona na prática</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.0625rem', marginTop: '10px' }}>Simplicidade do cadastro à entrega do veículo.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="steps-grid">
          {[
            {
              step: '01',
              icon: Car,
              title: 'Entrada em 10 Segundos',
              desc: 'Cadastre o cliente, modelo e placa do veículo rapidamente direto do celular ou computador do pátio.',
            },
            {
              step: '02',
              icon: Clock,
              title: 'Painel Kanban de Pátio',
              desc: 'Altere o status com 1 clique: Aguardando ➔ Em Serviço ➔ Pronto ➔ Entregue.',
            },
            {
              step: '03',
              icon: MessageCircle,
              title: 'Aviso Direto WhatsApp',
              desc: 'Quando o carro estiver pronto, clique em "Avisar Cliente" para abrir a mensagem preenchida no WhatsApp.',
            },
            {
              step: '04',
              icon: BarChart3,
              title: 'Controle Financeiro',
              desc: 'Acompanhe a receita diária, ticket médio e descubra clientes sumidos há mais de 45 dias.',
            },
          ].map((card) => (
            <div
              key={card.step}
              style={{
                background: 'rgba(22, 28, 48, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '28px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                  <card.icon size={24} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.15)' }}>{card.step}</span>
              </div>
              <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#ffffff' }}>{card.title}</h3>
              <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: Benefícios */}
      <section id="beneficios" style={{ background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VANTAGENS EXCLUSIVAS</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>Por que trocar planilhas e papéis pelo nosso sistema?</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }} className="features-grid">
            {[
              {
                icon: Zap,
                title: 'Zero Perda de Informações',
                desc: 'Nunca mais perca fichas de papel rasgadas ou nomes de clientes rabiscados. Tudo fica registrado com segurança na nuvem.',
              },
              {
                icon: MessageCircle,
                title: 'Agilidade de Comunicação',
                desc: 'Evite ligações demoradas. Notifique o cliente assim que a lavagem for concluída direto pelo WhatsApp.',
              },
              {
                icon: TrendingUp,
                title: 'Reativação de Clientes Inativos',
                desc: 'O sistema lista automaticamente os clientes que não visitam seu lava-rápido há mais de 45 dias para você enviar promoções.',
              },
              {
                icon: DollarSign,
                title: 'Transparência Financeira',
                desc: 'Saiba exatamente qual foi o faturamento de hoje, desta semana e deste mês, além do seu ticket médio por lavagem.',
              },
              {
                icon: Users,
                title: 'Multi-Dispositivo Sincronizado',
                desc: 'Acesse pelo celular do pátio, tablet do caixa ou computador de casa. Todas as alterações são sincronizadas ao vivo.',
              },
              {
                icon: ShieldCheck,
                title: 'Trava de Segurança com PIN',
                desc: 'Proteja o Dashboard e relatórios financeiros com PIN numérico de 4 dígitos configurável.',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(22, 28, 48, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <item.icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{item.title}</h3>
                <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Section: Pricing / Planos */}
      <section id="planos" style={{ padding: '100px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PREÇO TRANSPARENTE</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>Um plano simples, sem letras miúdas</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.0625rem', marginTop: '10px' }}>Tudo o que seu lava-rápido precisa por um valor acessível.</p>
        </div>

        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(22, 36, 74, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '2px solid #06b6d4',
              borderRadius: '28px',
              padding: '40px 32px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(6, 182, 212, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 16px', borderRadius: '999px', letterSpacing: '0.05em' }}>
              RECOMENDADO PARA SEU NEGÓCIO
            </div>

            <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>Plano Gestão Completa</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 600 }}>R$</span>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>149.90</span>
                <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ mês</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#38bdf8', marginTop: '8px', fontWeight: 600 }}>Assinatura mensal sem fidelidade</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9375rem', color: '#cbd5e1' }}>
              {[
                'Cadastros ilimitados de clientes e veículos',
                'Painel de Pátio com alteração de status em 1-clique',
                'Notificações diretas de WhatsApp prontas',
                'Módulo financeiro (receita diária, semanal e mensal)',
                'Relatório automático de clientes inativos',
                'Acesso simultâneo em múltiplos celulares e computadores',
                'Suporte técnico prioritário via WhatsApp',
              ].map((benefit, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Link
              href="/cadastro"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '1.0625rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 136, 230, 0.4)',
                marginTop: '12px',
                boxSizing: 'border-box',
              }}
            >
              Começar Agora — R$ 149.90/mês
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Section: FAQ */}
      <section id="faq" style={{ background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '100px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TIRE SUAS DÚVIDAS</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>Perguntas Frequentes</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqItems.map((item, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(22, 28, 48, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={20}
                    color="#38bdf8"
                    style={{
                      transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {openFaq === index && (
                  <div style={{ padding: '0 24px 20px', color: '#94a3b8', fontSize: '0.9375rem', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '48px 24px 32px', background: '#070a14' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={20} color="white" />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>Lava Rápido OS</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.875rem', color: '#94a3b8' }}>
              <Link href="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Entrar</Link>
              <Link href="/cadastro" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Cadastrar Lava Rápido</Link>
              <a href="#planos" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Planos</a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b', flexWrap: 'wrap', gap: '12px' }}>
            <div>© {new Date().getFullYear()} Lava Rápido OS. Todos os direitos reservados.</div>
            <div>Desenvolvido com excelência para lava-rápidos e estéticas automotivas.</div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Contact Button */}
      <a
        href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Lava%20R%C3%A1pido%20OS."
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
          zIndex: 99,
          color: '#ffffff',
        }}
        title="Falar no WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* CSS Styles for Responsive Layout & Animations */}
      <style jsx>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          animation: marqueeScroll 25s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .steps-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-nav {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
