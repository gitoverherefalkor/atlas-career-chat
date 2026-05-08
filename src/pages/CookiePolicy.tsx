import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-atlas-navy mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2, 2026</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-atlas-navy mb-3">What Are Cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help the website
              remember your preferences and keep you logged in. We aim to use as few cookies as possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-atlas-navy mb-3">Cookies We Use</h2>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-atlas-navy mb-1">Essential Cookies (Required)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  These cookies are necessary for the platform to function. They cannot be disabled.
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-gray-700">Cookie</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-700">Purpose</th>
                      <th className="text-left py-2 font-medium text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                      <td className="py-2 pr-4">Keeps you logged in (Supabase authentication)</td>
                      <td className="py-2">Session / 1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">cairnly-cookie-consent</td>
                      <td className="py-2 pr-4">Remembers your cookie preference</td>
                      <td className="py-2">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-atlas-navy mb-1">Third-Party Cookies</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When you make a payment, Stripe may set temporary cookies during the checkout process.
                  These are only active during the payment flow and are governed by{' '}
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-atlas-blue underline">
                    Stripe's Privacy Policy
                  </a>.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h3 className="font-medium text-green-800 mb-1">No Tracking or Advertising Cookies</h3>
                <p className="text-sm text-green-700">
                  We do not use any analytics, tracking, or advertising cookies. We do not track your
                  browsing behavior across websites, and we do not share cookie data with advertisers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-atlas-navy mb-3">Local Storage</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              In addition to cookies, we use your browser's local storage for:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
              <li>Your cookie consent preference</li>
              <li>Chat session identifiers (for AI career chat continuity)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-atlas-navy mb-3">Managing Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              You can clear cookies at any time through your browser settings. Note that clearing
              essential cookies will sign you out. You can also change your cookie preference by
              clearing your browser's local storage for this site, which will show the consent
              banner again on your next visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-atlas-navy mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about our use of cookies, contact us at{' '}
              <a href="mailto:privacy@cairnly.io" className="text-atlas-blue underline">
                privacy@cairnly.io
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
