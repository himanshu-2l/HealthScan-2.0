import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Play, Square, Info, Layers, Wind, Ruler, Activity as Pulse } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { startGaitAnalysis, stopGaitAnalysis } from '@/services/labs/gaitService';

const GaitLab = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [realtimeHistory, setRealtimeHistory] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    if (isRecording) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      stopGaitAnalysis();
      setIsRecording(false);
    } else {
      if (videoRef.current) {
        setIsRecording(true);
        startGaitAnalysis(videoRef.current, (data) => {
          setMetrics(data);
          setRealtimeHistory(prev => [...prev.slice(-30), {
            time: new Date().toLocaleTimeString(),
            stability: data.stability.score,
            balance: data.balance,
            symmetry: data.symmetry.overall
          }]);
          
          if (canvasRef.current && data.keypoints) {
            drawPose(canvasRef.current, data.keypoints);
          }
        });
      }
    }
  };

  const drawPose = (canvas: HTMLCanvasElement, keypoints: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle']
    ];

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    connections.forEach(([p1, p2]) => {
      const kp1 = keypoints.find(k => k.name === p1);
      const kp2 = keypoints.find(k => k.name === p2);
      if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach(kp => {
      if (kp.score > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#4facfe';
        ctx.stroke();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
      {/* Left Panel: Video Feed */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm relative group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Precision Gait Kinematics</CardTitle>
            </div>
            <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 text-xs">
              {isRecording ? 'STREAMING ACTIVE' : 'CALIBRATED STANDBY'}
            </Badge>
          </CardHeader>
          <div className="relative aspect-video bg-slate-950 mx-4 my-4 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full z-10"
            />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] z-20">
                <Button 
                  onClick={toggleRecording}
                  size="lg"
                  className="rounded-full w-14 h-14 bg-teal-600 hover:bg-teal-700 hover:scale-105 transition-all shadow-lg text-white"
                >
                  <Play className="fill-current w-5 h-5 ml-0.5" />
                </Button>
              </div>
            )}
            
            {/* UI Overlays */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
               {isRecording && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-xs"
                 >
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">RATE</p>
                   <p className="text-sm font-mono text-teal-400 font-bold">30.0 FPS</p>
                 </motion.div>
               )}
            </div>
          </div>
          
          <div className="p-4 pt-0 flex justify-center gap-4">
             {isRecording && (
               <Button 
                 onClick={toggleRecording}
                 variant="destructive"
                 className="w-full max-w-[200px] shadow-sm rounded-xl"
               >
                 <Square className="mr-2 h-4 w-4" /> Stop Gait Analysis
               </Button>
             )}
          </div>
        </Card>

        {/* Real-time Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-0">
               <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                 <Pulse className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Postural Center Stability
               </CardTitle>
            </CardHeader>
            <div className="h-[180px] p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeHistory}>
                  <defs>
                    <linearGradient id="stabilityColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e130" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="stability" stroke="#3b82f6" fillOpacity={1} fill="url(#stabilityColor)" strokeWidth={2.5} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-0">
               <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                 <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Bilateral Gait Symmetry
               </CardTitle>
            </CardHeader>
            <div className="h-[180px] p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e130" vertical={false} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="symmetry" stroke="#a855f7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Panel: AI Insights */}
      <div className="space-y-6">
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Clinical Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between mb-1.5 text-xs sm:text-sm">
                   <span className="text-slate-600 dark:text-slate-400">Overall Balance Score</span>
                   <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{metrics?.balance?.toFixed(1) || 0}%</span>
                 </div>
                 <Progress value={metrics?.balance || 0} className="h-2 bg-slate-100 dark:bg-white/10" />
               </div>
               
               <div>
                 <div className="flex justify-between mb-1.5 text-xs sm:text-sm">
                   <span className="text-slate-600 dark:text-slate-400">Lateral Sway Deviation</span>
                   <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{(metrics?.stability?.lateralSway || 0).toFixed(2)} cm</span>
                 </div>
                 <Progress value={(metrics?.stability?.lateralSway || 0) * 5} className="h-2 bg-slate-100 dark:bg-white/10" />
               </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> AI Kinematic Assessment
              </h4>
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key="recording"
                    className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30"
                  >
                    <p className="text-xs sm:text-sm leading-relaxed text-teal-950 dark:text-teal-200">
                      Tracking stance and swing phases across step cycles. Joint angles and center-of-mass trajectory in tolerance.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="idle"
                    className="p-5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-center"
                  >
                    <Wind className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Start recording to generate live kinematic trajectory and neural assessment.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-2">
               <Card className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 p-3.5 rounded-xl">
                 <div className="flex items-start gap-3">
                   <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                      <Ruler className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Protocol Guidance</p>
                     <p className="text-xs text-blue-900 dark:text-blue-200 mt-0.5 leading-relaxed">
                       Keep the camera stable at hip height with full lower-limb visibility.
                     </p>
                   </div>
                 </div>
               </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GaitLab;
