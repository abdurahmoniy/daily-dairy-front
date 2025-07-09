import { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { User } from "../../shared/api";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const u = await apiClient.getCurrentUser();
      setUser(u.user);
      setError("");
    } catch (err) {
      setUser(null);
      setError("Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  return { user, isLoading, error, refetch: fetchUser };
} 