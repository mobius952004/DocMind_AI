import { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import { uploadFileToBackend, fetchAIResponse } from './api';

let msgIdCounter = 0;
const nextId = () => ++msgIdCounter;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  /* ── Sidebar file tracking & backend upload ── */
  const handleFilesAdded = useCallback(async (fileArray) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mapped = fileArray.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      uploadedAt: now,
      rawFile: f,
    }));
    setUploadedFiles((prev) => [...prev, ...mapped]);

    for (const f of fileArray) {
      try {
        await uploadFileToBackend(f);
      } catch (err) {
        console.warn(`File ${f.name} indexing notice:`, err);
      }
    }
  }, []);

  const handleRemoveFile = useCallback((id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ── Send message ── */
  const handleSend = useCallback(async ({ text, files = [] }) => {
    // print(text)
    const fileNames = files.map((f) => (typeof f === 'string' ? f : f.name));
    if (!text && fileNames.length === 0) return;

    // Add user message
    const userMsg = { id: nextId(), role: 'user', text: text || '(file upload)', files: fileNames };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      console.log(text)
      const response = await fetchAIResponse(text || 'uploaded files');
      const aiMsg = { id: nextId(), role: 'assistant', text: response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg = { id: nextId(), role: 'assistant', text: '⚠️ Something went wrong. Please try again.' };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── Prompt suggestion click ── */
  const handlePromptClick = useCallback(
    (promptText) => {
      handleSend({ text: promptText, files: [] });
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Sidebar drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        uploadedFiles={uploadedFiles}
        onRemove={handleRemoveFile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* Chat message area */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        onPromptClick={handlePromptClick}
      />

      {/* Sticky bottom input */}
      <InputBar
        onSend={handleSend}
        onFilesAdded={handleFilesAdded}
        disabled={isLoading}
      />
    </div>
  );
}
