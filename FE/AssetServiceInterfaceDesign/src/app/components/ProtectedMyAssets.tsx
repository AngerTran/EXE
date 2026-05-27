import ProtectedRoute from "./ProtectedRoute";
import MyAssets from "./MyAssets";

export default function ProtectedMyAssets() {
  return (
    <ProtectedRoute>
      <MyAssets />
    </ProtectedRoute>
  );
}
