// Fraud Guard - dynamic risk computation engine

import type { Instrument, RiskBand, RiskSignal } from '../types';

export interface FraudWeightsConfig {
  duplicateInstrumentNo: number;
  sameFileHash: number;
  maturityNotAfterIssueOrOddTenure: number;
  ifscBankMismatch: number;
  amountBelowRequirement: number;
  pdfModifiedAfterCreation: number;
  imageTamper: number;
  noAicteWording: number;
  bankMismatch: number;
}

export const DEFAULT_FRAUD_WEIGHTS: FraudWeightsConfig = {
  duplicateInstrumentNo: 40,
  sameFileHash: 30,
  maturityNotAfterIssueOrOddTenure: 35,
  ifscBankMismatch: 20,
  amountBelowRequirement: 20,
  pdfModifiedAfterCreation: 15,
  imageTamper: 15,
  noAicteWording: 10,
  bankMismatch: 50,
};

export interface RiskBandConfig {
  high: number; // default 60
  medium: number; // default 30
}

export const DEFAULT_RISK_BANDS: RiskBandConfig = {
  high: 60,
  medium: 30,
};

// Bank IFSC prefix map (first 4 chars = bank code)
const IFSC_BANK_MAP: Record<string, string> = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  UBIN: 'Union Bank of India',
  CNRB: 'Canara Bank',
  BKID: 'Bank of India',
  IOBA: 'Indian Overseas Bank',
  ANDB: 'Andhra Bank',
  CORP: 'Corporation Bank',
  IDIB: 'Indian Bank',
  VIJB: 'Vijaya Bank',
  UCBA: 'UCO Bank',
  ALLA: 'Allahabad Bank',
};

function getExpectedBank(ifsc: string): string | null {
  const prefix = ifsc.slice(0, 4).toUpperCase();
  return IFSC_BANK_MAP[prefix] || null;
}

export function computeRisk(
  instrument: Instrument,
  allInstruments: Instrument[],
  customWeights: FraudWeightsConfig = DEFAULT_FRAUD_WEIGHTS
): { score: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];
  let score = 0;

  // 1. Duplicate instrument number
  const dupNo = allInstruments.some(
    i => i.id !== instrument.id && i.instrumentNo === instrument.instrumentNo
  );
  signals.push({
    label: 'Duplicate instrument number',
    weight: customWeights.duplicateInstrumentNo,
    triggered: dupNo,
  });
  if (dupNo) score += customWeights.duplicateInstrumentNo;

  // 2. Same file hash
  const sameHash =
    !!instrument.fileHash &&
    allInstruments.some(
      i => i.id !== instrument.id && i.fileHash === instrument.fileHash && !!i.fileHash
    );
  signals.push({
    label: 'Duplicate file hash (same PDF)',
    weight: customWeights.sameFileHash,
    triggered: sameHash,
  });
  if (sameHash) score += customWeights.sameFileHash;

  // 3. Maturity not after issue or odd tenure
  const issueMs = new Date(instrument.issueDate).getTime();
  const maturityMs = new Date(instrument.maturityDate).getTime();
  const tenureDays = (maturityMs - issueMs) / 86400000;
  const badMaturity = maturityMs <= issueMs || tenureDays < 90 || tenureDays > 3650;
  signals.push({
    label: 'Maturity not after issue / odd tenure',
    weight: customWeights.maturityNotAfterIssueOrOddTenure,
    triggered: badMaturity,
  });
  if (badMaturity) score += customWeights.maturityNotAfterIssueOrOddTenure;

  // 4. IFSC bank mismatch
  const expectedBank = getExpectedBank(instrument.ifsc);
  const ifscMismatch =
    !!expectedBank &&
    !instrument.bankName.includes(expectedBank.split(' ')[0]) &&
    !expectedBank.includes(instrument.bankName.split(' ')[0]);
  signals.push({
    label: 'IFSC prefix vs bank name mismatch',
    weight: customWeights.ifscBankMismatch,
    triggered: ifscMismatch,
  });
  if (ifscMismatch) score += customWeights.ifscBankMismatch;

  // 5. Amount below requirement
  const amountLow = !!instrument.coverageRequired && instrument.amount < instrument.coverageRequired;
  signals.push({
    label: 'Amount below AICTE requirement',
    weight: customWeights.amountBelowRequirement,
    triggered: amountLow,
  });
  if (amountLow) score += customWeights.amountBelowRequirement;

  // 6. PDF modified after creation
  const pdfMod = !!instrument.pdfModifiedAfterCreation;
  signals.push({
    label: 'PDF modified after creation date',
    weight: customWeights.pdfModifiedAfterCreation,
    triggered: pdfMod,
  });
  if (pdfMod) score += customWeights.pdfModifiedAfterCreation;

  // 7. Image tamper
  const imgTamper = !!instrument.imageTampered;
  signals.push({
    label: 'Image tampering detected',
    weight: customWeights.imageTamper,
    triggered: imgTamper,
  });
  if (imgTamper) score += customWeights.imageTamper;

  // 8. No AICTE lien wording
  const noLien = !instrument.lienInFavourAicte;
  signals.push({
    label: 'Missing AICTE lien wording',
    weight: customWeights.noAicteWording,
    triggered: noLien,
  });
  if (noLien) score += customWeights.noAicteWording;

  // 9. Bank mismatch (portal reported)
  const bankMismatch =
    instrument.riskSignals?.some(
      s => s.label === 'Bank mismatch (document vs declared)' && s.triggered
    ) || false;
  signals.push({
    label: 'Bank mismatch (document vs declared)',
    weight: customWeights.bankMismatch,
    triggered: bankMismatch,
  });
  if (bankMismatch) score += customWeights.bankMismatch;

  return { score: Math.min(score, 100), signals };
}

export function getRiskBand(score: number, thresholds: RiskBandConfig = DEFAULT_RISK_BANDS): RiskBand {
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

export function getRiskColor(band: RiskBand): string {
  if (band === 'high') return 'text-red-700 bg-red-100';
  if (band === 'medium') return 'text-amber-700 bg-amber-100';
  return 'text-green-700 bg-green-100';
}
