import { useState } from "react";
import axios from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { ExpiredPasswordModal } from "../../components/Auth/ExpiredPasswordModal";
import { TwoFactorModal } from "../../components/Auth/TwoFactorModal";
// Importamos iconos
import { HiEye, HiEyeOff } from "react-icons/hi";
import { BiDumbbell } from "react-icons/bi";
import { QrCode, Shield, User, UserPlus, CheckCircle2, Circle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const passwordReqs = [
  { id: "len", text: "Mínimo 8 caracteres", test: p => p.length >= 8 },
  { id: "let", text: "Contiene letras", test: p => /[A-Za-z]/.test(p) },
  { id: "upp", text: "Una mayúscula", test: p => /[A-Z]/.test(p) },
  { id: "num", text: "Al menos un número", test: p => /\d/.test(p) },
  { id: "sym", text: "Un símbolo (@$!%*?.&-)", test: p => /[@$!%*?.&\-]/.test(p) },
];

// ====================================================================
// CSS-in-JS STYLES (mantenemos estética oscura + naranja de GymTrack)
// ====================================================================
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0a0a 0%, #000000 40%, #0f0f0f 100%)",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    padding: "16px",
    position: "relative",
  },
  // Efecto de partículas/glow decorativo
  glowOrb: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
    top: "10%",
    right: "15%",
    pointerEvents: "none",
  },
  glowOrb2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)",
    bottom: "15%",
    left: "10%",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "rgba(24, 24, 27, 0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "24px",
    padding: "40px 32px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    zIndex: 10,
    animation: "fadeInUp 0.5s ease-out",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #ea580c, #f97316)",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(249,115,22,0.25)",
    marginBottom: "20px",
    transition: "transform 0.3s",
    cursor: "default",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    color: "#fff",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#a1a1aa",
    margin: 0,
  },
  // ROLE TABS
  roleTabs: {
    display: "flex",
    background: "rgba(9,9,11,0.5)",
    borderRadius: "14px",
    padding: "4px",
    marginBottom: "24px",
    border: "1px solid rgba(63,63,70,0.4)",
  },
  roleTab: (active) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    borderRadius: "10px",
    padding: "10px 12px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: active ? "rgba(63,63,70,0.6)" : "transparent",
    color: active ? "#fff" : "#71717a",
    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
  }),
  // METHOD TABS (Correo / QR)
  methodTabs: {
    display: "flex",
    background: "rgba(9,9,11,0.5)",
    borderRadius: "12px",
    padding: "3px",
    marginBottom: "24px",
    border: "1px solid rgba(63,63,70,0.3)",
  },
  methodTab: (active) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "600",
    borderRadius: "9px",
    padding: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: active ? "rgba(63,63,70,0.5)" : "transparent",
    color: active ? "#fff" : "#52525b",
  }),
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    marginLeft: "4px",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    background: "rgba(9,9,11,0.5)",
    border: "1px solid rgba(63,63,70,0.5)",
    borderRadius: "12px",
    padding: "14px 16px",
    paddingRight: "48px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  },
  inputFocus: {
    borderColor: "#f97316",
    boxShadow: "0 0 0 2px rgba(249,115,22,0.15)",
  },
  togglePasswordBtn: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#52525b",
    cursor: "pointer",
    padding: "4px",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: "16px",
    animation: "shake 0.4s ease",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#71717a",
    transition: "color 0.2s",
  },
  submitBtn: (loading) => ({
    width: "100%",
    background: "linear-gradient(135deg, #ea580c, #f97316)",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    transition: "all 0.2s",
    boxShadow: "0 8px 20px rgba(249,115,22,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "'Inter', sans-serif",
  }),
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0 20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(63,63,70,0.4)",
  },
  dividerText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#52525b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  registerLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(249,115,22,0.25)",
    background: "rgba(249,115,22,0.05)",
    color: "#f97316",
    fontSize: "13px",
    fontWeight: "600",
    textDecoration: "none",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    padding: "24px 0",
  },
  qrContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "20px",
    boxShadow: "0 0 40px -10px rgba(249,115,22,0.3)",
    border: "3px solid rgba(249,115,22,0.15)",
    transition: "transform 0.5s",
  },
  footer: {
    position: "fixed",
    bottom: "16px",
    color: "#3f3f46",
    fontSize: "10px",
    fontWeight: "500",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    zIndex: 0,
  },
};

// Animaciones CSS inyectadas
const animationCSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  .login-input::placeholder { color: #3f3f46; }
  .login-input:focus { border-color: #f97316 !important; box-shadow: 0 0 0 2px rgba(249,115,22,0.15) !important; }
  .role-tab:hover { color: #a1a1aa !important; background: rgba(63,63,70,0.2) !important; }
  .method-tab:hover { color: #a1a1aa !important; }
  .toggle-pass:hover { color: #fff !important; }
  .submit-btn:hover:not(:disabled) { box-shadow: 0 12px 28px rgba(249,115,22,0.3) !important; transform: translateY(-1px); }
  .submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .register-link:hover { background: rgba(249,115,22,0.1) !important; border-color: rgba(249,115,22,0.4) !important; }
  .qr-wrap:hover { transform: scale(1.05); }
  .logo-icon:hover { transform: scale(1.08); }
  .checkbox-label:hover { color: #a1a1aa !important; }
`;

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'qr' | 'forgot'
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);

  // ESTADOS FORGOT PASSWORD
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});

  // ESTADOS DEL MODAL DE POLÍTICAS DE SEGURIDAD
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post("auth/login", { username, password });
      const { token, user } = response.data.body;
      login(user, token);

      // Redirección inteligente según el rol del usuario
      if (user.role === "entrenador") {
        navigate("/entrenador/dashboard");
      } else if (user.role === "cliente") {
        navigate("/client/dashboard");
      } else if (
        user.role === "administrador" ||
        user.role === "recepcionista"
      ) {
        navigate("/dashboard");
      } else {
        navigate("/"); // Fallback al login
      }
    } catch (err) {
      console.error(err);
      // 1. Caducidad de Contraseña (90 días)
      if (
        err.response?.status === 403 &&
        err.response?.data?.body?.requirePasswordChange
      ) {
        setTempCredentials({ username, password });
        setShowExpiredModal(true);
      }
      // 2. Verificación en 2 Pasos (2FA)
      else if (
        err.response?.status === 403 &&
        err.response?.data?.body?.require2FA
      ) {
        setTwoFactorData({
          userId: err.response.data.body.userId,
          email: err.response.data.body.email,
        });
        setShow2FAModal(true);
      }
      // Manejo de errores normales
      else if (err.response && err.response.data && err.response.data.body) {
        const errorMessage =
          err.response.data.body.message || err.response.data.body;
        setError(
          typeof errorMessage === "string"
            ? errorMessage
            : "Error de autenticación"
        );
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentRole = { icon: <User size={16} />, label: "Usuario", placeholder: "correo o usuario" };

  return (
    <>
      <style>{animationCSS}</style>
      <div style={styles.page}>
        {/* Decorative glow */}
        <div style={styles.glowOrb} />
        <div style={styles.glowOrb2} />

        {/* MAIN CARD */}
        <div style={styles.card}>
          {/* HEADER */}
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon} className="logo-icon">
              <BiDumbbell size={28} />
            </div>
            <h1 style={styles.title}>Bienvenido a GymTrack</h1>
            <p style={styles.subtitle}>
              Accede a tu cuenta de GymTrack
            </p>
          </div>



          {/* METHOD TABS */}
          <div style={styles.methodTabs}>
              <button
                type="button"
                className="method-tab"
                style={styles.methodTab(loginMethod === "email")}
                onClick={() => setLoginMethod("email")}
              >
                Correo
              </button>
              <button
                type="button"
                className="method-tab"
                style={styles.methodTab(loginMethod === "qr")}
                onClick={() => setLoginMethod("qr")}
              >
                <QrCode size={16} /> Código QR
              </button>
          </div>

          {/* DYNAMIC SECTION */}
          {loginMethod === "forgot" ? (
             <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "12px 0" }}>

                 {/* ── PASO 1: Ingresar correo ── */}
                 {forgotStep === 1 && (
                   <>
                     <div style={{ textAlign: "left", marginBottom: "8px" }}>
                        <h3 style={{ fontSize:"18px", fontWeight:"700", margin:"0 0 8px 0", color: "#fff" }}>Restablecer Contraseña</h3>
                        <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                          Ingresa el correo asociado a tu cuenta para recibir un código de recuperación.
                        </p>
                     </div>
                     <div style={styles.inputGroup}>
                       <label style={styles.label}>Correo Electrónico</label>
                       <input
                         type="email"
                         className="login-input"
                         value={forgotEmail}
                         onChange={(e) => { setForgotEmail(e.target.value); setForgotErrors(err => ({...err, email: null})); }}
                         style={{...styles.input, borderColor: forgotErrors.email ? "#ef4444" : "rgba(63,63,70,0.5)"}}
                         placeholder="correo@ejemplo.com"
                       />
                       {forgotErrors.email && <p style={{ fontSize:"11px", color:"#f87171", marginTop:"4px", marginLeft:"4px" }}>{forgotErrors.email}</p>}
                     </div>
                     {error && (
                       <div style={styles.errorBox}>⚠️ {error}</div>
                     )}
                     <button
                       type="button"
                       className="submit-btn"
                       style={styles.submitBtn(loading)}
                       onClick={async () => {
                          if (!forgotEmail) { setForgotErrors({email: "El correo es obligatorio"}); return; }
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(forgotEmail)) { setForgotErrors({email: "Correo inválido"}); return; }
                          setLoading(true);
                          setError(null);
                          try {
                            const res = await axios.post("auth/forgot-password", { email: forgotEmail.trim().toLowerCase() });
                            setForgotStep(2);
                            setForgotErrors({});
                            toast.success("Código enviado a tu correo");
                          } catch(err) {
                            const msg = err.response?.data?.body;
                            setError(typeof msg === "string" ? msg : "Error al enviar el código");
                          } finally {
                            setLoading(false);
                          }
                       }}
                       disabled={loading}
                     >
                       {loading ? <div style={styles.spinner} /> : "Enviar Código"}
                     </button>
                     <button
                       type="button"
                       onClick={() => { setLoginMethod("email"); setError(null); setForgotErrors({}); }}
                       style={{ background:"none", border:"none", color:"#71717a", fontSize:"12px", cursor:"pointer", marginTop:"4px" }}
                     >
                       ← Volver al inicio de sesión
                     </button>
                   </>
                 )}

                 {/* ── PASO 2: Verificar código ── */}
                 {forgotStep === 2 && (
                   <>
                     <div style={{ textAlign: "left", marginBottom: "8px" }}>
                        <h3 style={{ fontSize:"18px", fontWeight:"700", margin:"0 0 8px 0", color: "#fff" }}>Verificar Código</h3>
                        <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                          Enviamos un código de 6 dígitos a <strong style={{color:"#fff"}}>{forgotEmail}</strong>.
                        </p>
                     </div>
                     <div style={styles.inputGroup}>
                       <label style={styles.label}>Código de Verificación</label>
                       <input
                         className="login-input"
                         value={forgotCode}
                         onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setForgotErrors(err => ({...err, code: null})); }}
                         style={{...styles.input, fontSize:"20px", letterSpacing:"6px", textAlign:"center", padding:"12px", borderColor: forgotErrors.code ? "#ef4444" : "rgba(63,63,70,0.5)"}}
                         placeholder="••••••"
                         maxLength={6}
                       />
                       {forgotErrors.code && <p style={{ fontSize:"11px", color:"#f87171", marginTop:"4px", marginLeft:"4px" }}>{forgotErrors.code}</p>}
                     </div>
                     {error && (
                       <div style={styles.errorBox}>⚠️ {error}</div>
                     )}
                     <div style={{ display:"flex", gap:"12px" }}>
                       <button
                         type="button"
                         style={{ background:"none", border:"1px solid rgba(63,63,70,0.5)", borderRadius:"12px", padding:"12px", color:"#a1a1aa", fontSize:"14px", fontWeight:"600", cursor:"pointer", flex: 1, transition:"all 0.2s" }}
                         onClick={() => { setForgotStep(1); setForgotCode(""); setError(null); setForgotErrors({}); }}
                       >
                         Atrás
                       </button>
                       <button
                         type="button"
                         className="submit-btn"
                         style={{...styles.submitBtn(loading), flex: 2}}
                         onClick={async () => {
                           if (forgotCode.length !== 6) { setForgotErrors({code: "El código debe tener 6 dígitos"}); return; }
                           setLoading(true);
                           setError(null);
                           try {
                             await axios.post("auth/verify-reset-code", { email: forgotEmail.trim().toLowerCase(), code: forgotCode });
                             setForgotStep(3);
                             setForgotErrors({});
                             toast.success("Código verificado correctamente");
                           } catch (err) {
                             const msg = err.response?.data?.body;
                             setError(typeof msg === "string" ? msg : "El código es incorrecto o ha expirado");
                           } finally {
                             setLoading(false);
                           }
                         }}
                         disabled={loading || forgotCode.length !== 6}
                       >
                         {loading ? <div style={styles.spinner} /> : "Verificar Código"}
                       </button>
                     </div>
                     <button
                       type="button"
                       onClick={async () => {
                         setLoading(true);
                         try {
                           await axios.post("auth/forgot-password", { email: forgotEmail.trim().toLowerCase() });
                           toast.success("Nuevo código enviado");
                         } catch(err) {
                           toast.error("Error al reenviar el código");
                         } finally {
                           setLoading(false);
                         }
                       }}
                       disabled={loading}
                       style={{ background:"none", border:"none", color:"#f97316", fontSize:"12px", fontWeight:"600", cursor: loading ? "not-allowed" : "pointer", marginTop:"4px" }}
                     >
                       ¿No recibiste el código? Reenviar
                     </button>
                   </>
                 )}

                 {/* ── PASO 3: Nueva contraseña ── */}
                 {forgotStep === 3 && (
                   <>
                     <div style={{ textAlign: "left", marginBottom: "8px" }}>
                        <h3 style={{ fontSize:"18px", fontWeight:"700", margin:"0 0 8px 0", color: "#fff" }}>Nueva Contraseña</h3>
                        <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                          Crea una contraseña segura para tu cuenta.
                        </p>
                     </div>
                     <div style={styles.inputGroup}>
                       <label style={styles.label}>Nueva Contraseña</label>
                       <div style={styles.inputWrapper}>
                         <input
                           type={showNewPassword ? "text" : "password"}
                           className="login-input"
                           value={newPassword}
                           onChange={(e) => { setNewPassword(e.target.value); setForgotErrors(err => ({...err, password: null})); }}
                           style={{...styles.input, borderColor: forgotErrors.password ? "#ef4444" : "rgba(63,63,70,0.5)"}}
                           placeholder="••••••••"
                         />
                         <button type="button" className="toggle-pass" onClick={() => setShowNewPassword(!showNewPassword)} style={styles.togglePasswordBtn}>
                           {showNewPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                         </button>
                       </div>
                       {forgotErrors.password && <p style={{ fontSize:"11px", color:"#f87171", marginTop:"4px", marginLeft:"4px" }}>{forgotErrors.password}</p>}
                       <div style={{ marginTop:"8px", display:"flex", flexWrap:"wrap", gap:"4px 16px" }}>
                         {passwordReqs.map(r => {
                           const ok = r.test(newPassword);
                           return <div key={r.id} style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color: ok ? "#22c55e" : "#52525b" }}>
                             {ok ? <CheckCircle2 size={12}/> : <Circle size={12}/>} {r.text}
                           </div>;
                         })}
                       </div>
                     </div>
                     <div style={styles.inputGroup}>
                       <label style={styles.label}>Confirmar Nueva Contraseña</label>
                       <input
                         type={showNewPassword ? "text" : "password"}
                         className="login-input"
                         value={confirmNewPassword}
                         onChange={(e) => { setConfirmNewPassword(e.target.value); setForgotErrors(err => ({...err, confirmPassword: null})); }}
                         style={{...styles.input, borderColor: forgotErrors.confirmPassword ? "#ef4444" : "rgba(63,63,70,0.5)"}}
                         placeholder="••••••••"
                       />
                       {forgotErrors.confirmPassword && <p style={{ fontSize:"11px", color:"#f87171", marginTop:"4px", marginLeft:"4px" }}>{forgotErrors.confirmPassword}</p>}
                     </div>
                     {error && (
                       <div style={styles.errorBox}>⚠️ {error}</div>
                     )}
                     <button
                       type="button"
                       className="submit-btn"
                       style={styles.submitBtn(loading)}
                       onClick={async () => {
                         const e = {};
                         if (!newPassword) e.password = "La contraseña es obligatoria";
                         else if (!passwordReqs.every(r => r.test(newPassword))) e.password = "La contraseña no cumple los requisitos";
                         if (newPassword !== confirmNewPassword) e.confirmPassword = "Las contraseñas no coinciden";
                         if (Object.keys(e).length > 0) { setForgotErrors(e); return; }
                         
                         setLoading(true);
                         setError(null);
                         try {
                           const res = await axios.post("auth/reset-password", { email: forgotEmail.trim().toLowerCase(), code: forgotCode, newPassword });
                           const msg = res.data?.body?.message || "Contraseña restablecida exitosamente";
                           toast.success(msg);
                           // Limpiar estado y volver al login
                           setLoginMethod("email");
                           setForgotStep(1);
                           setForgotEmail("");
                           setForgotCode("");
                           setNewPassword("");
                           setConfirmNewPassword("");
                           setForgotErrors({});
                           setError(null);
                         } catch (err) {
                           const msg = err.response?.data?.body;
                           setError(typeof msg === "string" ? msg : "Error al restablecer la contraseña. Intenta nuevamente.");
                         } finally {
                           setLoading(false);
                         }
                       }}
                       disabled={loading}
                     >
                       {loading ? <div style={styles.spinner} /> : "Restablecer Contraseña"}
                     </button>
                   </>
                 )}
             </div>
          ) : loginMethod === "qr" ? (
            <div style={styles.qrSection}>
              <div style={styles.qrContainer} className="qr-wrap">
                <QRCodeSVG
                  value="gymtrack-login://auth/123456789"
                  size={200}
                  level="H"
                  fgColor="#09090b"
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontWeight: "600", color: "#fff", margin: "0 0 8px 0" }}>
                  Inicio Rápido con QR
                </h3>
                <p style={{ fontSize: "13px", color: "#71717a", margin: 0, lineHeight: 1.5 }}>
                  Abre la app móvil de GymTrack en tu celular y escanea este código.
                </p>
              </div>
            </div>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLogin}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Correo o Usuario
                </label>
                <input
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder={currentRole.placeholder}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña</label>
                <div style={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.togglePasswordBtn}
                  >
                    {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div style={styles.errorBox}>⚠️ {error}</div>
              )}

              <div style={styles.checkboxRow}>
                <label className="checkbox-label" style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    style={{ accentColor: "#f97316", width: "16px", height: "16px", borderRadius: "4px", cursor: "pointer" }}
                  />
                  <span>Recordarme</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setLoginMethod("forgot")}
                  style={{ background: "none", border: "none", color: "#f97316", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ea580c"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#f97316"}
                >
                  Olvidé mi contraseña
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
                style={styles.submitBtn(loading)}
              >
                {loading ? (
                  <div style={styles.spinner} />
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          )}

          {/* REGISTER LINK */}
          <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>¿Eres nuevo?</span>
                <div style={styles.dividerLine} />
              </div>
              <Link to="/register" className="register-link" style={styles.registerLink}>
                <UserPlus size={16} />
                Crear mi cuenta
          </Link>
        </div>

        {/* Footer */}
        <div style={styles.footer}>Powered by GymTrack System</div>

        <ExpiredPasswordModal
          isOpen={showExpiredModal}
          userCredentials={tempCredentials}
          onComplete={(data) => {
            setShowExpiredModal(false);
            login(data.user, data.token);

            if (data.user.role === "cliente") {
              navigate("/client/dashboard");
            } else if (
              data.user.role === "administrador" ||
              data.user.role === "recepcionista"
            ) {
              navigate("/dashboard");
            } else {
              navigate("/");
            }
          }}
        />

        <TwoFactorModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          data={twoFactorData}
          onComplete={(data) => {
            setShow2FAModal(false);
            login(data.user, data.token);

            if (data.user.role === "cliente") {
              navigate("/client/dashboard");
            } else {
              navigate("/dashboard");
            }
          }}
        />
      </div>
    </>
  );
}
