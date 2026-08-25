const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'matias89ts@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'tu-app-password-aqui'
    }
});

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, email, whatsapp, dateStr, timeStr } = req.body || {};

    if (!name || !email || !dateStr || !timeStr) {
        return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    try {
        const clientHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1f2937, #111827); padding: 30px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">¡Reserva Confirmada!</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="font-size: 16px;">Tu sesión de <strong>Asesoría Estratégica & Tecnológica</strong> ha sido reservada con éxito. Estos son los detalles de tu reunión online:</p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
                        <p style="margin: 0 0 10px 0;">📅 <strong>Fecha:</strong> ${dateStr}</p>
                        <p style="margin: 0;">⏰ <strong>Hora:</strong> ${timeStr}</p>
                    </div>
                    
                    <p style="font-size: 16px;">Para asegurar tu cupo de forma definitiva, por favor realiza el pago a través del siguiente enlace.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: #02b291; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pagar Asesoría Ahora</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">Nos vemos pronto,<br>El equipo de Kalupa Digital.</p>
                </div>
            </div>
        `;

        const adminHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Nueva Reserva de Asesoría 🚀</h2>
                <p>Has recibido una nueva solicitud de reserva desde el sitio web:</p>
                <ul style="background: #f9fafb; padding: 20px; border-radius: 6px;">
                    <li><strong>Cliente:</strong> ${name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>WhatsApp:</strong> ${whatsapp || 'No proporcionado'}</li>
                    <li><strong>Fecha:</strong> ${dateStr}</li>
                    <li><strong>Hora:</strong> ${timeStr}</li>
                </ul>
            </div>
        `;

        if (process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'tu-app-password-aqui') {
            await transporter.sendMail({
                from: '"Kalupa Digital" <matias89ts@gmail.com>',
                to: email,
                subject: 'Confirmación de Asesoría Estratégica - Kalupa',
                html: clientHtml
            });

            await transporter.sendMail({
                from: '"Kalupa Digital" <matias89ts@gmail.com>',
                to: 'matias89ts@gmail.com',
                subject: `Nueva Reserva: ${name}`,
                html: adminHtml
            });
        } else {
            console.log("Simulando envío de correos (falta EMAIL_PASSWORD en entorno real).");
        }

        return res.status(200).json({ success: true, message: 'Reserva completada con éxito' });

    } catch (error) {
        console.error('Error enviando correos:', error);
        return res.status(500).json({ error: 'Hubo un error procesando la reserva.' });
    }
};
