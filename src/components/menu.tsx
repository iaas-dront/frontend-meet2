import "../styles/menu.sass";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

export default function Menu({ open, setOpen }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
    setOpen(false);
  }

  return (
    <>
      {/* OVERLAY DETRÁS DEL MENÚ */}
      {open && (
        <div
          className="menu-overlay"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* MENÚ LATERAL */}
      <div
        className={`side-menu ${open ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p onClick={() => { navigate("/home"); setOpen(false); }}>Inicio</p>
        <p onClick={() => { navigate("/about"); setOpen(false); }}>Sobre nosotros</p>
        <p onClick={() => { navigate("/sitemap"); setOpen(false); }}>Mapa del sitio</p>
        <p onClick={() => { navigate("/editprofile"); setOpen(false); }}>Editar perfil</p>
        <p onClick={() => { navigate("/deleteaccount"); setOpen(false); }}>Eliminar cuenta</p>

        <p className="logout-option" onClick={handleLogout}>
          Cerrar sesión
        </p>
      </div>
    </>
  );
}
