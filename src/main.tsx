import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Critical mounting error:", error);
    rootElement.innerHTML = `
      <div style="min-height:100vh;background:#070A11;color:#f8fafc;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;padding:24px;text-align:center;">
        <div style="max-width:440px;background:#0F172A;border:1px solid #1E293B;border-radius:16px;padding:32px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#041316;font-weight:900;font-size:18px;">HS</div>
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">HealthScan Initializing</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 20px;">The application is reloading with the latest clinical assets. Click below to continue.</p>
          <button onclick="window.location.reload(true)" style="width:100%;padding:12px 20px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">Launch App</button>
        </div>
      </div>
    `;
  }
}

// Register PWA Service Worker for installability and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}
