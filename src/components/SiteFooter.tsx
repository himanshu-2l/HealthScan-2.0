/**
 * Site Footer Component
 * Footer with links, government information, and branding
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Heart, Shield, Mail, Github, Linkedin, Activity, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SiteFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Labs', href: '/labs' },
      { label: 'EHR Integration', href: '/ehr' },
      { label: 'About', href: '/about' },
      { label: 'Health Predictions', href: '/health-predictions' },
      { label: 'Symptom Checker', href: '/symptom-checker' },
    ],
    resources: [
      { label: 'Purpose', href: '/purpose' },
      { label: 'Hardware Integration', href: '/hardware-integration' },
      { label: 'Device Model', href: '/device-model' },
      { label: 'Doctor Report', href: '/doctor-report' },
      { label: 'Vaccinations', href: '/vaccinations' },
      { label: 'Emergency Contacts', href: '/emergency-contacts' },
    ],
    government: [
      { label: 'ABDM Portal', href: 'https://abdm.gov.in', external: true },
      { label: 'Ayushman Bharat', href: 'https://pmjay.gov.in', external: true },
      { label: 'National Health Mission', href: 'https://nhm.gov.in', external: true },
    ],
  };

  return (
    <footer className="bg-[#0a0a0f] text-white border-t border-white/[0.06]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <Stethoscope className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Health Scan</h3>
            <p className="text-white/60 text-sm">
              Privacy-first health screening platform integrated with ABDM for comprehensive health monitoring.
            </p>
            <div className="flex gap-2">
              <Badge className="bg-blue-600 text-white text-xs">ABDM Integrated</Badge>
              <Badge className="bg-green-600 text-white text-xs">Government Approved</Badge>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Government Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Government
            </h4>
            <ul className="space-y-2">
              {footerLinks.government.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                    <span className="ml-1 text-xs">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/[0.06] pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/60 text-sm text-center md:text-left">
              <p>© {currentYear} Health Scan. All rights reserved.</p>
              <p className="mt-1">ABDM Integrated Healthcare Platform</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Made for India</span>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://github.com/Geekluffy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/in/mohammad-owais-naeem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Government Mission Slogans */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex flex-wrap justify-center gap-6 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Ayushman Bharat Digital Mission</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>स्वस्थ भारत, समृद्ध भारत</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Digital Health for All</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

