interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const baseStyles = {
  body: "margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #0a1628;",
  container: "background: linear-gradient(135deg, #0a1628 0%, #0f1e32 50%, #132841 100%); padding: 40px 20px;",
  card: "max-width: 600px; width: 100%; background-color: rgba(15, 30, 50, 0.95); border: 1px solid rgba(14, 165, 233, 0.15); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);",
  headerBar: "height: 4px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);",
  content: "padding: 40px 30px;",
  title: "margin: 0 0 20px 0; font-size: 28px; font-weight: 800; color: #0ea5e9; text-align: left;",
  text: "font-size: 16px; line-height: 1.6; color: #94b8d4; margin: 0 0 20px 0;",
  strongText: "color: #e4f0fb;",
  button: "display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);",
  infoBox: "background-color: rgba(14, 165, 233, 0.05); border-left: 3px solid #0ea5e9; border-radius: 8px; padding: 12px 16px; margin: 20px 0;",
  footer: "background-color: rgba(10, 22, 40, 0.7); padding: 20px 30px; border-top: 1px solid rgba(14, 165, 233, 0.15); text-align: center;",
  footerText: "margin: 0; font-size: 12px; color: #6b8aa8;"
};

const createEmailWrapper = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="${baseStyles.body}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${baseStyles.container}">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="${baseStyles.card}">
          <tr>
            <td style="${baseStyles.headerBar}"></td>
          </tr>
          <tr>
            <td style="${baseStyles.content}">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">
                © ${new Date().getFullYear()} 3D Print Queue. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const verificationEmailTemplate = (
  displayName: string,
  verificationUrl: string
): EmailTemplate => {
  const htmlContent = `
    <h1 style="${baseStyles.title}">
      Welcome to 3D Print Queue!
    </h1>
    
    <p style="${baseStyles.text}">
      Hi <strong style="${baseStyles.strongText}">${displayName}</strong>,
    </p>
    
    <p style="${baseStyles.text}">
      Thank you for registering! To complete your registration and start submitting print requests, please verify your email address by clicking the button below:
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${verificationUrl}" style="${baseStyles.button}">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 10px 0;">
      Or copy and paste this link into your browser:
    </p>
    
    <div style="${baseStyles.infoBox}">
      <a href="${verificationUrl}" style="color: #0ea5e9; text-decoration: none; font-size: 14px; word-break: break-all;">${verificationUrl}</a>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 0 0;">
      This verification link will expire in 24 hours. If you didn't create an account with 3D Print Queue, you can safely ignore this email.
    </p>
  `;

  const textContent = `
Welcome to 3D Print Queue!

Hi ${displayName},

Thank you for registering! To complete your registration and start submitting print requests, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account with 3D Print Queue, you can safely ignore this email.

© ${new Date().getFullYear()} 3D Print Queue. All rights reserved.
  `;

  return {
    subject: 'Verify Your Email - 3D Print Queue',
    html: createEmailWrapper('Verify Your Email - 3D Print Queue', htmlContent),
    text: textContent
  };
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'completed': '#10b981',
    'cancelled': '#6b7280',
    'print-error': '#ef4444'
  };
  return colors[status] || '#0ea5e9';
};

const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'print-error': 'Print Error'
  };
  return statusMap[status] || status;
};

const getStatusMessage = (status: string, itemName: string): string => {
  const messages: Record<string, string> = {
    'completed': `Great news! Your print request for <strong style="${baseStyles.strongText}">${itemName}</strong> has been completed and is ready for pickup! 🎉`,
    'cancelled': `Your print request for <strong style="${baseStyles.strongText}">${itemName}</strong> has been cancelled. If you have any questions, please contact an administrator.`,
    'print-error': `Unfortunately, there was an error printing your request for <strong style="${baseStyles.strongText}">${itemName}</strong>. Our team has been notified and will look into this issue.`
  };
  return messages[status] || `Your print request status has been updated.`;
};

export const statusUpdateEmailTemplate = (
  displayName: string,
  itemName: string,
  status: string,
  notes?: string,
  modelUrl?: string
): EmailTemplate => {
  const statusColor = getStatusColor(status);
  const statusText = getStatusDisplay(status);
  const message = getStatusMessage(status, itemName);

  const htmlContent = `
    <h1 style="${baseStyles.title}">
      Print Request Update
    </h1>
    
    <p style="${baseStyles.text}">
      Hi <strong style="${baseStyles.strongText}">${displayName}</strong>,
    </p>
    
    <p style="${baseStyles.text}">
      ${message}
    </p>
    
    <div style="background-color: rgba(14, 165, 233, 0.05); border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 16px 20px; margin: 30px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</strong>
            <p style="margin: 4px 0 0 0; color: #e4f0fb; font-weight: 600; font-size: 16px;">${itemName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</strong>
            <p style="margin: 4px 0 0 0; color: ${statusColor}; font-weight: 700; font-size: 14px; text-transform: uppercase;">${statusText}</p>
          </td>
        </tr>
        ${modelUrl ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Model</strong>
            <p style="margin: 4px 0 0 0;">
              <a href="${modelUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${modelUrl}</a>
            </p>
          </td>
        </tr>
        ` : ''}
        ${notes ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</strong>
            <p style="margin: 4px 0 0 0; color: #94b8d4; font-style: italic;">${notes}</p>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 0 0;">
      Questions? Feel free to contact us or check the queue for more details.
    </p>
  `;

  const textContent = `
Print Request Update

Hi ${displayName},

${getStatusMessage(status, itemName).replace(/<[^>]*>/g, '')}

Item: ${itemName}
Status: ${statusText}
${modelUrl ? `Model: ${modelUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Questions? Feel free to contact us or check the queue for more details.

© ${new Date().getFullYear()} 3D Print Queue. All rights reserved.
  `;

  return {
    subject: `Print Request ${statusText} - ${itemName}`,
    html: createEmailWrapper(`Print Request Update - 3D Print Queue`, htmlContent),
    text: textContent
  };
};

export const inviteEmailTemplate = (
  email: string,
  invitedBy: string,
  inviteUrl: string
): EmailTemplate => {
  const htmlContent = `
    <h1 style="${baseStyles.title}">
      You're Invited to 3D Print Queue!
    </h1>
    
    <p style="${baseStyles.text}">
      Hi there,
    </p>
    
    <p style="${baseStyles.text}">
      <strong style="${baseStyles.strongText}">${invitedBy}</strong> has invited you to join the 3D Print Queue system. You can now submit 3D print requests and track their progress!
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${inviteUrl}" style="${baseStyles.button}">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 10px 0;">
      Or copy and paste this link into your browser:
    </p>
    
    <div style="${baseStyles.infoBox}">
      <a href="${inviteUrl}" style="color: #0ea5e9; text-decoration: none; font-size: 14px; word-break: break-all;">${inviteUrl}</a>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 0 0;">
      This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  `;

  const textContent = `
You're Invited to 3D Print Queue!

Hi there,

${invitedBy} has invited you to join the 3D Print Queue system. You can now submit 3D print requests and track their progress!

Accept your invitation by visiting this link:

${inviteUrl}

This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} 3D Print Queue. All rights reserved.
  `;

  return {
    subject: 'You\'re Invited to 3D Print Queue',
    html: createEmailWrapper('Invitation - 3D Print Queue', htmlContent),
    text: textContent
  };
};

export const newPrintRequestNotificationTemplate = (
  userName: string,
  userEmail: string,
  itemName: string,
  notes?: string,
  modelUrl?: string
): EmailTemplate => {
  const htmlContent = `
    <h1 style="${baseStyles.title}">
      New Print Request Submitted
    </h1>
    
    <p style="${baseStyles.text}">
      A new print request has been submitted to the queue.
    </p>
    
    <div style="background-color: rgba(14, 165, 233, 0.05); border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 16px 20px; margin: 30px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted By</strong>
            <p style="margin: 4px 0 0 0; color: #e4f0fb; font-weight: 600; font-size: 16px;">${userName}</p>
            <p style="margin: 2px 0 0 0; color: #94b8d4; font-size: 14px;">${userEmail}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</strong>
            <p style="margin: 4px 0 0 0; color: #e4f0fb; font-weight: 600; font-size: 16px;">${itemName}</p>
          </td>
        </tr>
        ${modelUrl ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Model</strong>
            <p style="margin: 4px 0 0 0;">
              <a href="${modelUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${modelUrl}</a>
            </p>
          </td>
        </tr>
        ` : ''}
        ${notes ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #6b8aa8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</strong>
            <p style="margin: 4px 0 0 0; color: #94b8d4; font-style: italic;">${notes}</p>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b8aa8; margin: 30px 0 0 0;">
      Log in to the admin panel to review and manage this request.
    </p>
  `;

  const textContent = `
New Print Request Submitted

A new print request has been submitted to the queue.

Submitted By: ${userName} (${userEmail})
Item: ${itemName}
${modelUrl ? `Model: ${modelUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Log in to the admin panel to review and manage this request.

© ${new Date().getFullYear()} 3D Print Queue. All rights reserved.
  `;

  return {
    subject: `New Print Request: ${itemName}`,
    html: createEmailWrapper(`New Print Request - 3D Print Queue`, htmlContent),
    text: textContent
  };
};