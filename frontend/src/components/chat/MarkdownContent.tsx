import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Adicione esta função dentro do componente
  const handleDownloadCode = (code: string, language: string) => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code_${Date.now()}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      sql: "sql",
      bash: "sh",
      shell: "sh",
      markdown: "md",
      text: "txt",
    };
    return extensions[language?.toLowerCase()] || "txt";
  };
  return (
    <div className="prose prose-invert max-w-none font-mono text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-terminal-accent mt-4 mb-2">
              # {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-terminal-accent mt-3 mb-2">
              ## {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-terminal-accent mt-3 mb-1">
              ### {children}
            </h3>
          ),

          // Parágrafos
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed">{children}</p>
          ),

          // Listas
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,

          // Código
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="bg-terminal-surface px-1 py-0.5 border border-terminal-border text-terminal-accent"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block bg-terminal-surface border border-terminal-border p-2 my-2 overflow-x-auto ${className}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }: any) => {
            // Extrair código do children
            const codeElement = children?.props?.children;
            const className = children?.props?.className || "";
            const language = className.replace("language-", "");

            return (
              <div className="relative">
                <button
                  onClick={() =>
                    handleDownloadCode(String(codeElement), language)
                  }
                  className="absolute top-2 right-2 px-2 py-1 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs hover:bg-terminal-accent hover:text-terminal-bg transition-colors z-10"
                  title="Baixar código"
                >
                  [ ↓ Baixar ]
                </button>
                <pre className="bg-terminal-surface border border-terminal-border p-3 my-2 overflow-x-auto">
                  {children}
                </pre>
              </div>
            );
          },

          // Ênfase
          strong: ({ children }) => (
            <strong className="font-bold text-terminal-accent">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-accent underline hover:text-terminal-accent2"
            >
              {children}
            </a>
          ),

          // Citações
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-terminal-accent pl-4 my-2 italic">
              {children}
            </blockquote>
          ),

          // Linha horizontal
          hr: () => <hr className="border-terminal-border my-4" />,

          // Tabelas
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse border border-terminal-border w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-terminal-border bg-terminal-surface px-3 py-2 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-terminal-border px-3 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
