import React from 'react';
import { SubPageHeader } from '@/components/pwa/SubPageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Linkedin, Github, Sparkles, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import {
  Brain, Heart, Users, Smartphone, Zap, Target, Activity, Stethoscope,
  Mic, Eye, Ear
} from 'lucide-react';

const About: React.FC = () => {

  const values = [
    {
      icon: Smartphone,
      title: "Hardware Innovation",
      description: "Developing professional-grade medical sensors integrated with Raspberry Pi Zero processing for comprehensive neurological monitoring.",
      accentColor: "text-sky-400",
      bgAccent: "bg-sky-500/10",
      borderAccent: "border-sky-500/20"
    },
    {
      icon: Stethoscope,
      title: "Medical Precision",
      description: "Every sensor and algorithm is designed with medical accuracy in mind, targeting early detection of neurological conditions.",
      accentColor: "text-emerald-400",
      bgAccent: "bg-emerald-500/10",
      borderAccent: "border-emerald-500/20"
    },
    {
      icon: Activity,
      title: "Comprehensive Monitoring",
      description: "Six medical-grade sensors working in harmony - Heart Rate Sensor, EMG, motion tracking, temperature, pulse oximetry, and voice analysis.",
      accentColor: "text-amber-400",
      bgAccent: "bg-amber-500/10",
      borderAccent: "border-amber-500/20"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "8-10 hour battery life with continuous real-time analysis and intelligent power management for all-day monitoring.",
      accentColor: "text-violet-400",
      bgAccent: "bg-violet-500/10",
      borderAccent: "border-violet-500/20"
    },
    {
      icon: Target,
      title: "Early Detection Focus",
      description: "Specialized AI algorithms for identifying early-stage indicators of Parkinson's, Alzheimer's, and epilepsy.",
      accentColor: "text-teal-400",
      bgAccent: "bg-teal-500/10",
      borderAccent: "border-teal-500/20"
    },
    {
      icon: Users,
      title: "Primary Care Integration",
      description: "Designed for seamless integration into primary healthcare workflows with secure data transmission and professional reporting.",
      accentColor: "text-indigo-400",
      bgAccent: "bg-indigo-500/10",
      borderAccent: "border-indigo-500/20"
    }
  ];

  const problemItems = [
    "60% rural population - no specialist access",
    "Parkinson's detected 5-7 years late (70% brain damage)",
    "Alzheimer's cases doubling every 5 years",
    "1 neurologist per 100,000 people",
    "₹2,000-5,000 per screening + travel costs",
    "No comprehensive health tracking tools"
  ];

  const rootCauses = [
    "Geographic barriers (travel to cities)",
    "Economic barriers (expensive consultations)",
    "Awareness gap (symptoms ignored)",
    "Fragmented healthcare (multiple visits)",
    "Data silos (reports not accessible)"
  ];

  const labs = [
    { icon: Mic, label: "Voice & Speech Lab", desc: "Voice pattern analysis (89% accuracy)", color: "text-violet-400" },
    { icon: Eye, label: "Eye & Cognition Lab", desc: "Alzheimer's screening (87% accuracy)", color: "text-emerald-400" },
    { icon: Activity, label: "Motor & Tremor Lab", desc: "Parkinson's screening (91% accuracy)", color: "text-sky-400" },
    { icon: Heart, label: "Cardiovascular Lab", desc: "Heart health monitoring (94% accuracy)", color: "text-rose-400" },
    { icon: Brain, label: "Mental Health Lab", desc: "Depression/anxiety screening (95% accuracy)", color: "text-indigo-400" },
    { icon: Ear, label: "Vision & Hearing Lab", desc: "Sensory health assessment", color: "text-amber-400" },
  ];

  const features = [
    "Diabetes Management with AI Meal Planner",
    "Blood Pressure Tracking with Smart Alerts",
    "Google Fit Smartwatch Integration",
    "ABDM/EHR Integration (Government Approved)"
  ];

  const teamMembers = [
    {
      name: "Owais Naeem",
      role: "AI Architect & Backend Lead",
      avatar: "/owais.png",
      initials: "ON",
      accentColor: "text-sky-400",
      bgAccent: "bg-sky-500/10",
      borderAccent: "border-sky-500/20",
      hoverColor: "hover:text-sky-400",
      description: "Spearheading the core intelligence of HealthScan. Owais creates the custom neurological models and robust backend infrastructure that makes real-time analysis possible.",
      skills: ["AI/ML Models", "Python", "API Development", "Authentication", "Cloud Architecture", "Research"],
      github: "https://github.com/Geekluffy",
      linkedin: "https://linkedin.com/in/mohammad-owais-naeem"
    },
    {
      name: "Himanshu Rathore",
      role: "Frontend Lead & UX/IoT Designer",
      avatar: "/himanshu.png",
      initials: "HR",
      accentColor: "text-emerald-400",
      bgAccent: "bg-emerald-500/10",
      borderAccent: "border-emerald-500/20",
      hoverColor: "hover:text-emerald-400",
      description: "Crafting the user experience that makes complex medical data accessible. Himanshu builds the responsive interfaces and manages the IoT device connectivity flow.",
      skills: ["Frontend (React)", "UI/UX Design", "IoT Integration", "Data Visualization", "WebSockets", "User Research"],
      github: "https://github.com/himanshu-2l",
      linkedin: "https://www.linkedin.com/in/himanshu-rathore21/"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to App" backTo="/" category="About Us" />

      <main className="py-8 pb-24 md:pb-12 px-4 sm:px-6 flex-1">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
              <Sparkles className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              <span className="text-slate-600 dark:text-white/60 text-sm font-medium">Pioneering Neurological Healthcare</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight">
              About <span className="text-teal-600 dark:text-teal-400">HealthScan</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-white/60 max-w-3xl mx-auto leading-relaxed">
              We're pioneering the future of neurological healthcare by developing the <strong className="text-slate-900 dark:text-white">HealthScan device</strong> —
              a comprehensive medical-grade hardware platform that combines advanced AI with professional sensor technology
              for early detection and monitoring of neurological conditions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium border border-teal-500/20">
                ABDM Integrated
              </span>
              <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20">
                Government Approved
              </span>
            </div>
          </section>

          {/* Healthcare Crisis Section */}
          <section className="space-y-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">India's Healthcare Crisis</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* The Problem */}
              <div className="bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">The Problem</h3>
                </div>
                
                <ul className="space-y-4">
                  {problemItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 mt-2.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Root Causes */}
              <div className="bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Search className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">Root Causes</h3>
                </div>
                
                <ul className="space-y-4">
                  {rootCauses.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <span className="inline-block px-6 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-lg font-semibold border border-rose-200 dark:border-rose-500/20 shadow-sm">
                50+ Million Indians Need Accessible Health Screening
              </span>
            </div>
          </section>

          {/* Our Solution */}
          <section className="space-y-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Our Solution: HealthScan</h2>
            
            <div className="bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-2xl p-10 space-y-10 shadow-sm">
              {/* Labs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map((lab, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all duration-300 shadow-sm"
                  >
                    <lab.icon className={`w-6 h-6 shrink-0 ${lab.color}`} />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{lab.label}</div>
                      <div className="text-sm text-slate-600 dark:text-white/50 mt-1">{lab.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="pt-8 border-t border-slate-200 dark:border-white/[0.06]">
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-white/60">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-slate-200 dark:border-white/[0.06] text-center">
                <p className="text-teal-600 dark:text-teal-400 font-medium">
                  100% Browser-Based | No Installation | Powered by Google Technologies
                </p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Our Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div 
                    key={index} 
                    className="group bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className={`inline-flex p-4 rounded-xl ${value.bgAccent} border ${value.borderAccent} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${value.accentColor}`} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{value.title}</h3>
                    <p className="text-slate-600 dark:text-white/50 leading-relaxed text-sm">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Team Section */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Our Team</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Header */}
                  <div className={`p-10 text-center ${member.bgAccent}`}>
                    <Avatar className={`w-32 h-32 mx-auto mb-6 border-4 ${member.borderAccent} shadow-2xl`}>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className={`${member.bgAccent} ${member.accentColor}`}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{member.name}</h3>
                    <p className={`text-lg font-medium mt-2 ${member.accentColor}`}>{member.role}</p>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 space-y-8">
                    <p className="text-slate-600 dark:text-white/60 text-center leading-relaxed">
                      {member.description}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                      {member.skills.map((skill) => (
                        <span 
                          key={skill} 
                          className={`px-3 py-1.5 text-sm rounded-lg ${member.bgAccent} ${member.accentColor} border ${member.borderAccent}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-center gap-6 pt-4">
                      <a 
                        href={member.github} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`text-slate-400 hover:text-slate-900 dark:text-white/40 ${member.hoverColor} transition-all duration-300 hover:scale-110`}
                      >
                        <Github className="w-7 h-7" />
                      </a>
                      <a 
                        href={member.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`text-slate-400 hover:text-slate-900 dark:text-white/40 ${member.hoverColor} transition-all duration-300 hover:scale-110`}
                      >
                        <Linkedin className="w-7 h-7" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
};

export default About;
