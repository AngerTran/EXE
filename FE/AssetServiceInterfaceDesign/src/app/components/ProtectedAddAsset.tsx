import ProtectedRoute from "./ProtectedRoute";
import AddAsset from "./AddAsset";

export default function ProtectedAddAsset() {
  return (
    <ProtectedRoute>
      <AddAsset />
    </ProtectedRoute>
  );
}
