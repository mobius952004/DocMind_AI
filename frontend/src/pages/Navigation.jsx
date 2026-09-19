import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header stays visible on all pages */}
      <Header user={user} onLogout={logout} />

      {/* Whatever child route is active renders here */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}