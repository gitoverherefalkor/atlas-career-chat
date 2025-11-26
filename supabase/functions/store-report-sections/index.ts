
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      REPORT_ID,
      USER_ID,
      REPORT_DATE,
      EXEC_SUMMARY,
      STRENGTHS,
      GROWTH,
      PERS_TEAM,
      VALUES,
      "1ST": first,
      "2ND": second,
      "3RD": third,
      RUNNER_UP,
      "OUTSIDE BOX": outsideBox,
      DREAM
    } = await req.json()

    // REPORT_ID should be passed from n8n (which received it from forward-to-n8n)
    // Fall back to USER_ID lookup only if REPORT_ID is not provided (for backwards compatibility)
    let reportId = REPORT_ID;

    if (!reportId && !USER_ID) {
      return new Response(
        JSON.stringify({ error: 'Either REPORT_ID or USER_ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no REPORT_ID provided, look up by USER_ID (legacy behavior)
    if (!reportId) {
      console.log('REPORT_ID not provided, falling back to USER_ID lookup (legacy)');
      const { data: report, error: reportError } = await supabaseClient
        .from('reports')
        .select('id')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (reportError || !report) {
        return new Response(
          JSON.stringify({ error: 'No report found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      reportId = report.id
    }

    console.log('Using report ID:', reportId)

    // Define the sections to insert
    const sectionsToInsert = [
      // About You Chapter
      {
        report_id: reportId,
        chapter_id: 'about-you',
        section_id: 'executive-summary',
        section_type: 'executive_summary',
        title: 'Executive Summary',
        content: EXEC_SUMMARY || '',
        order_number: 1
      },
      {
        report_id: reportId,
        chapter_id: 'about-you',
        section_id: 'personality-team',
        section_type: 'personality_team',
        title: 'Personality and Team Dynamics',
        content: PERS_TEAM || '',
        order_number: 2
      },
      {
        report_id: reportId,
        chapter_id: 'about-you',
        section_id: 'strengths',
        section_type: 'strengths',
        title: 'Your Strengths',
        content: STRENGTHS || '',
        order_number: 3
      },
      {
        report_id: reportId,
        chapter_id: 'about-you',
        section_id: 'growth',
        section_type: 'growth',
        title: 'Opportunities for Growth',
        content: GROWTH || '',
        order_number: 4
      },
      {
        report_id: reportId,
        chapter_id: 'about-you',
        section_id: 'values',
        section_type: 'values',
        title: 'Your (Career) Values',
        content: VALUES || '',
        order_number: 5
      },
      // Career Suggestions Chapter
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'first-career',
        section_type: 'career_suggestion',
        title: 'Primary Career Match',
        content: first || '',
        order_number: 1
      },
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'second-career',
        section_type: 'career_suggestion',
        title: 'Second Career Match',
        content: second || '',
        order_number: 2
      },
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'third-career',
        section_type: 'career_suggestion',
        title: 'Third Career Match',
        content: third || '',
        order_number: 3
      },
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'runner-up',
        section_type: 'career_suggestion',
        title: 'Runner Up Career',
        content: RUNNER_UP || '',
        order_number: 4
      },
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'outside-box',
        section_type: 'career_suggestion',
        title: 'Outside the Box',
        content: outsideBox || '',
        order_number: 5
      },
      {
        report_id: reportId,
        chapter_id: 'career-suggestions',
        section_id: 'dream-jobs',
        section_type: 'career_suggestion',
        title: 'Dream Job Analysis',
        content: DREAM || '',
        order_number: 6
      }
    ]

    // Delete existing sections for this report to avoid duplicates
    const { error: deleteError } = await supabaseClient
      .from('report_sections')
      .delete()
      .eq('report_id', reportId)

    if (deleteError) {
      console.error('Error deleting existing sections:', deleteError)
      // Continue anyway, as duplicates are not critical
    }

    // Insert all sections
    const { data: insertedSections, error: insertError } = await supabaseClient
      .from('report_sections')
      .insert(sectionsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting report sections:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store report sections', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Report sections stored successfully',
        report_id: reportId,
        sections_count: insertedSections?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in store-report-sections function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
