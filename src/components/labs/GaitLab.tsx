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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-[calc(100vh-80px)] bg-background/50 backdrop-blur-sm">
      {/* Left Panel: Video Feed */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-slate-900/40 backdrop-blur-md relative group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-lg font-medium">Precision Video Analysis</CardTitle>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {isRecording ? 'LIVE STREAM' : 'STANDBY'}
            </Badge>
          </CardHeader>
          <div className="relative aspect-video bg-neutral-900 mx-4 mb-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full z-10"
            />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
                <Button 
                  onClick={toggleRecording}
                  size="lg"
                  className="rounded-full w-16 h-16 bg-primary hover:scale-110 transition-transform shadow-lg shadow-primary/50"
                >
                  <Play className="fill-current" />
                </Button>
              </div>
            )}
            
            {/* UI Overlays */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
               {isRecording && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10"
                 >
                   <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">FPS</p>
                   <p className="text-xl font-mono text-primary font-bold">30.0</p>
                 </motion.div>
               )}
            </div>
          </div>
          
          <div className="p-4 pt-0 flex justify-center gap-4">
             {isRecording && (
               <Button 
                 onClick={toggleRecording}
                 variant="destructive"
                 className="w-full max-w-[200px] shadow-lg shadow-red-500/20"
               >
                 <Square className="mr-2 h-4 w-4" /> Stop Analysis
               </Button>
             )}
          </div>
        </Card>

        {/* Real-time Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900/40 border-primary/10">
            <CardHeader className="p-4 pb-0">
               <CardTitle className="text-sm font-medium flex items-center gap-2">
                 <Pulse className="w-4 h-4 text-primary" /> Postural Stability
               </CardTitle>
            </CardHeader>
            <div className="h-[200px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeHistory}>
                  <defs>
                    <linearGradient id="stabilityColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4facfe" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4facfe" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="stability" stroke="#4facfe" fillOpacity={1} fill="url(#stabilityColor)" strokeWidth={3} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-slate-900/40 border-primary/10">
            <CardHeader className="p-4 pb-0">
               <CardTitle className="text-sm font-medium flex items-center gap-2">
                 <Layers className="w-4 h-4 text-purple-400" /> Gait Symmetry
               </CardTitle>
            </CardHeader>
            <div className="h-[200px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="symmetry" stroke="#a855f7" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Panel: AI Insights */}
      <div className="space-y-6">
        <Card className="bg-slate-900/60 border-primary/20 backdrop-blur-xl h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Clinical Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between mb-2">
                   <span className="text-sm text-white/50">Overall Balance</span>
                   <span className="font-mono text-primary">{metrics?.balance?.toFixed(1) || 0}%</span>
                 </div>
                 <Progress value={metrics?.balance || 0} className="h-2 bg-white/5" />
               </div>
               
               <div>
                 <div className="flex justify-between mb-2">
                   <span className="text-sm text-white/50">Lateral Sway</span>
                   <span className="font-mono text-purple-400">{(metrics?.stability?.lateralSway || 0).toFixed(2)} cm</span>
                 </div>
                 <Progress value={(metrics?.stability?.lateralSway || 0) * 5} className="h-2 bg-white/5" />
               </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-xs uppercase tracking-widest font-bold text-white/40 mb-4 flex items-center gap-2">
                <Info className="w-3 h-3" /> AI Clinical Assessment
              </h4>
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key="recording"
                    className="p-4 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <p className="text-sm leading-relaxed text-white/80">
                      Analyzing gait cycles... detecting stance and swing phases. Tracking center of mass trajectory.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="idle"
                    className="p-6 rounded-xl bg-white/5 border border-white/10 text-center"
                  >
                    <Wind className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-sm text-white/40">
                      Start recording to generate a live neural assessment based on gait patterns.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6">
               <Card className="bg-blue-500/10 border-blue-500/20 p-4">
                 <div className="flex items-start gap-4">
                   <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Ruler className="w-4 h-4 text-blue-400" />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Clinical Note</p>
                     <p className="text-sm text-blue-100/80 mt-1">
                       Keep the camera at hip height for best joint angle estimation results.
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
