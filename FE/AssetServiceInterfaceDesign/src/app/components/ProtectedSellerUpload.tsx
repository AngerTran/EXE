import ProtectedRoute from "./ProtectedRoute";
import AddAsset from "./AddAsset";

export default function ProtectedSellerUpload() {
  return (
    <ProtectedRoute requireSeller>
      <AddAsset />
    </ProtectedRoute>
  );
}
