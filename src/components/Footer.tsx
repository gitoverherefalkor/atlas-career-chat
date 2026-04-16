
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container-atlas">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              {t('footer.brand')}
            </h3>
            <p className="mb-4">
              {t('footer.description')}
            </p>
            <div className="text-sm text-gray-400">
              <p>{t('footer.copyright', { year: currentYear })}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">{t('nav.howItWorks')}</a>
              </li>
              <li>
                <a href="/#why-atlas" className="hover:text-white transition-colors">{t('nav.whyAtlas')}</a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</a>
              </li>
              <li>
                <a href="/#examples" className="hover:text-white transition-colors">{t('footer.examples')}</a>
              </li>
              <li>
                <a href="/#about" className="hover:text-white transition-colors">{t('nav.aboutUs')}</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@atlas-assessments.com" className="hover:text-white transition-colors">info@atlas-assessments.com</a>
              </li>
              <li>
                <p>{t('footer.currentlyInBeta')}</p>
              </li>
            </ul>
            <div className="mt-6">
              <a href="/#pricing" className="btn-primary">
                {t('nav.getStarted')}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                {t('footer.privacyPolicy')}
              </Link>
              <span className="mx-2">|</span>
              <Link to="/terms-conditions" className="hover:text-white transition-colors">
                {t('footer.termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
