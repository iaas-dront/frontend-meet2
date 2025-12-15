import { useState, type JSX } from "react";
import "../styles/forgot.sass";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Forgot Password page.
 * Allows the user to submit a recovery email.
 *
 * @returns JSX.Element
 */
export default function ForgotPassword(): JSX.Element {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);

      setMessage("Si el correo existe, recibirá instrucciones para recuperar su contraseña.");
    } catch (error: any) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        setMessage("Si el correo existe, recibirá instrucciones para recuperar su contraseña.");
      } else {
        setMessage("Hubo un error, inténtelo nuevamente.");
      }
    }
  }

  return (
    <div className="forgot-container">
      <div className="forgot-card">

        <img
          src="/public/images/uvmeet-removebg-preview.png"
          alt="UVMeet Logo"
          className="forgot-logo"
        />

        <h2 className="forgot-title">Ingrese el correo de recuperación</h2>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {message && (
            <p className="forgot-msg" role="alert">
              {message}
            </p>
          )}

          <button type="submit" className="forgot-button">
            Confirmar
          </button>
        </form>

        <p className="forgot-footer">
          ¿No tiene cuenta? <a href="/register">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
