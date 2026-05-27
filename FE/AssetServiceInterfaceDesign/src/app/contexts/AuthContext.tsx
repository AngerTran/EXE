import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserRole = "customer" | "admin";

type SubscriptionType = "free" | "student" | "indie" | "pro" | null;

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  role: UserRole;
  subscription: SubscriptionType;
  subscriptionExpiry?: string; // ISO date string
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateCredits: (newCredits: number) => void;
  updateSubscription: (subscription: SubscriptionType, expiry?: string) => void;
  refreshUserData: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Get all users from localStorage
    const usersData = localStorage.getItem("users");
    const users = usersData ? JSON.parse(usersData) : {};

    // Check if user exists and password matches
    if (users[email] && users[email].password === password) {
      const userData: User = {
        id: users[email].id,
        email: email,
        name: users[email].name,
        credits: users[email].credits || 20,
        role: users[email].role || "customer",
        subscription: users[email].subscription || "free",
        subscriptionExpiry: users[email].subscriptionExpiry,
      };
      setUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Get all users from localStorage
    const usersData = localStorage.getItem("users");
    const users = usersData ? JSON.parse(usersData) : {};

    // Check if user already exists
    if (users[email]) {
      return false;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      password: password,
      name: name,
      credits: 10, // 20 free credits for new users (as per BMC)
      role: "customer" as UserRole,
      subscription: "free" as SubscriptionType,
      registeredAt: new Date().toISOString(),
      totalSpent: 0,
    };

    users[email] = newUser;
    localStorage.setItem("users", JSON.stringify(users));

    // Auto login after registration
    const userData: User = {
      id: newUser.id,
      email: email,
      name: name,
      credits: newUser.credits,
      role: newUser.role,
      subscription: newUser.subscription,
    };
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateCredits = (newCredits: number) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // Also update in users storage
      const usersData = localStorage.getItem("users");
      if (usersData) {
        const users = JSON.parse(usersData);
        if (users[user.email]) {
          users[user.email].credits = newCredits;
          localStorage.setItem("users", JSON.stringify(users));
        }
      }
    }
  };

  const updateSubscription = (subscription: SubscriptionType, expiry?: string) => {
    if (user) {
      const updatedUser = { ...user, subscription, subscriptionExpiry: expiry };
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // Also update in users storage
      const usersData = localStorage.getItem("users");
      if (usersData) {
        const users = JSON.parse(usersData);
        if (users[user.email]) {
          users[user.email].subscription = subscription;
          users[user.email].subscriptionExpiry = expiry;
          localStorage.setItem("users", JSON.stringify(users));
        }
      }
    }
  };

  const refreshUserData = () => {
    if (!user) return;
    
    // Read from users storage (source of truth) instead of just currentUser
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const users = JSON.parse(usersData);
      if (users[user.email]) {
        const freshUserData: User = {
          id: users[user.email].id,
          email: user.email,
          name: users[user.email].name,
          credits: users[user.email].credits || 20,
          role: users[user.email].role || "customer",
          subscription: users[user.email].subscription || "free",
          subscriptionExpiry: users[user.email].subscriptionExpiry,
        };
        setUser(freshUserData);
        localStorage.setItem("currentUser", JSON.stringify(freshUserData));
      }
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateCredits, updateSubscription, refreshUserData, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}