import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Markdown for long-form fields (about, case study sections). Raw HTML is not rendered, so admin
 * content can format text but cannot inject markup.
 */
export function Prose({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-5 text-[17px] leading-[1.7] text-foreground/85",
        "[&_a]:underline [&_a]:decoration-signal [&_a]:underline-offset-4",
        "[&_code]:rounded-sm [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_h3]:pt-4 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:tracking-tight [&_h3]:text-foreground",
        "[&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-signal [&_blockquote]:pl-5 [&_blockquote]:italic",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
