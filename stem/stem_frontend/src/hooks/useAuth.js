import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MAIN_URL = import.meta.env.VITE_MAIN_URL || "http://localhost:5173";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/user/currentuser`);
        setUser(res.data);
      } catch (error) {
        // No valid cookie → redirect to main frontend login
        console.log("Not authenticated, redirecting to login...");
        window.location.href = `${MAIN_URL}/login`;
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return { user, loading };
};

export default useAuth;
