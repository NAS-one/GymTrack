import nodemailer from 'nodemailer';

// Create a transporter using standard SMTP transport
// We configure it to use environment variables for flexibility.
export const transporter = nodemailer.createTransport({
    service: "gmail", // You can change this to your preferred service (Outlook, SendGrid, etc.)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Para Gmail: Necesitas una "Contraseña de aplicación" (App Password)
    },
});

export const sendActivationEmail = async (userEmail, userName, activationLink) => {
    const mailOptions = {
        from: `"GymTrack" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Bienvenido a GymTrack - Activa tu cuenta",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">¡Bienvenido a GymTrack, ${userName}!</h2>
        <p>Tu cuenta ha sido creada exitosamente por el gimnasio. Para comenzar a usar la plataforma, necesitas activar tu cuenta y configurar tu contraseña privada.</p>
        <p>Haz clic en el siguiente enlace para activar tu cuenta. Este enlace expirará en 24 horas.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Activar mi cuenta y crear contraseña
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666;">Si no solicitaste esta cuenta, simplemente ignora este correo.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de activación enviado a:", userEmail, "ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error al enviar el correo de activación:", error);
        return false;
    }
};

// Enviar código 2FA
export const send2FAEmail = async (userEmail, code, dispositivo, location) => {
    const mailOptions = {
        from: `"GymTrack Seguridad" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Código de Verificación - Nuevo Dispositivo Detectado",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0e; color: #ffffff; border-radius: 10px; border: 1px solid #333;">
                <h2 style="color: #f97316; text-align: center; margin-bottom: 5px;">GymTrack Security</h2>
                <p style="text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 0;">Verificación en 2 Pasos</p>
                
                <p style="margin-top: 30px;">Hemos detectado un intento de inicio de sesión desde un dispositivo no reconocido:</p>
                
                <div style="background-color: #18181b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #27272a;">
                    <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Dispositivo:</strong> ${dispositivo}</p>
                    <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Ubicación / IP:</strong> ${location}</p>
                </div>
                
                <p>Para autorizar este acceso, ingresa el siguiente código de 6 dígitos en la pantalla de login:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; letter-spacing: 12px; background-color: #f97316; color: #ffffff; padding: 15px 20px; border-radius: 10px; font-weight: bold; font-family: monospace;">
                        ${code}
                    </span>
                </div>
                
                <p style="color: #ef4444; font-size: 12px; text-align: center; font-weight: bold;">⚠️ Este código expirará en 5 minutos.</p>
                
                <hr style="border-color: #27272a; margin: 30px 0;" />
                
                <p style="font-size: 11px; color: #71717a; text-align: center;">
                    Si no intentaste iniciar sesión, alguien tiene tu contraseña. Por favor, ingresa a GymTrack desde un dispositivo seguro y cambia tu clave inmediatamente.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo 2FA enviado a:", userEmail, "ID:", info.messageId);
        return true;
    } catch (error) {
        console.log("=== ERROR REAL DE GOOGLE/NODEMAILER ===");
        console.error(error); // 🌟 ESTO NOS DIRÁ EXACTAMENTE QUÉ PASA
        console.log("=======================================");
        throw new Error("No se pudo enviar el correo de verificación.");
    }
};

// Enviar correo de confirmación de auto-registro
export const sendSelfRegistrationEmail = async (userEmail, userName, activationLink, planInfo = null) => {
    const planSection = planInfo ? `
        <div style="background-color: #18181b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #27272a;">
            <p style="margin: 0 0 8px 0; color: #f97316; font-weight: bold; font-size: 14px;">📋 Plan Seleccionado</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Plan:</strong> ${planInfo.nombre}</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Precio:</strong> $${planInfo.precio?.toLocaleString('es-CL')} CLP</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Duración:</strong> ${planInfo.duracion_meses} ${planInfo.duracion_meses === 1 ? 'mes' : 'meses'}</p>
            <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">⏳ Tu membresía se activará una vez confirmes tu cuenta.</p>
        </div>
    ` : `
        <div style="background-color: #18181b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #27272a;">
            <p style="margin: 0; color: #a1a1aa; font-size: 13px;">💡 Aún no has seleccionado un plan. Puedes elegir uno después de activar tu cuenta o directamente en la recepción del gimnasio.</p>
        </div>
    `;

    const mailOptions = {
        from: `"GymTrack" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "¡Bienvenido a GymTrack! Confirma tu registro",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0e; color: #ffffff; border-radius: 10px; border: 1px solid #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f97316; margin-bottom: 5px; font-size: 28px;">GymTrack</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin-top: 0;">Fitness & Wellness</p>
                </div>
                
                <h2 style="color: #ffffff; text-align: center; margin-bottom: 5px;">¡Hola, ${userName}!</h2>
                <p style="text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 5px;">Tu registro ha sido recibido exitosamente.</p>
                
                <p style="margin-top: 25px; color: #d4d4d8;">Para completar tu registro y comenzar a usar GymTrack, confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${activationLink}" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Confirmar mi cuenta
                    </a>
                </div>

                ${planSection}
                
                <p style="color: #ef4444; font-size: 12px; text-align: center; font-weight: bold;">⚠️ Este enlace expirará en 24 horas.</p>
                
                <hr style="border-color: #27272a; margin: 30px 0;" />

                <div style="text-align: center;">
                    <p style="font-size: 13px; color: #a1a1aa;">📍 GymTrack Fitness — Osorno Centro</p>
                    <p style="font-size: 11px; color: #71717a;">Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de registro enviado a:", userEmail, "ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error al enviar correo de registro:", error);
        return false;
    }
};

export const sendRegistrationCodeEmail = async (userEmail, userName, code, planInfo = null) => {
    const planSection = planInfo ? `
        <div style="background-color: #18181b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #27272a;">
            <p style="margin: 0 0 8px 0; color: #f97316; font-weight: bold; font-size: 14px;">📋 Plan Seleccionado</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Plan:</strong> ${planInfo.nombre}</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Precio:</strong> $${planInfo.precio?.toLocaleString('es-CL')} CLP</p>
            <p style="margin: 5px 0; color: #d4d4d8; font-size: 14px;"><strong>Duración:</strong> ${planInfo.duracion_meses} ${planInfo.duracion_meses === 1 ? 'mes' : 'meses'}</p>
            <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">⏳ Tu membresía se activará una vez confirmes tu cuenta.</p>
        </div>
    ` : `
        <div style="background-color: #18181b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #27272a;">
            <p style="margin: 0; color: #a1a1aa; font-size: 13px;">💡 Aún no has seleccionado un plan. Puedes elegir uno después de activar tu cuenta o directamente en la recepción del gimnasio.</p>
        </div>
    `;

    const mailOptions = {
        from: `"GymTrack" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "¡Bienvenido a GymTrack! Código de confirmación",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0e; color: #ffffff; border-radius: 10px; border: 1px solid #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f97316; margin-bottom: 5px; font-size: 28px;">GymTrack</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin-top: 0;">Fitness & Wellness</p>
                </div>
                
                <h2 style="color: #ffffff; text-align: center; margin-bottom: 5px;">¡Hola, ${userName}!</h2>
                <p style="text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 5px;">Tu registro ha sido recibido exitosamente.</p>
                
                <p style="margin-top: 25px; color: #d4d4d8;">Para completar tu registro y comenzar a usar GymTrack, ingresa el siguiente código de confirmación:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; letter-spacing: 12px; background-color: #f97316; color: #ffffff; padding: 15px 20px; border-radius: 10px; font-weight: bold; font-family: monospace;">
                        ${code}
                    </span>
                </div>

                ${planSection}
                
                <p style="color: #ef4444; font-size: 12px; text-align: center; font-weight: bold;">⚠️ Este código expirará en 5 minutos.</p>
                
                <hr style="border-color: #27272a; margin: 30px 0;" />

                <div style="text-align: center;">
                    <p style="font-size: 13px; color: #a1a1aa;">📍 GymTrack Fitness — Osorno Centro</p>
                    <p style="font-size: 11px; color: #71717a;">Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de código de registro enviado a:", userEmail, "ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error al enviar correo de código de registro:", error);
        return false;
    }
};

// Enviar código de recuperación de contraseña
export const sendPasswordResetCodeEmail = async (userEmail, code) => {
    const mailOptions = {
        from: `"GymTrack Seguridad" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Código de Recuperación de Contraseña - GymTrack",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0e; color: #ffffff; border-radius: 10px; border: 1px solid #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f97316; margin-bottom: 5px; font-size: 28px;">GymTrack</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin-top: 0;">Recuperación de Contraseña</p>
                </div>
                
                <h2 style="color: #ffffff; text-align: center; margin-bottom: 5px;">Restablecer tu contraseña</h2>
                <p style="text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 5px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                
                <p style="margin-top: 25px; color: #d4d4d8;">Ingresa el siguiente código de 6 dígitos en la pantalla de recuperación:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; letter-spacing: 12px; background-color: #f97316; color: #ffffff; padding: 15px 20px; border-radius: 10px; font-weight: bold; font-family: monospace;">
                        ${code}
                    </span>
                </div>
                
                <p style="color: #ef4444; font-size: 12px; text-align: center; font-weight: bold;">⚠️ Este código expirará en 5 minutos.</p>
                
                <hr style="border-color: #27272a; margin: 30px 0;" />
                
                <div style="text-align: center;">
                    <p style="font-size: 13px; color: #a1a1aa;">📍 GymTrack Fitness — Osorno</p>
                    <p style="font-size: 11px; color: #71717a;">Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de recuperación enviado a:", userEmail, "ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error al enviar correo de recuperación:", error);
        return false;
    }
};
