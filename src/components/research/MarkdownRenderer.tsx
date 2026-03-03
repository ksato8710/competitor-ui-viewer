"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-text-bright mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-text-primary mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-bright">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1.5 text-sm text-text-primary mb-4 ml-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-primary mb-4 ml-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent-blue pl-4 my-4 text-sm text-text-dim italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className="block bg-bg-section rounded-lg p-4 text-xs leading-relaxed overflow-x-auto my-4 text-text-primary">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-bg-section text-accent-blue text-[13px] px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-bg-section">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 text-xs font-semibold text-text-dim border-b border-border-card">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-text-primary border-b border-border-card">
      {children}
    </td>
  ),
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
