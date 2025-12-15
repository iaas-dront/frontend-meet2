export interface LoginPayload {
  email?: string;
  password?: string;
  firebaseToken?: string; // tu frontend usa ESTE
  [key: string]: any;      // <-- permite cualquier campo adicional
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  firebaseToken: string;  // ← AGREGA ESTO
}

const API = import.meta.env.VITE_API_URL ?? "";

type User = {
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password?: string;
};


/* -------------------------
   Helper: Mock storage utils
   ------------------------- */
function getMockUsers(): User[] {
  const raw = localStorage.getItem("uv_mock_users");
  if (!raw) {
    const demo: User[] = [
      { uid: "1", firstName: "Demo", lastName: "User", age: 30, email: "demo@uv.com", password: "demo123" }
    ];
    localStorage.setItem("uv_mock_users", JSON.stringify(demo));
    return demo;
  }
  return JSON.parse(raw) as User[];
}

function saveMockUsers(users: User[]) {
  localStorage.setItem("uv_mock_users", JSON.stringify(users));
}

function generateId() {
  return String(Date.now() + Math.floor(Math.random() * 1000));
}


/* -------------------------
   Network helpers
   ------------------------- */
async function postJson(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function putJson(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("uv_token") ?? ""}`
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(path: string) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${localStorage.getItem("uv_token") ?? ""}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}


/* -------------------------
   Public API
   ------------------------- */

/**
 * LOGIN COMPLETO (API + MOCK)
 * Soporta:
 * - email + password
 * - Firebase token
 */
export async function loginRequest(
  payload: LoginPayload
): Promise<{ token: string; user: User } | null> {

  if (API) {
    // ✔ ENVÍA EL firebaseToken A TU BACKEND REAL
    return postJson("/users/provider-login", payload);
  }

  // MOCK
  const users = getMockUsers();

  // mock login por contraseña
  if (payload.password) {
    const found = users.find(
      u => u.email === payload.email && u.password === payload.password
    );
    if (!found) return null;
    return {
      token: `mock-token-${found.uid}`,
      user: { ...found, password: undefined }
    };
  }

  // mock login con Firebase token
  if (payload.firebaseToken) {
    const found = users.find(u => u.email === payload.email);
    if (!found) return null;
    return {
      token: `mock-fbtoken-${found.uid}`,
      user: { ...found, password: undefined }
    };
  }

  return null;
}


/**
 * REGISTER → Conecta FRONT → BACKEND
 */
export async function registerRequest(data: RegisterPayload): Promise<User> {
  if (API) {
    return postJson("/users/register", data); // ← Enviará firebaseToken
  }

  // MOCK (solo si no hay backend)
  const users = getMockUsers();

  if (users.find(u => u.email === data.email)) {
    throw new Error("Email already exists (mock).");
  }

  const newUser: User = {
    uid: generateId(),
    firstName: data.firstName,
    lastName: data.lastName,
    age: data.age,
    email: data.email,
    password: data.password,
  };

  users.push(newUser);
  saveMockUsers(users);
  return { ...newUser, password: undefined };
}


/**
 * FORGOT PASSWORD
 */
export async function forgotPasswordRequest(email: string): Promise<boolean> {
  if (API) {
    const res = await postJson("/auth/forgot-password", { email });
    return !!res;
  }

  const users = getMockUsers();
  const found = users.find(u => u.email === email);
  if (!found) return false;

  const token = `mock-reset-${found.uid}-${Date.now()}`;
  localStorage.setItem(`uv_reset_${found.uid}`, token);

  console.info("Mock reset token:", token);
  return true;
}


/**
 * RESET PASSWORD
 */
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";

export async function resetPasswordRequest(data: { password: string; token: string }): Promise<boolean> {
  try {
    await confirmPasswordReset(auth, data.token, data.password);
    return true;
  } catch (err) {
    console.error("Error al resetear la contraseña:", err);
    return false;
  }
}


 
/**
 * UPDATE USER
 */
export async function updateUserRequest(id: string, update: Partial<User>): Promise<User> {
  

  if (API) {
    return putJson(`/users/${id}`, {
      ...update,
      authUid: id // ← este es el UID REAL del usuario autenticado
    });
  }
 
  // MOCK
  const users = getMockUsers();
  const idx = users.findIndex(u => u.uid === id);
  if (idx === -1) throw new Error("User not found");

  users[idx] = { ...users[idx], ...update };
  saveMockUsers(users);

  return { ...users[idx], password: undefined };
}


/**
 * GET USER BY ID (Para Editar Perfil)
 */
export async function getUserRequest(id: string): Promise<User> {
  if (API) {
    const res = await fetch(`${API}/users/${id}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("uv_token") ?? ""}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // MOCK (solo si no hay backend)
  const users = getMockUsers();
  const found = users.find(u => u.uid === id);
  if (!found) throw new Error("User not found (mock)");
  return { ...found, password: undefined };
}

/**
 * DELETE USER
 */
export async function deleteUserRequest(id: string): Promise<boolean> {
  if (API) {
    return del(`/users/${id}`);
  }

  let users = getMockUsers();
  users = users.filter(u => u.uid !== id);
  saveMockUsers(users);
  return true;
}
