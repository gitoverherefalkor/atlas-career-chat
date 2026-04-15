
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

const Navbar = () => {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-atlas">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a href="#" className="flex items-center">
              <img
                src="/atlas-logo.png"
                alt="Atlas Assessment"
                className="h-10 w-auto"
              />
            </a>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <a href="#how-it-works" className="text-gray-700 hover:text-primary font-medium">
              {t('nav.howItWorks')}
            </a>
            <a href="#why-atlas" className="text-gray-700 hover:text-primary font-medium">
              {t('nav.whyAtlas')}
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-primary font-medium">
              {t('nav.pricing')}
            </a>
            <a href="#about" className="text-gray-700 hover:text-primary font-medium">
              {t('nav.aboutUs')}
            </a>

            <ThemeToggle />
            <LanguageSwitcher />

            {user ? (
              <Button asChild className="btn-primary">
                <button onClick={() => navigate('/dashboard')}>
                  <User className="h-4 w-4 mr-2" />
                  {t('nav.dashboard')}
                </button>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  {t('nav.signIn')}
                </Button>
                <Button asChild className="btn-primary">
                  <a href="#pricing">
                    {t('nav.getStarted')}
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button 
              type="button" 
              className="text-gray-700 hover:text-primary"
              onClick={toggleMenu}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white shadow-lg animate-fade-in">
          <div className="container-atlas py-4 space-y-3">
            <a href="#how-it-works" className="block text-gray-700 hover:text-primary font-medium py-2" onClick={toggleMenu}>
              {t('nav.howItWorks')}
            </a>
            <a href="#why-atlas" className="block text-gray-700 hover:text-primary font-medium py-2" onClick={toggleMenu}>
              {t('nav.whyAtlas')}
            </a>
            <a href="#pricing" className="block text-gray-700 hover:text-primary font-medium py-2" onClick={toggleMenu}>
              {t('nav.pricing')}
            </a>
            <a href="#about" className="block text-gray-700 hover:text-primary font-medium py-2" onClick={toggleMenu}>
              {t('nav.aboutUs')}
            </a>

            <div className="py-2">
              <ThemeToggle />
            <LanguageSwitcher />
            </div>

            {user ? (
              <Button className="btn-primary w-full mt-4" onClick={() => { navigate('/dashboard'); toggleMenu(); }}>
                <User className="h-4 w-4 mr-2" />
                {t('nav.dashboard')}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => { navigate('/auth'); toggleMenu(); }}>
                  {t('nav.signIn')}
                </Button>
                <Button asChild className="btn-primary w-full">
                  <a href="#pricing" onClick={toggleMenu}>
                    {t('nav.getStarted')}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
