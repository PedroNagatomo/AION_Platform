import type { ButtonHTMLAttributes } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function TerminalButton({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}: TerminalButtonProps) {
  
  const baseClasses = 'px-4 py-2 font-mono text-sm transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-terminal-accent focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-terminal-surface border-terminal-accent text-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg',
    secondary: 'bg-terminal-surface border-terminal-border text-terminal-text hover:border-terminal-accent hover:text-terminal-accent',
    danger: 'bg-terminal-surface border-terminal-error text-terminal-error hover:bg-terminal-error hover:text-terminal-bg',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}