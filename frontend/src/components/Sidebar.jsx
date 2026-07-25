import { FileText, Image as ImageIcon, FileCode, Paperclip, FolderOpen, X, Trash2, ShieldCheck } from 'lucide-react';



const FILE_ICONS = {
  pdf:   { Icon: FileText,   color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20' },
  image: { Icon: ImageIcon,  color: 'text-sky-400',   bg: 'bg-sky-500/10',   border: 'border-sky-500/20' },
  doc:   { Icon: FileCode,   color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
  other: { Icon: Paperclip, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

function getFileCategory(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['doc', 'docx', 'txt', 'md', 'odt'].includes(ext)) return 'doc';
  return 'other';
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Sidebar({ isOpen, uploadedFiles = [], onRemove, onClose }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-72 flex flex-col glass border-r  border-white/[0.07] shadow-2xl shadow-black/50
          ${isOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Uploaded Files</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} in session
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {uploadedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">No files yet</p>
                <p className="text-xs text-slate-600 mt-1">Upload PDFs, images, or docs to get started</p>
              </div>
            </div>
          ) : (
            uploadedFiles.map((file) => {
              const cat = getFileCategory(file.name);
              const style = FILE_ICONS[cat];
              const IconComp = style.Icon;
              return (
                <div
                  key={file.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${style.bg} ${style.border} group transition-all duration-200 hover:brightness-125`}
                >
                  <IconComp className={`w-5 h-5 mt-0.5 shrink-0 ${style.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${style.color}`}>{file.name}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{formatSize(file.size)}</p>
                    <p className="text-[10px] text-slate-700 mt-0.5">{file.uploadedAt}</p>
                  </div>
                  <button
                    onClick={() => onRemove(file.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 text-slate-500 hover:text-red-400 transition-all duration-150 cursor-pointer"
                    aria-label="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {uploadedFiles.length > 0 && (
          <div className="p-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <p className="text-[11px] text-indigo-300">All files are processed in-session and indexed for RAG retrieval.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
