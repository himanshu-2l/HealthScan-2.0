import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

let detector: any = null;
let isAnalyzing = false;
let animationFrameId: number | null = null;

const initializeDetector = async () => {
  try {
    await tf.ready();
    await tf.setBackend('webgl');
    
    if (!detector) {
      const model = poseDetection.SupportedModels.BlazePose;
      const detectorConfig = {
        runtime: 'tfjs' as const,
        enableSmoothing: true,
        modelType: 'full' as const,
        scoreThreshold: 0.65
      };
      detector = await poseDetection.createDetector(model, detectorConfig);
    }
    return detector;
  } catch (error) {
    console.error('Error initializing detector:', error);
    throw error;
  }
};

export const startGaitAnalysis = async (videoElement: HTMLVideoElement, onMetricsUpdate: (metrics: any) => void) => {
  try {
    const detector = await initializeDetector();
    isAnalyzing = true;

    const analyzeFrame = async () => {
      if (!isAnalyzing) return;

      try {
        const poses = await detector.estimatePoses(videoElement, {
          flipHorizontal: false,
          maxPoses: 1
        });

        if (poses && poses.length > 0) {
          const metrics = calculateMetrics(poses[0]);
          if (metrics) {
            onMetricsUpdate(metrics);
          }
        }
      } catch (error) {
        console.error('Frame analysis error:', error);
      }

      if (isAnalyzing) {
        animationFrameId = requestAnimationFrame(analyzeFrame);
      }
    };

    analyzeFrame();
  } catch (error) {
    console.error('Error starting gait analysis:', error);
    throw error;
  }
};

export const stopGaitAnalysis = () => {
  isAnalyzing = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const calculateMetrics = (pose: any) => {
  if (!pose || !pose.keypoints || !pose.keypoints.length) {
    return null;
  }

  const keypoints = pose.keypoints3D || pose.keypoints;
  const findKeypoint = (name: string) => keypoints.find((kp: any) => kp.name === name);

  const nose = findKeypoint('nose');
  const leftHip = findKeypoint('left_hip');
  const rightHip = findKeypoint('right_hip');
  const leftKnee = findKeypoint('left_knee');
  const rightKnee = findKeypoint('right_knee');
  const leftAnkle = findKeypoint('left_ankle');
  const rightAnkle = findKeypoint('right_ankle');
  const leftShoulder = findKeypoint('left_shoulder');
  const rightShoulder = findKeypoint('right_shoulder');

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return null;
  }

  const com = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };

  const velocity = {
    x: com.x / 640,
    y: com.y / 480
  };

  const stability = calculateStabilityMetrics(nose, leftHip, rightHip, leftShoulder, rightShoulder);
  const symmetry = calculateSymmetryMetrics(leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle);
  const balance = calculateBalanceMetrics(leftHip, rightHip, leftShoulder, rightShoulder);
  const jointAngles = calculateJointAnglesMetrics(leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle);

  return {
    stability,
    symmetry,
    balance,
    jointAngles,
    velocity,
    keypoints: pose.keypoints,
    phaseData: {
      x: velocity.x,
      y: velocity.y,
      timestamp: Date.now()
    }
  };
};

const calculateStabilityMetrics = (nose: any, leftHip: any, rightHip: any, leftShoulder: any, rightShoulder: any) => {
  if (!nose || !leftHip || !rightHip || !leftShoulder || !rightShoulder) {
    return { score: 0, lateralSway: 0, verticalSway: 0 };
  }

  const hipCenter = (leftHip.x + rightHip.x) / 2;
  const shoulderCenter = (leftShoulder.x + rightShoulder.x) / 2;

  const lateralSway = Math.abs(nose.x - hipCenter);
  const verticalSway = Math.abs(nose.y - shoulderCenter) / 100;
  const score = Math.max(0, 100 - (lateralSway * 2 + verticalSway * 50));

  return { score, lateralSway, verticalSway };
};

const calculateSymmetryMetrics = (leftHip: any, rightHip: any, leftKnee: any, rightKnee: any, leftAnkle: any, rightAnkle: any) => {
  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return { overall: 0, legSymmetry: 0, armSymmetry: 0 };
  }

  const leftLegLength = Math.sqrt(Math.pow(leftHip.x - leftKnee.x, 2) + Math.pow(leftHip.y - leftKnee.y, 2));
  const rightLegLength = Math.sqrt(Math.pow(rightHip.x - rightKnee.x, 2) + Math.pow(rightHip.y - rightKnee.y, 2));

  const legSymmetry = Math.max(0, 100 - Math.abs(leftLegLength - rightLegLength) * 10);
  
  return {
    overall: legSymmetry,
    legSymmetry,
    armSymmetry: legSymmetry
  };
};

const calculateBalanceMetrics = (leftHip: any, rightHip: any, leftShoulder: any, rightShoulder: any) => {
  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return 0;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const verticalAlignment = Math.abs(hipCenterX - shoulderCenterX);
  return Math.max(0, 100 - (verticalAlignment * 5));
};

const calculateJointAnglesMetrics = (leftHip: any, rightHip: any, leftKnee: any, rightKnee: any, leftAnkle: any, rightAnkle: any) => {
  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const angle = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return Math.abs((angle * 180 / Math.PI + 360) % 360);
  };

  return [
    { joint: 'left_hip', angle: calculateAngle({ x: leftHip.x, y: leftHip.y - 100 }, leftHip, leftKnee), confidence: leftHip.score },
    { joint: 'right_hip', angle: calculateAngle({ x: rightHip.x, y: rightHip.y - 100 }, rightHip, rightKnee), confidence: rightHip.score },
    { joint: 'left_knee', angle: calculateAngle(leftHip, leftKnee, leftAnkle), confidence: leftKnee.score },
    { joint: 'right_knee', angle: calculateAngle(rightHip, rightKnee, rightAnkle), confidence: rightKnee.score }
  ];
};
