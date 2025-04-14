
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container-atlas">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Atlas Assessment
            </h3>
            <p className="mb-4">
              Gain personalized, actionable career clarity through an expert-developed, AI-enhanced assessment delivered via a unique, interactive chat experience. Stop guessing, start directing your career.
            </p>
            <div className="text-sm text-gray-400">
              <p>© {currentYear} Falkor Atlas. All rights reserved.</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#why-atlas" className="hover:text-white transition-colors">Why Atlas</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#examples" className="hover:text-white transition-colors">Examples</a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About Us</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@atlasassessment.com" className="hover:text-white transition-colors">info@atlasassessment.com</a>
              </li>
              <li>
                <p>Currently in Beta</p>
              </li>
            </ul>
            <div className="mt-6">
              <button className="btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              <span>Privacy Policy</span>
              <span className="mx-2">|</span>
              <span>Terms of Service</span>
            </div>
            <div className="text-sm text-gray-500">
              <p>Designed and developed with ♥ for career clarity</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
