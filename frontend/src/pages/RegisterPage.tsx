import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { register } from '../api/auth';
import { TerminalInput } from '../components/ui/TerminalInput';
import { TerminalButton } from '../components/ui/TerminalButton';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register(email, password);
      setAuth(response);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
      <div className="w-full max-w-md p-8 bg-terminal-surface border border-terminal-border">
        <div className="text-center mb-8">
          <div className="font-mono text-2xl text-terminal-accent mb-2">
            ❯ AION All in One
          </div>
          <div className="font-mono text-sm text-terminal-dim">
            &lt;registro&gt;
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TerminalInput
            label="email:"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TerminalInput
            label="senha:"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TerminalInput
            label="confirmar_senha:"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <div className="font-mono text-sm text-terminal-error">
              ❌ {error}
            </div>
          )}

          <TerminalButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? '[...]' : '[ Registrar ]'}
          </TerminalButton>
        </form>

        <div className="mt-4 text-center font-mono text-sm text-terminal-dim">
          <Link to="/login" className="hover:text-terminal-accent transition-colors">
            &lt;já_tenho_conta&gt;
          </Link>
        </div>
      </div>
    </div>
  );
}