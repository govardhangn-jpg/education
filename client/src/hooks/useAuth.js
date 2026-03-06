import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('samarthaa_token');
    if (token) {
      getMe().then(res => { setUser(res.data.user); }).catch(() => {
        localStorage.removeItem('samarthaa_token');
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('samarthaa_token', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('samarthaa_token');
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
