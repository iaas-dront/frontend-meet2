import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import "../styles/deleteaccount.sass";
import Menu from "../components/menu";

export default function DeleteAccount() {
  const [openMenu, setOpenMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!password || password.length < 6) {
      alert("Debe ingresar su contraseña antes de continuar.");
      return;
    }

    const yes = window.confirm(
      "¿Seguro que desea eliminar su cuenta? Esta acción es permanente y no se puede deshacer."
    );

    if (!yes) return;

    setLoading(true);

    try {
      await deleteAccount(password);
      alert("Cuenta eliminada exitosamente.");
      navigate("/login");
    } catch (err: any) {
      alert(err.message || "Error al eliminar la cuenta.");
    }

    setLoading(false);
  };

  return (
    <div className="deleteaccount-page">
      {/* HEADER */}
      <header className="delete-header">
        <div className="header-left">
          <button
            className="btn-menu"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu((prev) => !prev);
            }}
          >
            ☰
          </button>

          <Menu open={openMenu} setOpen={setOpenMenu} />

          <img
            src="/images/uvmeet-removebg-preview.png"
            alt="UVMeet Logo"
            className="logo"
          />
        </div>
      </header>

      {/* MAIN */}
      <div className="edit-profile-container">
        <div className="delete-card">
          {!confirm ? (
            <>
              <h2 className="delete-title">¿DESEA ELIMINAR ESTA CUENTA?</h2>

              <button
                className="btn-delete-main"
                onClick={() => setConfirm(true)}
                disabled={loading}
              >
                Eliminar cuenta
              </button>
            </>
          ) : (
            <>
              <p className="delete-confirm-text">
                Esta acción es permanente.  
                <br />Ingrese su contraseña para confirmar:
              </p>

              <input
                type="password"
                className="delete-password-input"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="delete-confirm-buttons">
                <button
                  className="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>

                <button
                  className="btn-confirm-cancel"
                  onClick={() => setConfirm(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-divider"></div>
        <h3>Mapa del sitio</h3>

        <div className="footer-columns">
          <div>
            <p><strong>ACCESO</strong></p>
            <p>Iniciar Sesión</p>
            <p>Crear cuenta</p>
            <p>Recuperar contraseña</p>
          </div>

          <div>
            <p><strong>CUENTA Y SOPORTE</strong></p>
            <p>Editar perfil</p>
            <p>Sobre nosotros</p>
            <p>Contacto</p>
          </div>

          <div>
            <p><strong>NAVEGACIÓN</strong></p>
            <p>Inicio</p>
            <p>Sobre nosotros</p>
            <p>Reuniones</p>
          </div>

          <div>
            <p><strong>CONTACTO</strong></p>
            <p>uvmeet@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
