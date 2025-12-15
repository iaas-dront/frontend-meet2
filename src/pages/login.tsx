import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { loginRequest } from "../services/auth.service";
import { useAuth } from "../components/AuthProvider";
import "../styles/login.sass";

export default function Login() {
  const { setUser, setToken } = useAuth();
  const nav = useNavigate();

  // Email field state
  const [email, setEmail] = useState("");

  // Password field state
  const [password, setPassword] = useState("");

  // Stores error messages for UI feedback
  const [err, setErr] = useState<string | null>(null);

  // Shows loading indicator while processing login
  const [loading, setLoading] = useState(false);

  /* =====================================================
      LOGIN WITH EMAIL AND PASSWORD
     ===================================================== */
  async function handleSubmit(e: any) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // Authenticate with Firebase using email/password
      const fbUser = await signInWithEmailAndPassword(auth, email, password);

      // Retrieve Firebase JWT token
      const firebaseToken = await fbUser.user.getIdToken();

      // Send token to backend for server-side authentication
      const res: any = await loginRequest({
        firebaseToken,
        email: fbUser.user.email!,
        provider: "manual",
      });

      // Backend must return user and token
      if (!res) throw new Error("The server rejected the login");

      // Save session in global auth context
      setToken(res.token);
      setUser(res.user);

      // Redirect to main dashboard
      nav("/home");
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
      LOGIN WITH GOOGLE ACCOUNT
     ===================================================== */
  async function handleGoogleLogin() {
    setErr(null);

    try {
      // Create Google provider instance
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // Open popup for Google authentication
      const result = await signInWithPopup(auth, provider);

      // Retrieve Firebase JWT token
      const firebaseToken = await result.user.getIdToken();

      // Authenticate with backend using token + email
      const res = await loginRequest({
        firebaseToken,
        email: result.user.email ?? "",
        provider: "google",
      });

      if (!res?.token || !res?.user) {
        setErr("Invalid server response");
        return;
      }

      // Store session
      setToken(res.token);
      setUser(res.user);

      nav("/home");
    } catch (error) {
      console.error("Google Login Error:", error);
      setErr("Unable to sign in with Google");
    }
  }

  /* =====================================================
      LOGIN WITH GITHUB ACCOUNT
     ===================================================== */
  async function handleGithubLogin() {
    setErr(null);

    try {
      // Create GitHub provider instance
      const provider = new GithubAuthProvider();
      provider.addScope("user:email"); // Required to retrieve email

      // Open popup for GitHub authentication
      const result = await signInWithPopup(auth, provider);

      // Retrieve Firebase JWT token
      const firebaseToken = await result.user.getIdToken();

      // Authenticate with backend
      const res = await loginRequest({
        firebaseToken,
        email: result.user.email ?? "",
        provider: "github",
      });

      if (!res?.token || !res?.user) {
        setErr("Invalid server response");
        return;
      }

      // Save session in context
      setToken(res.token);
      setUser(res.user);

      nav("/home");
    } catch (error: any) {
      console.error("GitHub Login Error:", error);

      // Handles the case when another provider uses the same email
      if (error?.code === "auth/account-exists-with-different-credential") {
        setErr("This email is already linked to another login method. Use Google or email.");
      } else {
        setErr("Unable to sign in with GitHub");
      }
    }
  }

  /* =====================================================
      UI SECTION
     ===================================================== */
  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* UVMeet Logo */}
        <img
          src="/images/uvmeet-removebg-preview.png"
          alt="UVMeet Logo"
          className="login-logo"
        />

        {/* Page Title */}
        <h2 className="login-title">Tu plataforma de videollamadas favorita</h2>

        {/* Email and password login form */}
        <form onSubmit={handleSubmit} className="login-form">

          <label htmlFor="username">Usuario (email)</label>
          <input
            id="username"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Error message */}
          {err && <p className="login-error">{err}</p>}

          {/* Login button */}
          <button type="submit" className="login-button">
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

          {/* Link to recover account access */}
          <p className="forgot-link">
            ¿Problemas al acceder a su cuenta? <a href="/forgot">Recuperar</a>
          </p>
          
          {/* Link to reset password */}
          <p className="ressetpasword-link">
            ¿Olvidó su contraseña? <a href="/ressetpasword">Cambiar</a>
          </p>
        </form>

        {/* Social login providers */}
        <div className="social-login">
          <button className="social-btn google" onClick={handleGoogleLogin}>
            <img src="/icons/google.svg" alt="" />
            Iniciar sesión con Google
          </button>

          <button className="social-btn github" onClick={handleGithubLogin}>
            <img src="/icons/github.svg" alt="" />
            Iniciar sesión con GitHub
          </button>
        </div>

        {/* Register link */}
        <p className="login-footer">
          ¿No tiene cuenta? <a href="/register">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
