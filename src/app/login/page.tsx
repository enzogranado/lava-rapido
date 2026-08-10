'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, Lock, Mail, ArrowRight, ShieldCheck, Store } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro no login');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #0088e6 0%, #0055b3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,136,230,0.3)' }}>
            <Droplets size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lava Rápido OS</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '4px' }}>Acesse a plataforma de gestão do seu lava-rápido</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">E-mail de Acesso</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input"
                  placeholder="seuemail@lavarapido.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '1rem', marginTop: '8px' }} disabled={loading}>
              {loading ? (
                <div className="loading-spinner" style={{ width: 20, height: 20 }} />
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contas Demo Rápidas:</span>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fillDemo('express@lavarapido.com', 'user123')}
                style={{ fontSize: '0.75rem' }}
              >
                <Store size={14} /> Express
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fillDemo('premium@lavarapido.com', 'user123')}
                style={{ fontSize: '0.75rem' }}
              >
                <Store size={14} /> Auto Spa Premium
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fillDemo('admin@sistema.com', 'admin123')}
                style={{ fontSize: '0.75rem', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#a855f7' }}
              >
                <ShieldCheck size={14} /> Super Admin
              </button>
            </div>
          </div>
        </div>

        {/* Link to Register */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Ainda não cadastrou seu lava-rápido?{' '}
          <Link href="/cadastro" style={{ color: 'var(--color-primary-400)', fontWeight: 600 }}>
            Cadastrar Novo Lava Rápido
          </Link>
        </div>

      </div>
    </div>
  );
}
