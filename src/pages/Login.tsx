import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl lg:max-w-7xl lg:min-h-[180px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[180px]">
          {/* HERO (desktop) */}
          <div className="relative hidden lg:flex flex-col justify-between p-12">
            <div className="absolute inset-0 bg-[url('/candles-bg.svg')] bg-cover bg-center opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/80 to-black/65" />

            <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />
            <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />

            <div className="relative">
              {/* FIX: controla o tamanho do logo */}
              <img
                src="/image.png"
                alt="Logo"
                className="h-54 w-auto max-w-[420px] object-contain mx-auto drop-shadow-[0_0_28px_rgba(34,197,94,0.16)]"
              />

              <h1 className="mt-10 text-4xl font-semibold leading-tight">
                Acesso à plataforma
              </h1>

              <p className="mt-4 text-base text-white/70 max-w-md">
                Entre com suas credenciais para gerenciar licenças MT5 com segurança e performance.
              </p>

              <div className="mt-8 h-px w-24 bg-gradient-to-r from-primary/70 to-transparent" />
            </div>

            <p className="relative text-sm text-white/45">
              Sistema de gerenciamento de licenças MT5
            </p>
          </div>

          {/* FORM */}
          <div className="relative flex items-center p-6 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(34,197,94,0.06),transparent_60%)]" />

            <div className="relative w-full">
              {/* Header mobile */}
              <div className="lg:hidden text-center mb-8">
               <img
  src="/image.png"
  alt="Logo"
  className="mx-auto object-contain h-[260px] w-auto max-w-none drop-shadow-[0_0_28px_rgba(34,197,94,0.16)]"
/>
    

                <h1 className="mt-4 text-2xl font-semibold">Acesso à plataforma</h1>
                <p className="mt-2 text-sm text-white/65">Faça login para continuar</p>
              </div>

              <Card glow className="p-10 bg-black/28 border border-white/10 backdrop-blur-md w-full">
                <form onSubmit={handleSubmit} className="space-y-7">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />

                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Entrar
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      className="text-sm text-primary/90 hover:text-primary transition-colors"
                      onClick={() => alert('Funcionalidade em desenvolvimento')}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </form>
              </Card>

              <p className="text-center text-white/45 text-sm mt-6 lg:hidden">
                Sistema de gerenciamento de licenças MT5
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
