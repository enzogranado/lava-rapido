'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, Store, User, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #0088e6 0%, #0055b3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,136,230,0.3)' }}>
            <Droplets size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Cadastrar Novo Lava Rápido</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '4px' }}>Crie a conta da sua empresa e comece a gerenciar hoje mesmo</p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Nome do Lava Rápido / Empresa *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="businessName"
                  className="input"
                  placeholder="Ex: Lava Rápido Auto Shine"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px' }}
                />
                <Store size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Nome do Proprietário / Responsável *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="ownerName"
                  className="input"
                  placeholder="Seu nome completo"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px' }}
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Telefone / WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="phone"
                    className="input"
                    placeholder="(11) 99999-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ paddingLeft: '40px' }}
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">E-mail de Acesso *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="contato@lavarapido.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Criar Senha de Acesso *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{ paddingLeft: '40px' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <div style={{ background: 'rgba(0, 136, 230, 0.08)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}>
              <CheckCircle2 size={16} />
              Configuração automática dos serviços padrões e 30 dias grátis.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '1rem' }} disabled={loading}>
              {loading ? (
                <div className="loading-spinner" style={{ width: 20, height: 20 }} />
              ) : (
                <>
                  Criar Conta do Lava Rápido <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link to Login */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Já possui um cadastro?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary-400)', fontWeight: 600 }}>
            Fazer Login
          </Link>
        </div>

      </div>
    </div>
  );
}
