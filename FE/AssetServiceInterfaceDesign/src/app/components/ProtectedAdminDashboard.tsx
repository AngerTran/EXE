import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./AdminDashboard";

export default function ProtectedAdminDashboard() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
