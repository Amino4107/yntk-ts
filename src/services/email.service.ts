import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import env from '../config/env';
import { formatDuration } from '../utils/time-utils';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
});

const loadEmailTemplate = async (templateName: string, variables: Record<string, string>): Promise<string> => {
  // In production (bundled by tsup), __dirname is 'dist/' and views are at 'dist/views/'
  // In development (tsx watch), __dirname is 'src/services/' and views are at 'src/views/'
  // Use process.cwd() as base and determine views path based on whether we're in dist or src
  const viewsPath = path.join(process.cwd(), 'dist', 'views', 'emails', `${templateName}.html`);
  const devViewsPath = path.join(process.cwd(), 'src', 'views', 'emails', `${templateName}.html`);

  // Try production path first, fall back to development path
  let templatePath: string;
  try {
    await fs.access(viewsPath);
    templatePath = viewsPath;
  } catch {
    templatePath = devViewsPath;
  }

  let template = await fs.readFile(templatePath, 'utf-8');

  // Replace all variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return template;
};

const sendResetPasswordEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

  const html = await loadEmailTemplate('reset-password', { resetUrl });

  const mailOptions = {
    from: env.emailFrom,
    to: email,
    subject: 'Reset Password Request',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({
      action: 'email_sent',
      type: 'reset_password',
      email: email,
    }, 'Reset password email sent successfully');
  } catch (error) {
    logger.error({
      action: 'email_sending_failed',
      type: 'reset_password',
      email: email,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Failed to send reset password email');
    throw error;
  }
};

const sendVerificationEmail = async (email: string, verificationToken: string) => {
  const verificationUrl = `${env.frontendUrl}/verify-email?token=${verificationToken}`;
  const expiryTime = formatDuration(env.emailVerificationTokenExpiry);

  const html = await loadEmailTemplate('verify-email', {
    verificationUrl,
    expiryTime,
  });

  const mailOptions = {
    from: env.emailFrom,
    to: email,
    subject: 'Verify Your Email Address',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({
      action: 'email_sent',
      type: 'verify_email',
      email: email,
    }, 'Verification email sent successfully');
  } catch (error) {
    logger.error({
      action: 'email_sending_failed',
      type: 'verify_email',
      email: email,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Failed to send verification email');
    throw error;
  }
};

const emailService = {
  sendResetPasswordEmail,
  sendVerificationEmail,
};

export default emailService;
