import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "../components/menu";
import "../styles/about.sass";

const About = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="about-container">

      {/* HEADER */}
      <header className="about-header">

        <div className="header-left">

          {/* BOTÓN HAMBURGUESA FUNCIONAL */}
          <button
            className="hamburger-btn"
            onClick={() => setOpen(!open)}
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
          <a onClick={() => navigate("/about")}>Sobre nosotros</a>
          <a onClick={() => navigate("/sitemap")}>Mapa del sitio</a>
          <a onClick={() => setOpen(true)}>Menú</a>
        </nav>
      </header>

      {/* MENÚ DESPLEGABLE */}
      <Menu open={open} setOpen={setOpen} />

      {/* SIDEBAR */}
      <div className="sidebar-btn">Sobre nosotros</div>

      {/* MAIN CONTENT */}
      <main className="about-main">
        <div className="about-card">
          <h2>Sobre nosotros</h2>

          <p>
            En UV Meet creemos que la comunicación debe ser simple, rápida y accesible para todos.
            Por eso desarrollamos una plataforma de videollamadas moderna, segura y eficiente,
            pensada para conectar a personas, equipos y organizaciones sin importar dónde se encuentren.
          </p>

          <p>
            Nuestra misión es ofrecer una herramienta intuitiva que permita reuniones en línea de alta calidad,
            con funciones diseñadas para facilitar la colaboración: videollamadas estables, chat en tiempo real,
            uso compartido de pantalla y espacios virtuales que se adaptan a cualquier necesidad.
          </p>

          <p>
            Trabajamos con un enfoque centrado en el usuario, priorizando la seguridad, privacidad y experiencia fluida.
            UV Meet nace como una solución confiable para instituciones, empresas y personas que buscan comunicarse
            de forma profesional y sin complicaciones.
          </p>

          <p>
            En UV Meet, conectamos ideas, personas y proyectos.
            Tu espacio digital para reunirte, aprender y trabajar.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="about-footer">
        <div className="footer-divider"></div>

        <h3>Mapa del sitio</h3>

        <div className="footer-columns">
          <div>
            <p><strong>ACCESO</strong></p>
            <p onClick={() => navigate("/login")}>Iniciar Sesión</p>
            <p onClick={() => navigate("/register")}>Crear cuenta</p>
            <p>Recuperar contraseña</p>
          </div>

          <div>
            <p><strong>CUENTA Y SOPORTE</strong></p>
            <p onClick={() => navigate("/editprofile")}>Editar perfil</p>
            <p onClick={() => navigate("/about")}>Sobre nosotros</p>
            <p>Contacto</p>
          </div>

          <div>
            <p><strong>NAVEGACIÓN</strong></p>
            <p onClick={() => navigate("/home")}>Inicio</p>
            <p onClick={() => navigate("/about")}>Sobre nosotros</p>
            <p onClick={() => navigate("/meet")}>Reuniones</p>
          </div>

          <div>
            <p><strong>CONTACTO</strong></p>
            <p>uvmeet@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
