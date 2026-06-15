"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownMessageProps = {
  content: string;
  inverted?: boolean;
};

export function MarkdownMessage({ content, inverted }: MarkdownMessageProps) {
  const components: Components = {
    a({ children, href }) {
      return (
        <a
          className={cn(
            "font-medium underline underline-offset-4",
            inverted ? "text-primary-foreground" : "text-primary",
          )}
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {children}
        </a>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote
          className={cn(
            "border-l-2 pl-3 italic",
            inverted ? "border-primary-foreground/50" : "border-border",
          )}
        >
          {children}
        </blockquote>
      );
    },
    code({ children }) {
      return (
        <code
          className={cn(
            "rounded px-1.5 py-0.5 text-[0.9em]",
            inverted ? "bg-primary-foreground/15" : "bg-muted",
          )}
        >
          {children}
        </code>
      );
    },
    h1({ children }) {
      return <h1 className="text-xl font-semibold leading-7">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg font-semibold leading-7">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-base font-semibold leading-6">{children}</h3>;
    },
    hr() {
      return (
        <hr
          className={cn(
            "my-3 border-0 border-t",
            inverted ? "border-primary-foreground/30" : "border-border",
          )}
        />
      );
    },
    li({ children }) {
      return <li className="pl-1">{children}</li>;
    },
    ol({ children }) {
      return <ol className="ml-5 list-decimal space-y-1">{children}</ol>;
    },
    p({ children }) {
      return <p>{children}</p>;
    },
    pre({ children }) {
      return (
        <pre
          className={cn(
            "overflow-x-auto rounded-md p-3 text-xs leading-5",
            inverted ? "bg-primary-foreground/15" : "bg-muted",
          )}
        >
          {children}
        </pre>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table
            className={cn(
              "w-full min-w-[520px] border-collapse text-left text-xs",
              inverted ? "border-primary-foreground/30" : "border-border",
            )}
          >
            {children}
          </table>
        </div>
      );
    },
    td({ children }) {
      return (
        <td
          className={cn(
            "border px-2 py-2 align-top",
            inverted ? "border-primary-foreground/30" : "border-border",
          )}
        >
          {children}
        </td>
      );
    },
    th({ children }) {
      return (
        <th
          className={cn(
            "border px-2 py-2 font-semibold",
            inverted
              ? "border-primary-foreground/30 bg-primary-foreground/10"
              : "border-border bg-muted",
          )}
        >
          {children}
        </th>
      );
    },
    ul({ children }) {
      return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
    },
  };

  return (
    <div className="space-y-3 break-words">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
