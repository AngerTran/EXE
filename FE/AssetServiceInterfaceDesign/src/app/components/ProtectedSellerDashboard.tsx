import ProtectedRoute from "./ProtectedRoute";
import SellerDashboard from "./SellerDashboard";

export default function ProtectedSellerDashboard() {
  return (
    <ProtectedRoute requireSeller>
      <SellerDashboard />
    </ProtectedRoute>
  );
}
