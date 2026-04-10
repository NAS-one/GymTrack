import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  let token = null;

  // 1. Buscamos el token en el Header: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } 
  // 2. Si no está en el header, lo buscamos en la URL (Query Param: ?token=...)
  // Esto es vital para Server-Sent Events (EventSource) que no soportan Headers
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. Si definitivamente no hay token, bloqueamos el acceso
  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
  }

  try {
    // 4. Verificamos si el token es válido y no ha expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Guardamos los datos del usuario en la petición para usarlos luego
    req.user = decoded;

    // 6. Dejamos pasar a la siguiente función (el controlador)
    next();

  } catch (error) {
    console.error("Error en validación de token:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};