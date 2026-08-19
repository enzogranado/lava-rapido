'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, Store, User, Mail, Lock, Phone, ArrowRight, CheckCircle2, Eye, EyeOff, Info, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    dashboardPin: '1234',
    businessType: 'HIBRIDO',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPinInfo, setShowPinInfo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro');
      }

      if (data.pendingApproval) {
        setSuccessMsg(data.message || 'Cadastro realizado com sucesso! Suas informações foram enviadas para aprovação da administração.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 35%, #16203d 0%, #0a0e1a 75%)',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Header */}
        <Link href="/landing" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 136, 230, 0.35)'
          }}>
            <Droplets size={36} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Criar Conta no LavaFlow</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9375rem', marginTop: '6px' }}>Crie a conta da sua empresa e comece a gerenciar hoje mesmo</p>
          </div>
        </Link>

        {/* Card */}
        <div style={{
          background: 'rgba(22, 28, 48, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}>
          {successMsg ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', padding: '10px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f4f8' }}>Cadastro Enviado!</h2>
                <p style={{ color: '#cbd5e1', fontSize: '0.9375rem', marginTop: '8px', lineHeight: 1.6 }}>
                  {successMsg}
                </p>
              </div>
              <Link href="/login" style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10px'
              }}>
                Ir para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

            {/* Business Type Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#cbd5e1' }}>Tipo de Operação do seu Negócio *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'LAVA_RAPIDO', title: 'Lava Rápido', subtitle: 'Apenas lavagens', icon: '🚿' },
                  { id: 'ESTACIONAMENTO', title: 'Estacionamento', subtitle: 'Apenas pátio/vagas', icon: '🅿️' },
                  { id: 'HIBRIDO', title: 'Lava Rápido & Estac.', subtitle: 'Ambos integrados', icon: '🚗✨' },
                ].map((type) => {
                  const selected = formData.businessType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setFormData((prev) => ({ ...prev, businessType: type.id }))}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: selected ? '2px solid #0088e6' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: selected ? 'rgba(0, 136, 230, 0.18)' : 'rgba(13, 18, 32, 0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{type.icon}</span>
                      <strong style={{ fontSize: '0.75rem', color: selected ? '#ffffff' : '#cbd5e1' }}>{type.title}</strong>
                      <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>{type.subtitle}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>Nome do Estabelecimento / Empresa *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="businessName"
                  placeholder="Ex: Auto Shine Lava Rápido & Estacionamento"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: '#0d1220 !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    borderRadius: '12px',
                    color: '#f0f4f8 !important',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Store size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>Nome do Proprietário / Responsável *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Seu nome completo"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: '#0d1220 !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    borderRadius: '12px',
                    color: '#f0f4f8 !important',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>Telefone / WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="phone"
                    placeholder="(11) 99999-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: '#0d1220 !important',
                      border: '1px solid rgba(255, 255, 255, 0.12) !important',
                      borderRadius: '12px',
                      color: '#f0f4f8 !important',
                      fontSize: '0.9375rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>E-mail de Acesso *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="contato@lavarapido.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: '#0d1220 !important',
                      border: '1px solid rgba(255, 255, 255, 0.12) !important',
                      borderRadius: '12px',
                      color: '#f0f4f8 !important',
                      fontSize: '0.9375rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>Criar Senha de Acesso *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 44px',
                    background: '#0d1220 !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    borderRadius: '12px',
                    color: '#f0f4f8 !important',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  PIN do Dashboard (4 Dígitos) *
                  <button
                    type="button"
                    onClick={() => setShowPinInfo(!showPinInfo)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="Por que preciso de um PIN?"
                  >
                    <Info size={13} />
                  </button>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Padrão: 1234</span>
              </div>

              {showPinInfo && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.8125rem',
                  color: '#38bdf8',
                  lineHeight: 1.5
                }}>
                  ℹ️ <strong>Por que este PIN?</strong> O PIN numérico de 4 dígitos é exigido para desbloquear a visualização das métricas de faturamento no Dashboard. Isso impede que colaboradores e funcionários vejam os valores financeiros que entram no lava-rápido.
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="dashboardPin"
                  maxLength={4}
                  placeholder="Ex: 1234"
                  value={formData.dashboardPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData((prev) => ({ ...prev, dashboardPin: val }));
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: '#0d1220 !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    borderRadius: '12px',
                    color: '#f0f4f8 !important',
                    fontSize: '1rem',
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0088e6' }} />
              </div>
            </div>

            <div style={{ background: 'rgba(0, 136, 230, 0.1)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: '#38bdf8', border: '1px solid rgba(0, 136, 230, 0.2)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              Configuração automática dos serviços padrões e 30 dias grátis.
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0088e6 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0, 136, 230, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: '6px'
              }}
            >
              {loading ? (
                <div className="loading-spinner" style={{ width: 22, height: 22 }} />
              ) : (
                <>
                  Criar Conta no LavaFlow <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          )}
        </div>

        {/* Footer link to Login */}
        <div style={{ textAlign: 'center', fontSize: '0.9375rem', color: '#94a3b8' }}>
          Já possui um cadastro?{' '}
          <Link href="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            Fazer Login
          </Link>
        </div>

      </div>
    </div>
  );
}
