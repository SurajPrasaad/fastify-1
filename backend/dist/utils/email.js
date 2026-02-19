import nodemailer from 'nodemailer';
// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || '953b2558175f07', // Replace with your SMTP user
        pass: process.env.SMTP_PASS || '3119264b364004', // Replace with your SMTP password
    },
});
export async function sendResetPasswordEmail(email, token) {
    const resetUrl = `http://localhost:8080/auth/reset-password?token=${token}`;
    const mailOptions = {
        from: '"Fastify App" <[EMAIL_ADDRESS]>',
        to: email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Your token is: ${token}\n\nAlternatively, click here to reset: ${resetUrl}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Please use the following token to reset your password:</p>
        <div style="background: #f4f4f4; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; border-radius: 5px;">
          ${token}
        </div>
        <p>Or click the button below to reset it directly:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
      </div>
    `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return true;
    }
    catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
export async function sendVerificationEmail(email, token) {
    const verifyUrl = `http://localhost:8080/auth/verify-email?token=${token}`; // Update URL as needed
    const mailOptions = {
        from: '"Fastify App" <noreply@fastifyapp.com>',
        to: email,
        subject: "Verify your email address",
        text: `Please verify your email address by clicking the following link: ${verifyUrl}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering! Please verify your email address to activate your account.</p>
        <p>Click the button below to verify:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you did not create an account, please ignore this email.</p>
      </div>
    `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent: %s to %s", info.messageId, email);
        return true;
    }
    catch (error) {
        console.error("Error sending verification email:", error);
        return false;
    }
}
//# sourceMappingURL=email.js.map