import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Mail, AlertCircle, ArrowRight } from 'lucide-react';

// Stepper stages — timed to feel like real progress
const STEPS = [
  { label: 'Reading your responses', delay: 0 },
  { label: 'Building your personality profile', delay: 5 },
  { label: 'Preparing your AI career coach', delay: 60 },
];

// Timeout thresholds (seconds)
const SOFT_WARNING_AT = 3 * 60;   // 3 minutes
const END_STATE_AT = 5 * 60;      // 5 minutes
const POLL_INTERVAL = 15_000;     // 15 seconds

type Phase = 'normal' | 'soft-warning' | 'end-state' | 'redirecting';

const ReportProcessing = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('normal');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReportStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['completed', 'pending_review'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (reports && reports.length > 0) {
        setPhase('redirecting');
        toast({
          title: "Your coach is ready!",
          description: "Connecting you now...",
        });
        setTimeout(() => navigate('/chat'), 1500);
      }
    } catch (error) {
      console.error('Error checking report status:', error);
    }
  }, [user, navigate, toast]);

  // Polling + timer
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    checkReportStatus();
    pollRef.current = setInterval(checkReportStatus, POLL_INTERVAL);
    timerRef.current = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [authLoading, user, checkReportStatus]);

  // Phase transitions based on elapsed time
  useEffect(() => {
    if (phase === 'redirecting') return;
    if (timeElapsed >= END_STATE_AT) setPhase('end-state');
    else if (timeElapsed >= SOFT_WARNING_AT) setPhase('soft-warning');
  }, [timeElapsed, phase]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-atlas-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main card */}
        <Card className="shadow-lg border-0">
          <CardContent className="pt-8 pb-6 px-6">
            {phase === 'redirecting' ? (
              <RedirectingState />
            ) : phase === 'end-state' ? (
              <EndState onDashboard={() => navigate('/dashboard')} />
            ) : (
              <NormalState
                timeElapsed={timeElapsed}
                phase={phase}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigate away hint — only in normal/soft-warning */}
        {(phase === 'normal' || phase === 'soft-warning') && (
          <div className="flex items-start gap-3 px-2 animate-in fade-in duration-500">
            <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-500">
              You can safely leave this page — we'll email you when your coach is ready.
            </p>
          </div>
        )}

        {/* Subtle dashboard link */}
        {phase !== 'end-state' && phase !== 'redirecting' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Normal + soft-warning state ─────────────────────────────────────
function NormalState({ timeElapsed, phase }: { timeElapsed: number; phase: Phase }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-atlas-navy">
          Building Your Profile
        </h1>
        <p className="text-sm text-gray-500">
          {phase === 'soft-warning'
            ? 'Almost there — just finishing up.'
            : 'This usually takes 2-3 minutes.'}
        </p>
      </div>

      {/* Stepper */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const isVisible = timeElapsed >= step.delay;
          const nextStep = STEPS[i + 1];
          const isComplete = nextStep ? timeElapsed >= nextStep.delay : phase === 'soft-warning';
          const isActive = isVisible && !isComplete;

          if (!isVisible) return null;

          return (
            <div
              key={step.label}
              className="flex items-start gap-3 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-atlas-teal" />
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-atlas-teal animate-pulse" />
                  </div>
                )}
              </div>
              {/* Label */}
              <span className={`text-sm ${isActive ? 'text-atlas-navy font-medium' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar — subtle, fills over ~3 min */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-atlas-teal/60 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(100, phase === 'soft-warning' ? 100 : (timeElapsed / SOFT_WARNING_AT) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Redirecting state ───────────────────────────────────────────────
function RedirectingState() {
  return (
    <div className="text-center space-y-4 py-4">
      <CheckCircle2 className="h-12 w-12 text-atlas-teal mx-auto" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-atlas-navy">Your coach is ready!</h2>
        <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
          Connecting you now <ArrowRight className="h-3.5 w-3.5" />
        </p>
      </div>
    </div>
  );
}

// ─── End state (5+ min) ──────────────────────────────────────────────
function EndState({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-atlas-navy">
            Taking longer than expected
          </h2>
          <p className="text-sm text-gray-600">
            Our support team has been notified and will follow up shortly.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800 font-medium">
          Your data is safe — nothing has been lost.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          We'll email you as soon as your career coach is ready.
        </p>
      </div>

      <Button
        onClick={onDashboard}
        className="w-full bg-atlas-teal hover:bg-atlas-teal/90 text-white"
      >
        Go to Dashboard
      </Button>
    </div>
  );
}

export default ReportProcessing;
