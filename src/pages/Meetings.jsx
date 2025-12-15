import { useState, useEffect } from "react";
import { createMeeting, listMeetings, deleteMeeting } from "../services/meetingService";

export default function Meetings({ user, token }) {
  const [meetings, setMeetings] = useState([]);

  // Crear reunión
  const generate = async () => {
    try {
      const res = await createMeeting(
        user.uid,
        user.displayName || user.firstName || "Anónimo",
        token
      );

      alert(`Reunión creada con ID: ${res.id}`);

      load(); // recargar lista
    } catch (e) {
      console.error(e);
      alert("Error al crear reunión");
    }
  };

  // Cargar reuniones del usuario
  const load = async () => {
    try {
      const res = await listMeetings(user.uid, token);
      setMeetings(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Eliminar reunión
  const removeMeet = async (id) => {
    await deleteMeeting(id, token);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🔵 Mis Reuniones</h1>

      <button onClick={generate}>➕ Crear Reunión</button>

      <ul>
        {meetings.map((m) => (
          <li key={m.id} style={{ marginTop: 10 }}>
            <b>{m.id}</b> — {m.hostName}
            
            <a
              href={`/room/${m.id}`}
              style={{ marginLeft: 10, color: "blue" }}
            >
              Entrar
            </a>

            <button
              style={{ marginLeft: 10 }}
              onClick={() => removeMeet(m.id)}
            >
              🗑 Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
