import React from 'react';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import {
  Heart,
  Activity,
  Thermometer,
  Mic,
  Cpu,
  Battery,
  Wifi,
  Gauge,
  Zap,
  Brain,
  MonitorSpeaker,
  Waves,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const DeviceModel: React.FC = () => {

  const sensorSpecs = [
    {
      icon: Heart,
      name: "AD8232 Heart Rate Monitor",
      description: "Single-lead heart rate signal acquisition",
      features: [
        "Heart rate variability analysis",
        "Real-time cardiac rhythm monitoring",
        "Operating range: 30-300 BPM"
      ],
      accentColor: "text-rose-400",
      bgAccent: "bg-rose-500/10",
      borderAccent: "border-rose-500/20"
    },
    {
      icon: Activity,
      name: "EMG Muscle Activity Sensor",
      description: "Surface electromyography detection",
      features: [
        "Muscle contraction amplitude measurement",
        "Frequency analysis: 20-500 Hz",
        "Adjustable gain control"
      ],
      accentColor: "text-sky-400",
      bgAccent: "bg-sky-500/10",
      borderAccent: "border-sky-500/20"
    },
    {
      icon: Gauge,
      name: "MPU-6050 Motion Sensor",
      description: "6-axis gyroscope and accelerometer",
      features: [
        "Tremor frequency detection (0.1-20 Hz)",
        "Movement pattern analysis",
        "Digital output with 16-bit ADCs"
      ],
      accentColor: "text-emerald-400",
      bgAccent: "bg-emerald-500/10",
      borderAccent: "border-emerald-500/20"
    },
    {
      icon: Thermometer,
      name: "MAX30205 Temperature Sensor",
      description: "High-precision body temperature monitoring",
      features: [
        "±0.1°C accuracy",
        "Temperature compensation for sensor calibration",
        "I2C digital interface"
      ],
      accentColor: "text-amber-400",
      bgAccent: "bg-amber-500/10",
      borderAccent: "border-amber-500/20"
    },
    {
      icon: MonitorSpeaker,
      name: "MAX30102 Pulse Oximeter",
      description: "SpO2 oxygen saturation measurement",
      features: [
        "Heart rate monitoring",
        "Red and infrared LED configuration",
        "Real-time pulse waveform analysis"
      ],
      accentColor: "text-violet-400",
      bgAccent: "bg-violet-500/10",
      borderAccent: "border-violet-500/20"
    },
    {
      icon: Mic,
      name: "INMP441 Digital Microphone",
      description: "High-fidelity speech capture",
      features: [
        "I2S digital audio interface",
        "Voice pattern analysis compatibility",
        "Low-noise, high SNR design"
      ],
      accentColor: "text-indigo-400",
      bgAccent: "bg-indigo-500/10",
      borderAccent: "border-indigo-500/20"
    }
  ];

  const systemSpecs = [
    {
      icon: Cpu,
      name: "Raspberry Pi Zero",
      description: "Compact single-board computer",
      specs: [
        "ARM11 single-core processor",
        "Wi-Fi and Bluetooth connectivity",
        "MicroSD card storage",
        "Real-time data processing capabilities"
      ]
    },
    {
      icon: Battery,
      name: "3000mAh Li-ion Battery",
      description: "Extended operation power system",
      specs: [
        "8-10 hours continuous operation",
        "USB-C fast charging",
        "Battery level monitoring",
        "Low-power sleep modes"
      ]
    }
  ];

  const statsData = [
    { value: "6+", label: "Medical-Grade Sensors", color: "text-teal-400" },
    { value: "8-10h", label: "Battery Life", color: "text-emerald-400" },
    { value: "Real-time", label: "Data Processing", color: "text-violet-400" },
    { value: "Wi-Fi", label: "Connectivity", color: "text-amber-400" }
  ];

  const applications = [
    {
      icon: Brain,
      name: "Parkinson's Disease",
      description: "Early detection through tremor analysis and motor function assessment",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20"
    },
    {
      icon: Waves,
      name: "Alzheimer's Disease",
      description: "Cognitive screening through voice pattern and motor coordination analysis",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20"
    },
    {
      icon: Activity,
      name: "Epilepsy",
      description: "Seizure detection and monitoring through comprehensive sensor fusion",
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />

      <main className="pt-28 pb-24 px-6 flex-1">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-white/60 text-sm">Professional Medical Hardware</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              <span className="text-teal-400">HealthScan</span> Device
            </h1>
            
            <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Professional-grade neurological screening hardware combining multiple medical-grade sensors
              with our web platform for early detection of neurological conditions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 text-sm font-medium border border-teal-500/20">
                ABDM Integrated
              </span>
              <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                Government Approved
              </span>
            </div>
          </section>

          {/* Flagship Device Showcase */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold uppercase tracking-wider border border-teal-500/20">
                Flagship Reference Hardware
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">HealthScan Neuro Hub v1.0</h2>
              <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
                Next-generation bedside and clinic diagnostic station featuring circular OLED vitals telemetry, magnetic biometric leads, and sub-millisecond edge signal processing.
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-white/[0.02] shadow-2xl group">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-7 relative overflow-hidden bg-slate-950">
                  <img 
                    src="/images/hardware-hub.jpg" 
                    alt="HealthScan Neuro Diagnostic Hardware Hub" 
                    className="w-full h-80 sm:h-96 lg:h-[460px] object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#0a0f1d] pointer-events-none opacity-80 lg:opacity-100" />
                </div>
                
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-xs font-mono text-teal-400 font-semibold uppercase tracking-wider">Active Sensor Telemetry</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Titanium Neuro Diagnostic Hub</h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Engineered in brushed aerospace titanium with a high-contrast circular OLED display rendering real-time PPG pulse waves, SpO2 plethysmography, and multi-channel EMG muscle signals.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-white/40 block text-[11px]">Display Interface</span>
                      <span className="font-semibold text-white">Circular High-PPI OLED</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-white/40 block text-[11px]">Leads & Probes</span>
                      <span className="font-semibold text-teal-400">Magnetic Quick-Lock</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-white/40 block text-[11px]">Telemetry</span>
                      <span className="font-semibold text-white">BLE 5.3 & Wi-Fi 6</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-white/40 block text-[11px]">EHR Protocol</span>
                      <span className="font-semibold text-emerald-400">ABDM FHIR R4 Ready</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Patent-Pending Optical Sensor Array</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Device Showcase */}
          <section className="space-y-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center">Form Factor Iterations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((num) => (
                <div 
                  key={num} 
                  className="group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden hover:bg-white/[0.06] transition-all duration-500"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={`/idea${num}.png`}
                      alt={`HealthScan Device Concept ${num}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-white text-center">
                      Concept {num}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Overview */}
          <section className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-10">
            <h2 className="text-3xl font-semibold text-white mb-6 text-center">Overview</h2>
            <p className="text-lg text-white/60 leading-relaxed text-center max-w-4xl mx-auto">
              The HealthScan device is a comprehensive, wearable neurological screening kit designed for primary healthcare settings.
              By combining multiple medical-grade sensors with our web platform, it enables early detection of neurological
              conditions including Parkinson's disease, Alzheimer's disease, and epilepsy.
            </p>
          </section>

          {/* Core Sensor Array */}
          <section className="space-y-12">
            <h2 className="text-3xl font-semibold text-white text-center">Core Sensor Array</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensorSpecs.map((sensor, index) => {
                const IconComponent = sensor.icon;
                return (
                  <div 
                    key={index} 
                    className="group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className={`inline-flex p-4 rounded-xl ${sensor.bgAccent} border ${sensor.borderAccent} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-7 h-7 ${sensor.accentColor}`} />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{sensor.name}</h3>
                    <p className="text-white/50 mb-6">{sensor.description}</p>
                    
                    <ul className="space-y-3">
                      {sensor.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-white/60">
                          <span className={`w-1.5 h-1.5 rounded-full ${sensor.accentColor.replace('text-', 'bg-')} mt-2 flex-shrink-0`}></span>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Processing & Power Systems */}
          <section className="space-y-12">
            <h2 className="text-3xl font-semibold text-white text-center">Processing & Power Systems</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {systemSpecs.map((system, index) => {
                const IconComponent = system.icon;
                return (
                  <div 
                    key={index} 
                    className="group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className="flex items-start gap-5 mb-6">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <IconComponent className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{system.name}</h3>
                        <p className="text-white/50 mt-1">{system.description}</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-4">
                      {system.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-white/60">
                          <Zap className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Technical Specifications */}
          <section className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-10">
            <h2 className="text-3xl font-semibold text-white mb-10 text-center">
              Technical Specifications
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {statsData.map((stat, idx) => (
                <div key={idx} className="text-center p-6 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <div className={`text-4xl font-bold ${stat.color} mb-3`}>{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Target Applications */}
          <section className="space-y-12">
            <h2 className="text-3xl font-semibold text-white text-center">Target Applications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {applications.map((app, idx) => {
                const IconComponent = app.icon;
                return (
                  <div 
                    key={idx} 
                    className={`group text-center p-10 rounded-2xl ${app.bgColor} border ${app.borderColor} hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className={`inline-flex p-5 rounded-2xl bg-white/[0.06] mb-6`}>
                      <IconComponent className={`w-10 h-10 ${app.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{app.name}</h3>
                    <p className="text-white/50">{app.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-semibold text-white mb-4">
              Experience HealthScan
            </h3>
            <p className="text-white/60 mb-10 text-lg">
              Try our AI-powered neurological screening platform and discover how technology
              is revolutionizing early detection and healthcare accessibility.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/labs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-400 transition-all duration-300"
              >
                Try the Labs
                <ChevronRight className="w-5 h-5" />
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl font-semibold transition-all duration-300 border border-white/[0.06]"
              >
                Learn More
              </a>
            </div>
          </section>
          
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
};

export default DeviceModel;
