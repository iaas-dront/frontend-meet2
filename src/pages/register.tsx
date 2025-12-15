import { useState, type JSX } from "react";
import "../styles/register.sass";
import { useAuth } from "../components/AuthProvider";

export default function Register(): JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register } = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (!age) {
      alert("Debes ingresar tu edad");
      return;
    }

    try {
      await register({ firstName, lastName, age, email, password });
      alert("Cuenta creada. Ahora inicia sesión.");
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message || "Error al registrar");
    }
  }

  return (
    <div className="register-container">
      <div className="register-left">
        <img
          src="/public/images/uvmeet-removebg-preview.png"
          alt="UVMeet Logo"
          className="register-logo"
        />
        <h2 className="register-text">Tu plataforma de videollamadas favorita</h2>
      </div>

      <div className="register-card">
        <h2 className="register-title">Crea tu cuenta</h2>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="firstName">Nombre</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <label htmlFor="lastName">Apellido</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

          <label htmlFor="age">Edad</label>
          <input
            id="age"
            type="number"
            min="1"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            required
          />

          <label htmlFor="email">Correo</label>
          <input
            id="email"
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

          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="register-button">
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
}
