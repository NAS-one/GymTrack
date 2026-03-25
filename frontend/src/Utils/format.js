// src/utils/format.js

export const formatMoney = (amount) => {
  // 1. Si no hay dato, devolvemos $0 (Evita errores de pantalla blanca)
  if (amount === undefined || amount === null) return "$0";

  // 2. Aseguramos que sea número
  const number = Number(amount);

  // 3. Formato Chileno (Puntos para miles, sin decimales)
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};
