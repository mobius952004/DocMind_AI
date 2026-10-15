import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { MockContextProvider, useMock } from './context/MockContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatPage from './pages/ChatPage';
import { Mock_test } from './pages/Mock_interview';
import Header from './components/Header';

export function ProtectedRoute() {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useChat();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Global Fixed Glassmorphism Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
        user={user}
        onLogout={logout}
      />

      {/* Main container with pt-16 offset for fixed glass header */}
      <main className="flex-1 flex flex-col min-h-0 pt-16 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ChatPage />} />
        <Route path="/Mock" element={<Mock_test />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MockContextProvider>
        <BrowserRouter>
          <AppRoutes/>
        </BrowserRouter>
        </MockContextProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
