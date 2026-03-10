import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendInviteEmail({
  to,
  inviterName,
  bookTitle,
  inviteId,
  siteUrl,
}: {
  to: string;
  inviterName: string;
  bookTitle: string;
  inviteId: string;
  siteUrl: string;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email send to:', to);
    return { success: false, error: 'Email service not configured.' };
  }

  const acceptLink = `${siteUrl}/api/invite/accept?id=${inviteId}`;

  try {
    const data = await resend.emails.send({
      from: 'BookGit <onboarding@resend.dev>', // Replace with your domain when configured in Resend
      to: [to],
      subject: `You've been invited to collaborate on "${bookTitle}"`,
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px;">
                    <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #18181b;">Collaboration Invite</h1>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.5;">Hello,</p>
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.5;"><strong>${inviterName}</strong> has invited you to collaborate on the book <strong>"${bookTitle}"</strong> on BookGit.</p>
                    
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#7c3aed" style="border-radius: 6px;">
                          <a href="${acceptLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">Accept Invite</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 32px 0 0 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">If you do not have an account, you will be asked to sign up first. The invitation will be automatically accepted after you log in.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
    });

    if (data.error) {
      console.error('Resend API Error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
