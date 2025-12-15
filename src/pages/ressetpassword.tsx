import { useState, type JSX } from "react";
import { resetPasswordRequest } from "../services/auth.service";
import "../styles/ressetpasword.sass";

export default function RessetPasword(): JSX.Element {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== repeatPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }

    try {
      const token = new URLSearchParams(window.location.search).get("oobCode");

      if (!token) {
        setErrorMessage("Token no válido");
        return;
      }

      const ok = await resetPasswordRequest({ password, token });

      if (!ok) {
        setErrorMessage("No se pudo actualizar la contraseña");
        return;
      }

      setSuccessMessage("Contraseña actualizada correctamente");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
      setErrorMessage("Error al procesar la solicitud");
    }
  }

  return (
    <div className="reset-bg">
      <div className="reset-card">
        <img
          src="/images/uvmeet-removebg-preview.png"
          alt="UVMeet logo"
          className="reset-logo"
        />

        <h2 className="reset-title">Restablecer contraseña</h2>

        <form onSubmit={handleSubmit} className="reset-form">
          <label>Nueva contraseña</label>
          <input
            type="password"
            placeholder="Ingrese su nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Repita la contraseña</label>
          <input
            type="password"
            placeholder="Repita su nueva contraseña"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
          />

          {errorMessage && <p className="reset-error">{errorMessage}</p>}
          {successMessage && <p className="reset-success">{successMessage}</p>}

          <button type="submit" className="reset-button">
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
