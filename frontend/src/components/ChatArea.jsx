import { useRef, useEffect, useState } from 'react';
import {
  FileText,
  Search,
  HelpCircle,
  PenTool,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

/**
 * ChatArea – scrollable message history.
 * Props:
 *   messages – array of { id, role: 'user'|'assistant', text, files? }
 *   isLoading – boolean, shows typing indicator
 *   onPromptClick – (text) => void
 */

const WELCOME_PROMPTS = [
  { icon: FileText, label: 'Summarise this PDF', sub: 'Upload a document and get a concise summary' },
  { icon: Search, label: 'Extract key insights', sub: 'Pull important data points from your files' },
  { icon: HelpCircle, label: 'Ask anything about your docs', sub: 'RAG-powered Q&A over your documents' },
  { icon: PenTool, label: 'Draft a report', sub: 'Generate structured content from your sources' },
];

function UserMessage({ message }) {
  return (
    <div className="flex justify-end gap-3 message-animate">
      <div className="max-w-[75%] flex flex-col items-end gap-1.5">
        {/* Attached files */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.files.map((f, i) => (
              <span key={i} className="file-chip">{f}</span>
            ))}
          </div>
        )}
        <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-sm text-white shadow-lg shadow-emerald-900/40 leading-relaxed whitespace-pre-wrap">
          {message.content || message.text}
        </div>
      </div>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-emerald-500/30">
        <User className="w-4 h-4" />
      </div>
    </div>
  );
}

function AssistantMessage({ message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || message.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 message-animate group">
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-emerald-500/30">
        <Bot className="w-4 h-4" />
      </div>
      <div className="max-w-[80%] flex flex-col gap-1">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm glass text-sm text-zinc-100 leading-relaxed shadow-lg whitespace-pre-wrap relative group/msg">
          {message.content || message.text}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover/msg:opacity-100 transition-all duration-150 cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 ml-1">DocMind AI · just now</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 message-animate">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 via-green-500 to-black-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
        <Bot className="w-4 h-4 animate-bounce" />
      </div>
      <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm glass flex items-center gap-1.5 shadow-lg">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

export default function ChatArea({ messages = [], isLoading = false, onPromptClick }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto w-full">

        {/* ── Welcome screen ── */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 via-greene-500 to-balck-200 flex items-center justify-center shadow-2xl shadow-green-500/40">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">DocMind AI</h1>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Upload your documents and ask anything. Powered by Retrieval-Augmented Generation.
              </p>
            </div>

            {/* Suggestion cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {WELCOME_PROMPTS.map((p, i) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onPromptClick?.(p.label)}
                    className="text-left p-4 rounded-2xl glass border border-white/[0.07] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <IconComp className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                    <p className="mt-2 text-sm font-medium text-slate-200 group-hover:text-green-300 transition-colors">{p.label}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{p.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Conversation thread ── */
          <div className="space-y-6">
            {messages.map((msg) =>
              msg.role === 'user'
                ? <UserMessage key={msg.id} message={msg} />
                : <AssistantMessage key={msg.id} message={msg} />
            )}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
