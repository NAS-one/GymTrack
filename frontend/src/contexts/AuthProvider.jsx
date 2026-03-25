// AuthProvider.jsx, el proveedor del contexto de autenticación.  
// 1. Importaciones
import { useState } from 'react';             // Hook para manejar estados
import { AuthContext } from './AuthContext'; // Importamos el contexto creado.

// 2. Funcion Padre que provee autenticación a toda la app.
export function AuthProvider({ children }) {

  // 2.1 ESTADO DEL USUARIO (Lazy Initialization)
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');        // Obtener datos del usuario desde LocalStorage (disco duro del navegador).
      return storedUser ? JSON.parse(storedUser) : null;     // Si existe, lo convertimos a Objeto JS. Si no, devolvemos null.
    } catch {
      return null;                                          // En caso de error (JSON mal formado), devolvemos null.
    }
  });

  // 2.2 ESTADO DE AUTENTICACIÓN (true/false) (Lazy Initialization)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');                    // Obtener el token desde LocalStorage
    return !!token;                                                // '!!' convierte el string en un booleano.
  });

  // 2.3 ESTADO DE CARGA 
  const [loading] = useState(false);                           // Estado de carga (inicialmente false)

  // 2.4 LOGIN, guarda datos en LocalStorage y actualiza estados.
  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData)); // Guardamos datos del usuario en LocalStorage
    localStorage.setItem('token', token);                  // Guardamos el token en LocalStorage

    setUser(userData);                                   // Actualizamos el estado del usuario
    setIsAuthenticated(true);                           // Actualizamos el estado de autenticación
  };

  // 2.5 LOGOUT
  const logout = () => {
    localStorage.removeItem('user');                // Removemos datos del usuario del LocalStorage
    localStorage.removeItem('token');              // Removemos el token del LocalStorage
    setUser(null);                                // Actualizamos el estado del usuario
    setIsAuthenticated(false);                   // Actualizamos el estado de autenticación
  };

  // 2.6 Proveemos el contexto a los componentes hijos
  // el valor 'value' contiene todo lo que queremos compartir 
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

