import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP_USER or SMTP_PASS is not set in .env. Email will not be sent.');
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: 'Your FixTrack Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0b57d0; text-align: center;">FixTrack Password Reset</h2>
        <p>You requested a password reset for your FixTrack account. Please use the following One-Time Password (OTP) to reset your password:</p>
        <div style="background-color: #f0f4f8; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          FixTrack System - Do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};
