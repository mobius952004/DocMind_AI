import { useState, useRef, useCallback } from 'react';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';

/**
 * InputBar – sticky bottom bar with text input + file upload.
 * Props:
 *   onSend        – ({ text, files }) => void
 *   onFilesAdded  – (fileArray) => void   (to update the sidebar)
 *   disabled      – boolean
 */

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.odt';

export default function InputBar({ onSend, onFilesAdded, disabled = false }) {
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]); // Array of File objects
  const [dragOver, setDragOver] = useState(false);
  const [sendAnim, setSendAnim] = useState(false);
  //  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  /* ─── helpers ─── */
  const addFiles = useCallback((fileList) => {
    const arr = Array.from(fileList);
    setPendingFiles((prev) => [...prev, ...arr]);
    onFilesAdded?.(arr);
  }, [onFilesAdded]);

  const removePending = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  /* ─── drag & drop ─── */
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  /* ─── send ─── */
  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || disabled) return;

    setSendAnim(true);
    setTimeout(() => setSendAnim(false), 200);

    onSend?.({
      text: trimmed,
      files: pendingFiles,
    });
    setText('');
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── auto-grow textarea ─── */
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !disabled;

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto w-full">

        {/* ── Pending file chips ── */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {pendingFiles.map((f, i) => (
              <div key={i} className="file-chip">
                <Paperclip className="w-3.5 h-3.5 text-green-400" />
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button
                  onClick={() => removePending(i)}
                  className="ml-1 text-green-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Main input container ── */}
        <div
          className={`glass rounded-2xl border transition-all duration-200 input-glow relative
            ${dragOver ? 'border-green-500/60 bg-green-500/40' : 'border-white/[0.09]'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none z-10 bg-green-950/40 backdrop-blur-xs">
              <p className="text-sm text-green-300 font-medium">Drop files here</p>
            </div>
          )}

          {/* Textarea */}
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Ask anything about your documents… (Enter to send, Shift+Enter for new line)"
            className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none px-4 pt-4 pb-2 leading-relaxed disabled:opacity-50"
            style={{ maxHeight: '160px', overflowY: 'auto' }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: attach + drag hint */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <button
                id="attach-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex items-center gap-1.5 text-slate-400 hover:text-green-300 transition-colors duration-200 text-xs py-1.5 px-2.5 rounded-xl hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                title="Attach files (PDF, images, docs)"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Attach</span>
              </button>
              <span className="hidden sm:block text-[10px] text-slate-600">PDF · Image · Doc</span>
            </div>

            {/* Right: character count + send */}
            <div className="flex items-center gap-3">
              {text.length > 0 && (
                <span className="text-[10px] text-slate-600 font-mono">{text.length}</span>
              )}
              <button
                id="send-btn"
                onClick={handleSend}
                disabled={!canSend}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${canSend
                    ? 'bg-gradient-to-br from-green-500 to-green-800 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  } ${sendAnim ? 'send-pop' : ''}`}
                aria-label="Send message"
              >
                {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[10px] text-slate-600 mt-2">
          DocMind AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
