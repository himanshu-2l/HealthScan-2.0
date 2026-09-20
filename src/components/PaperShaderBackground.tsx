import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const PaperShaderBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { colors, currentTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      time += 0.01;
      
      // Clear canvas with theme-based background
      const themeBackgrounds = {
        violet: '#0a0a1f',
        blue: '#0a0f1a',
        purple: '#0f0a1f',
        cosmic: '#0a0f1f'
      };
      ctx.fillStyle = themeBackgrounds[currentTheme] || themeBackgrounds.violet;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create flowing energy patterns
      const gradient1 = ctx.createRadialGradient(
        canvas.width * 0.3 + Math.sin(time) * 200,
        canvas.height * 0.4 + Math.cos(time * 0.8) * 150,
        0,
        canvas.width * 0.3 + Math.sin(time) * 200,
        canvas.height * 0.4 + Math.cos(time * 0.8) * 150,
        400
      );
      // Theme-based gradient colors
      const themeGradients = {
        violet: { r: 139, g: 92, b: 246 }, // violet-500
        blue: { r: 59, g: 130, b: 246 },   // blue-500
        purple: { r: 147, g: 51, b: 234 }, // purple-600
        cosmic: { r: 99, g: 102, b: 241 }  // indigo-500
      };
      const primaryColor = themeGradients[currentTheme] || themeGradients.violet;
      
      gradient1.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.3)`);
      gradient1.addColorStop(0.5, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.1)`);
      gradient1.addColorStop(1, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.7 + Math.cos(time * 1.2) * 180,
        canvas.height * 0.6 + Math.sin(time * 0.9) * 120,
        0,
        canvas.width * 0.7 + Math.cos(time * 1.2) * 180,
        canvas.height * 0.6 + Math.sin(time * 0.9) * 120,
        350
      );
      const themeSecondary = {
        violet: { r: 167, g: 139, b: 250 }, // violet-400
        blue: { r: 96, g: 165, b: 250 },    // blue-400
        purple: { r: 168, g: 85, b: 247 },  // purple-500
        cosmic: { r: 139, g: 92, b: 246 }   // violet-500
      };
      const secondaryColor = themeSecondary[currentTheme] || themeSecondary.violet;
      
      gradient2.addColorStop(0, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.4)`);
      gradient2.addColorStop(0.5, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.15)`);
      gradient2.addColorStop(1, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0)`);

      const gradient3 = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.sin(time * 0.7) * 160,
        canvas.height * 0.3 + Math.cos(time * 1.1) * 140,
        0,
        canvas.width * 0.5 + Math.sin(time * 0.7) * 160,
        canvas.height * 0.3 + Math.cos(time * 1.1) * 140,
        300
      );
      const themeAccent = {
        violet: { r: 192, g: 132, b: 252 }, // violet-300
        blue: { r: 147, g: 197, b: 253 },   // blue-300
        purple: { r: 192, g: 132, b: 252 }, // purple-400
        cosmic: { r: 6, g: 182, b: 212 }    // cyan-500
      };
      const accentColor = themeAccent[currentTheme] || themeAccent.violet;
      
      gradient3.addColorStop(0, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.25)`);
      gradient3.addColorStop(0.5, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.08)`);
      gradient3.addColorStop(1, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0)`);

      // Apply gradients
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add flowing lines/connections
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < 5; i++) {
        const x1 = canvas.width * (0.2 + i * 0.15) + Math.sin(time + i) * 100;
        const y1 = canvas.height * 0.5 + Math.cos(time * 0.8 + i) * 200;
        const x2 = canvas.width * (0.3 + i * 0.15) + Math.sin(time + i + 1) * 120;
        const y2 = canvas.height * 0.5 + Math.cos(time * 0.8 + i + 1) * 180;
        
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(
          (x1 + x2) / 2 + Math.sin(time * 2) * 50,
          (y1 + y2) / 2 + Math.cos(time * 2) * 50,
          x2, y2
        );
      }
      ctx.stroke();

      // Add subtle noise texture
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] += noise;     // Red
        data[i + 1] += noise; // Green
        data[i + 2] += noise; // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);

      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)' }}
    />
  );
};