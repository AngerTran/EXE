import ProtectedRoute from "./ProtectedRoute";
import AssetsCheckout from "./AssetsCheckout";

export default function ProtectedAssetsCheckout() {
  return (
    <ProtectedRoute>
      <AssetsCheckout />
    </ProtectedRoute>
  );
}
