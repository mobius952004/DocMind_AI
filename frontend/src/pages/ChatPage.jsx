import { useState, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import InputBar from '../components/InputBar';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user, sessionId, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Remove an uploaded file ── */
  const handleRemoveFile = useCallback((indexToRemove) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  /* ── Send message action ── */
  const handleSend = useCallback(
    async ({ text, files }) => {
      if (!text.trim() && (!files || files.length === 0)) return;

      // Add attached files to drawer list
      if (files && files.length > 0) {
        const fileItems = files.map((f) => ({
          name: f.name,
          size: f.size,
          rawFile: f,
        }));
        setUploadedFiles((prev) => [...prev, ...fileItems]);

        // Automatically upload attached PDFs to backend /upload
        for (const fileObj of files) {
          if (fileObj.name.toLowerCase().endsWith('.pdf')) {
            const formData = new FormData();
            formData.append('file', fileObj);
            try {
              await fetch('http://localhost:8000/upload/', {
                method: 'POST',
                body: formData,
              });
            } catch (err) {
              console.error('File upload error:', err);
            }
          }
        }
      }

      // Add user message to UI state
      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        files: files ? files.map((f) => f.name) : [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Post prompt + session_id to backend for thread-based memory management
        const response = await fetch('http://localhost:8000/interview/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId || '',
          },
          body: JSON.stringify({
            topic: text,
            session_id: sessionId || null,
          }),
        });

        const data = await response.json();

        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.result || 'No response generated.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error('API Error:', err);
        const errMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Failed to connect to backend server. Make sure FastAPI server is running on http://localhost:8000.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  /* ── Prompt suggestion click ── */
  const handlePromptClick = useCallback(
    (promptText) => {
      handleSend({ text: promptText, files: [] });
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
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
        user={user}
        onLogout={logout}
      />

      {/* Chat message area */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        onPromptClick={handlePromptClick}
      />

      {/* Input bar */}
      <InputBar onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
