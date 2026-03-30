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
