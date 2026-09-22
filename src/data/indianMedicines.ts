/**
 * Curated Indian Pharmaceutical Knowledge Base & Deterministic Drug Matrix
 * 
 * Provides validated brand-to-composition mappings for common Indian pharmaceuticals,
 * along with clinical warnings, contraindications, and drug-drug interactions.
 * References: CDSCO India, National List of Essential Medicines (NLEM India),
 * openFDA, and curated clinical guidelines.
 */

export interface IndianMedicineRecord {
  brandName: string;
  normalizedBrand: string;
  genericIngredients: Array<{ name: string; strength?: string }>;
  dosageForm: string;
  manufacturer: string;
  medicineClass: string;
  commonUses: string[];
  commonSideEffects: string[];
  importantWarnings: string[];
  contraindications: string[];
  prescriptionStatus: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X';
  storage: string;
  ageWarnings?: {
    pediatric?: string;
    geriatric?: string;
  };
  pregnancyRisk: 'Compatible with caution' | 'Avoid unless prescribed' | 'Contraindicated in pregnancy' | 'Consult OB/GYN';
}

export interface DrugInteractionPair {
  drugA: string;
  drugB: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  mechanism: string;
  clinicalAdvice: string;
}

export const INDIAN_MEDICINES: IndianMedicineRecord[] = [
  // --- ANALGESICS / ANTIPYRETICS / NSAIDs ---
  {
    brandName: 'Dolo 650',
    normalizedBrand: 'dolo',
    genericIngredients: [{ name: 'paracetamol', strength: '650mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    medicineClass: 'Analgesic / Antipyretic',
    commonUses: ['Fever reduction', 'Mild to moderate body ache', 'Headache', 'Dental pain'],
    commonSideEffects: ['Nausea (mild)', 'Allergic skin rash (rare)'],
    importantWarnings: [
      'Do not exceed 4,000 mg (4 grams) of paracetamol per 24 hours from all sources.',
      'Check other cold/flu medications to avoid accidental paracetamol double-dosing.',
      'Avoid chronic alcohol consumption while taking this medication due to liver toxicity risk.'
    ],
    contraindications: ['Severe hepatic impairment or active liver failure', 'Known hypersensitivity to paracetamol'],
    prescriptionStatus: 'OTC',
    storage: 'Store below 30°C in a dry place protected from direct sunlight.',
    ageWarnings: {
      pediatric: '650mg strength is for adults and adolescents weighing over 40kg. Use pediatric drops or lower dose syrup for children.',
      geriatric: 'Safe at therapeutic doses; monitor if liver or renal impairment is present.'
    },
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Calpol 500',
    normalizedBrand: 'calpol',
    genericIngredients: [{ name: 'paracetamol', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    medicineClass: 'Analgesic / Antipyretic',
    commonUses: ['Fever', 'Headache', 'Muscle aches', 'Post-vaccination pain'],
    commonSideEffects: ['Mild stomach upset', 'Rare skin rash'],
    importantWarnings: ['Do not combine with other paracetamol-containing remedies.', 'Maximum adult daily limit is 4000mg.'],
    contraindications: ['Severe liver failure', 'Paracetamol allergy'],
    prescriptionStatus: 'OTC',
    storage: 'Store below 25°C away from moisture.',
    ageWarnings: {
      pediatric: 'For children under 12, use pediatric suspension calibrated by weight.',
      geriatric: 'Generally well tolerated; maintain adequate hydration.'
    },
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Crocin Advance',
    normalizedBrand: 'crocin advance',
    genericIngredients: [{ name: 'paracetamol', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'GlaxoSmithKline Consumer Healthcare',
    medicineClass: 'Analgesic / Antipyretic (Fast Release)',
    commonUses: ['Fever', 'Headache', 'Body ache'],
    commonSideEffects: ['Mild gastrointestinal discomfort (rare)'],
    importantWarnings: ['Do not exceed recommended frequency (minimum 4 to 6 hours between doses).'],
    contraindications: ['Active liver cirrhosis', 'Allergy to paracetamol'],
    prescriptionStatus: 'OTC',
    storage: 'Store in a cool dry place.',
    ageWarnings: { pediatric: 'Use appropriate pediatric syrup dosage for children.' },
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Combiflam',
    normalizedBrand: 'combiflam',
    genericIngredients: [
      { name: 'ibuprofen', strength: '400mg' },
      { name: 'paracetamol', strength: '325mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Sanofi India Ltd',
    medicineClass: 'NSAID + Analgesic Combination',
    commonUses: ['Inflammatory pain', 'Dental pain', 'Joint and muscle sprains', 'Dysmenorrhea (period pain)'],
    commonSideEffects: ['Gastric irritation', 'Heartburn', 'Nausea', 'Dizziness'],
    importantWarnings: [
      'Take strictly with or after meals to protect stomach lining.',
      'Prolonged use increases risk of gastrointestinal ulcers and kidney strain.',
      'Caution in patients with asthma (NSAID-induced bronchospasm risk).'
    ],
    contraindications: ['Active peptic ulcer or GI bleeding', 'Severe heart failure', 'Third trimester of pregnancy', 'Severe renal impairment'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in a cool, dry place away from heat and light.',
    ageWarnings: {
      pediatric: 'Not recommended for children under 12 years without pediatrician direction.',
      geriatric: 'Higher risk of GI bleed and acute kidney injury; use shortest effective duration.'
    },
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Zerodol-P',
    normalizedBrand: 'zerodol p',
    genericIngredients: [
      { name: 'aceclofenac', strength: '100mg' },
      { name: 'paracetamol', strength: '325mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Ipca Laboratories Ltd',
    medicineClass: 'NSAID + Analgesic Combination',
    commonUses: ['Osteoarthritis', 'Rheumatoid arthritis', 'Ankylosing spondylitis', 'Post-surgical dental or orthopedic pain'],
    commonSideEffects: ['Epigastric pain', 'Heartburn', 'Diarrhea', 'Nausea'],
    importantWarnings: [
      'Always take with food or milk to minimize stomach distress.',
      'Avoid if taking other pain relievers containing aceclofenac, diclofenac, or paracetamol.',
      'Discontinue if black tarry stools or vomiting blood occur.'
    ],
    contraindications: ['Active stomach ulcer or bleeding disorder', 'Severe renal or hepatic failure', 'Severe coronary artery disease'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C protected from moisture.',
    ageWarnings: {
      pediatric: 'Not approved for pediatric patients.',
      geriatric: 'Monitor renal profile and blood pressure during prolonged therapy.'
    },
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Zerodol-SP',
    normalizedBrand: 'zerodol sp',
    genericIngredients: [
      { name: 'aceclofenac', strength: '100mg' },
      { name: 'paracetamol', strength: '325mg' },
      { name: 'serratiopeptidase', strength: '15mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Ipca Laboratories Ltd',
    medicineClass: 'NSAID + Anti-inflammatory Enzyme Combination',
    commonUses: ['Severe post-traumatic swelling', 'Dental extraction inflammation', 'Post-operative pain and edema'],
    commonSideEffects: ['Gastric discomfort', 'Nausea', 'Skin rash'],
    importantWarnings: ['Take after meals.', 'Serratiopeptidase has mild anti-coagulation properties; caution if on blood thinners.'],
    contraindications: ['Peptic ulcer disease', 'Active bleeding', 'Severe kidney failure'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in a cool dry place.',
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Hifenac-P',
    normalizedBrand: 'hifenac p',
    genericIngredients: [
      { name: 'aceclofenac', strength: '100mg' },
      { name: 'paracetamol', strength: '325mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Intas Pharmaceuticals Ltd',
    medicineClass: 'NSAID + Analgesic Combination',
    commonUses: ['Musculoskeletal pain', 'Joint swelling', 'Cervical pain'],
    commonSideEffects: ['Indigestion', 'Abdominal pain', 'Drowsiness'],
    importantWarnings: ['Take with meals.', 'Do not double dose with other NSAIDs.'],
    contraindications: ['Active gastric ulcers', 'Late pregnancy', 'Severe cardiac decompensation'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 30°C in dry conditions.',
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Meftal-Spas',
    normalizedBrand: 'meftal spas',
    genericIngredients: [
      { name: 'mefenamic acid', strength: '250mg' },
      { name: 'dicyclomine', strength: '10mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Blue Cross Laboratories Ltd',
    medicineClass: 'NSAID + Antispasmodic Combination',
    commonUses: ['Spasmodic menstrual cramps (dysmenorrhea)', 'Abdominal intestinal colic', 'Ureteric colic'],
    commonSideEffects: ['Dry mouth', 'Blurred vision', 'Drowsiness', 'Constipation', 'Nausea'],
    importantWarnings: [
      'Indian Pharmacopoeia Commission issued alert for DRESS syndrome with mefenamic acid—monitor for severe skin rash or fever.',
      'Anticholinergic effect: may cause dry mouth and dizziness. Avoid driving if affected.'
    ],
    contraindications: ['Glaucoma', 'Myasthenia gravis', 'Obstructive GI uropathy', 'Severe ulcer disease'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C protected from moisture.',
    ageWarnings: { pediatric: 'Use only pediatric drops formulation with exact weight dosing.' },
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Ultracet',
    normalizedBrand: 'ultracet',
    genericIngredients: [
      { name: 'tramadol', strength: '37.5mg' },
      { name: 'paracetamol', strength: '325mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Johnson & Johnson / Janssen',
    medicineClass: 'Opioid Analgesic + Paracetamol Combination',
    commonUses: ['Moderate to severe acute pain', 'Orthopedic trauma', 'Post-surgical pain relief'],
    commonSideEffects: ['Nausea', 'Dizziness', 'Drowsiness', 'Constipation', 'Dry mouth'],
    importantWarnings: [
      'Potential for physical dependence and habit-forming with prolonged use.',
      'Can cause central nervous system depression; do not operate heavy machinery or drink alcohol.',
      'Risk of Serotonin Syndrome if combined with antidepressants (SSRIs/SNRIs).'
    ],
    contraindications: ['Acute intoxication with alcohol, hypnotics or narcotics', 'Severe respiratory depression', 'Epilepsy/uncontrolled seizures'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store below 30°C away from reach of children.',
    pregnancyRisk: 'Avoid unless prescribed'
  },

  // --- ANTIBIOTICS ---
  {
    brandName: 'Augmentin 625 Duo',
    normalizedBrand: 'augmentin duo',
    genericIngredients: [
      { name: 'amoxicillin', strength: '500mg' },
      { name: 'clavulanic acid', strength: '125mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    medicineClass: 'Antibiotic (Penicillin + Beta-Lactamase Inhibitor)',
    commonUses: ['Bacterial respiratory tract infections', 'Sinusitis', 'Otitis media', 'Skin and soft tissue infections', 'Urinary tract infections'],
    commonSideEffects: ['Diarrhea (frequent)', 'Nausea', 'Mild rash', 'Vaginal candidiasis (thrush)'],
    importantWarnings: [
      'Must complete the full prescribed course even if symptoms resolve early.',
      'Take at the start of a meal to minimize gastrointestinal upset and maximize absorption.',
      'CRITICAL: Check for Penicillin allergy. Can provoke life-threatening anaphylaxis.'
    ],
    contraindications: ['History of penicillin/beta-lactam allergy', 'History of amoxicillin-clavulanate associated jaundice or hepatic dysfunction'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store in airtight packaging below 25°C away from moisture.',
    ageWarnings: {
      pediatric: 'Tablets not suitable for small children; use dry syrup/suspension.',
      geriatric: 'Monitor renal clearance; adjust dosing interval if GFR < 30 mL/min.'
    },
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Clavam 625',
    normalizedBrand: 'clavam',
    genericIngredients: [
      { name: 'amoxicillin', strength: '500mg' },
      { name: 'clavulanic acid', strength: '125mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Alkem Laboratories Ltd',
    medicineClass: 'Antibiotic (Penicillin + Beta-Lactamase Inhibitor)',
    commonUses: ['Community-acquired pneumonia', 'Dental abscess', 'Skin infections', 'Sinusitis'],
    commonSideEffects: ['Diarrhea', 'Loose stools', 'Nausea'],
    importantWarnings: ['Complete entire antibiotic regimen.', 'Contraindicated in penicillin allergy.'],
    contraindications: ['Penicillin allergy', 'Hepatic cholestatic jaundice history'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store in a cool dry place.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Azee 500',
    normalizedBrand: 'azee',
    genericIngredients: [{ name: 'azithromycin', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Cipla Ltd',
    medicineClass: 'Antibiotic (Macrolide)',
    commonUses: ['Bacterial pharyngitis/tonsillitis', 'Bronchitis', 'Chlamydia infections', 'Typhoid fever alternative'],
    commonSideEffects: ['Abdominal cramps', 'Diarrhea', 'Nausea', 'Headache'],
    importantWarnings: [
      'Can cause QT prolongation on ECG; exercise extreme caution in patients with arrhythmias or taking other QT-prolonging drugs.',
      'Take 1 hour before or 2 hours after food for optimal absorption.',
      'Do not take antacids containing aluminum or magnesium at the same time.'
    ],
    contraindications: ['Hypersensitivity to azithromycin, erythromycin, or any macrolide antibiotic', 'History of cholestatic jaundice with prior azithromycin'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store below 30°C in a dry location.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Azithral 500',
    normalizedBrand: 'azithral',
    genericIngredients: [{ name: 'azithromycin', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    medicineClass: 'Antibiotic (Macrolide)',
    commonUses: ['Upper and lower respiratory infections', 'Skin infections', 'Genital ulcer disease'],
    commonSideEffects: ['Vomiting', 'Nausea', 'Abdominal pain'],
    importantWarnings: ['Take at least 1 hour before or 2 hours after meals.', 'Caution with cardiac QT risk.'],
    contraindications: ['Macrolide allergy', 'Severe liver failure'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Ciplox 500',
    normalizedBrand: 'ciplox',
    genericIngredients: [{ name: 'ciprofloxacin', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Cipla Ltd',
    medicineClass: 'Antibiotic (Fluoroquinolone)',
    commonUses: ['Complicated urinary tract infections', 'Infectious diarrhea / typhoid', 'Bone and joint infections', 'Prostatitis'],
    commonSideEffects: ['Nausea', 'Diarrhea', 'Headache', 'Dizziness', 'Photosensitivity (sunburn risk)'],
    importantWarnings: [
      'BLACK BOX WARNING: Increased risk of tendinitis and tendon rupture (especially Achilles tendon).',
      'Can exacerbate muscle weakness in myasthenia gravis.',
      'Do not consume dairy products, iron, or calcium supplements within 2 hours of dosing.'
    ],
    contraindications: ['Hypersensitivity to fluoroquinolones', 'Concurrent administration of tizanidine', 'Myasthenia gravis history'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store below 30°C.',
    ageWarnings: { pediatric: 'Avoid in children due to potential cartilage damage unless specifically indicated by pediatric specialist.' },
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Taxim-O 200',
    normalizedBrand: 'taxim o',
    genericIngredients: [{ name: 'cefixime', strength: '200mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Alkem Laboratories Ltd',
    medicineClass: 'Antibiotic (3rd Generation Cephalosporin)',
    commonUses: ['Typhoid fever', 'Uncomplicated gonococcal infection', 'UTI', 'Otitis media'],
    commonSideEffects: ['Loose stools', 'Stomach ache', 'Nausea', 'Dyspepsia'],
    importantWarnings: [
      'Take with food to reduce GI irritation.',
      'May trigger false positive results in Coombs test or urine glucose tests.',
      'Caution in patients with severe penicillin allergy (cross-reactivity risk).'
    ],
    contraindications: ['Hypersensitivity to cephalosporins or severe beta-lactam allergy'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store below 25°C away from light.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Monocef 1g',
    normalizedBrand: 'monocef',
    genericIngredients: [{ name: 'ceftriaxone', strength: '1g' }],
    dosageForm: 'Injection',
    manufacturer: 'Aristo Pharmaceuticals Pvt Ltd',
    medicineClass: 'Antibiotic (3rd Generation Cephalosporin)',
    commonUses: ['Severe bacterial meningitis', 'Septicemia', 'Pre-operative prophylaxis', 'Severe typhoid'],
    commonSideEffects: ['Pain at injection site', 'Diarrhea', 'Thrombocytosis'],
    importantWarnings: ['Hospital administration only (IV/IM).', 'Must never be mixed with calcium-containing IV solutions.'],
    contraindications: ['Neonates with jaundice or receiving IV calcium', 'Cephalosporin allergy'],
    prescriptionStatus: 'Schedule H1',
    storage: 'Store vials below 25°C away from light.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Metrogyl 400',
    normalizedBrand: 'metrogyl',
    genericIngredients: [{ name: 'metronidazole', strength: '400mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'J.B. Chemicals & Pharmaceuticals Ltd',
    medicineClass: 'Antibiotic / Antiprotozoal (Nitroimidazole)',
    commonUses: ['Amebiasis / amoebic dysentery', 'Giardiasis', 'Dental anaerobic infections', 'Bacterial vaginosis', 'Trichomoniasis'],
    commonSideEffects: ['Metallic taste in mouth', 'Darkened reddish-brown urine', 'Nausea', 'Anorexia'],
    importantWarnings: [
      'STRICT WARNING: Avoid alcohol completely during treatment and for at least 48 hours after the last dose.',
      'Combining with alcohol causes severe Disulfiram-like reaction (violent vomiting, flushing, tachycardia, drop in BP).',
      'Take with food to minimize gastric discomfort.'
    ],
    contraindications: ['First trimester of pregnancy (in trichomoniasis)', 'Severe neurological disease', 'Hypersensitivity to nitroimidazoles'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 30°C protected from light.',
    pregnancyRisk: 'Avoid unless prescribed'
  },

  // --- GASTROINTESTINAL & PPIs ---
  {
    brandName: 'Pan 40',
    normalizedBrand: 'pan',
    genericIngredients: [{ name: 'pantoprazole', strength: '40mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Alkem Laboratories Ltd',
    medicineClass: 'Proton Pump Inhibitor (PPI)',
    commonUses: ['Gastroesophageal reflux disease (GERD)', 'Acid peptic disease', 'Gastric ulcers', 'Prevention of NSAID-induced ulcers'],
    commonSideEffects: ['Headache', 'Mild diarrhea', 'Flatulence', 'Abdominal pain'],
    importantWarnings: [
      'Best taken 30 to 60 minutes before breakfast on an empty stomach.',
      'Swallow tablet whole; do not crush or chew.',
      'Long-term continuous use (>1 year) can decrease magnesium and vitamin B12 absorption and slightly increase bone fracture risk.'
    ],
    contraindications: ['Known hypersensitivity to substituted benzimidazoles'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in dry place below 25°C.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Pan-D',
    normalizedBrand: 'pan d',
    genericIngredients: [
      { name: 'pantoprazole', strength: '40mg' },
      { name: 'domperidone', strength: '30mg' }
    ],
    dosageForm: 'Capsule',
    manufacturer: 'Alkem Laboratories Ltd',
    medicineClass: 'PPI + Prokinetic Combination',
    commonUses: ['Acid reflux with nausea', 'GERD unresponsive to PPI alone', 'Dyspepsia with bloating and heartburn'],
    commonSideEffects: ['Dry mouth', 'Headache', 'Diarrhea', 'Drowsiness'],
    importantWarnings: [
      'Take 30 minutes before breakfast on an empty stomach.',
      'Domperidone carries a small risk of QT prolongation and ventricular arrhythmias—use with caution in cardiac patients and avoid taking with macrolide antibiotics.'
    ],
    contraindications: ['Prolapsed prolactinoma', 'Gastrointestinal bleeding or perforation', 'Moderate to severe hepatic impairment', 'Existing cardiac conduction abnormalities'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C away from moisture.',
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Pantocid DSR',
    normalizedBrand: 'pantocid dsr',
    genericIngredients: [
      { name: 'pantoprazole', strength: '40mg' },
      { name: 'domperidone', strength: '30mg' }
    ],
    dosageForm: 'Capsule (Sustained Release)',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    medicineClass: 'PPI + Prokinetic Combination',
    commonUses: ['Acid reflux with delayed gastric emptying', 'Heartburn and regurgitation', 'Gastritis with vomiting sensation'],
    commonSideEffects: ['Dryness in mouth', 'Stomach ache', 'Dizziness'],
    importantWarnings: ['Take before the first meal of the day.', 'Cardiac caution with domperidone.'],
    contraindications: ['Cardiac arrhythmias', 'GI obstruction or perforation'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C protected from light.',
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Omez 20',
    normalizedBrand: 'omez',
    genericIngredients: [{ name: 'omeprazole', strength: '20mg' }],
    dosageForm: 'Capsule',
    manufacturer: 'Dr. Reddy’s Laboratories Ltd',
    medicineClass: 'Proton Pump Inhibitor (PPI)',
    commonUses: ['Duodenal and gastric ulcers', 'Acid reflux', 'Zollinger-Ellison syndrome', 'H. pylori eradication (in combination)'],
    commonSideEffects: ['Constipation/diarrhea', 'Nausea', 'Headache'],
    importantWarnings: [
      'Take 30 minutes before morning meal.',
      'Clinically significant interaction: Omeprazole strongly inhibits CYP2C19, decreasing clopidogrel activation. Avoid taking omeprazole with clopidogrel (pantoprazole is preferred).'
    ],
    contraindications: ['Concomitant administration with nelfinavir', 'Omeprazole allergy'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Digene Gel',
    normalizedBrand: 'digene',
    genericIngredients: [
      { name: 'magnesium hydroxide', strength: '25mg/5ml' },
      { name: 'aluminum hydroxide', strength: '300mg/5ml' },
      { name: 'simethicone', strength: '25mg/5ml' }
    ],
    dosageForm: 'Oral Suspension',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    medicineClass: 'Antacid + Antiflatulent',
    commonUses: ['Immediate relief of acute acidity', 'Heartburn', 'Bloating and gas'],
    commonSideEffects: ['Chalky taste', 'Constipation (from aluminum) or diarrhea (from magnesium)'],
    importantWarnings: [
      'Provides symptomatic relief; does not cure underlying peptic ulcers.',
      'Antacids bind to antibiotics (ciprofloxacin, tetracycline) and iron supplements—separate doses by at least 2 hours.'
    ],
    contraindications: ['Severe renal failure (risk of aluminum/magnesium toxicity)', 'Appendicitis symptoms'],
    prescriptionStatus: 'OTC',
    storage: 'Shake well before use. Keep in a cool place; do not freeze.',
    pregnancyRisk: 'Compatible with caution'
  },

  // --- ANTIHISTAMINES / COLD / COUGH ---
  {
    brandName: 'Allegra 120',
    normalizedBrand: 'allegra',
    genericIngredients: [{ name: 'fexofenadine', strength: '120mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Sanofi India Ltd',
    medicineClass: 'Second-Generation Non-Sedating Antihistamine',
    commonUses: ['Allergic rhinitis (sneezing, runny nose, itchy eyes)', 'Chronic idiopathic urticaria (hives)'],
    commonSideEffects: ['Headache', 'Drowsiness (rare compared to older antihistamines)', 'Nausea'],
    importantWarnings: [
      'Do not take with fruit juices (apple, orange, grapefruit) because they reduce fexofenadine bioavailability by up to 50% through OATP1A2 inhibition.',
      'Take with plain water only.'
    ],
    contraindications: ['Hypersensitivity to fexofenadine'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Montair-LC',
    normalizedBrand: 'montair lc',
    genericIngredients: [
      { name: 'montelukast', strength: '10mg' },
      { name: 'levocetirizine', strength: '5mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Cipla Ltd',
    medicineClass: 'Leukotriene Receptor Antagonist + Antihistamine',
    commonUses: ['Allergic rhinitis', 'Seasonal allergies', 'Asthma maintenance with allergic rhinitis'],
    commonSideEffects: ['Drowsiness', 'Dry mouth', 'Fatigue', 'Vivid dreams'],
    importantWarnings: [
      'Best taken in the evening before bedtime due to mild sedative effects.',
      'FDA Black Box Warning on montelukast: Monitor for neuropsychiatric changes (agitation, depression, sleep disturbances, suicidal ideation).'
    ],
    contraindications: ['Severe renal disease (creatinine clearance < 10 mL/min)', 'Known allergy to montelukast or cetirizine derivatives'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in dry place below 30°C.',
    ageWarnings: { pediatric: 'Use pediatric syrup/chewable tablets with precise weight-based dosing.' },
    pregnancyRisk: 'Consult OB/GYN'
  },
  {
    brandName: 'Cheston Cold',
    normalizedBrand: 'cheston cold',
    genericIngredients: [
      { name: 'cetirizine', strength: '5mg' },
      { name: 'paracetamol', strength: '325mg' },
      { name: 'phenylephrine', strength: '10mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Cipla Ltd',
    medicineClass: 'Antihistamine + Analgesic + Decongestant',
    commonUses: ['Common cold symptoms', 'Nasal congestion', 'Sinus pressure', 'Fever with runny nose'],
    commonSideEffects: ['Drowsiness', 'Dryness in nose and throat', 'Increased heart rate', 'Insomnia'],
    importantWarnings: [
      'Phenylephrine is a vasoconstrictor: Can raise blood pressure. CAUTION in hypertensive patients.',
      'Contains paracetamol: Do not take additional paracetamol tablets.',
      'May cause daytime sleepiness; avoid driving.'
    ],
    contraindications: ['Severe uncontrolled hypertension', 'Severe coronary artery disease', 'Hyperthyroidism', 'Closed-angle glaucoma'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in a cool dry place.',
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Sinarest',
    normalizedBrand: 'sinarest',
    genericIngredients: [
      { name: 'paracetamol', strength: '500mg' },
      { name: 'chlorpheniramine', strength: '2mg' },
      { name: 'phenylephrine', strength: '10mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Centaur Pharmaceuticals Pvt Ltd',
    medicineClass: 'Analgesic + First-Gen Antihistamine + Decongestant',
    commonUses: ['Cold, flu, nasal congestion, body pain and headache'],
    commonSideEffects: ['Marked drowsiness', 'Dry mouth', 'Urinary retention in elderly men', 'Restlessness'],
    importantWarnings: [
      'Strongly causes drowsiness: Do not drive or operate machinery.',
      'Do not combine with other paracetamol medicines or alcohol.',
      'Avoid in patients taking MAO inhibitors.'
    ],
    contraindications: ['Severe hypertension', 'Benign prostatic hyperplasia (BPH) with retention', 'Narrow-angle glaucoma'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Ascoril LS',
    normalizedBrand: 'ascoril ls',
    genericIngredients: [
      { name: 'levosalbutamol', strength: '1mg/5ml' },
      { name: 'ambroxol', strength: '30mg/5ml' },
      { name: 'guaiphenesin', strength: '50mg/5ml' }
    ],
    dosageForm: 'Syrup',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    medicineClass: 'Bronchodilator + Mucolytic + Expectorant',
    commonUses: ['Productive (wet) cough associated with bronchospasm', 'Bronchitis', 'Asthma exacerbation with mucus'],
    commonSideEffects: ['Tremors of hands', 'Palpitations', 'Nausea', 'Headache'],
    importantWarnings: [
      'Levosalbutamol is a beta-2 agonist: May cause shakiness, tremors, or rapid pulse in sensitive individuals.',
      'Drink plenty of warm fluids to help thin mucus secretions.',
      'Not intended for dry, non-productive cough.'
    ],
    contraindications: ['Cardiac arrhythmias', 'Severe thyrotoxicosis'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 30°C; do not refrigerate.',
    pregnancyRisk: 'Consult OB/GYN'
  },

  // --- CARDIOVASCULAR & ANTIHYPERTENSIVE ---
  {
    brandName: 'Telma 40',
    normalizedBrand: 'telma',
    genericIngredients: [{ name: 'telmisartan', strength: '40mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    medicineClass: 'Angiotensin II Receptor Blocker (ARB)',
    commonUses: ['Essential hypertension', 'Cardiovascular event risk reduction', 'Diabetic nephropathy management'],
    commonSideEffects: ['Dizziness upon standing (orthostatic)', 'Back pain', 'Sinusitis', 'Diarrhea'],
    importantWarnings: [
      'BLACK BOX WARNING: Toxic to developing fetus; must be discontinued immediately if pregnancy is detected.',
      'Check serum potassium regularly (risk of hyperkalemia, especially if combined with potassium supplements or salt substitutes).',
      'Take at approximately the same time every day with or without food.'
    ],
    contraindications: ['Pregnancy (2nd and 3rd trimesters)', 'Biliary obstructive disorders', 'Severe hepatic impairment'],
    prescriptionStatus: 'Schedule H',
    storage: 'Moisture sensitive: Keep in original blister strip until immediately before use.',
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Telma-H',
    normalizedBrand: 'telma h',
    genericIngredients: [
      { name: 'telmisartan', strength: '40mg' },
      { name: 'hydrochlorothiazide', strength: '12.5mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    medicineClass: 'ARB + Thiazide Diuretic Combination',
    commonUses: ['Hypertension not adequately controlled by monotherapy'],
    commonSideEffects: ['Increased urination', 'Electrolyte imbalance (low sodium, high/low potassium)', 'Dizziness', 'Dehydration'],
    importantWarnings: [
      'CONTRAINDICATED IN PREGNANCY.',
      'Best taken in the morning to prevent night-time urination (nocturia).',
      'Monitor serum electrolytes (sodium, potassium) and uric acid (can precipitate gout).'
    ],
    contraindications: ['Pregnancy', 'Anuria', 'Refractory hypokalemia or hyponatremia', 'Severe renal impairment'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store in blister strip in dry location.',
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Amlong 5',
    normalizedBrand: 'amlong',
    genericIngredients: [{ name: 'amlodipine', strength: '5mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    medicineClass: 'Dihydropyridine Calcium Channel Blocker',
    commonUses: ['Hypertension', 'Chronic stable angina', 'Vasospastic angina'],
    commonSideEffects: ['Peripheral edema (ankle/foot swelling)', 'Flushing', 'Palpitations', 'Fatigue'],
    importantWarnings: [
      'Ankle swelling is a common vasodilation side effect, not necessarily heart failure—inform your physician if bothersome.',
      'Avoid abrupt discontinuation to prevent rebound hypertension.'
    ],
    contraindications: ['Severe hypotension', 'Cardiogenic shock', 'Severe aortic stenosis'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C away from moisture.',
    ageWarnings: { geriatric: 'Start at lower dose (2.5mg daily) due to slower clearance.' },
    pregnancyRisk: 'Consult OB/GYN'
  },
  {
    brandName: 'Atorva 10',
    normalizedBrand: 'atorva',
    genericIngredients: [{ name: 'atorvastatin', strength: '10mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'Zydus Lifesciences Ltd',
    medicineClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    commonUses: ['Hypercholesterolemia (elevated LDL)', 'Coronary artery disease prevention', 'Stroke prevention'],
    commonSideEffects: ['Myalgia (muscle ache)', 'Joint pain', 'Mild digestive upset', 'Mild elevation in liver enzymes'],
    importantWarnings: [
      'Report any unexplained muscle pain, tenderness, or weakness immediately (risk of rhabdomyolysis).',
      'Avoid large quantities of grapefruit juice as it inhibits CYP3A4, dramatically increasing statin levels.',
      'Routine baseline liver function tests recommended.'
    ],
    contraindications: ['Active liver disease', 'Pregnancy and lactation', 'Unexplained persistent liver enzyme elevation'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Contraindicated in pregnancy'
  },
  {
    brandName: 'Ecosprin 75',
    normalizedBrand: 'ecosprin',
    genericIngredients: [{ name: 'aspirin', strength: '75mg' }],
    dosageForm: 'Enteric-Coated Tablet',
    manufacturer: 'USV Pvt Ltd',
    medicineClass: 'Antiplatelet Agent (Low-Dose Aspirin)',
    commonUses: ['Secondary prevention of myocardial infarction (heart attack)', 'Prevention of ischemic stroke', 'Post-stent thrombosis prevention'],
    commonSideEffects: ['Dyspepsia', 'Bruising easily', 'Microscopic GI bleeding'],
    importantWarnings: [
      'Enteric coated: Swallow whole with a full glass of water; do not break or crush.',
      'Increases bleeding risk with other blood thinners (warfarin, apixaban, clopidogrel) or NSAIDs.',
      'Never give to children or teenagers with viral illness (Reye Syndrome risk).'
    ],
    contraindications: ['Active gastrointestinal ulceration or bleeding', 'Hemophilia or bleeding diathesis', 'Aspirin-induced asthma triad'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C in dry conditions.',
    pregnancyRisk: 'Avoid unless prescribed'
  },

  // --- ANTIDIABETIC ---
  {
    brandName: 'Glycomet 500',
    normalizedBrand: 'glycomet',
    genericIngredients: [{ name: 'metformin', strength: '500mg' }],
    dosageForm: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    medicineClass: 'Biguanide Antidiabetic',
    commonUses: ['Type 2 Diabetes Mellitus', 'Polycystic Ovary Syndrome (PCOS) insulin resistance'],
    commonSideEffects: ['Metallic taste', 'Diarrhea', 'Nausea and vomiting', 'Abdominal flatulence'],
    importantWarnings: [
      'Take with or immediately after meals to reduce gastrointestinal side effects.',
      'BLACK BOX WARNING: Lactic Acidosis risk. Extreme caution in kidney impairment (monitor eGFR; avoid if eGFR < 30 mL/min).',
      'Must temporarily withhold 48 hours before and after radiocontrast iodinated procedures.',
      'Long-term use can reduce Vitamin B12 absorption; annual B12 check recommended.'
    ],
    contraindications: ['Severe renal impairment (eGFR < 30 mL/min)', 'Acute metabolic or diabetic ketoacidosis', 'Severe heart failure or sepsis with tissue hypoxia'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 30°C in a dry place.',
    pregnancyRisk: 'Compatible with caution'
  },
  {
    brandName: 'Glycomet-GP 1',
    normalizedBrand: 'glycomet gp',
    genericIngredients: [
      { name: 'metformin', strength: '500mg' },
      { name: 'glimepiride', strength: '1mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    medicineClass: 'Biguanide + Sulfonylurea Combination',
    commonUses: ['Type 2 Diabetes uncontrolled by metformin alone'],
    commonSideEffects: ['Hypoglycemia (low blood sugar)', 'Weight gain', 'Gastrointestinal upset', 'Dizziness'],
    importantWarnings: [
      'CRITICAL: Glimepiride stimulates insulin release and can cause severe hypoglycemia (cold sweat, shakiness, confusion). Always keep glucose candy or fruit juice handy.',
      'Take strictly with the first main meal of the day (breakfast). Never skip meals after taking this tablet.',
      'Avoid alcohol consumption as it masks and worsens hypoglycemia.'
    ],
    contraindications: ['Type 1 Diabetes', 'Diabetic ketoacidosis', 'Severe kidney or liver impairment'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C protected from light.',
    ageWarnings: { geriatric: 'Higher risk of severe hypoglycemia in elderly patients; frequent blood sugar checks needed.' },
    pregnancyRisk: 'Avoid unless prescribed'
  },
  {
    brandName: 'Janumet 50/500',
    normalizedBrand: 'janumet',
    genericIngredients: [
      { name: 'sitagliptin', strength: '50mg' },
      { name: 'metformin', strength: '500mg' }
    ],
    dosageForm: 'Tablet',
    manufacturer: 'MSD Pharmaceuticals Pvt Ltd',
    medicineClass: 'DPP-4 Inhibitor + Biguanide Combination',
    commonUses: ['Type 2 Diabetes Mellitus'],
    commonSideEffects: ['Upper respiratory tract infection', 'Diarrhea', 'Nausea', 'Flatulence'],
    importantWarnings: [
      'Take with meals twice daily.',
      'Rare risk of acute pancreatitis: Report persistent, severe abdominal pain radiating to the back immediately.',
      'Check kidney function prior to initiation.'
    ],
    contraindications: ['Severe renal impairment', 'Metabolic acidosis', 'Hypersensitivity to sitagliptin'],
    prescriptionStatus: 'Schedule H',
    storage: 'Store below 25°C.',
    pregnancyRisk: 'Avoid unless prescribed'
  }
];

// --- DETERMINISTIC DRUG-DRUG INTERACTION MATRIX ---
export const DRUG_INTERACTIONS: DrugInteractionPair[] = [
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'HIGH',
    mechanism: 'Additive antiplatelet and anticoagulant effects severely amplify risk of major gastrointestinal and systemic bleeding.',
    clinicalAdvice: 'Avoid concurrent use unless strictly supervised under specialized cardiology and frequent INR monitoring.'
  },
  {
    drugA: 'warfarin',
    drugB: 'ibuprofen',
    severity: 'HIGH',
    mechanism: 'NSAIDs displace warfarin from plasma protein binding and damage gastric mucosa, creating extreme gastrointestinal hemorrhage risk.',
    clinicalAdvice: 'Contraindicated. Use paracetamol for analgesia if anticoagulated on warfarin.'
  },
  {
    drugA: 'warfarin',
    drugB: 'aceclofenac',
    severity: 'HIGH',
    mechanism: 'NSAID-induced platelet inhibition and ulcerogenic effect dramatically elevates bleeding risk in warfarin therapy.',
    clinicalAdvice: 'Do not combine. Consult cardiologist for non-NSAID pain management.'
  },
  {
    drugA: 'aspirin',
    drugB: 'ibuprofen',
    severity: 'HIGH',
    mechanism: 'Ibuprofen blocks platelet COX-1 binding site, preventing aspirin from exerting its cardioprotective antiplatelet effect, while compounding ulcer risk.',
    clinicalAdvice: 'If both are prescribed, take aspirin at least 30 minutes before ibuprofen, or take ibuprofen at least 8 hours prior.'
  },
  {
    drugA: 'aspirin',
    drugB: 'aceclofenac',
    severity: 'HIGH',
    mechanism: 'Concurrent dual NSAID/salicylate use causes synergistic erosion of gastric mucosa and dramatically increases GI ulcer and bleeding rates.',
    clinicalAdvice: 'Avoid combining dual NSAIDs.'
  },
  {
    drugA: 'metformin',
    drugB: 'alcohol',
    severity: 'HIGH',
    mechanism: 'Alcohol inhibits hepatic gluconeogenesis and lactate clearance, substantially elevating the risk of life-threatening metformin-associated lactic acidosis (MALA).',
    clinicalAdvice: 'Strictly avoid excessive or binge alcohol consumption while on metformin.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'magnesium hydroxide',
    severity: 'MODERATE',
    mechanism: 'Polyvalent cations (magnesium, aluminum) chelate fluoroquinolones in the GI tract, reducing antibiotic bioavailability by up to 85%.',
    clinicalAdvice: 'Administer ciprofloxacin at least 2 hours before or 4 hours after antacids.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'aluminum hydroxide',
    severity: 'MODERATE',
    mechanism: 'Chelation with aluminum ions drastically hinders ciprofloxacin absorption, causing clinical failure of infection control.',
    clinicalAdvice: 'Separate doses by at least 2 to 4 hours.'
  },
  {
    drugA: 'azithromycin',
    drugB: 'domperidone',
    severity: 'HIGH',
    mechanism: 'Both agents independently prolong the cardiac QTc interval. Combined use significantly elevates the risk of polymorphic ventricular tachycardia (Torsades de Pointes).',
    clinicalAdvice: 'Avoid concurrent administration, especially in patients with baseline electrolyte abnormalities or known cardiac conditions.'
  },
  {
    drugA: 'metronidazole',
    drugB: 'alcohol',
    severity: 'HIGH',
    mechanism: 'Inhibition of aldehyde dehydrogenase triggers acetaldehyde accumulation, causing severe disulfiram-like reactions: violent flushing, vomiting, tachycardia, and dyspnea.',
    clinicalAdvice: 'Strict zero-alcohol policy during therapy and for 48 hours following the final dose.'
  },
  {
    drugA: 'omeprazole',
    drugB: 'clopidogrel',
    severity: 'HIGH',
    mechanism: 'Omeprazole strongly inhibits hepatic CYP2C19, preventing the bioactivation of clopidogrel into its active antiplatelet form, increasing stent thrombosis risk.',
    clinicalAdvice: 'Switch to pantoprazole, which exhibits minimal CYP2C19 inhibition.'
  },
  {
    drugA: 'telmisartan',
    drugB: 'ibuprofen',
    severity: 'MODERATE',
    mechanism: 'NSAIDs inhibit renal vasodilatory prostaglandins, attenuating the antihypertensive efficacy of telmisartan and precipitating acute renal decline.',
    clinicalAdvice: 'Monitor blood pressure and renal function. Avoid chronic daily NSAID use with ARBs.'
  },
  {
    drugA: 'telmisartan',
    drugB: 'spironolactone',
    severity: 'HIGH',
    mechanism: 'Synergistic potassium retention by aldosterone antagonism and renin-angiotensin blockade can cause life-threatening hyperkalemia.',
    clinicalAdvice: 'Monitor serum potassium and renal panel regularly.'
  },
  {
    drugA: 'tramadol',
    drugB: 'paracetamol',
    severity: 'LOW',
    mechanism: 'Safe and clinically validated synergy when taken within therapeutic dose limits (e.g. Ultracet), but beware accidental duplicate paracetamol ingestion from other products.',
    clinicalAdvice: 'Ensure total daily paracetamol from all sources stays under 4,000 mg.'
  },
  {
    drugA: 'paracetamol',
    drugB: 'paracetamol',
    severity: 'HIGH',
    mechanism: 'Accidental duplicate active ingredient ingestion from multi-symptom cold/pain formulations leads to acute acetaminophen hepatotoxicity and liver failure.',
    clinicalAdvice: 'Check all packaging. Do NOT take more than one paracetamol-containing medicine at a time.'
  }
];

// --- CROSS-ALLERGY GROUPS ---
export const ALLERGY_CROSS_REACTIVITY: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'cloxacillin', 'clavulanic acid', 'piperacillin', 'ticarcillin'],
  cephalosporin: ['cefixime', 'ceftriaxone', 'cefuroxime', 'cephalexin', 'cefotaxime', 'cefepime'],
  nsaid: ['ibuprofen', 'aspirin', 'aceclofenac', 'diclofenac', 'naproxen', 'mefenamic acid', 'indomethacin', 'piroxicam'],
  sulfa: ['sulfamethoxazole', 'glimepiride', 'hydrochlorothiazide', 'furosemide', 'celecoxib'],
  macrolide: ['azithromycin', 'clarithromycin', 'erythromycin', 'roxithromycin'],
  fluoroquinolone: ['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'moxifloxacin', 'norfloxacin']
};
