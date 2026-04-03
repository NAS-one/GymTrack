import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
// Importamos iconos de la librería que instalaste
import { FaGoogle } from "react-icons/fa";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { BiDumbbell } from "react-icons/bi";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado de carga visual

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // 1. Verificamos si la función al menos se dispara
    console.log("🔘 BOTÓN PRESIONADO. Intentando enviar:", { email, password });
    setError(null);
    setLoading(true); // Activa spinner

    try {
      console.log("🚀 Enviando petición a la API...");
      const response = await axios.post("auth/login", {
        username: email,
        password,
      });
      console.log("✅ Respuesta exitosa del backend:", response.data);
      const { token, user } = response.data.body;

      console.log("🕵️ DATOS DEL USUARIO QUE LLEGAN DEL BACKEND:", user);

      // Guardamos la sesión en el contexto
      login(user, token);

      // ==========================================
      // LÓGICA DE REDIRECCIÓN BASADA EN ROLES (CORREGIDA)
      // ==========================================
      const rolDelUsuario = (user?.role || user?.rol || user?.id_rol || "")
        .toString()
        .toLowerCase();

      console.log("🔍 EL ROL DETECTADO ES EXACTAMENTE:", `"${rolDelUsuario}"`);

      if (rolDelUsuario === "entrenador" || rolDelUsuario === "2") {
        navigate("/entrenador/dashboard");
      } else if (rolDelUsuario === "cliente" || rolDelUsuario === "3") {
        navigate("/client/dashboard");
      } else {
        // Si es administrador o cualquier otro, va al principal
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.body) {
        setError(err.response.data.body);
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false); // Desactiva spinner
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder para futuro
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    // FONDO: Degradado oscuro sutil y profesional
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white font-sans selection:bg-orange-500 selection:text-white p-4">
      {/* TARJETA PRINCIPAL: Efecto Glassmorphism sutil */}
      <div className="w-full max-w-[420px] bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-fade-in-up">
        {/* HEADER: Logo y Bienvenida */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 text-white shadow-lg shadow-orange-500/20 mb-5 transform hover:scale-105 transition-transform duration-300">
            <BiDumbbell size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Bienvenido de nuevo
          </h1>
          <p className="text-zinc-400 text-sm">
            Ingresa tus credenciales para acceder al panel.
          </p>
        </div>

        {/* BOTÓN SOCIAL: Google (Solo este) */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-200 transition-all duration-200 mb-6 group"
        >
          <FaGoogle className="text-red-500 text-lg group-hover:scale-110 transition-transform" />
          Continuar con Google
        </button>

        {/* SEPARADOR ELEGANTE */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            o con email
          </span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-wide">
              Usuario
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              placeholder="nombre@ejemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-wide">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
          </div>

          {/* MENSAJE DE ERROR ANIMADO */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs font-medium text-center animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4 rounded border-zinc-700 bg-zinc-800 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Recordarme
              </span>
            </label>
            <a
              href="#"
              className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-orange-500 hover:to-orange-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Acceder al Panel"
            )}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-xs text-zinc-500 mt-8">
          ¿No tienes cuenta?{" "}
          <span className="text-zinc-300 font-medium">
            Contacta al administrador
          </span>
        </p>
      </div>

      {/* Footer Branding sutil */}
      <div className="fixed bottom-4 text-zinc-700 text-[10px] font-medium tracking-widest uppercase">
        Powered by GymTrack System
      </div>
    </div>
  );
}
