export async function createMeeting(uid: string, hostName: string, token: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/meetings`, { // <- quité /api
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ uid, hostName })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("❌ ERROR DEL SERVIDOR:", data);
    throw new Error(data.message || "Error creando reunión");
  }

  return data;
}


export async function getMeeting(id: string, token: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meetings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Error obteniendo reunión");
  return res.json();
}

export async function listMeetings(uid: string, token: string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/meetings?uid=${uid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) throw new Error("Error listando reuniones");
  return res.json();
}

export async function deleteMeeting(id: string, token: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meetings/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Error eliminando reunión");
  return res.json();
}
