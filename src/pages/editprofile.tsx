import { useEffect, useState } from "react";
import "../styles/editprofile.sass";
import Menu from "../components/menu";
import { useAuth } from "../components/AuthProvider";
import { auth } from "../firebase";
import { updateProfile, updateEmail, reload } from "firebase/auth";

export default function EditProfile() {
  const { user, token, setUser } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
  });
  console.log("USER DESDE AUTH:", user);

  // Cargar datos actuales del usuario
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        age: user.age?.toString() || "",
      });
    }
  }, [user]);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    console.log("USUARIO EN EDITPROFILE:", user);
    if (!user?.uid) {
      alert("Usuario no válido");
      
      return;
    }

    const currentAuthUser = auth.currentUser;

    if (!currentAuthUser) {
      alert("No hay usuario en Firebase");
      return;
    }

    try {
      // 1️⃣ Actualizar Firebase Auth
      await updateProfile(currentAuthUser, {
        displayName: `${form.firstName} ${form.lastName}`,
      });

      if (form.email !== currentAuthUser.email) {
        await updateEmail(currentAuthUser, form.email);
      }

      // Refrescar datos de Firebase
      await reload(currentAuthUser);

      // 2️⃣ Actualizar backend
      const res = await fetch(
        `http://localhost:3000/api/users/${user.uid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.log("ID QUE ENVÍO AL BACKEND:", user.uid);
        alert("Error al actualizar: " + data.error);
        return;
      }

      // 3️⃣ Actualizar usuario global (frontend)
      setUser({
        ...user,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        age: Number(form.age),
      });

      alert("Perfil actualizado correctamente");

    } catch (error) {
      console.error(error);
      alert("Hubo un error actualizando el perfil");
    }
  }

  return (
    <div className="editprofile-page">
      {/* HEADER */}
      <header className="edit-header">
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

      {/* FORM */}
      <div className="edit-profile-container">
        <div className="edit-card">

          <div className="profile-photo">
            <div className="circle">
              <span className="icon">👤</span>
            </div>
            <button className="btn-edit-photo">Editar foto</button>
          </div>

          <div className="username-section">
            <h2 className="username">
              {form.firstName || "Usuario"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="edit-form">
            
            <label>Nombre</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
            />

            <label>Apellido</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />

            <label>Correo</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <label>Edad</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
            />

            <button type="submit" className="btn-save">Guardar</button>
          </form>
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
