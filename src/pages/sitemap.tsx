import { useNavigate } from "react-router-dom";
import Menu from "../components/menu";
import { useState, useEffect } from "react";
import "../styles/sitemap.sass";

/**
 * Sitemap page — visual tree / concept map
 * Shows main routes and (if available) last created meeting code.
 */
export default function Sitemap() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [lastMeeting, setLastMeeting] = useState<string | null>(null);

  useEffect(() => {
    // read last meeting from localStorage if exists
    const saved = localStorage.getItem("lastMeeting");
    if (saved) setLastMeeting(saved);
  }, []);

  return (
    <div className="sitemap-page">
      <header className="sitemap-header">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(!openMenu);
            }}
            aria-label="Open menu"
          >
            ☰
          </button>

          <img
            src="/images/uvmeet-removebg-preview.png"
            alt="UVMeet Logo"
            className="logo"
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer" }}
          />
        </div>

        <nav className="navbar">
          <button onClick={() => navigate("/about")} className="nav-btn">Sobre nosotros</button>
          <button onClick={() => navigate("/sitemap")} className="nav-btn">Mapa del sitio</button>
        </nav>
      </header>

      <Menu open={openMenu} setOpen={setOpenMenu} />

      <main className="sitemap-main">
        <h1 className="sitemap-title">Mapa del Sitio — UVMeet</h1>

        <p className="sitemap-sub">
          Vista conceptual de las principales rutas y acciones de la aplicación.
        </p>

        <section className="sitemap-tree-wrapper" aria-hidden={false}>
          {/* Root */}
          <div className="node root" onClick={() => navigate("/home")}>
            <span className="node-title">Inicio</span>
            <small className="node-sub">Create / Join meetings</small>
          </div>

          {/* Level 1 */}
          <div className="tree-row">
            <div className="node column" onClick={() => navigate("/login")}>
              <span className="node-title">Login</span>
              <small className="node-sub">Manual / Google / GitHub</small>
            </div>

            <div className="node column" onClick={() => navigate("/register")}>
              <span className="node-title">Register</span>
              <small className="node-sub">Create account</small>
            </div>

            <div className="node column" onClick={() => navigate("/about")}>
              <span className="node-title">About</span>
              <small className="node-sub">Project info</small>
            </div>
          </div>

          {/* Level 2 */}
          <div className="tree-row">
            <div className="node small" onClick={() => navigate("/forgot")}>
              <span className="node-title">Recover password</span>
            </div>

            <div className="node small" onClick={() => navigate("/editprofile")}>
              <span className="node-title">Edit profile</span>
            </div>

            <div className="node small" onClick={() => navigate("/deleteaccount")}>
              <span className="node-title">Delete account</span>
            </div>
          </div>

          {/* Meetings branch */}
          <div className="tree-branch">
            <div className="node branch" onClick={() => navigate("/home")}>
              <span className="node-title">Meetings</span>
              <small className="node-sub">Create / List / Join</small>
            </div>

            <div className="branch-children">
              <div className="node tiny" onClick={() => navigate("/home")}>
                <span className="node-title">Create meeting</span>
              </div>
              <div className="node tiny" onClick={() => navigate("/home")}>
                <span className="node-title">Join by code</span>
              </div>

              {/* Last created meeting (if exists) */}
              {lastMeeting && (
                <div
                  className="node meeting"
                  onClick={() => navigate(`/room/${lastMeeting}`)}
                  title={`Open meeting ${lastMeeting}`}
                >
                  <span className="node-title">Last meeting</span>
                  <small className="node-sub">{lastMeeting}</small>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="sitemap-actions">
          <button className="btn" onClick={() => navigate(-1)}>⬅ Volver</button>
          <button
            className="btn secondary"
            onClick={() => {
              // quick open create meeting page
              navigate("/home");
            }}
          >
            Crear / Unirse
          </button>
        </div>
      </main>
    </div>
  );
}
