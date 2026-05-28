import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "../../api/axios";
import { BiDumbbell } from "react-icons/bi";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { CheckCircle2, Circle, MapPin, User, CreditCard, ArrowLeft, ArrowRight, X } from "lucide-react";
import gymImg from "../../assets/gym_osorno.png";
import gymPortalesImg from "../../assets/gym_osorno_portales.png";
// Códigos postales válidos para Osorno
const OSORNO_CODES = ["5290000","5290001","5290002","5290003","5290004","5290005","5290006","5290007","5290008","5290009","5290010","5291000","5310000"];

// Validar RUT chileno (Módulo 11)
function validateRutDV(rut) {
  const clean = rut.replace(/[.\-]/g, "");
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  const expected = r === 11 ? "0" : r === 10 ? "K" : r.toString();
  return dv === expected;
}

function formatRut(value) {
  let v = value.replace(/[^0-9kK]/g, "");
  if (v.length > 9) v = v.slice(0, 9);
  if (v.length <= 1) return v;
  const dv = v.slice(-1);
  let body = v.slice(0, -1);
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
}

function calcAge(dateStr) {
  const d = new Date(dateStr), now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const passwordReqs = [
  { id: "len", text: "Mínimo 8 caracteres", test: p => p.length >= 8 },
  { id: "let", text: "Contiene letras", test: p => /[A-Za-z]/.test(p) },
  { id: "upp", text: "Una mayúscula", test: p => /[A-Z]/.test(p) },
  { id: "num", text: "Al menos un número", test: p => /\d/.test(p) },
  { id: "sym", text: "Un símbolo (@$!%*?.&-)", test: p => /[@$!%*?.&\-]/.test(p) },
];

const GOALS = ["Ganar Masa Muscular", "Bajar de Peso", "Tonificar", "Mejorar Resistencia", "Rehabilitación", "Mantenerse en Forma"];

const SEDES = [
  { id: "centro", nombre: "GymTrack Osorno Centro", direccion: "Av. Juan Mackenna 1050, Osorno", estado: "Abierto", imagen: gymImg },
  { id: "portales", nombre: "GymTrack Osorno Portales", direccion: "Calle Portales 540, Osorno", estado: "Abierto", imagen: gymPortalesImg },
];

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedSede, setSelectedSede] = useState(null);

  const [form, setForm] = useState({
    nombre: "", rut: "", email: "", password: "", confirmPassword: "",
    fecha_nacimiento: "", direccion: "", codigo_postal: "", objetivo: "", genero: "", id_plan: null,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estados para OTP
  const [userId, setUserId] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    axios.get("auth/plans").then(r => setPlans(r.data.body || [])).catch(() => {});
  }, []);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  // ── VALIDACIÓN PASO 1 ──
  const validateStep1 = () => {
    const e = {};
    if (!selectedSede) e.sede = "Debes seleccionar una sede";
    if (!form.codigo_postal.trim()) e.codigo_postal = "El código postal es obligatorio";
    else if (!OSORNO_CODES.includes(form.codigo_postal.trim())) e.codigo_postal = "Código postal fuera de la zona de Osorno";
    setErrors(prev => ({ ...prev, ...e, ...(e.codigo_postal ? {} : { codigo_postal: null }), ...(e.sede ? {} : { sede: null }) }));
    return !e.sede && !e.codigo_postal;
  };

  // ── VALIDACIONES PASO 2 ──
  const validateStep2 = () => {
    const e = {};
    // Re-validar paso 1 silenciosamente
    if (!selectedSede) e.sede = "Debes seleccionar una sede";
    if (!form.codigo_postal.trim()) e.codigo_postal = "El código postal es obligatorio";
    else if (!OSORNO_CODES.includes(form.codigo_postal.trim())) e.codigo_postal = "Código postal fuera de la zona de Osorno";
    // Nombre
    const words = form.nombre.trim().split(/\s+/);
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    else if (!/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(form.nombre)) e.nombre = "Solo letras y espacios";
    else if (words.length < 2) e.nombre = "Ingresa nombre y apellido";
    else if (words.length > 4) e.nombre = "Máximo 4 palabras";
    else if (words.some(w => w.length < 2)) e.nombre = "Cada palabra debe tener al menos 2 letras";
    // RUT
    if (!form.rut) e.rut = "El RUT es obligatorio";
    else if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(form.rut)) e.rut = "Formato: XX.XXX.XXX-X";
    else { const clean = form.rut.replace(/[.\-]/g,""); const body = clean.slice(0,-1); if(/^(\d)\1+$/.test(body)) e.rut = "RUT con patrón repetitivo"; else if(!validateRutDV(form.rut)) e.rut = "Dígito verificador incorrecto"; }
    // Email
    if (!form.email) e.email = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Correo inválido";
    else if (form.email.split("@")[0].length < 2) e.email = "Usuario de correo muy corto";
    // Fecha y coherencia con RUT
    if (!form.fecha_nacimiento) e.fecha_nacimiento = "La fecha es obligatoria";
    else { 
      const age = calcAge(form.fecha_nacimiento); 
      if (age < 12) e.fecha_nacimiento = "Debes tener al menos 12 años"; 
      else if (age > 120) e.fecha_nacimiento = "Fecha no realista"; 
      else if (form.rut && !e.rut) {
        const rutNum = parseInt(form.rut.replace(/[.\-kK]/g, "").slice(0, -1) || "0", 10);
        const birthYear = new Date(form.fecha_nacimiento).getFullYear();
        if (rutNum > 0 && rutNum < 5000000 && birthYear > 1975) {
          e.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
        } else if (rutNum > 0 && rutNum < 10000000 && birthYear > 1995) {
          e.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
        } else if (rutNum > 0 && rutNum < 15000000 && birthYear > 2005) {
          e.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
        } else if (rutNum > 0 && rutNum < 20000000 && birthYear > 2015) {
          e.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
        }
      }
    }
    // Dirección
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria";
    else if (form.direccion.trim().length < 5) e.direccion = "Dirección muy corta";
    // Código Postal (ya validado arriba)
    // Password
    if (!form.password) e.password = "La contraseña es obligatoria";
    else if (!passwordReqs.every(r => r.test(form.password))) e.password = "La contraseña no cumple los requisitos";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) { toast.error("Corrige los campos marcados"); return; }
    if (step === 2 && !validateStep2()) { toast.error("Corrige los campos marcados"); return; }
    setStep(s => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep2()) { setStep(2); toast.error("Corrige los campos marcados"); return; }
    setLoading(true);
    try {
      const payload = { nombre: form.nombre.trim(), rut: form.rut, email: form.email.trim().toLowerCase(), password: form.password, fecha_nacimiento: form.fecha_nacimiento, direccion: form.direccion.trim(), codigo_postal: form.codigo_postal.trim(), objetivo: form.objetivo || null, genero: form.genero || null, id_plan: form.id_plan || null, sede: selectedSede || null };
      const res = await axios.post("auth/self-register", payload);
      toast.success(res.data.body?.message || "¡Registro exitoso! Revisa tu correo.");
      setUserId(res.data.body?.userId);
      setRegisteredEmail(res.data.body?.email || form.email.trim().toLowerCase());
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.body;
      const status = err.response?.status;
      const msgStr = typeof msg === "string" ? msg : msg?.message || "";
      // Si el backend devuelve conflicto (409), mostrar error en el campo correcto y volver al paso 2
      if (status === 409) {
        if (msgStr.toLowerCase().includes("correo") || msgStr.toLowerCase().includes("email")) {
          setErrors(e => ({ ...e, email: msgStr }));
          setStep(2);
        } else if (msgStr.toLowerCase().includes("rut")) {
          setErrors(e => ({ ...e, rut: msgStr }));
          setStep(2);
        }
        toast.error(msgStr);
      } else if (Array.isArray(msg)) {
        msg.forEach(m => toast.error(m));
      } else {
        toast.error(msgStr || "Error en el registro");
      }
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) { toast.error("El código debe tener 6 dígitos"); return; }
    setLoading(true);
    try {
      const res = await axios.post("auth/verify-registration-code", { userId, code: otpCode });
      toast.success(res.data.body?.message || "Cuenta activada exitosamente");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.body || "Código incorrecto");
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const payload = { userId };
      if (isEditingEmail && newEmail && newEmail !== registeredEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail)) { toast.error("Correo inválido"); setLoading(false); return; }
        payload.newEmail = newEmail;
      }
      const res = await axios.post("auth/resend-registration-code", payload);
      toast.success(res.data.body?.message || "Código reenviado");
      if (res.data.body?.email) setRegisteredEmail(res.data.body.email);
      setIsEditingEmail(false);
      setNewEmail("");
    } catch (err) {
      toast.error(err.response?.data?.body || "Error al reenviar");
    } finally { setLoading(false); }
  };

  const selectedPlan = plans.find(p => p.id === form.id_plan);

  // ── STEP INDICATORS ──
  const steps = [
    { num: 1, label: "Tu Gimnasio", icon: <MapPin size={14}/> },
    { num: 2, label: "Tus Datos", icon: <User size={14}/> },
    { num: 3, label: "Membresía", icon: <CreditCard size={14}/> },
    { num: 4, label: "Activar Cuenta", icon: <CheckCircle2 size={14}/> },
  ];

  const fieldStyle = (name) => ({ width:"100%", background:"rgba(9,9,11,0.6)", border:`1px solid ${errors[name] ? "#ef4444" : "rgba(63,63,70,0.5)"}`, borderRadius:"10px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none", fontFamily:"'Inter',sans-serif", boxSizing:"border-box", transition:"border-color 0.2s" });
  const labelStyle = { display:"block", fontSize:"11px", fontWeight:"700", color:"#71717a", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"5px" };
  const errStyle = { fontSize:"11px", color:"#f87171", marginTop:"3px" };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .reg-fade { animation: fadeIn 0.4s ease-out; }
        .reg-input:focus { border-color: #f97316 !important; box-shadow: 0 0 0 2px rgba(249,115,22,0.12) !important; }
        .reg-input::placeholder { color: #3f3f46; }
        .reg-input option { background-color: #18181b; color: #fff; }
        .plan-card { transition: all 0.25s ease; cursor: pointer; }
        .plan-card:hover { border-color: rgba(249,115,22,0.4) !important; transform: translateY(-2px); }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", background:"#000", fontFamily:"'Inter',sans-serif", color:"#fff" }}>
        {/* LEFT PANEL — Image */}
        <div style={{ width:"45%", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0a0a" }} className="reg-left">
          <img src={gymImg} alt="GymTrack Osorno" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.7 }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, transparent 60%, #000)" }} />
          <div style={{ position:"absolute", bottom:"60px", left:"40px", zIndex:2 }}>
            <h2 style={{ fontSize:"36px", fontWeight:"800", lineHeight:1.1, margin:0, textTransform:"uppercase" }}>
              {step === 1 ? "ELIGE TU\nGIMNASIO" : step === 2 ? "TUS\nDATOS" : step === 3 ? "ELIGE TU\nMEMBRESÍA" : "VERIFICA TU\nCORREO"}
            </h2>
          </div>
          {/* Back to login */}
          <Link to="/" style={{ position:"absolute", top:"24px", left:"24px", display:"flex", alignItems:"center", gap:"6px", color:"#a1a1aa", textDecoration:"none", fontSize:"13px", zIndex:3 }}>
            <ArrowLeft size={16}/> Volver al Login
          </Link>
        </div>

        {/* RIGHT PANEL — Form */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", overflowY:"auto" }}>
          {/* Step indicators */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"24px 32px 0", borderBottom:"1px solid rgba(63,63,70,0.2)", paddingBottom:"16px" }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:"600", background: step >= s.num ? "rgba(249,115,22,0.12)" : "transparent", color: step >= s.num ? "#f97316" : "#52525b", border: step === s.num ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent" }}>
                  <span style={{ fontSize:"10px", fontWeight:"700" }}>0{s.num}</span> {s.label}
                </div>
                {i < steps.length - 1 && <div style={{ width:"32px", height:"1px", background: step > s.num ? "#f97316" : "rgba(63,63,70,0.4)" }} />}
              </div>
            ))}
            <button onClick={() => navigate("/")} style={{ marginLeft:"auto", background:"none", border:"none", color:"#52525b", cursor:"pointer", padding:"4px" }}><X size={20}/></button>
          </div>

          {/* FORM CONTENT */}
          <div style={{ flex:1, padding:"32px 48px", maxWidth:"560px", width:"100%", margin:"0 auto" }} className="reg-fade" key={step}>
            <h3 style={{ fontSize:"22px", fontWeight:"700", margin:"0 0 4px 0" }}>
              {step === 1 ? "3 pasos y estás dentro." : step === 2 ? "Información Personal" : step === 3 ? "Elige tu Membresía" : "Activa tu cuenta"}
            </h3>
            <p style={{ fontSize:"13px", color:"#71717a", margin:"0 0 28px 0" }}>
              {step === 1 ? "Selecciona tu sede más cercana para comenzar." : step === 2 ? "Completa tus datos para crear tu cuenta." : step === 3 ? "Selecciona un plan o continúa sin uno." : "Ingresa el código que hemos enviado a tu correo."}
            </p>

            {/* ═══ STEP 1: Tu Gimnasio ═══ */}
            {step === 1 && (
              <div>
                <label style={{...labelStyle, marginBottom:"10px"}}>Selecciona tu sede</label>
                {errors.sede && <p style={{...errStyle, marginBottom:"8px"}}>{errors.sede}</p>}
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {SEDES.map(s => (
                    <div key={s.id} className="plan-card" onClick={() => { setSelectedSede(s.id); setErrors(e => ({...e, sede: null})); }}
                      style={{ border: selectedSede === s.id ? "2px solid #f97316" : "1px solid rgba(63,63,70,0.4)", borderRadius:"14px", padding:"16px", display:"flex", alignItems:"center", gap:"16px", background: selectedSede === s.id ? "rgba(249,115,22,0.04)" : "rgba(24,24,27,0.4)", cursor:"pointer" }}>
                      <img src={s.imagen} alt={s.nombre} style={{ width:"100px", height:"70px", borderRadius:"10px", objectFit:"cover" }} />
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:"11px", color:"#71717a", margin:"0 0 2px 0" }}>Tu Club</p>
                        <p style={{ fontSize:"16px", fontWeight:"700", margin:"0 0 2px 0" }}>{s.nombre}</p>
                        <p style={{ fontSize:"12px", color:"#a1a1aa", margin:0 }}>📍 {s.direccion}</p>
                      </div>
                      <div style={{ padding:"4px 10px", borderRadius:"6px", background:"rgba(34,197,94,0.1)", color:"#22c55e", fontSize:"11px", fontWeight:"600" }}>{s.estado}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:"20px" }}>
                  <label style={labelStyle}>Código Postal de tu zona</label>
                  <input className="reg-input" style={fieldStyle("codigo_postal")} placeholder="Ej: 5290000" value={form.codigo_postal} onChange={e => set("codigo_postal", e.target.value.replace(/\D/g,"").slice(0,7))} />
                  {errors.codigo_postal && <p style={errStyle}>{errors.codigo_postal}</p>}
                  <p style={{ fontSize:"11px", color:"#52525b", marginTop:"4px" }}>Ingresa el código postal de Osorno para verificar tu zona.</p>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Datos Personales ═══ */}
            {step === 2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {/* Banner cross-step: errores del paso anterior */}
                {(errors.codigo_postal || errors.sede) && (
                  <div style={{ padding:"10px 14px", borderRadius:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"16px" }}>⚠️</span>
                    <div>
                      <p style={{ fontSize:"12px", fontWeight:"700", color:"#f87171", margin:"0 0 2px 0" }}>Hay errores en el paso anterior</p>
                      {errors.sede && <p style={{ fontSize:"11px", color:"#fca5a5", margin:0 }}>{errors.sede}</p>}
                      {errors.codigo_postal && <p style={{ fontSize:"11px", color:"#fca5a5", margin:0 }}>Código postal: {errors.codigo_postal}</p>}
                      <button onClick={() => setStep(1)} style={{ fontSize:"11px", color:"#f97316", background:"none", border:"none", cursor:"pointer", padding:0, marginTop:"4px", textDecoration:"underline", fontWeight:"600" }}>Volver al Paso 1 para corregir →</button>
                    </div>
                  </div>
                )}
                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Nombre Completo</label>
                  <input className="reg-input" style={fieldStyle("nombre")} placeholder="Nombre Apellido" value={form.nombre} onChange={e => set("nombre", e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ""))} />
                  {errors.nombre && <p style={errStyle}>{errors.nombre}</p>}
                </div>
                {/* RUT */}
                <div>
                  <label style={labelStyle}>RUT</label>
                  <input className="reg-input" style={fieldStyle("rut")} placeholder="12.345.678-9" value={form.rut} onChange={e => set("rut", formatRut(e.target.value))} maxLength={12} />
                  {errors.rut && <p style={errStyle}>{errors.rut}</p>}
                </div>
                {/* Email */}
                <div>
                  <label style={labelStyle}>Correo Electrónico</label>
                  <input className="reg-input" type="email" style={fieldStyle("email")} placeholder="correo@ejemplo.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  {errors.email && <p style={errStyle}>{errors.email}</p>}
                </div>
                {/* Fecha + Género */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <label style={labelStyle}>Fecha de Nacimiento</label>
                    <input className="reg-input" type="date" style={fieldStyle("fecha_nacimiento")} value={form.fecha_nacimiento} onChange={e => set("fecha_nacimiento", e.target.value)} max={new Date().toISOString().split("T")[0]} />
                    {errors.fecha_nacimiento && <p style={errStyle}>{errors.fecha_nacimiento}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Género</label>
                    <select className="reg-input" style={{...fieldStyle("genero"), color: form.genero ? "#fff" : "#3f3f46"}} value={form.genero} onChange={e => set("genero", e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>
                </div>
                {/* Dirección */}
                <div>
                  <label style={labelStyle}>Dirección</label>
                  <input className="reg-input" style={fieldStyle("direccion")} placeholder="Av. Ejemplo 123, Osorno" value={form.direccion} onChange={e => set("direccion", e.target.value)} />
                  {errors.direccion && <p style={errStyle}>{errors.direccion}</p>}
                </div>
                {/* Objetivo */}
                <div>
                  <label style={labelStyle}>Meta Fitness (Opcional)</label>
                  <select className="reg-input" style={{...fieldStyle("objetivo"), color: form.objetivo ? "#fff" : "#3f3f46"}} value={form.objetivo} onChange={e => set("objetivo", e.target.value)}>
                    <option value="">Selecciona tu objetivo</option>
                    {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                {/* Contraseña */}
                <div>
                  <label style={labelStyle}>Contraseña</label>
                  <div style={{ position:"relative" }}>
                    <input className="reg-input" type={showPass?"text":"password"} style={{...fieldStyle("password"), paddingRight:"44px"}} placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#52525b", cursor:"pointer" }}>
                      {showPass ? <HiEyeOff size={18}/> : <HiEye size={18}/>}
                    </button>
                  </div>
                  {errors.password && <p style={errStyle}>{errors.password}</p>}
                  <div style={{ marginTop:"8px", display:"flex", flexWrap:"wrap", gap:"4px 16px" }}>
                    {passwordReqs.map(r => {
                      const ok = r.test(form.password);
                      return <div key={r.id} style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color: ok ? "#22c55e" : "#52525b" }}>
                        {ok ? <CheckCircle2 size={12}/> : <Circle size={12}/>} {r.text}
                      </div>;
                    })}
                  </div>
                </div>
                {/* Confirmar */}
                <div>
                  <label style={labelStyle}>Confirmar Contraseña</label>
                  <div style={{ position:"relative" }}>
                    <input className="reg-input" type={showConfirm?"text":"password"} style={{...fieldStyle("confirmPassword"), paddingRight:"44px"}} placeholder="••••••••" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#52525b", cursor:"pointer" }}>
                      {showConfirm ? <HiEyeOff size={18}/> : <HiEye size={18}/>}
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Membresía ═══ */}
            {step === 3 && (
              <div>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {plans.map(p => (
                    <div key={p.id} className="plan-card" onClick={() => set("id_plan", form.id_plan === p.id ? null : p.id)}
                      style={{ display:"flex", alignItems:"center", gap:"14px", padding:"16px", borderRadius:"12px", border: form.id_plan === p.id ? "2px solid #f97316" : "1px solid rgba(63,63,70,0.4)", background: form.id_plan === p.id ? "rgba(249,115,22,0.06)" : "rgba(24,24,27,0.4)" }}>
                      <img src={gymImg} alt={p.nombre} style={{ width:"80px", height:"55px", borderRadius:"8px", objectFit:"cover" }} />
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:"15px", fontWeight:"700", margin:"0 0 2px 0" }}>{p.nombre}</p>
                        <p style={{ fontSize:"12px", color:"#a1a1aa", margin:0 }}>{p.descripcion || `Acceso a GymTrack Osorno Centro`}</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:"18px", fontWeight:"700", color:"#fff", margin:"0" }}>${p.precio?.toLocaleString("es-CL")}</p>
                        <p style={{ fontSize:"11px", color:"#71717a", margin:0 }}>{p.duracion_meses === 1 ? "Mensual" : `${p.duracion_meses} meses`}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {form.id_plan && selectedPlan && (
                  <div style={{ marginTop:"20px", padding:"14px", borderRadius:"10px", background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.2)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"#a1a1aa", marginBottom:"6px" }}>
                      <span>Plan seleccionado</span><span>{selectedPlan.nombre}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"15px", fontWeight:"700", color:"#f97316" }}>
                      <span>Total</span><span>${selectedPlan.precio?.toLocaleString("es-CL")} CLP</span>
                    </div>
                  </div>
                )}

                {!form.id_plan && (
                  <p style={{ fontSize:"12px", color:"#52525b", marginTop:"16px", textAlign:"center" }}>
                    💡 Puedes registrarte sin plan y elegir uno después.
                  </p>
                )}
              </div>
            )}

            {/* ═══ STEP 4: OTP Verification ═══ */}
            {step === 4 && (
              <div style={{ display:"flex", flexDirection:"column", gap:"14px", alignItems:"flex-start" }}>
                <div style={{ textAlign:"left", marginBottom:"10px" }}>
                  <p style={{ fontSize:"14px", color:"#a1a1aa", margin:"0 0 8px 0" }}>
                    Enviamos un código de 6 dígitos a:
                  </p>
                  
                  {isEditingEmail ? (
                    <div style={{ display:"flex", gap:"8px", justifyContent:"flex-start" }}>
                      <input className="reg-input" style={{...fieldStyle("email"), width:"220px", padding:"8px 12px"}} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Nuevo correo" />
                      <button onClick={handleResendOTP} disabled={loading} style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:"8px", padding:"0 12px", fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>
                        Guardar
                      </button>
                      <button onClick={() => setIsEditingEmail(false)} style={{ background:"none", color:"#a1a1aa", border:"1px solid #3f3f46", borderRadius:"8px", padding:"0 12px", fontSize:"12px", cursor:"pointer" }}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", justifyContent:"flex-start" }}>
                      <span style={{ fontSize:"16px", fontWeight:"700", color:"#fff" }}>{registeredEmail}</span>
                      <button onClick={() => { setIsEditingEmail(true); setNewEmail(registeredEmail); }} style={{ background:"none", border:"none", color:"#f97316", fontSize:"12px", textDecoration:"underline", cursor:"pointer" }}>
                        Editar
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ width: "100%", maxWidth: "300px" }}>
                  <input
                    className="reg-input"
                    style={{...fieldStyle("otpCode"), fontSize:"24px", letterSpacing:"8px", textAlign:"left", padding:"16px"}}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>

                <div style={{ display:"flex", gap:"12px", marginTop:"16px" }}>
                  <button onClick={handleResendOTP} disabled={loading || isEditingEmail} style={{ background:"none", border:"1px solid rgba(249,115,22,0.3)", borderRadius:"10px", padding:"12px 24px", color:"#f97316", fontSize:"13px", fontWeight:"600", cursor: loading ? "not-allowed" : "pointer" }}>
                    Reenviar Código
                  </button>
                  <button onClick={handleVerifyOTP} disabled={loading || otpCode.length !== 6} style={{ background: (loading || otpCode.length !== 6) ? "#52525b" : "linear-gradient(135deg,#ea580c,#f97316)", border:"none", borderRadius:"10px", padding:"12px 24px", color:"#fff", fontSize:"13px", fontWeight:"700", cursor: (loading || otpCode.length !== 6) ? "not-allowed" : "pointer" }}>
                    {loading ? "Verificando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS */}
          <div style={{ padding:"16px 48px 24px", borderTop:"1px solid rgba(63,63,70,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center", maxWidth:"560px", width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
            {step > 1 && step < 4 ? (
              <button onClick={prevStep} style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"1px solid rgba(63,63,70,0.4)", borderRadius:"10px", padding:"10px 20px", color:"#a1a1aa", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                <ArrowLeft size={15}/> Atrás
              </button>
            ) : <div/>}

            {step < 3 ? (
              <button onClick={nextStep} style={{ display:"flex", alignItems:"center", gap:"6px", background:"linear-gradient(135deg,#ea580c,#f97316)", border:"none", borderRadius:"10px", padding:"10px 24px", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", boxShadow:"0 4px 12px rgba(249,115,22,0.25)", fontFamily:"'Inter',sans-serif" }}>
                Siguiente <ArrowRight size={15}/>
              </button>
            ) : step === 3 ? (
              <button onClick={handleSubmit} disabled={loading} style={{ display:"flex", alignItems:"center", gap:"6px", background: loading ? "#52525b" : "linear-gradient(135deg,#ea580c,#f97316)", border:"none", borderRadius:"10px", padding:"12px 28px", color:"#fff", fontSize:"14px", fontWeight:"700", cursor: loading ? "not-allowed" : "pointer", boxShadow:"0 4px 12px rgba(249,115,22,0.25)", fontFamily:"'Inter',sans-serif" }}>
                {loading ? "Registrando..." : "Completar Registro"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
