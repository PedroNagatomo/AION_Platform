import { useTokenMonitor } from '../../hooks/useTokenMonitor';

export function TokenWarning() {
  const { tokenUsage, tokenLimit, usagePercentage, warningLevel } = useTokenMonitor();
  
  if (warningLevel === 'none') return null;
  
  const styles = {
    warning: {
      border: 'border-yellow-500',
      text: 'text-yellow-500',
      icon: '⚠',
      message: 'Contexto está ficando grande',
    },
    critical: {
      border: 'border-orange-500',
      text: 'text-orange-500',
      icon: '⚡',
      message: 'Contexto crítico - considere encerrar',
    },
    danger: {
      border: 'border-red-500',
      text: 'text-red-500',
      icon: '🔴',
      message: 'Limite próximo - encerre e salve memória',
    },
  }[warningLevel];
  
  return (
    <div className={`mx-4 mb-2 px-3 py-2 border ${styles.border} ${styles.text} font-mono text-xs flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <span>{styles.icon}</span>
        <span>{styles.message}</span>
      </div>
      <div>
        {tokenUsage.toLocaleString()} / {tokenLimit.toLocaleString()} tokens ({usagePercentage}%)
      </div>
    </div>
  );
}