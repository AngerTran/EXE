import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";

export default function ProtectedProfile() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

