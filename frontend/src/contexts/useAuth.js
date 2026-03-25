//1.  Intercomunicador entre componentes y el contexto de autenticación.
import { useContext } from "react";
import { AuthContext } from "./AuthContext"; // Importamos el contexto desde el otro archivo

// Hook personalizado separado
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Buena práctica extra: Validar que se use dentro del Provider
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
};
