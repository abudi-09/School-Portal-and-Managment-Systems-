import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import type { UserRole } from "@/contexts/auth-types";

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const PrivateRoute = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}: PrivateRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but doesn't have required role
  if (
    isAuthenticated &&
    allowedRoles.length > 0 &&
    user &&
    !allowedRoles.includes(user.role)
  ) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = getRoleBasedRedirect(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // If authentication is not required, allow access
  if (!requireAuth) {
    return <>{children}</>;
  }

  // User is authenticated and has correct role, allow access
  return <>{children}</>;
};

// Helper function to get the correct dashboard path for a role
const getRoleBasedRedirect = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "/admin";
    case "head":
      return "/head";
    case "teacher":
      return "/teacher";
    case "student":
    default:
      return "/dashboard";
  }
};
