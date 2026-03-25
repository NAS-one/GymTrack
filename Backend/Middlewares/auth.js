// 1. Importamos la libreria jsonwebtoken
import jwt from "jsonwebtoken";

// 2. Verificamos que el token sea válido y no haya expirado
export const verifyToken = (req, res, next) => {
  // 2.1 El cliente envía el token en el Header: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  // 2.2 Si no hay token, devolvemos un error
  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado." });
  }

  // 2.3 Quitamos la palabra "Bearer " para quedarnos solo con el código
  const token = authHeader.split(" ")[1];

  try {
    // 2.4 Verificamos si el token es válido y no ha expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2.5 Guardamos los datos del usuario en la petición para usarlos luego
    req.user = decoded;

    // 2.6 Dejamos pasar a la siguiente función (el controlador)
    next();

  } catch (error) {
    // 2.7 Si hay un error, devolvemos un error
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
