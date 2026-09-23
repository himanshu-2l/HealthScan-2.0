import {
  Droplet,
  Heart,
  Activity,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Stethoscope,
  Mic,
  FileText,
  Hospital,
  Phone,
  Watch,
  Cpu,
  Layers,
  Info,
  Target,
  FlaskConical,
  LucideIcon
} from 'lucide-react';

export interface NavRouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
  desc: string;
  badge?: string;
  color?: string;
}

export interface NavRouteCategory {
  title: string;
  items: NavRouteItem[];
}

export const NAV_CATEGORIES: NavRouteCategory[] = [
  {
    title: 'Health Tracking',
    items: [
      {
        label: 'Diabetes & CGM Hub',
        href: '/diabetes',
        icon: Droplet,
        desc: 'IOB bilinear decay & carb calculator',
        badge: 'CGM Synced',
        color: 'text-sky-500'
      },
      {
        label: 'Hypertension & BP Log',
        href: '/bp-tracker',
        icon: Heart,
        desc: 'AHA stage classification & trends',
        badge: 'AHA Standards',
        color: 'text-rose-500'
      },
      {
        label: 'Hormonal Health',
        href: '/period-tracker',
        icon: Activity,
        desc: 'Cycle phase & follicular intelligence',
        badge: 'Clinical',
        color: 'text-pink-500'
      },
      {
        label: 'Immunization Records',
        href: '/vaccinations',
        icon: ShieldCheck,
        desc: 'WHO & National schedule tracking',
        badge: 'Verified',
        color: 'text-teal-500'
      },
    ]
  },
  {
    title: 'AI & Clinical Insights',
    items: [
      {
        label: 'Health Risk Predictions',
        href: '/health-predictions',
        icon: TrendingUp,
        desc: '5-year multi-organ statistical forecast',
        badge: 'AI Engine',
        color: 'text-indigo-500'
      },
      {
        label: 'Clinical Recommendations',
        href: '/recommendations',
        icon: Sparkles,
        desc: 'Evidence-based personalized guidance',
        badge: 'NICE/ICMR',
        color: 'text-amber-500'
      },
      {
        label: 'AI Symptom Triage',
        href: '/symptom-checker',
        icon: Stethoscope,
        desc: 'Interactive clinical red-flag triage',
        badge: 'Diagnostic',
        color: 'text-emerald-500'
      },
    ]
  },
  {
    title: 'Clinical Tools',
    items: [
      {
        label: 'Voice Biomarker Entry',
        href: '/voice-entry',
        icon: Mic,
        desc: 'Acoustic pitch, jitter & shimmer logging',
        badge: 'Voice AI',
        color: 'text-purple-500'
      },
      {
        label: 'Physician Health Report',
        href: '/doctor-report',
        icon: FileText,
        desc: 'Consolidated clinical export brief',
        badge: 'PDF / FHIR',
        color: 'text-blue-500'
      },
      {
        label: 'ABDM EHR Gateway',
        href: '/ehr',
        icon: Hospital,
        desc: 'Ayushman Bharat Digital Health exchange',
        badge: 'Govt Ready',
        color: 'text-cyan-500'
      },
    ]
  },
  {
    title: 'Hardware & Safety',
    items: [
      {
        label: 'Emergency Contacts & SOS',
        href: '/emergency-contacts',
        icon: Phone,
        desc: 'Instant 112/102 SOS & ICE contacts',
        badge: 'Life Safety',
        color: 'text-red-500'
      },
      {
        label: 'Smartwatch & Wearables',
        href: '/smartwatch',
        icon: Watch,
        desc: 'Google Fit & continuous sensor telemetry',
        badge: 'Live Sync',
        color: 'text-violet-500'
      },
      {
        label: 'Hardware Data Display',
        href: '/hardware-integration',
        icon: Cpu,
        desc: 'Real-time waist & chest sensor telemetry',
        badge: 'Hardware',
        color: 'text-emerald-500'
      },
      {
        label: 'Neuro Hub Device Model',
        href: '/device-model',
        icon: Layers,
        desc: 'Flagship bedside station specifications',
        badge: 'Hardware',
        color: 'text-teal-500'
      },
    ]
  },
  {
    title: 'About & Vision',
    items: [
      {
        label: 'About HealthScan',
        href: '/about',
        icon: Info,
        desc: 'Founding mission, crisis data & team',
        color: 'text-slate-500'
      },
      {
        label: 'Clinical Purpose',
        href: '/purpose',
        icon: Target,
        desc: 'Why HealthScan was engineered',
        color: 'text-teal-500'
      },
    ]
  }
];
