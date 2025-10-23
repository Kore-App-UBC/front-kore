import { apiService } from '../services/api';
import { useAuthStore } from '../state/authStore';
import { storageService } from '../utils/storage';

export const useAuth = () => {
  const { user, isAuthenticated, loading, error, login, logout, setLoading, setError } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(email, password);
      await storageService.setItem('auth-token', response.token);
      login(response.user);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.responseData?.error;
      setError(errorMessage);

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await storageService.removeItem('auth-token');
      logout();
      setLoading(false);
    }
  };

  const initializeAuth = async () => {
    try {
      const token = await storageService.getItem('auth-token');

      if (token && !isAuthenticated) {
        const user = await apiService.getUserFromToken(token);

        if (user) {
          login(user);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signOut,
    initializeAuth,
  };
};