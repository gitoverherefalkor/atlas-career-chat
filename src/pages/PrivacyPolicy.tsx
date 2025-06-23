
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="container-atlas py-16">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            <div className="text-sm text-gray-600 mb-8">
              <p>Last updated: June 23, 2025</p>
            </div>

            <div className="prose max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Falkor Atlas ("we," "our," or "us") operates the Atlas Assessment platform. This Privacy Policy explains how we collect, use, process, and protect your personal information when you use our career assessment services.
                </p>
                <p className="text-gray-700">
                  By using our services, you agree to the collection and use of information in accordance with this Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Professional information (job title, company, industry)</li>
                  <li>Demographics (age range, location, pronouns)</li>
                  <li>LinkedIn profile data (when you connect your LinkedIn account)</li>
                  <li>Resume and CV information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Assessment Data</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Responses to assessment questions</li>
                  <li>Career preferences and goals</li>
                  <li>Skills and competency assessments</li>
                  <li>Personality and behavioral insights</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage analytics and interaction data</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Provide personalized career assessment and recommendations</li>
                  <li>Generate detailed career clarity reports</li>
                  <li>Improve our AI-enhanced assessment algorithms</li>
                  <li>Communicate with you about your assessment results</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Comply with legal obligations and protect our rights</li>
                  <li>Send important updates about our services (with your consent for marketing)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. LinkedIn Integration</h2>
                <p className="text-gray-700 mb-4">
                  When you choose to connect your LinkedIn account, we access limited profile information to enhance your assessment experience:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Basic profile information (name, email, current position)</li>
                  <li>Professional experience and education history</li>
                  <li>Skills and endorsements</li>
                </ul>
                <p className="text-gray-700">
                  This integration is optional and you can disconnect it at any time from your profile settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Service Providers:</strong> Trusted third-party services that help us operate our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> With your explicit permission for other purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement industry-standard security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and updates</li>
                  <li>Limited access to personal information on a need-to-know basis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights (GDPR)</h2>
                <p className="text-gray-700 mb-4">If you are located in the European Union, you have the following rights:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Access:</strong> Request copies of your personal information</li>
                  <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Restriction:</strong> Request limitation of processing</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-700">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. Assessment data is typically retained for 7 years to allow for long-term career tracking and improvement of our services, unless you request earlier deletion.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to improve your experience:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Essential cookies for platform functionality</li>
                  <li>Analytics cookies to understand usage patterns</li>
                  <li>Preference cookies to remember your settings</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  You can control cookie preferences through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
                <p className="text-gray-700">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your personal information in accordance with applicable data protection laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><strong>Email:</strong> privacy@atlas-assessments.com</p>
                  <p className="text-gray-700"><strong>Address:</strong> Falkor Atlas, Utrecht, The Netherlands</p>
                  <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@atlas-assessments.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
