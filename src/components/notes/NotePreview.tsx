import { cn } from '../../lib/utils';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

interface NotePreviewProps {
  content: string;
  className?: string;
}

export function NotePreview({ content, className }: NotePreviewProps) {
  return (
    <div className={cn('p-6 overflow-y-auto h-full', className)}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
