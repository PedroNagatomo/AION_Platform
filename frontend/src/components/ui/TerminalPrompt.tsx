interface TerminalPromptProps {
  user?: string;
  path?: string;
  command?: string;
}

export function TerminalPrompt({ user = 'user', path = '~', command }: TerminalPromptProps) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-terminal-accent">➜</span>
      <span className="text-terminal-text">{user}</span>
      <span className="text-terminal-dim">in</span>
      <span className="text-terminal-accent">{path}</span>
      {command && (
        <>
          <span className="text-terminal-dim">$</span>
          <span className="text-terminal-text">{command}</span>
        </>
      )}
    </div>
  );
}