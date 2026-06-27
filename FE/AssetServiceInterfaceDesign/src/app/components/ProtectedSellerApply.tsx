import ProtectedRoute from "./ProtectedRoute";
import SellerApply from "./SellerApply";

export default function ProtectedSellerApply() {
  return (
    <ProtectedRoute>
      <SellerApply />
    </ProtectedRoute>
  );
}
