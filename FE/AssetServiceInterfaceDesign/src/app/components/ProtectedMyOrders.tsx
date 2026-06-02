import ProtectedRoute from "./ProtectedRoute";
import MyOrders from "./MyOrders";

export default function ProtectedMyOrders() {
  return (
    <ProtectedRoute>
      <MyOrders />
    </ProtectedRoute>
  );
}

