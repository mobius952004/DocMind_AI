import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { sessionId } = useAuth();

  // Load initial messages from localStorage based on active sessionId
  const [messages, setMessages] = useState(() => {
    if (!sessionId) return [];
    try {
      const saved = localStorage.getItem(`docmind_messages_${sessionId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync messages with localStorage whenever messages or sessionId changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`docmind_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // Load session messages when sessionId changes (e.g. login/switch user)
  useEffect(() => {
    if (sessionId) {
      try {
        const saved = localStorage.getItem(`docmind_messages_${sessionId}`);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  /* ── Remove an uploaded file ── */
  const handleRemoveFile = useCallback((indexToRemove) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  /* ── Clear active chat ── */
  const clearChat = useCallback(() => {
    setMessages([]);
    if (sessionId) {
      localStorage.removeItem(`docmind_messages_${sessionId}`);
    }
  }, [sessionId]);

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
              await fetch(`${API_BASE}/upload/`, {
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
        const response = await fetch(`${API_BASE}/interview/generate`, {
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
          content: '⚠️ Failed to connect to backend server. Make sure FastAPI server is running.',
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

  const handlePromptClick = useCallback(
    (promptText) => {
      handleSend({ text: promptText, files: [] });
    },
    [handleSend]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        uploadedFiles,
        sidebarOpen,
        setSidebarOpen,
        isLoading,
        handleRemoveFile,
        handleSend,
        setMessages,
        setUploadedFiles,
        setIsLoading,
        clearChat,
        handlePromptClick
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}