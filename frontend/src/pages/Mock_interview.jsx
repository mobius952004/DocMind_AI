import { useChat } from "../context/ChatContext";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import InputBar from "../components/InputBar";

export function Mock_test() {
  const {
    messages,
    sidebarOpen,
    setSidebarOpen,
    isLoading,
    handleSend,
    handlePromptClick
  } = useChat();

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Sidebar drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        uploadedFiles={[]}
        onRemove={() => {}}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Chat message area (Scrollable) */}
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