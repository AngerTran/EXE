import ProtectedRoute from "./ProtectedRoute";
import CreditsCheckout from "./CreditsCheckout";

export default function ProtectedCreditsCheckout() {
  return (
    <ProtectedRoute>
      <CreditsCheckout />
    </ProtectedRoute>
  );
}
