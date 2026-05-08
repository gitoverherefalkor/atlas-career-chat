// Boilerplate intros and outros for each section delivery.
// Lifted verbatim from the WF5.2 Atlas Agent system prompt (BOILERPLATE QUICK REFERENCE)
// so platform-side delivery produces output identical to what the agent emits today.
//
// `intro: null`  → no intro line (top_career_2/3 continue from previous turn)
// `outro: null`  → no outro line (dream_jobs waits silently after delivery)

export type SectionType =
  | 'approach'
  | 'strengths'
  | 'development'
  | 'values'
  | 'top_career_1'
  | 'top_career_2'
  | 'top_career_3'
  | 'runner_ups'
  | 'outside_box'
  | 'dream_jobs';

interface Boilerplate {
  intro: string | null;
  outro: string | null;
}

export const BOILERPLATE: Record<SectionType, Boilerplate> = {
  approach: {
    intro:
      "Hi there. Let's dive into your personality profile. We'll start with your work approach - how you navigate challenges, lead teams, and engage with others.",
    outro:
      "**Does this feel like an accurate reflection of your work style?** Let me know if anything stands out or if you'd like to refine any part.",
  },
  strengths: {
    intro:
      "Let's talk about your strengths - what sets you apart professionally and drives your success.",
    outro:
      "**Do these insights align with how you see yourself professionally?** If there's anything you'd like to adjust or highlight further, let me know.",
  },
  development: {
    intro:
      'Now for the growth opportunities - areas where focused development can make the biggest difference in reaching your goals.',
    outro:
      "**Do these observations and suggestions resonate with you?** Let me know if there's anything you'd like to explore in more detail.",
  },
  values: {
    intro:
      "Finally, let's look at your core values - what matters most to you in your career and how that shapes the right fit.",
    outro:
      "**Does this section reflect what matters most to you?** If everything looks good, we can move on to your career recommendations. Let me know how you'd like to proceed.",
  },
  top_career_1: {
    intro:
      "## CHAPTER 2: CAREER RECOMMENDATIONS\n\nOk! Let's continue with our career recommendations and discuss why we think they are a great fit for you. We start with your top career matches first.\n\nBased on your personality, values, and skills, one of the most suitable jobs for you is:",
    outro:
      'That was your first top career match.\n\nBased on what we just covered, **does this role appeal to you? Does it align with your career goals and interests?**\n\nWere you expecting to see this as a top recommendation, or was it a surprise?\n\nIf you\'d like, I can provide more details, whether that\'s diving into the daily responsibilities, potential career paths, or industry trends. Or, if you\'re ready, we can move on to the next career match. **Let me know how you\'d like to proceed!**',
  },
  top_career_2: {
    intro: null,
    outro:
      'Alright, that was your second career match. **How does this one compare to the first? Do you see yourself thriving in this type of role?**\n\nWas this something you had considered before, or does it bring a new perspective on potential career paths for you?\n\nI\'m happy to go deeper into any aspects of this job e.g. compensation, long-term growth, or how it fits with your skills. Or, if you\'d prefer, we can move on to the next suggestion. **What do you think?**',
  },
  top_career_3: {
    intro: null,
    outro:
      "And that was your third top career match. **What's your first reaction? Does this feel like a strong fit**, or is it less aligned with what you had in mind?\n\nDo any aspects of this role stand out as particularly exciting or unexpected?\n\nIf you're curious about any specific details, I can expand on them. Or, if you're ready, we can move forward to your runner-up careers for a quick comparison. **Let me know how you'd like to continue!**",
  },
  runner_ups: {
    intro:
      "Let's take a look at your **runner-up career matches**. These roles are also well-suited to your strengths, values, and skills, but may differ in focus, work environment, or career trajectory compared to your top matches. Here are strong alternatives worth considering:",
    outro:
      'That wraps up your runner-up career matches! **Do you have any questions about any of these roles**, or anything else you\'d like to explore further?',
  },
  outside_box: {
    intro:
      "**Sometimes the best career paths aren't the most obvious ones.** Based on your personality, interests, and values, we've identified a few **outside-the-box career options.** Roles that align with who you are but might not have been on your radar. These could open up unexpected yet highly fulfilling opportunities. Let's take a look:",
    outro:
      "**Do any of these roles resonate with you?** Even if they're outside your usual scope, they might offer new ways to apply your strengths and interests in a way that feels exciting and rewarding. **Let me know your thoughts** whether you'd like more details on any of these or if you'd prefer to explore other directions. If not, we could move on to a bonus segment, the feasibility of your 'dream jobs'!",
  },
  dream_jobs: {
    intro:
      "Everyone has an idea of their ideal job, the one that aligns perfectly with their passions and ambitions. In this section, we take an honest look at how well your dream job(s) align with your personality, experience, and the realities of the job market today. Let's break it down.",
    // No outro on initial delivery. The wrap-up message is sent separately
    // when the user clicks "All done, wrap up session".
    outro: null,
  },
};

// Wrap-up message after the user signals they're done with dream_jobs.
// Triggered by the "All done, wrap up session" QuickReply.
export const DREAM_JOBS_WRAP_UP =
  "That concludes your Cairnly career chat session. Behind the scenes, we're now generating your personalized executive summary based on everything we discussed, including your feedback. Your complete report with the executive summary and all career recommendations will be ready shortly in your dashboard.\n\nYou'll receive an email when it's available. You can revisit this report anytime to reflect on these findings or share it with mentors, career advisors, or anyone else who can support your next steps.\n\nYou know where you stand. Now decide where you're going.";
