import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/login";
import RessetPasword from "../pages/ressetpassword";
import Forgot from "../pages/forgot";
import Room from "../pages/room";
import Register from "../pages/register";
import Home from "../pages/home";
import About from "../pages/about";
import ProtectedRoute from "../components/ProtectedRoute";
import EditProfile from "../pages/editprofile";
import DeleteAccount from "../pages/deleteaccount";
import Sitemap from "../pages/sitemap";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ⭐ Ruta raíz -> redirigir SIEMPRE al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/resetpassword" element={<RessetPasword />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/sitemap" element={<Sitemap />} />

        {/* Rutas protegidas */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/room/:id"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editprofile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/deleteaccount"
          element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
