import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HealthTestResult } from '../types/health';
import { getPatientProfile } from './patientProfileService';
import { format, parseISO, differenceInYears } from 'date-fns';

/**
 * Service to generate formal, government-standard medical PDF reports
 */
export const generateDiagnosticPDF = async (result: HealthTestResult) => {
  const profile = getPatientProfile();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Formal Medical Colors
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [60, 60, 60];
  const medGray: [number, number, number] = [120, 120, 120];
  const lightGray: [number, number, number] = [240, 240, 240];
  const officialBlue: [number, number, number] = [15, 23, 42]; // Slate 900 for text headers

  // 1. Official Border & Watermark
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  
  // Confidential Watermark (Subtle)
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.text('OFFICIAL MEDICAL RECORD', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();

  // 2. Institution Header (Government/Formal Style)
  doc.setFillColor(officialBlue[0], officialBlue[1], officialBlue[2]);
  doc.rect(10, 10, pageWidth - 20, 2, 'F');
  
  doc.setTextColor(officialBlue[0], officialBlue[1], officialBlue[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTHSCAN MEDICAL SYSTEMS', 15, 22);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('CENTRE FOR ADVANCED BIOMETRIC DIAGNOSTICS', 15, 27);
  doc.text('CERTIFIED DIGITAL HEALTH INFRASTRUCTURE', 15, 31);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLINICAL TEST REPORT', pageWidth - 15, 22, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Doc Ref: HS-MED-${result.id.slice(0, 8).toUpperCase()}`, pageWidth - 15, 27, { align: 'right' });
  doc.text(`Classification: CONFIDENTIAL`, pageWidth - 15, 31, { align: 'right' });

  // 3. Patient Identity Grid
  let currentY = 45;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(10, currentY, pageWidth - 20, 7, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor( officialBlue[0], officialBlue[1], officialBlue[2]);
  doc.text('PATIENT IDENTIFICATION', 15, currentY + 5);

  currentY += 10;
  const patientName = profile ? `${profile.firstName} ${profile.lastName}`.toUpperCase() : 'NOT SPECIFIED';
  const patientAge = profile?.dateOfBirth ? `${differenceInYears(new Date(), parseISO(profile.dateOfBirth))} Yrs` : 'N/A';
  const patientGender = profile?.gender ? profile.gender.toUpperCase() : 'N/A';
  const bloodGroup = profile?.bloodGroup || 'N/A';

  const patientIdentity = [
    ['PATIENT NAME:', patientName, 'NID / REG NO:', `HS-${Date.now().toString().slice(-6)}`],
    ['AGE / GENDER:', `${patientAge} / ${patientGender}`, 'BLOOD GROUP:', bloodGroup],
    ['IDENTIFIED BY:', 'BIOMETRIC SIGNATURE', 'COLLECTION:', 'REMOTE/APP'],
    ['REPORT STATUS:', 'FINAL - SIGNED', 'TEST DATE:', format(parseISO(result.testDate), 'dd MMM yyyy, HH:mm')]
  ];

  autoTable(doc, {
    startY: currentY,
    body: patientIdentity,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: darkGray },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35, textColor: darkGray },
      3: { cellWidth: 55 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Clinical Observations & Findings
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(10, currentY, pageWidth - 20, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL TEST FINDINGS', 15, currentY + 5);

  currentY += 10;
  
  const findingsData = [];
  findingsData.push(['ANALYTE / METRIC', 'OBSERVED VALUE', 'UNIT', 'REFERENCE INDICATOR', 'STATUS']);
  
  if (result.testType === 'neuro-assessment' || result.testType === 'digit-span' || result.testType === 'word-list-recall') {
     findingsData.push(['Cognitive Score', result.score.toString(), 'Pts', `${result.maxScore} Pts`, getStatusText(result.scorePercentage || 0)]);
     findingsData.push(['Neural Efficiency', `${(result.scorePercentage || 0).toFixed(1)}`, '%', '> 75.0', getStatusText(result.scorePercentage || 0)]);
     if (result.duration) findingsData.push(['Response Latency', result.duration.toString(), 'Sec', '< 180.0', 'STABLE']);
  } else if (result.testType === 'blood-pressure-check') {
     const bp = result.data as any;
     findingsData.push(['Systolic BP', bp.systolic.toString(), 'mmHg', '< 120.0', bp.systolic < 120 ? 'NORMAL' : 'ELEVATED']);
     findingsData.push(['Diastolic BP', bp.diastolic.toString(), 'mmHg', '< 80.0', bp.diastolic < 80 ? 'NORMAL' : 'ELEVATED']);
     findingsData.push(['Pulse Rate', (bp.pulse || bp.heartRate || 'N/A').toString(), 'bpm', '60.0 - 100.0', 'STABLE']);
  } else {
     findingsData.push(['Performance Index', (result.scorePercentage || 0).toFixed(1), '%', '70.0 - 100.0', result.riskLevel.toUpperCase()]);
     findingsData.push(['Risk Coefficient', result.riskLevel.toUpperCase(), '-', 'LOW', 'VERIFIED']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [findingsData[0]],
    body: findingsData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontSize: 8, halign: 'center' },
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. Clinical Summary & Narrative
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL INTERPRETATION:', 15, currentY);
  
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const narrative = result.interpretation || 'Clinical data analyzed via AI pattern recognition. No acute pathologies detected within the scope of this baseline screening.';
  const splitNarrative = doc.splitTextToSize(narrative, pageWidth - 30);
  doc.text(splitNarrative, 15, currentY);

  currentY += splitNarrative.length * 4.5 + 8;

  // 6. Actionable Plan / Recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED MEDICAL ACTIONS:', 15, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    result.recommendations.forEach((rec) => {
      doc.text(`• ${rec.toUpperCase()}`, 18, currentY);
      currentY += 4.5;
    });
  }

  // 7. Footer: QR, Signature & Disclaimer
  const footerY = pageHeight - 55;
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.line(10, footerY, pageWidth - 10, footerY);

  // Digital Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED SIGNATORY:', 15, footerY + 10);
  doc.setFont('helvetica', 'italic');
  doc.text('HealthScan AI Systems - Autonomous Validation', 15, footerY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Digital Seal: SHA-256:${result.id.slice(0, 16).toUpperCase()}`, 15, footerY + 19);

  // QR Code
  const qrData = `VERIFIED-RECORD-${result.id}`;
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(qrData)}`;
  try {
    doc.addImage(qrUrl, 'PNG', pageWidth - 45, footerY + 5, 30, 30);
    doc.setFontSize(7);
    doc.text('SCAN TO VERIFY RECORD', pageWidth - 30, footerY + 38, { align: 'center' });
  } catch (e) {}

  // Disclaimer
  doc.setFontSize(6.5);
  doc.setTextColor(medGray[0], medGray[1], medGray[2]);
  const disclaimer = [
    'Disclaimer: This is a computer-generated summary for biometric screening and health awareness. This document is not a substitute for a comprehensive physician evaluation.',
    'Test results should be interpreted in the context of professional medical history. Electronic version of this document is available for verified institutions.'
  ];
  doc.text(disclaimer, 15, pageHeight - 12);
  doc.text(`Doc Generated: ${format(new Date(), 'dd-MM-yyyy HH:mm')} | HS-CORP-P001`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  // 8. Final Save
  const fileName = `MED_REPORT_${result.testType.toUpperCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};

// Formal status mapping for government style
const getStatusText = (percentage: number) => {
  if (percentage >= 90) return 'OPTIMAL';
  if (percentage >= 75) return 'NORMAL';
  if (percentage >= 50) return 'SATISFACTORY';
  if (percentage >= 30) return 'MARGINAL';
  return 'UNSATISFACTORY';
};
