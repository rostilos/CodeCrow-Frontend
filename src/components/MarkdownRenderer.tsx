import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Style headings
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h4>,
          
          // Style paragraphs
          p: ({ children }) => <p className="text-sm text-muted-foreground mb-2 last:mb-0">{children}</p>,
          
          // Style lists
          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          
          // Style code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn('block p-2 rounded bg-muted text-xs font-mono overflow-x-auto', className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="bg-muted rounded p-2 overflow-x-auto mb-2">{children}</pre>,
          
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          ),
          
          // Style links
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          
          // Style strong/bold
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          
          // Style emphasis/italic
          em: ({ children }) => <em className="italic">{children}</em>,
          
          // Style horizontal rule
          hr: () => <hr className="my-3 border-border" />,
          
          // Style tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => <th className="px-2 py-1 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
