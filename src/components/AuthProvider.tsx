import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from "firebase/auth";

import { doc, deleteDoc } from "firebase/firestore";
import { loginRequest, registerRequest } from "../services/auth.service";

type User = { 
  uid: string; 
  email: string; 
  firstName?: string; 
  lastName?: string; 
  age?: number 
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<void>;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("uv_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("uv_token")
  );

  useEffect(() => {
    if (user) localStorage.setItem("uv_user", JSON.stringify(user));
    else localStorage.removeItem("uv_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("uv_token", token);
    else localStorage.removeItem("uv_token");
  }, [token]);

  // ---------------------------
  // LOGIN
  // ---------------------------
  async function login(email: string, password: string) {
  const fbUser = await signInWithEmailAndPassword(auth, email, password);
  const firebaseToken = await fbUser.user.getIdToken();

  const res: any = await loginRequest({
    firebaseToken,
    email: fbUser.user.email!,
  });

  if (!res) throw new Error("Invalid credentials");

  setToken(res.token);
  setUser(res.user);
}


  // ---------------------------
  // REGISTER
  // ---------------------------
  async function register(payload: any) {
    const { email, password } = payload;

    const fbUser = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseToken = await fbUser.user.getIdToken();

    await registerRequest({
      firstName: payload.firstName,
      lastName: payload.lastName,
      age: payload.age,
      email: fbUser.user.email ?? payload.email,
      password,
      firebaseToken,
    });
  }

  // ---------------------------
  // LOGOUT
  // ---------------------------
  function logout() {
    signOut(auth);
    setToken(null);
    setUser(null);
    localStorage.removeItem("uv_token");
    localStorage.removeItem("uv_user");
  }

  // ---------------------------
  // DELETE ACCOUNT (AUTH + FIRESTORE)
  // ---------------------------
  async function deleteAccount(password: string) {
    const current = auth.currentUser;
    if (!current) throw new Error("No hay usuario autenticado");

    try {
      // 1. Reautenticación obligatoria
      const credential = EmailAuthProvider.credential(current.email!, password);
      await reauthenticateWithCredential(current, credential);

      // 2. Borrar documento en Firestore
      const userRef = doc(db, "users", current.uid);
      await deleteDoc(userRef);

      // 3. Borrar usuario de Firebase Auth
      await deleteUser(current);

      // 4. Limpiar estado local
      setUser(null);
      setToken(null);
      localStorage.removeItem("uv_user");
      localStorage.removeItem("uv_token");

    } catch (err) {
      console.error("Error al borrar cuenta:", err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider 
      value={{ user, token, login, register, logout, deleteAccount, setUser, setToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
