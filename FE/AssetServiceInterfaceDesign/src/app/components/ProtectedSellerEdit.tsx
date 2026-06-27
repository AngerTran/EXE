import ProtectedRoute from "./ProtectedRoute";
import SellerEditAsset from "./SellerEditAsset";

export default function ProtectedSellerEdit() {
  return (
    <ProtectedRoute requireSeller>
      <SellerEditAsset />
    </ProtectedRoute>
  );
}
