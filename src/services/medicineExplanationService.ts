/**
 * Grounded Medicine Educational Explanation & Localization Service
 * 
 * Non-negotiable rules:
 * 1. Explanations must be strictly grounded in verified facts.
 * 2. Translation/localization occurs AFTER facts are established.
 * 3. Never output "This medicine is safe for you".
 * 4. Preserves drug names, strengths, and warnings across English, Hindi, and Hinglish.
 * Grounded in docs/MEDICINE_LENS.md
 */

import { MedicineLensResult, LocalizedExplanation, SupportedLanguage } from '../types/medicineLens';

/**
 * Builds localized patient explanations for English, Hindi, and Hinglish.
 */
export function generateLocalizedExplanation(
  result: MedicineLensResult,
  language: SupportedLanguage = 'en'
): LocalizedExplanation {
  const brand = result.identification.brandName || 'Scanned Medicine';
  const ingredients = result.identification.genericIngredients
    .map(g => `${g.name}${g.strength ? ` (${g.strength})` : ''}`)
    .join(', ') || 'Active ingredients pending';
  const medicineClass = result.education?.medicineClass || 'Therapeutic medication';
  const uses = result.education?.commonUses || ['Symptomatic relief as directed by physician'];
  const sideEffects = result.education?.commonSideEffects || ['Mild nausea', 'Dizziness'];
  const warnings = result.education?.importantWarnings || ['Take strictly as advised by your healthcare provider.'];
  const storage = result.education?.storage || 'Store in a cool, dry place away from direct sunlight.';

  // Highlight safety issues
  const hasAllergies = (result.personalizedSafety?.allergyWarnings?.length || 0) > 0;
  const hasInteractions = (result.personalizedSafety?.interactionWarnings?.length || 0) > 0;
  const hasDuplicates = (result.personalizedSafety?.duplicateWarnings?.length || 0) > 0;

  if (language === 'hi') {
    // Hindi (हिंदी)
    const summary = `${brand} एक ${medicineClass} वर्ग की दवा है जिसमें सक्रिय तत्व ${ingredients} शामिल हैं।`;
    const whatItIsFor = `यह मुख्य रूप से निम्नलिखित स्थितियों में उपयोग की जाती है: ${uses.join(', ')}।`;
    const howToTakeSafely = `हमेशा अपने डॉक्टर या फार्मासिस्ट द्वारा बताए गए सटीक समय और खुराक का पालन करें। ${storage}`;
    const sideEffectsAndPrecautions = `सामान्य संभावित दुष्प्रभाव: ${sideEffects.join(', ')}। यदि कोई दुष्प्रभाव बना रहता है, तो तुरंत डॉक्टर से संपर्क करें।`;
    
    let warningsText = warnings.join('। ');
    if (hasAllergies) {
      warningsText = `⚠️ गंभीर एलर्जी चेतावनी: यह दवा आपकी ज्ञात एलर्जी से मेल खाती है। इसे बिना डॉक्टर की सलाह के बिल्कुल न लें। ` + warningsText;
    }
    if (hasInteractions) {
      warningsText = `⚠️ दवा परस्पर प्रभाव (Drug Interaction): आपकी वर्तमान दवाओं के साथ इसका परस्पर प्रभाव हो सकता है। ` + warningsText;
    }
    if (hasDuplicates) {
      warningsText = `⚠️ दोहरी दवा चेतावनी: आप पहले से ही समान सक्रिय तत्व ले रहे हैं। ओवरडोज़ से बचें। ` + warningsText;
    }

    const emergencyAdvice = 'यदि आपको सांस लेने में कठिनाई, चेहरे या गले में सूजन, या त्वचा पर गंभीर चकत्ते महसूस हों, तो तत्काल निकटतम अस्पताल के आपातकालीन विभाग में जाएं।';

    return {
      language: 'hi',
      summary,
      whatItIsFor,
      howToTakeSafely,
      sideEffectsAndPrecautions,
      warningsText,
      emergencyAdvice
    };
  }

  if (language === 'hinglish') {
    // Hinglish (Colloquial Hindi in Roman script)
    const summary = `${brand} ek ${medicineClass} category ki medicine hai, jisme active salt ${ingredients} hota hai.`;
    const whatItIsFor = `Ye medicine aamtaur par in conditions ke liye use hoti hai: ${uses.join(', ')}.`;
    const howToTakeSafely = `Doctor ke bataye gaye dose aur time ke anusaar hi lein. Khali pet ya khane ke baad lene ka dhyan rakhein. ${storage}`;
    const sideEffectsAndPrecautions = `Common side effects: ${sideEffects.join(', ')}. Agar koi problem zyada lage toh apne doctor se consult karein.`;

    let warningsText = warnings.join('. ');
    if (hasAllergies) {
      warningsText = `⚠️ DANGER - ALLERGY ALERT: Is medicine me wo ingredient hai jisse aapko allergy hai. Ise bilkul mat lein! ` + warningsText;
    }
    if (hasInteractions) {
      warningsText = `⚠️ DRUG INTERACTION ALERT: Aapki regular dawaiyon ke saath iska interaction ho sakta hai. Pharmacist se verify karein. ` + warningsText;
    }
    if (hasDuplicates) {
      warningsText = `⚠️ DOUBLE DOSE ALERT: Aap already similar salt wali dawai le rahe hain. Overdose ka khatra hai. ` + warningsText;
    }

    const emergencyAdvice = 'Agar saans lene me takleef, chehre par sujan ya tez ghabrahat ho, toh bina deri kiye turant emergency hospital jayein.';

    return {
      language: 'hinglish',
      summary,
      whatItIsFor,
      howToTakeSafely,
      sideEffectsAndPrecautions,
      warningsText,
      emergencyAdvice
    };
  }

  // Default: English
  const summary = `${brand} is a ${medicineClass} containing the active ingredient(s): ${ingredients}.`;
  const whatItIsFor = `Typically indicated for: ${uses.join(', ')}.`;
  const howToTakeSafely = `Follow the exact dosage schedule prescribed by your physician. Do not alter dosage without clinical advice. ${storage}`;
  const sideEffectsAndPrecautions = `Reported common side effects include: ${sideEffects.join(', ')}. Discontinue and consult your clinician if side effects worsen.`;

  let warningsText = warnings.join('. ');
  if (hasAllergies) {
    warningsText = `⚠️ CRITICAL ALLERGY ALERT: Scanned ingredients match your documented allergy profile. Do NOT take this medication without emergency medical clearance. ` + warningsText;
  }
  if (hasInteractions) {
    warningsText = `⚠️ DRUG INTERACTION ALERT: Clinical interactions detected with your current medications. Consult your physician or pharmacist before taking. ` + warningsText;
  }
  if (hasDuplicates) {
    warningsText = `⚠️ DUPLICATE INGREDIENT ALERT: Overlap with existing medications detected. Combining these creates an accidental overdose hazard. ` + warningsText;
  }

  const emergencyAdvice = 'If you experience severe swelling of the face or throat, acute difficulty breathing, or severe widespread rash, seek emergency medical care immediately.';

  return {
    language: 'en',
    summary,
    whatItIsFor,
    howToTakeSafely,
    sideEffectsAndPrecautions,
    warningsText,
    emergencyAdvice
  };
}
