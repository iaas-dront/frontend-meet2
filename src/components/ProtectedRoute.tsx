import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import React from "react"; 

interface ProtectedProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
