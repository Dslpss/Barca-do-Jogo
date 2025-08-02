import { useAuth } from "../contexts/AuthContext";

export const useFirebaseAuth = () => {
  const { user, loading, signIn, signOut, error } = useAuth();

  const isAuthenticated = !!user;
  const userEmail = user?.email || null;

  return {
    user,
    isAuthenticated,
    userEmail,
    loading,
    signIn,
    signOut,
    error,
  };
};

export default useFirebaseAuth;
