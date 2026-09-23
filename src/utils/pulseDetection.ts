/**
 * Pulse Detection Utility
 * Camera-based photoplethysmography (PPG) for heart rate detection
 * 
 * @references
 * - American Heart Association. Target Heart Rates Chart. https://www.heart.org/
 * - Poh MZ, McDuff DJ, Picard RW. Non-contact, automated cardiac pulse measurements using video imaging and blind source separation. Optics Express. 2010;18(10):10762-10774.
 */

/**
 * Heart Rate Reference Ranges (beats per minute)
 * @reference American Heart Association, Mayo Clinic
 */
export const HR_RANGES = {
  BRADYCARDIA: { max: 60, label: 'Bradycardia', description: 'Below normal resting heart rate' },
  NORMAL: { min: 60, max: 100, label: 'Normal', description: 'Normal resting heart rate' },
  TACHYCARDIA: { min: 100, label: 'Tachycardia', description: 'Above normal resting heart rate' },
  ATHLETE_NORMAL: { min: 40, max: 60, label: 'Athletic Normal', description: 'Normal for well-trained athletes' }
} as const;

/** Heart rate classification for clinical flagging */
export type HeartRateClassification = 'bradycardia' | 'normal' | 'tachycardia' | 'athlete-normal' | 'critical-low' | 'critical-high';

/** Confidence level for pulse readings */
export type ConfidenceLevel = 'low' | 'moderate' | 'high' | 'very-high';

export interface PulseData {
  bpm: number;
  timestamp: number;
  confidence: number;
  classification: HeartRateClassification;
  confidenceLevel: ConfidenceLevel;
  isAbnormal: boolean;
  clinicalFlag?: string;
}

export interface PulseWaveform {
  samples: number[];
  timestamps: number[];
  sampleRate: number;
}

/** PPG operation mode: fingertip contact with rear camera + flash, or facial rPPG with front camera */
export type PPGMode = 'fingertip' | 'face';

/** Callback signature delivering pulse, confidence, RR intervals, estimated SpO2, finger contact status, and beat trigger */
export type PulseUpdateCallback = (
  bpm: number,
  confidence: number,
  rrIntervals?: number[],
  spo2?: number | null,
  fingerDetected?: boolean,
  isBeat?: boolean
) => void;

/**
 * Check if the active video track supports hardware torch (flashlight)
 */
export async function checkTorchSupport(stream?: MediaStream | null): Promise<boolean> {
  try {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track || typeof track.getCapabilities !== 'function') return false;
    const capabilities = track.getCapabilities() as { torch?: boolean };
    return Boolean(capabilities?.torch);
  } catch {
    return false;
  }
}

/**
 * Enable or disable hardware camera flashlight (torch)
 */
export async function setTorchState(stream: MediaStream | null, enabled: boolean): Promise<boolean> {
  try {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    const isSupported = await checkTorchSupport(stream);
    if (!isSupported) return false;

    await track.applyConstraints({
      advanced: [{ torch: enabled } as any]
    });
    return true;
  } catch (err) {
    console.warn('Failed to set torch constraint:', err);
    return false;
  }
}

/**
 * Classify heart rate according to clinical standards
 * @param bpm - Heart rate in beats per minute
 * @param isAthlete - Whether the person is a trained athlete
 * @returns Classification with clinical context
 * 
 * @reference American Heart Association target heart rate guidelines
 */
export function classifyHeartRate(
  bpm: number,
  isAthlete: boolean = false
): { classification: HeartRateClassification; isAbnormal: boolean; description: string; clinicalFlag?: string } {
  // Critical thresholds requiring immediate attention
  if (bpm < 40) {
    return {
      classification: 'critical-low',
      isAbnormal: true,
      description: 'Critically low heart rate - requires immediate medical attention',
      clinicalFlag: 'URGENT: Severe bradycardia detected (<40 BPM)'
    };
  }
  
  if (bpm > 150) {
    return {
      classification: 'critical-high',
      isAbnormal: true,
      description: 'Critically high heart rate at rest - requires medical attention',
      clinicalFlag: 'URGENT: Severe tachycardia detected (>150 BPM at rest)'
    };
  }
  
  // Bradycardia: <60 BPM (normal for athletes)
  if (bpm < HR_RANGES.BRADYCARDIA.max) {
    if (isAthlete && bpm >= HR_RANGES.ATHLETE_NORMAL.min) {
      return {
        classification: 'athlete-normal',
        isAbnormal: false,
        description: `Heart rate ${bpm} BPM is within normal range for trained athletes (40-60 BPM)`
      };
    }
    return {
      classification: 'bradycardia',
      isAbnormal: true,
      description: `Heart rate ${bpm} BPM is below normal (<60 BPM). May require evaluation if symptomatic.`,
      clinicalFlag: 'Bradycardia detected - consider evaluation if experiencing symptoms (dizziness, fatigue, fainting)'
    };
  }
  
  // Tachycardia: >100 BPM at rest
  if (bpm >= HR_RANGES.TACHYCARDIA.min) {
    return {
      classification: 'tachycardia',
      isAbnormal: true,
      description: `Heart rate ${bpm} BPM is above normal resting range (>100 BPM). May require evaluation.`,
      clinicalFlag: 'Tachycardia detected - consider evaluation if persistent or symptomatic'
    };
  }
  
  // Normal: 60-100 BPM
  return {
    classification: 'normal',
    isAbnormal: false,
    description: `Heart rate ${bpm} BPM is within normal resting range (60-100 BPM)`
  };
}

/**
 * Calculate confidence level from numeric confidence score
 * @param confidence - Confidence score (0-1)
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'very-high';
  if (confidence >= 0.6) return 'high';
  if (confidence >= 0.4) return 'moderate';
  return 'low';
}

/**
 * Validate BPM reading against physiological limits
 * @param bpm - Heart rate reading
 * @returns Validation result
 */
export function validateBPM(bpm: number): { valid: boolean; reason?: string } {
  if (bpm < 20) {
    return { valid: false, reason: 'Heart rate too low to be physiologically possible' };
  }
  if (bpm > 250) {
    return { valid: false, reason: 'Heart rate too high to be physiologically possible' };
  }
  return { valid: true };
}

class PulseDetector {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private isRunning: boolean = false;
  
  // Signal processing
  private redValues: number[] = [];
  private greenValues: number[] = [];
  private blueValues: number[] = [];
  private timestamps: number[] = [];
  private readonly maxSamples = 300; // ~10 seconds at 30fps
  
  // PPG mode and contact status
  private mode: PPGMode = 'fingertip';
  private fingerDetected: boolean = false;
  private consecutiveFingerFrames: number = 0;
  private consecutiveNoFingerFrames: number = 0;
  private latestSpo2: number | null = null;

  // Face or finger detection region
  private detectionRegion: { x: number; y: number; width: number; height: number } | null = null;

  // Callbacks
  private onPulseUpdate: PulseUpdateCallback | null = null;
  private onError: ((error: string) => void) | null = null;
  private lastRRIntervals: number[] = [];
  private lastBeatTimestamp: number = 0;

  /**
   * Set active PPG mode: 'fingertip' (rear camera + torch) or 'face' (front camera rPPG)
   */
  setMode(mode: PPGMode): void {
    this.mode = mode;
    this.detectionRegion = null;
  }

  getMode(): PPGMode {
    return this.mode;
  }

  isFingerDetected(): boolean {
    return this.fingerDetected;
  }

  getLatestSpo2(): number | null {
    return this.latestSpo2;
  }

  /**
   * Initialize pulse detection with video element
   */
  initialize(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    this.videoElement = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }
  }

  /**
   * Set detection region
   */
  setDetectionRegion(x: number, y: number, width: number, height: number): void {
    this.detectionRegion = { x, y, width, height };
  }

  /**
   * Start pulse detection
   */
  start(
    onPulseUpdate: PulseUpdateCallback,
    onError?: (error: string) => void
  ): void {
    if (!this.videoElement || !this.canvas || !this.ctx) {
      throw new Error('Pulse detector not initialized');
    }

    this.onPulseUpdate = onPulseUpdate;
    this.onError = onError || null;
    this.isRunning = true;
    this.redValues = [];
    this.greenValues = [];
    this.blueValues = [];
    this.timestamps = [];
    this.lastRRIntervals = [];

    // Region of interest adapts dynamically to test mode
    if (!this.detectionRegion) {
      const videoWidth = this.videoElement.videoWidth || 640;
      const videoHeight = this.videoElement.videoHeight || 480;

      if (this.mode === 'fingertip') {
        // Central 70% aperture for contact finger capillary illumination
        this.detectionRegion = {
          x: videoWidth * 0.15,
          y: videoHeight * 0.15,
          width: videoWidth * 0.7,
          height: videoHeight * 0.7
        };
      } else {
        // Upper-center forehead region for facial rPPG
        this.detectionRegion = {
          x: videoWidth * 0.3,
          y: videoHeight * 0.1,
          width: videoWidth * 0.4,
          height: videoHeight * 0.15
        };
      }
    }

    this.processFrame();
  }

  /**
   * Stop pulse detection
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Process video frame for pulse detection
   */
  private processFrame(): void {
    if (!this.isRunning || !this.videoElement || !this.canvas || !this.ctx) {
      return;
    }

    try {
      const vw = this.videoElement.videoWidth || 640;
      const vh = this.videoElement.videoHeight || 480;

      // Dynamically sync canvas size without allocating unnecessarily
      if (this.canvas.width !== vw || this.canvas.height !== vh) {
        this.canvas.width = vw;
        this.canvas.height = vh;
      }

      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Dynamically ensure detection region matches active video dimensions
      if (!this.detectionRegion || this.detectionRegion.width <= 10 || this.detectionRegion.height <= 10) {
        if (this.mode === 'fingertip') {
          this.detectionRegion = {
            x: Math.round(vw * 0.15),
            y: Math.round(vh * 0.15),
            width: Math.max(20, Math.round(vw * 0.7)),
            height: Math.max(20, Math.round(vh * 0.7))
          };
        } else {
          this.detectionRegion = {
            x: Math.round(vw * 0.3),
            y: Math.round(vh * 0.1),
            width: Math.max(20, Math.round(vw * 0.4)),
            height: Math.max(20, Math.round(vh * 0.15))
          };
        }
      }

      // Safely clamp region inside canvas bounds to guarantee no IndexSizeError
      const regX = Math.max(0, Math.min(this.canvas.width - 2, Math.round(this.detectionRegion.x)));
      const regY = Math.max(0, Math.min(this.canvas.height - 2, Math.round(this.detectionRegion.y)));
      const regW = Math.max(1, Math.min(this.canvas.width - regX, Math.round(this.detectionRegion.width)));
      const regH = Math.max(1, Math.min(this.canvas.height - regY, Math.round(this.detectionRegion.height)));

      // Extract pixel data from detection region
      const imageData = this.ctx.getImageData(regX, regY, regW, regH);

      // Calculate average RGB values and spatial variance across pixels
      let rSum = 0, gSum = 0, bSum = 0;
      let rSqSum = 0;
      const pixelCount = imageData.data.length / 4;

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        rSum += r;
        gSum += g;
        bSum += b;
        rSqSum += r * r;
      }

      const avgRed = rSum / pixelCount;
      const avgGreen = gSum / pixelCount;
      const avgBlue = bSum / pixelCount;
      const rVariance = Math.max(0, (rSqSum / pixelCount) - (avgRed * avgRed));

      // Strict physiological finger coverage verification in fingertip mode
      if (this.mode === 'fingertip') {
        const totalBrightness = avgRed + avgGreen + avgBlue;
        const redRatio = totalBrightness > 0 ? avgRed / totalBrightness : 0;

        // True contact PPG physics:
        // 1. Minimum red illumination (tissue must be illuminated by flash or light, not occluded blackness)
        const hasMinRed = avgRed >= 50;
        // 2. High red dominance: hemoglobin strongly absorbs green and blue, transmitting red
        const hasRedDominance = redRatio >= 0.58 && 
                                avgRed >= avgGreen * 1.35 && 
                                avgRed >= avgBlue * 2.2;
        // 3. Low blue intensity: subcutaneous tissue absorbs virtually all blue light
        const hasLowBlue = avgBlue <= 75;
        // 4. Optical diffusion: direct contact diffuses light evenly across sensor (low spatial variance vs open room)
        const isDiffuseTissue = rVariance < 850;

        const isContactActive = hasMinRed && hasRedDominance && hasLowBlue && isDiffuseTissue;

        if (isContactActive) {
          this.consecutiveFingerFrames++;
          this.consecutiveNoFingerFrames = 0;
          if (this.consecutiveFingerFrames >= 3) {
            this.fingerDetected = true;
          }
        } else {
          this.consecutiveNoFingerFrames++;
          this.consecutiveFingerFrames = 0;
          if (this.consecutiveNoFingerFrames >= 2) {
            this.fingerDetected = false;
          }
        }

        // STRICT GATE: When finger is NOT in contact with camera, do NOT compute pulse from air/room noise
        if (!this.fingerDetected) {
          this.redValues = [];
          this.greenValues = [];
          this.blueValues = [];
          this.timestamps = [];
          this.lastRRIntervals = [];
          this.latestSpo2 = null;

          if (this.onPulseUpdate) {
            this.onPulseUpdate(0, 0, [], null, false, false);
          }

          this.animationFrame = requestAnimationFrame(() => this.processFrame());
          return;
        }
      } else {
        // Face rPPG mode: verify face region is well-illuminated and present
        const totalBrightness = avgRed + avgGreen + avgBlue;
        const isFaceIlluminated = avgGreen >= 35 && avgGreen <= 235 && totalBrightness >= 90;
        this.fingerDetected = isFaceIlluminated;

        if (!this.fingerDetected) {
          this.redValues = [];
          this.greenValues = [];
          this.blueValues = [];
          this.timestamps = [];
          this.lastRRIntervals = [];
          this.latestSpo2 = null;

          if (this.onPulseUpdate) {
            this.onPulseUpdate(0, 0, [], null, false, false);
          }

          this.animationFrame = requestAnimationFrame(() => this.processFrame());
          return;
        }
      }

      // Store values strictly when valid optical contact is confirmed
      const timestamp = Date.now();
      this.redValues.push(avgRed);
      this.greenValues.push(avgGreen);
      this.blueValues.push(avgBlue);
      this.timestamps.push(timestamp);

      // Keep only recent samples
      if (this.redValues.length > this.maxSamples) {
        this.redValues.shift();
        this.greenValues.shift();
        this.blueValues.shift();
        this.timestamps.shift();
      }

      // Estimate SpO2 from dual-channel AC/DC ratio
      if (this.redValues.length >= 60) {
        this.latestSpo2 = this.calculateSpO2(this.redValues, this.greenValues);
      }

      // Calculate pulse when we have enough samples (at least 2 seconds)
      if (this.redValues.length >= 60) {
        const signal = this.selectSignal();
        const { bpm, isBeat } = this.calculateBPM(signal, this.timestamps);
        const confidence = this.calculateConfidence(signal);
        
        if (this.onPulseUpdate && bpm > 0) {
          this.onPulseUpdate(bpm, confidence, this.lastRRIntervals, this.latestSpo2, this.fingerDetected, isBeat);
        }
      }
    } catch (error) {
      if (this.onError) {
        this.onError(`Pulse detection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.processFrame());
  }

  /**
   * Calculate BPM from signal using peak detection with noise filtering
   * Uses adaptive thresholding and validates peak intervals
   */
  private calculateBPM(signal: number[], timestamps: number[]): { bpm: number; isBeat: boolean } {
    if (signal.length < 60) return { bpm: 0, isBeat: false };

    // Apply bandpass-like filtering by removing DC component and high-frequency noise
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const normalized = signal.map(v => v - mean);
    
    // Apply simple moving average for noise reduction
    const smoothed = this.smoothSignal(normalized, 3);

    // Adaptive peak detection with noise filtering
    const peaks = this.findPeaksAdaptive(smoothed);
    
    if (peaks.length < 2) return { bpm: 0, isBeat: false };

    // Calculate intervals between peaks and filter outliers
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = timestamps[peaks[i]] - timestamps[peaks[i - 1]];
      // Valid RR intervals should be between 300ms (200 BPM) and 2000ms (30 BPM)
      if (interval >= 300 && interval <= 2000) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return { bpm: 0, isBeat: false };

    // Remove outlier intervals using IQR method
    const filteredIntervals = this.removeIntervalOutliers(intervals);
    if (filteredIntervals.length === 0) return { bpm: 0, isBeat: false };

    const avgInterval = filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;
    const bpm = (60000 / avgInterval);

    this.lastRRIntervals = [...filteredIntervals];

    // Detect if newest peak is a fresh beat occurring right now
    const latestPeakIdx = peaks[peaks.length - 1];
    const latestPeakTime = timestamps[latestPeakIdx];
    let isBeat = false;
    if (
      latestPeakIdx >= signal.length - 4 &&
      latestPeakTime &&
      latestPeakTime - this.lastBeatTimestamp >= 380
    ) {
      this.lastBeatTimestamp = latestPeakTime;
      isBeat = true;
    }

    // Validate BPM range (30-200 BPM for physiological plausibility)
    return {
      bpm: Math.max(30, Math.min(200, Math.round(bpm))),
      isBeat
    };
  }

  /**
   * Adaptive peak detection with dynamic thresholding
   * More robust than simple threshold-based detection
   */
  private findPeaksAdaptive(signal: number[]): number[] {
    const peaks: number[] = [];
    
    // Calculate adaptive threshold based on signal statistics
    const absSignal = signal.map(Math.abs);
    const signalMax = Math.max(...absSignal);
    const signalMean = absSignal.reduce((a, b) => a + b, 0) / absSignal.length;
    
    // Threshold is between mean and max, scaled by signal quality
    const threshold = signalMean + (signalMax - signalMean) * 0.3;
    
    // Minimum distance between peaks (~300ms at 30fps = 9 samples, ~200 BPM max) to reject dicrotic notches
    const minPeakDistance = 9;

    let lastPeakIndex = -minPeakDistance;

    for (let i = 2; i < signal.length - 2; i++) {
      // Check if this is a local maximum
      const isLocalMax = signal[i] > signal[i - 1] && 
                         signal[i] > signal[i + 1] &&
                         signal[i] > signal[i - 2] &&
                         signal[i] > signal[i + 2];
      
      // Check if above threshold and minimum distance from last peak
      if (isLocalMax && signal[i] > threshold && (i - lastPeakIndex) >= minPeakDistance) {
        peaks.push(i);
        lastPeakIndex = i;
      }
    }

    return peaks;
  }

  /**
   * Calculate variance of signal to assess AC pulsatile amplitude
   */
  private getSignalVariance(signal: number[]): number {
    if (signal.length < 10) return 0;
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return signal.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / signal.length;
  }

  /**
   * Select optimal PPG signal channel based on test mode and sensor exposure
   */
  private selectSignal(): number[] {
    if (this.mode === 'face') {
      return this.greenValues;
    }
    const greenVar = this.getSignalVariance(this.greenValues);
    const redVar = this.getSignalVariance(this.redValues);
    return greenVar > 0.35 ? this.greenValues : (redVar > 0.15 ? this.redValues : this.greenValues);
  }

  /**
   * Find peaks in signal (legacy method for compatibility)
   */
  private findPeaks(signal: number[]): number[] {
    return this.findPeaksAdaptive(signal);
  }

  /**
   * Smooth signal using moving average
   */
  private smoothSignal(signal: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(signal.length, i + halfWindow + 1);
      const window = signal.slice(start, end);
      smoothed.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    
    return smoothed;
  }

  /**
   * Remove outlier intervals using IQR method
   */
  private removeIntervalOutliers(intervals: number[]): number[] {
    if (intervals.length < 4) return intervals;
    
    const sorted = [...intervals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return intervals.filter(i => i >= lowerBound && i <= upperBound);
  }

  /**
   * Calculate confidence score (0-1) based on signal quality metrics
   * Improved algorithm using multiple quality indicators
   */
  private calculateConfidence(signal: number[]): number {
    if (signal.length < 60) return 0;

    // Calculate signal-to-noise ratio
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);

    // Quality factor 1: Signal amplitude (variation indicates pulse visibility)
    const amplitudeScore = Math.min(1, stdDev / 5);

    // Quality factor 2: Peak regularity
    const normalized = signal.map(v => v - mean);
    const peaks = this.findPeaksAdaptive(normalized);
    
    let regularityScore = 0;
    if (peaks.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
      }
      const intervalMean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalStdDev = Math.sqrt(
        intervals.reduce((sum, val) => sum + Math.pow(val - intervalMean, 2), 0) / intervals.length
      );
      // Lower variation = more regular = higher confidence
      const cv = intervalStdDev / intervalMean;
      regularityScore = Math.max(0, 1 - cv);
    }

    // Quality factor 3: Sufficient peaks detected
    const expectedPeaks = signal.length / 30; // ~1 peak per second at 30fps
    const peakCountScore = Math.min(1, peaks.length / expectedPeaks);

    // Weighted confidence score
    const confidence = (amplitudeScore * 0.3) + (regularityScore * 0.5) + (peakCountScore * 0.2);

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Get current waveform data
   */
  getWaveform(): PulseWaveform {
    if (this.mode === 'fingertip' && !this.fingerDetected) {
      return {
        samples: [],
        timestamps: [],
        sampleRate: 30
      };
    }
    const signal = this.selectSignal();
    return {
      samples: [...signal],
      timestamps: [...this.timestamps],
      sampleRate: 30 // Assuming 30fps
    };
  }

  /**
   * Get latest RR intervals detected from pulse peaks
   */
  getRRIntervals(): number[] {
    return [...this.lastRRIntervals];
  }

  /**
   * Estimate SpO2 blood oxygen saturation from optical Red vs Green AC/DC ratio of ratios
   * Reference: Ding et al. (2018), Karlen et al. (2012)
   * Returns null if signal is insufficient, invalid, or outside plausible physiological limits.
   */
  private calculateSpO2(reds: number[], greens: number[]): number | null {
    if (reds.length < 30 || greens.length < 30) return null;
    const meanRed = reds.reduce((a, b) => a + b, 0) / reds.length;
    const meanGreen = greens.reduce((a, b) => a + b, 0) / greens.length;
    if (meanRed <= 0 || meanGreen <= 0) return null;

    const stdRed = Math.sqrt(reds.reduce((sum, v) => sum + Math.pow(v - meanRed, 2), 0) / reds.length);
    const stdGreen = Math.sqrt(greens.reduce((sum, v) => sum + Math.pow(v - meanGreen, 2), 0) / greens.length);

    const acdcRed = stdRed / meanRed;
    const acdcGreen = stdGreen / meanGreen;
    if (acdcGreen <= 0.0001) return null;

    const rRatio = acdcRed / acdcGreen;
    // Standard empirical ratio-of-ratios pulse oximetry equation: SpO2 = 110 - 25 * R
    const rawSpo2 = Math.round(110 - 25 * rRatio);
    // Reject non-numbers and physiologically implausible or extreme artifact estimates
    if (isNaN(rawSpo2) || rawSpo2 < 50 || rawSpo2 > 100) {
      return null;
    }
    return rawSpo2;
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.stop();
    this.redValues = [];
    this.greenValues = [];
    this.blueValues = [];
    this.timestamps = [];
    this.lastRRIntervals = [];
    this.detectionRegion = null;
    this.fingerDetected = false;
    this.consecutiveFingerFrames = 0;
    this.consecutiveNoFingerFrames = 0;
    this.latestSpo2 = null;
    this.lastBeatTimestamp = 0;
  }
}

export const pulseDetector = new PulseDetector();

