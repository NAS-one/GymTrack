let clients = [];

export const sendNotification = (message) => {
    clients.forEach(client => {
        client.response.write(`data: ${JSON.stringify(message)}\n\n`);
    });
};

export const SSEManager = (req, res) => {
    // Configurar headers para Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Enviar headers al cliente inmediatamente

    // Generar ID único usando timestamp
    const clientId = Date.now();

    const newClient = {
        id: clientId,
        response: res
    };

    clients.push(newClient);

    console.log(`[SSE] Receptor Administrador Conectado: ${clientId}`);

    // Limpiar recursos cuando la conexión se cierra
    req.on('close', () => {
        console.log(`[SSE] Receptor Administrador Desconectado: ${clientId}`);
        clients = clients.filter(client => client.id !== clientId);
    });
};
