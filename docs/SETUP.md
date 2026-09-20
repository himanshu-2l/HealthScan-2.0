# 🚀 NeuroScan Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Gemini AI API Key (for ChatBot)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# ABDM (Ayushman Bharat Digital Mission) Configuration
VITE_ABDM_BASE_URL=https://dev.abdm.gov.in/gateway
VITE_ABDM_CLIENT_ID=your_abdm_client_id_here
VITE_ABDM_CLIENT_SECRET=your_abdm_client_secret_here
VITE_ABDM_SANDBOX=true  # Set to false for production
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Feature Configuration

### EHR Integration (Sandbox Mode - Default)

By default, EHR integration runs in **sandbox mode** with demo data:
- ✅ No ABDM credentials required
- ✅ Pre-populated demo patient data
- ✅ Simulated authentication
- ✅ Test uploads logged to console

**To test EHR features:**
1. Navigate to `/ehr` page
2. Enter any ABHA ID (e.g., `12-3456-7890-1234`)
3. Click "Connect ABHA ID"
4. Demo data will be loaded automatically

### EHR Integration (Production Mode)

To enable real ABDM integration:

1. **Register with ABDM**
   - Visit: https://ndhm.gov.in/
   - Apply for Health Information User (HIU) access
   - Get API credentials (Client ID & Secret)

2. **Update Environment Variables**
   ```env
   VITE_ABDM_CLIENT_ID=your_real_client_id
   VITE_ABDM_CLIENT_SECRET=your_real_client_secret
   VITE_ABDM_SANDBOX=false
   ```

3. **Test Integration**
   - Use real ABHA IDs
   - Complete authentication flow
   - Verify data upload to ABDM

### Gemini AI ChatBot

To enable the AI ChatBot:

1. **Get Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key

2. **Add to Environment**
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Alternative: Use Settings UI**
   - Click Settings icon in navbar
   - Enter API key in "Gemini API Key" field
   - Key is stored in browser localStorage

## Project Structure

```
neuralab-app-main/
├── src/
│   ├── components/
│   │   ├── labs/              # Test components
│   │   │   ├── MotorLab.tsx   # Parkinson's motor tests
│   │   │   ├── VoiceLab.tsx   # Voice analysis
│   │   │   ├── EyeLab.tsx     # Cognitive tests
│   │   │   ├── DigitSpanTest.tsx  # Memory span test
│   │   │   └── WordListTest.tsx   # Alzheimer's screening
│   │   ├── EHRIntegration.tsx # EHR UI component
│   │   ├── ChatBot.tsx        # AI chatbot
│   │   └── ...
│   ├── contexts/
│   │   ├── ThemeContext.tsx   # Theme management
│   │   ├── SettingsContext.tsx # App settings
│   │   └── EHRContext.tsx     # EHR state management
│   ├── services/
│   │   └── ehrService.ts      # ABDM API integration
│   ├── types/
│   │   └── ehr.ts             # EHR TypeScript types
│   ├── pages/
│   │   ├── Index.tsx          # Home page
│   │   ├── Labs.tsx           # Labs page
│   │   ├── EHRPage.tsx        # EHR integration page
│   │   └── ...
│   └── App.tsx                # Main app component
├── docs/
│   ├── EHR_INTEGRATION.md     # EHR documentation
│   └── SETUP.md               # This file
└── package.json
```

## Available Routes

- `/` - Home page
- `/labs` - Neurological tests
  - `/labs/motor` - Motor function tests (Parkinson's)
  - `/labs/voice` - Voice analysis
  - `/labs/eye` - Cognitive & eye tests
- `/ehr` - EHR integration (ABDM)
- `/purpose` - Project purpose
- `/hardware-integration` - Hardware specs
- `/device-model` - Device information
- `/about` - About the team

## Testing EHR Features

### Sandbox Mode Testing

1. **ABHA Authentication**
   ```
   ABHA ID: 12-3456-7890-1234 (any format works)
   Auth Mode: MOBILE_OTP (automatic in sandbox)
   ```

2. **Demo Patient Data**
   - Name: Demo Patient
   - Age: 67
   - Conditions: Hypertension, Type 2 Diabetes
   - Medications: Metformin, Amlodipine
   - Allergies: Penicillin

3. **Test Upload**
   - Complete any neurological test
   - Results automatically "uploaded" (logged to console)
   - Check browser console for FHIR format

### Production Mode Testing

1. **Real ABHA ID Required**
   - Get ABHA ID from: https://abha.abdm.gov.in/
   - Format: XX-XXXX-XXXX-XXXX

2. **Authentication Flow**
   - Enter real ABHA ID
   - Complete OTP verification
   - Grant consent for data access

3. **Data Verification**
   - Check ABDM portal for uploaded records
   - Verify FHIR format compliance

## Troubleshooting

### Common Issues

**Issue**: Vite dev server not starting
- **Solution**: Delete `node_modules` and run `npm install` again

**Issue**: "Module not found" errors
- **Solution**: Check import paths, ensure all dependencies are installed

**Issue**: EHR features not working
- **Solution**: Verify `VITE_ABDM_SANDBOX=true` in `.env` file

**Issue**: ChatBot not responding
- **Solution**: Check Gemini API key in Settings or `.env` file

**Issue**: Tests not loading
- **Solution**: Check browser console for errors, ensure MediaPipe models are loaded

### Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ⚠️ Some features may require permissions (camera, microphone)
- **Mobile**: ✅ Responsive design, touch-friendly

### Performance Tips

1. **Use Chrome DevTools** to monitor performance
2. **Disable unnecessary features** in Settings if experiencing lag
3. **Clear browser cache** if experiencing stale data issues
4. **Use incognito mode** for clean testing environment

## Development Workflow

### Adding New Features

1. Create feature branch
2. Implement changes
3. Test locally
4. Check linter errors: `npm run lint`
5. Build for production: `npm run build`
6. Test production build: `npm run preview`

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: Context API for global state
- **API**: Service layer pattern

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment Variables for Production

Ensure all production environment variables are set:
- `VITE_GEMINI_API_KEY` - Real API key
- `VITE_ABDM_SANDBOX=false` - Production mode
- `VITE_ABDM_CLIENT_ID` - Real ABDM client ID
- `VITE_ABDM_CLIENT_SECRET` - Real ABDM client secret

### Deployment Platforms

- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Use `gh-pages` package

## Support & Documentation

- **EHR Integration**: See `docs/EHR_INTEGRATION.md`
- **ABDM Portal**: https://ndhm.gov.in/
- **Gemini AI**: https://ai.google.dev/
- **Shadcn UI**: https://ui.shadcn.com/
