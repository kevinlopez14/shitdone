import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function NoteEditor({ content, onChange }: NoteEditorProps) {
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden font-mono">
        <CodeMirror
          value={content}
          onChange={onChange}
          theme={oneDark}
          extensions={[markdown()]}
          height="100%"
          style={{ height: '100%' }}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: false,
          }}
        />
      </div>
      {/* Bottom bar */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-1 border-t border-surface-border bg-surface">
        <span className="text-xs text-slate-600">{charCount} caracteres</span>
        <span className="text-xs text-slate-600">{wordCount} palabras</span>
      </div>
    </div>
  );
}
