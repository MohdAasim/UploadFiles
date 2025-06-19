import { Navigate } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
interface ProtectedRouteProps {
  children: React.ReactNode;
}
  

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;