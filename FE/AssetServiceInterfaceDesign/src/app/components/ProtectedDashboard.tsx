import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
