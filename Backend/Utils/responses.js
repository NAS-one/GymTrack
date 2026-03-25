// Respuesta de Éxito Genérica
export const success = (req, res, data = null, status = 200) => {
  res.status(status).send({
    error: false,
    status: status,
    body: data,
  });
};

// Respuesta de Error Genérica
export const error = (req, res, message = "Error Interno", status = 500) => {
  res.status(status).send({
    error: true,
    status: status,
    body: message,
  });
};
