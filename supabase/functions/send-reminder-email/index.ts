import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BASE_URL = "https://cairnly.io";

// All 11 chat sections in order (mirrors ReportSidebar.tsx)
const ALL_SECTIONS = [
  "Executive Summary",
  "Your Approach",
  "Your Strengths",
  "Development Areas",
  "Career Values",
  "Primary Career Match",
  "Second Career Match",
  "Third Career Match",
  "Runner-up Careers",
  "Outside the Box",
  "Dream Job Assessment",
];

// ──────────────────────────────────────────────────────────────────────────────
// Email templates
// ──────────────────────────────────────────────────────────────────────────────

function wrapEmail(content: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background-color: #012F64; padding: 30px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">Cairnly</h1>
        <p style="color: #27A1A1; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Career Discovery Platform</p>
      </div>
      <div style="padding: 40px; color: #333333;">
        ${content}
      </div>
      <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
        <p style="color: #999; font-size: 12px; margin: 4px 0;">
          You're receiving this because you have a Cairnly account.
        </p>
        <p style="color: #999; font-size: 12px; margin: 4px 0;">
          To stop these reminders, visit your <a href="${BASE_URL}/profile" style="color: #27A1A1;">Profile Settings</a>.
        </p>
        <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
          &copy; 2026 Cairnly. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

function ctaButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}"
         style="background-color: #27A1A1; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
        ${text}
      </a>
    </div>
  `;
}

// ── Template 1: Signed up, never started ─────────────────────────────────────

function signupNoStartEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `Your career assessment is waiting, ${firstName}`,
    html: wrapEmail(`
      <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
        Ready to discover your ideal career path?
      </h2>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
        Hi ${firstName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        Your personalized career assessment is set up and ready for you. It takes about 15-20 minutes, and you'll unlock insights most people never get about their career potential.
      </p>

      <div style="background-color: #f0f7fa; border-left: 4px solid #27A1A1; padding: 20px; margin-bottom: 28px; border-radius: 0 8px 8px 0;">
        <p style="color: #012F64; font-weight: 600; margin: 0 0 12px 0; font-size: 15px;">Here's what you'll discover:</p>
        <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Your unique personality profile and working style</li>
          <li>Your core strengths and development areas</li>
          <li>5+ career paths tailored to your personality and goals</li>
          <li>A dream job analysis based on your aspirations</li>
        </ul>
      </div>

      ${ctaButton("Start Your Assessment", `${BASE_URL}/dashboard`)}

      <p style="font-size: 13px; color: #888; text-align: center;">
        The assessment is saved as you go — you can pause and come back anytime.
      </p>
    `),
  };
}

// ── Template 2: Survey abandoned ─────────────────────────────────────────────

function surveyAbandonedEmail(
  firstName: string,
  lastSection: number | null,
  totalSections: number | null,
): { subject: string; html: string } {
  const section = lastSection ?? 0;
  const total = totalSections ?? 7;
  const percentDone = Math.round(((section + 1) / total) * 100);

  return {
    subject: `Pick up where you left off, ${firstName}`,
    html: wrapEmail(`
      <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
        You're ${percentDone}% through your assessment
      </h2>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
        Hi ${firstName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        You've already made great progress on your career assessment — all your answers are saved and waiting for you.
      </p>

      <!-- Progress bar -->
      <div style="margin: 24px 0 28px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Section ${section + 1} of ${total}</span>
          <span style="font-size: 13px; font-weight: 600; color: #27A1A1;">${percentDone}% complete</span>
        </div>
        <div style="height: 8px; background-color: #e8e8e8; border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${percentDone}%; background-color: #27A1A1; border-radius: 4px;"></div>
        </div>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        Once you finish, our AI will generate your personalized career report with tailored recommendations — it only takes a few more minutes.
      </p>

      ${ctaButton("Continue Your Assessment", `${BASE_URL}/assessment`)}

      <p style="font-size: 13px; color: #888; text-align: center;">
        Your progress is saved — you'll pick up right where you stopped.
      </p>
    `),
  };
}

// ── Template 3: Chat not completed ───────────────────────────────────────────

function chatNotCompletedEmail(
  firstName: string,
  lastSectionIndex: number,
): { subject: string; html: string } {
  const sectionsCompleted = Math.max(0, lastSectionIndex + 1);
  const totalSections = ALL_SECTIONS.length;
  const remainingSections = ALL_SECTIONS.slice(sectionsCompleted);

  // Build the "what you're missing" list (max 4 items to keep email short)
  const previewSections = remainingSections.slice(0, 4);
  const moreCount = remainingSections.length - previewSections.length;

  const sectionListHtml = previewSections
    .map(
      (s) =>
        `<li style="padding: 4px 0;"><span style="color: #27A1A1; margin-right: 8px;">&#10148;</span>${s}</li>`,
    )
    .join("");

  const moreHtml =
    moreCount > 0
      ? `<li style="padding: 4px 0; color: #888; font-style: italic;">...and ${moreCount} more insight${moreCount > 1 ? "s" : ""}</li>`
      : "";

  return {
    subject: `Your career insights are waiting, ${firstName}`,
    html: wrapEmail(`
      <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
        You've unlocked ${sectionsCompleted} of ${totalSections} career insights
      </h2>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
        Hi ${firstName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        Your AI career coach has more to share with you. You've explored some great insights so far, but there's still more waiting — including personalized career matches and your dream job analysis.
      </p>

      ${
        remainingSections.length > 0
          ? `
      <div style="background-color: #f0f7fa; border-left: 4px solid #27A1A1; padding: 20px; margin-bottom: 28px; border-radius: 0 8px 8px 0;">
        <p style="color: #012F64; font-weight: 600; margin: 0 0 12px 0; font-size: 15px;">Insights you haven't explored yet:</p>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #444; line-height: 1.8;">
          ${sectionListHtml}
          ${moreHtml}
        </ul>
      </div>
      `
          : ""
      }

      ${ctaButton("Continue Your Session", `${BASE_URL}/chat`)}

      <p style="font-size: 13px; color: #888; text-align: center;">
        Your conversation is saved — your coach remembers where you left off.
      </p>
    `),
  };
}

// ── Template 4: Chat completed but hasn't visited dashboard/report ──────────

function reportNotViewedEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `Your full career report is ready, ${firstName}`,
    html: wrapEmail(`
      <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
        Your personalized career report is waiting
      </h2>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
        Hi ${firstName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        Great news — your AI career session is complete, and your full report has been generated. It combines everything from your assessment with the insights from your coaching session into one comprehensive overview.
      </p>

      <div style="background-color: #f0f7fa; border-left: 4px solid #27A1A1; padding: 20px; margin-bottom: 28px; border-radius: 0 8px 8px 0;">
        <p style="color: #012F64; font-weight: 600; margin: 0 0 12px 0; font-size: 15px;">What's in your report:</p>
        <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li><strong>Executive Summary</strong> — your personality, strengths, and top career matches at a glance</li>
          <li><strong>Detailed Career Matches</strong> — with your coaching feedback incorporated</li>
          <li><strong>Dream Job Analysis</strong> — how your aspirations align with your profile</li>
          <li><strong>Actionable Next Steps</strong> — tailored to your goals</li>
        </ul>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
        We're also adding new features to your dashboard soon — including CV optimization and job search tools. Check back regularly to get the most out of your assessment.
      </p>

      ${ctaButton("View Your Report", `${BASE_URL}/dashboard`)}

      <p style="font-size: 13px; color: #888; text-align: center;">
        Your report is permanently saved in your dashboard — access it anytime.
      </p>
    `),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Edge Function handler
// ──────────────────────────────────────────────────────────────────────────────

interface ReminderUser {
  user_id: string;
  email: string;
  first_name: string;
  survey_last_section?: number | null;
  survey_total_sections?: number | null;
  chat_last_section_index?: number | null;
}

interface ReminderPayload {
  type: "signup_no_start" | "survey_abandoned" | "chat_not_completed" | "report_not_viewed";
  users: ReminderUser[];
}

serve(async (req) => {
  // This function is called by pg_cron via pg_net — no CORS needed
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth: verify_jwt = false in config, called only by pg_cron via pg_net.
  // The Supabase API gateway handles API key validation.

  try {
    const payload: ReminderPayload = await req.json();
    const { type, users } = payload;

    if (!type || !users || !Array.isArray(users)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: need type and users array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`Processing ${users.length} ${type} reminder(s)`);

    const results = [];

    for (const user of users) {
      let emailContent: { subject: string; html: string };

      switch (type) {
        case "signup_no_start":
          emailContent = signupNoStartEmail(user.first_name);
          break;
        case "survey_abandoned":
          emailContent = surveyAbandonedEmail(
            user.first_name,
            user.survey_last_section ?? null,
            user.survey_total_sections ?? null,
          );
          break;
        case "chat_not_completed":
          emailContent = chatNotCompletedEmail(
            user.first_name,
            user.chat_last_section_index ?? -1,
          );
          break;
        case "report_not_viewed":
          emailContent = reportNotViewedEmail(user.first_name);
          break;
        default:
          console.error(`Unknown reminder type: ${type}`);
          continue;
      }

      try {
        const { data, error } = await resend.emails.send({
          from: "Cairnly <no-reply@cairnly.io>",
          to: [user.email],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (error) {
          console.error(`Failed to send ${type} email to ${user.email}:`, error);
          results.push({ email: user.email, success: false, error: error.message });
        } else {
          console.log(`Sent ${type} reminder to ${user.email}`);
          results.push({ email: user.email, success: true, id: data?.id });
        }
      } catch (emailError) {
        console.error(`Error sending to ${user.email}:`, emailError);
        results.push({ email: user.email, success: false, error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in send-reminder-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
