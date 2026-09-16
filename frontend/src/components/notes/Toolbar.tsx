import { useEditor } from '@tiptap/react';

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const tools = [
    { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
    { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    { type: 'divider' },
    { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), style: 'font-bold' },
    { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), style: 'italic' },
    { label: 'S', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), style: 'line-through' },
    { type: 'divider' },
    { label: '• Lista', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { label: '1. Lista', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { label: '❝ Citação', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { label: '&lt;/&gt; Código', action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
    { type: 'divider' },
    { label: '↶ Desfazer', action: () => editor.chain().focus().undo().run() },
    { label: '↷ Refazer', action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-terminal-border bg-terminal-surface">
      {tools.map((tool, index) => (
        tool.type === 'divider' ? (
          <div key={index} className="w-px h-5 bg-terminal-border mx-1" />
        ) : (
          <button
            key={index}
            onClick={tool.action}
            className={`px-2 py-1 font-mono text-xs transition-colors border ${
              tool.active
                ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent hover:text-terminal-accent'
            } ${tool.style || ''}`}
            title={tool.label}
          >
            {tool.label}
          </button>
        )
      ))}
    </div>
  );
}