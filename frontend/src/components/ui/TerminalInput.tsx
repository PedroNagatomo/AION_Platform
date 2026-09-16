import { type InputHTMLAttributes, forwardRef } from 'react';

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="font-mono text-xs text-terminal-dim">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`bg-terminal-surface border border-terminal-border text-terminal-text font-mono px-3 py-2 focus:outline-none focus:border-terminal-accent transition-colors ${error ? 'border-terminal-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <span className="font-mono text-xs text-terminal-error">
            {error}
          </span>
        )}
      </div>
    );
  }
);

TerminalInput.displayName = 'TerminalInput';