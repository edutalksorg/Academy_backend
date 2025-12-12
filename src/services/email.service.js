const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Email Service for sending notifications
 * Handles SMTP configuration and email sending
 */

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Send email notification to superadmin when instructor/TPO registers
 * @param {Object} user - User object with name, email, role, collegeId
 * @param {Object} college - College object (for TPO only)
 */
async function sendRegistrationNotificationToAdmin(user, college = null) {
  try {
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'megamart.dvst@gmail.com';

    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New ${user.role === 'instructor' ? 'Instructor' : 'TPO'} Registration</h2>
        <p>A new ${user.role} has registered and is pending approval.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">User Details</h3>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
          ${college ? `
            <p><strong>College Name:</strong> ${college.name}</p>
            <p><strong>College Code:</strong> ${college.collegeCode}</p>
          ` : ''}
          <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p style="color: #6c757d;">Please log in to the admin panel to review and approve this registration.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Academy Platform" <noreply@academy.com>',
      to: superadminEmail,
      subject: `New ${user.role === 'instructor' ? 'Instructor' : 'TPO'} Registration - Approval Required`,
      html: emailBody
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    logger.info(`Registration notification sent to admin for ${user.role}: ${user.email}`, { messageId: info.messageId });
    console.log('✅ Email sent successfully to superadmin!');
    console.log('   Message ID:', info.messageId);
    return true;
  } catch (error) {
    logger.error('Failed to send registration notification to admin', { error: error.message, user: user.email });
    console.error('❌ EMAIL FAILED!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   SMTP Config:', { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER });
    // Don't throw error - we don't want to block registration if email fails
    return false;
  }
}

/**
 * Send approval notification to instructor/TPO
 * @param {Object} user - User object with name, email, role
 */
async function sendApprovalNotificationToUser(user) {
  try {
    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Account Approved! 🎉</h2>
        <p>Dear ${user.name},</p>
        
        <p>Great news! Your ${user.role} account has been approved by the administrator.</p>
        
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #155724;">What's Next?</h3>
          <p>You can now log in to the Academy Platform and start using all the features available to ${user.role}s.</p>
          <p><strong>Your Login Email:</strong> ${user.email}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login Now
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">If you have any questions, please contact support.</p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 12px;">This is an automated message from the Academy Platform.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Academy Platform" <noreply@academy.com>',
      to: user.email,
      subject: 'Your Account Has Been Approved - Academy Platform',
      html: emailBody
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    logger.info(`Approval notification sent to ${user.role}: ${user.email}`, { messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send approval notification to user', { error: error.message, user: user.email });
    // Don't throw error - we don't want to block approval if email fails
    return false;
  }
}

module.exports = {
  sendRegistrationNotificationToAdmin,
  sendApprovalNotificationToUser
};
