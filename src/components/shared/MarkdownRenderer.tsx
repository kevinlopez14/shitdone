import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { cn } from '../../lib/utils';
import { remarkPlugins, rehypePlugins } from '../../lib/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-semibold text-slate-100 mb-4 mt-6 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-slate-100 mb-3 mt-5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-slate-100 mb-2 mt-4 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-slate-100 mb-2 mt-3 first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-semibold text-slate-100 mb-1 mt-2 first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-semibold text-slate-100 mb-1 mt-2 first:mt-0">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-accent hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="text-slate-300 list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-slate-300 list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-slate-300">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accent pl-4 text-slate-400 italic mb-3">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-surface-light px-1.5 py-0.5 rounded text-sm font-mono text-accent"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn('font-mono text-sm', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[#1E2030] rounded-lg p-4 font-mono text-sm overflow-x-auto mb-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="border-collapse w-full text-sm text-slate-300">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-surface-border">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-100 border border-surface-border">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-surface-border">{children}</td>
  ),
  hr: () => <hr className="border-surface-border my-4" />,
  input: ({ type, checked, ...props }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="accent-accent mr-1.5"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="rounded-lg max-w-full my-2" />
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('text-slate-300', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
