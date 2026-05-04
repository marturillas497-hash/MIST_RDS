import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdviserApprovalEmail({ email, fullName }) {
  const { data, error } = await resend.emails.send({
    from: "MIST Research Discovery System <onboarding@resend.dev>",
    to: email,
    subject: "Your MIST-RDS Adviser Account Has Been Approved",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Account Approved</title>
        </head>
        <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                  <tr>
                    <td style="background-color:#003366;padding:32px 40px;text-align:center;">
                      <p style="margin:0;font-size:13px;color:#FFCC00;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                        Makilala Institute of Science and Technology
                      </p>
                      <h1 style="margin:8px 0 0;font-size:20px;color:#ffffff;font-weight:700;">
                        Research Discovery System
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 16px;font-size:22px;color:#0F172A;font-weight:700;">
                        Your account has been approved
                      </h2>
                      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
                        Hi ${fullName},
                      </p>
                      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                        Your research adviser account on MIST-RDS has been reviewed and approved by the administrator.
                        You can now log in to access your adviser portal, where you can view the similarity reports
                        submitted by your assigned students.
                      </p>

                      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                        <tr>
                          <td style="background-color:#003366;border-radius:8px;">
                            
                              href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                              style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;"
                            >
                              Log In to MIST-RDS
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
                        If you did not register for a MIST-RDS adviser account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="background-color:#F1F5F9;padding:20px 40px;border-top:1px solid #E2E8F0;">
                      <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
                        MIST Research Discovery System &nbsp;|&nbsp; For Internal Use Only
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[sendAdviserApprovalEmail] Resend error:", error);
    return { success: false, error };
  }

  return { success: true, data };
}