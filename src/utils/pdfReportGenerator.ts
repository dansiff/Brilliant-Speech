import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChildProfile } from '../types';

export interface IEPGoal {
  id: string;
  title: string;
  targetPercent: number;
  currentPercent: number;
  status: 'active' | 'met' | 'monitoring';
  category: string;
  notes?: string;
  createdAt: string;
}

export interface SoundGroupSummary {
  id: string;
  name: string;
  phoneme: string;
  category: string;
  description: string;
  attempts: number;
  avgScore: number;
  maxScore: number;
  avgPromptType: string;
  status: 'unpracticed' | 'delayed' | 'emerging' | 'mastered';
}

export interface AutoObjectiveData {
  totalAttempts: number;
  avgScore: number;
  totalWithRubrics: number;
  promptSummary: {
    Independent: number;
    'Verbal Cue': number;
    'Visual Cue': number;
    'Tactile/Physical': number;
  };
  independenceRatio: number;
  weakestGroup?: SoundGroupSummary;
  strongestGroup?: SoundGroupSummary;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  timestamp?: string;
}

export interface IntelligibilityPoint {
  date: string;
  title: string;
  familiar: number;
  unfamiliar: number;
  accuracy: number;
  fluency: number;
  independence: number;
  promptLevel: string;
  notes: string;
}

export function generateClinicalProgressPDF(params: {
  activeProfile: ChildProfile;
  iepGoals: IEPGoal[];
  phoneticMatrix: SoundGroupSummary[];
  autoObjectiveData: AutoObjectiveData;
  soapNote: SOAPNote;
  intelligibilityHistory: IntelligibilityPoint[];
}) {
  const {
    activeProfile,
    iepGoals,
    phoneticMatrix,
    autoObjectiveData,
    soapNote,
    intelligibilityHistory
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Primary Header Banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SPEECH-LANGUAGE PATHOLOGY PROGRESS REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Brilliant Speech Clinical Platform — Parent & School SLP Summary', margin, 18);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, 18, { align: 'right' });

  y = 34;

  // Helper to check page boundary and insert new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin;
      // Re-add subtle header line on new pages
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 0, pageWidth, 8, 'F');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Progress Report Summary: ${activeProfile.name}`, margin, 5);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, 5, { align: 'right' });
      y = 14;
    }
  };

  const profAny = activeProfile as any;
  const ageVal = profAny.age ? `${profAny.age} yrs` : 'N/A';
  const targetAreaVal = profAny.targetArea || 'Articulation & Speech Clarity';
  const languageVal = profAny.languages ? profAny.languages.join(', ') : (activeProfile.language ? activeProfile.language.toUpperCase() : 'English');
  const notesVal = profAny.notes || 'Bilingual Speech & Articulation Therapy';

  // Child Profile & Clinical Metadata Box
  checkPageBreak(30);
  doc.setFillColor(248, 250, 252); // Light Gray
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 26, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Child Name: ${activeProfile.name}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Age: ${ageVal}   |   Target Focus: ${targetAreaVal}`, margin + 4, y + 12);
  doc.text(`Language: ${languageVal}   |   Clinical Profile ID: ${activeProfile.id}`, margin + 4, y + 18);
  
  if (notesVal) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Clinical Target Notes: ${notesVal.substring(0, 90)}${notesVal.length > 90 ? '...' : ''}`, margin + 4, y + 23);
  }

  y += 32;

  // Key Performance Metrics Summary Cards
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('QUANTITATIVE CLINICAL SNAPSHOT', margin, y);
  y += 4;

  const cardWidth = (pageWidth - (margin * 2) - 9) / 4;
  const cardHeight = 18;

  const metrics = [
    { label: 'Practice Trials', val: `${autoObjectiveData.totalAttempts}`, sub: 'Completed' },
    { label: 'Phonetic Score', val: `${autoObjectiveData.avgScore}%`, sub: 'Avg Accuracy' },
    { label: 'Independence', val: `${autoObjectiveData.independenceRatio}%`, sub: 'Unprompted' },
    { label: 'Unfamiliar Intelligibility', val: `${intelligibilityHistory.length > 0 ? intelligibilityHistory[intelligibilityHistory.length - 1].unfamiliar : 50}%`, sub: 'Listener Rating' },
  ];

  metrics.forEach((m, idx) => {
    const xPos = margin + idx * (cardWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(xPos, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(m.val, xPos + 3, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(m.label, xPos + 3, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, xPos + 3, y + 16);
  });

  y += cardHeight + 8;

  // IEP Speech Goals Section
  if (iepGoals && iepGoals.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text('INDIVIDUALIZED EDUCATION PROGRAM (IEP) GOALS', margin, y);
    y += 3;

    const goalRows = iepGoals.map(g => [
      g.title,
      g.category,
      `${g.targetPercent}% Target`,
      g.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Goal Description', 'Category', 'Target', 'Status']],
      body: goalRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Phonetic Family Mastery Matrix
  if (phoneticMatrix && phoneticMatrix.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text('PHONETIC ARTICULATION MASTERY MATRIX', margin, y);
    y += 3;

    const phoneticRows = phoneticMatrix.map(p => [
      p.name,
      p.phoneme,
      `${p.attempts} trials`,
      p.attempts > 0 ? `${p.avgScore}%` : 'N/A',
      p.avgPromptType,
      p.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Sound Family', 'Phoneme', 'Trials', 'Accuracy', 'Prompting Needed', 'Mastery Level']],
      body: phoneticRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 40 },
        5: { cellWidth: 33, halign: 'center' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Clinical SOAP Note Section
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('LATEST CLINICAL SESSION SOAP NOTE', margin, y);
  y += 4;

  const soapSections = [
    { label: 'S - SUBJECTIVE (Demeanor & Focus)', content: soapNote.subjective || 'Cooperative and engaged during speech drills.' },
    { label: 'O - OBJECTIVE (Quantitative Trials & Metrics)', content: soapNote.objective || `Completed ${autoObjectiveData.totalAttempts} trials with ${autoObjectiveData.avgScore}% accuracy.` },
    { label: 'A - ASSESSMENT (Speech Analysis & Phoneme Stability)', content: soapNote.assessment || 'Phonetic accuracy emerging steadily with visual and verbal prompting.' },
    { label: 'P - PLAN (Home & School Practice Recommendations)', content: soapNote.plan || 'Continue 15 mins daily practice targeting liquid and sibilant sounds.' }
  ];

  soapSections.forEach(sec => {
    checkPageBreak(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    
    // Calculate required box height for text wrapped
    const splitLines = doc.splitTextToSize(sec.content, pageWidth - (margin * 2) - 8);
    const boxHeight = Math.max(14, 8 + (splitLines.length * 3.5));

    doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229);
    doc.text(sec.label, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(splitLines, margin + 4, y + 9);

    y += boxHeight + 4;
  });

  // Intelligibility Progression Table
  if (intelligibilityHistory && intelligibilityHistory.length > 0) {
    checkPageBreak(30);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text('INTELLIGIBILITY INDEX PROGRESSION (LISTENERS)', margin, y);
    y += 3;

    const intelRows = intelligibilityHistory.slice(-6).map(pt => [
      pt.date,
      pt.title,
      `${pt.familiar}%`,
      `${pt.unfamiliar}%`,
      pt.promptLevel,
      pt.notes ? pt.notes.substring(0, 45) + (pt.notes.length > 45 ? '...' : '') : 'Standard checkpoint'
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Exercise / Checkpoint', 'Familiar Listener', 'Unfamiliar Listener', 'Prompting', 'Clinical Notes']],
      body: intelRows,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 42 }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer Signature & Confidentiality Notice
  checkPageBreak(22);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CONFIDENTIALITY NOTICE: This clinical report is prepared for educational and speech therapy tracking purposes to facilitate collaboration between parents, clinicians, and school Speech-Language Pathologists (SLPs).', margin, y, { maxWidth: pageWidth - (margin * 2) });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 27, 75);
  doc.text('Brilliant Speech Pathology Engine — Certified Progress Export', margin, y);
  doc.text('Authorized Parent / Clinician Signature: _______________________', pageWidth - margin, y, { align: 'right' });

  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    doc.text(`Brilliant Speech — ${activeProfile.name} Session Report`, margin, pageHeight - 6);
  }

  // Save PDF file
  const fileName = `${activeProfile.name.replace(/\s+/g, '_')}_Speech_Progress_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
