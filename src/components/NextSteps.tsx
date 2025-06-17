import React from 'react';
import { CheckCircle, ArrowRight, Clock, MessageSquare, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
const NextSteps = () => {
  return <section className="py-20 bg-white">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Happens After Your Assessment?</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-atlas-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-atlas-blue" />
              </div>
              <h3 className="font-semibold mb-3">Immediate Processing</h3>
              <p className="text-gray-600 text-sm">
                Your responses are immediately analyzed by our AI system, generating your personalized career profile.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-atlas-indigo bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-atlas-indigo" />
              </div>
              <h3 className="font-semibold mb-3">AI Coaching Chat</h3>
              <p className="text-gray-600 text-sm">
                Engage in an interactive AI coaching session to explore your results, ask questions, and dive deeper into specific career paths.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-atlas-purple bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-atlas-purple" />
              </div>
              <h3 className="font-semibold mb-3">Comprehensive Report</h3>
              <p className="text-gray-600 text-sm">Find your final report, now with the nuances and specific insights discussed during your AI coaching session, in your dashboard.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-atlas-teal bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-8 w-8 text-atlas-teal" />
              </div>
              <h3 className="font-semibold mb-3">Take Action</h3>
              <p className="text-gray-600 text-sm">
                Use your personalized insights to make informed decisions about your career path, education, or professional development.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-gray-50 rounded-xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Your Investment in Clarity</h3>
            <p className="text-lg text-gray-700 mb-6">
              Atlas Assessment provides you with professional-grade career insights at a fraction of the cost of traditional career coaching. 
              Get the clarity you need to make confident career decisions.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Personalized Analysis</p>
                  <p className="text-sm text-gray-600">Tailored to your unique profile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Interactive Coaching</p>
                  <p className="text-sm text-gray-600">AI-powered career guidance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Actionable Insights</p>
                  <p className="text-sm text-gray-600">Clear next steps for your career</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default NextSteps;