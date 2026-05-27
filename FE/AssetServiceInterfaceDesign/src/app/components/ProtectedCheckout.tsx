import ProtectedRoute from "./ProtectedRoute";
import Checkout from "./Checkout";

export default function ProtectedCheckout() {
  return (
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  );
}
