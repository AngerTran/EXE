import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BeamPanel } from "./BeamPanel";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (requireAdmin && !isAdmin()) {
      navigate("/dashboard");
    }
  }, [user, isLoading, requireAdmin, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-8" beam={4}>
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-gray-300 mb-4">Vui lòng đăng nhập để truy cập trang này</p>
          </BeamPanel>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-8" beam={4}>
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Truy cập bị từ chối</h2>
            <p className="text-gray-300 mb-4">Bạn không có quyền truy cập trang Admin</p>
          </BeamPanel>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
