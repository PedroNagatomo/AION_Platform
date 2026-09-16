import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      console.log('=== OAUTH CALLBACK ===');
      console.log('Code:', code);
      console.log('Error:', error);
      
      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${error}`);
        return;
      }
      
      if (!code) {
        setStatus('error');
        setMessage('No authorization code found in URL');
        return;
      }
      
      try {
        console.log('Sending code to backend...');
        const response = await api.post('/integrations/notion/oauth-callback', { code });
        console.log('Backend response:', response.data);
        
        setStatus('success');
        setMessage(response.data.message || 'Notion connected successfully!');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);
      } catch (error: any) {
        console.error('Error connecting Notion:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          error.message || 
          'Error connecting Notion. Please try again.'
        );
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
      <div className="text-center p-8 max-w-md">
        {status === 'processing' && (
          <>
            <div className="font-mono text-3xl text-terminal-accent animate-pulse mb-4">
              ⏳
            </div>
            <div className="font-mono text-terminal-text text-lg">
              &lt;connecting_to_notion/&gt;
            </div>
            <div className="font-mono text-terminal-dim text-sm mt-2">
              Please wait...
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="font-mono text-3xl mb-4">✅</div>
            <div className="font-mono text-terminal-accent text-lg">{message}</div>
            <div className="font-mono text-terminal-dim text-sm mt-2">
              Redirecting to integrations...
            </div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="font-mono text-3xl text-red-500 mb-4">❌</div>
            <div className="font-mono text-red-500 text-sm">{message}</div>
            <button
              onClick={() => navigate('/integrations')}
              className="mt-6 px-4 py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
            >
              [ Back to Integrations ]
            </button>
          </>
        )}
      </div>
    </div>
  );
}