// Ask Sentinel Rule-based Parser
// "The question is converted to a filter; records are never sent to a language model."

import type { Instrument, InstrumentStatus, RiskBand } from '../types';
import { daysToMaturity } from './dates';
import { getRiskBand } from './fraud';

export interface AskFilter {
  daysMax?: number; // e.g. 30
  amountMin?: number; // e.g. 10
  amountMax?: number; // e.g. 25
  state?: string; // e.g. 'Delhi'
  status?: InstrumentStatus;
  riskBand?: RiskBand;
  isCoverageGap?: boolean;
  bankName?: string;
  querySummary?: string;
}

export interface AskChip {
  id: string;
  label: string;
  key: keyof AskFilter;
}

// Allow-list validation
const ALLOWED_FIELDS: Array<keyof AskFilter> = [
  'daysMax',
  'amountMin',
  'amountMax',
  'state',
  'status',
  'riskBand',
  'isCoverageGap',
  'bankName',
  'querySummary',
];

export function validateFilter(filter: Record<string, unknown>): boolean {
  return Object.keys(filter).every(k => ALLOWED_FIELDS.includes(k as keyof AskFilter));
}

// Available seeds lookup
const STATES = [
  'Delhi',
  'Maharashtra',
  'Uttar Pradesh',
  'Karnataka',
  'Tamil Nadu',
  'Rajasthan',
  'Gujarat',
  'Andhra Pradesh',
  'Madhya Pradesh',
  'West Bengal',
  'Punjab',
  'Odisha',
];

const BANKS = [
  'State Bank of India',
  'SBI',
  'HDFC Bank',
  'HDFC',
  'ICICI Bank',
  'ICICI',
  'Canara Bank',
  'Punjab National Bank',
  'PNB',
  'Bank of Baroda',
  'BOB',
  'Union Bank of India',
  'UBI',
  'Indian Overseas Bank',
  'IOB',
  'Indian Bank',
  'UCO Bank',
];

export function parseQueryToFilter(query: string): AskFilter | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const filter: AskFilter = {};
  let matched = false;

  // 1. Days to maturity ("next 30 days", "within 60 days", "in 90 days")
  const daysMatch = q.match(/(?:next|within|in)\s+(\d+)\s*(?:days?|d)/i);
  if (daysMatch) {
    filter.daysMax = parseInt(daysMatch[1], 10);
    matched = true;
  }

  // 2. Amounts:
  // "above 10 lakh", "more than 20 lakhs", "greater than 15 lakh"
  const amountMinMatch = q.match(/(?:above|more than|greater than|over|min)\s+(\d+)\s*(?:lakhs?|l)?/i);
  if (amountMinMatch) {
    filter.amountMin = parseInt(amountMinMatch[1], 10);
    matched = true;
  }

  // "below 25 lakh", "less than 40 lakhs", "under 30 lakh"
  const amountMaxMatch = q.match(/(?:below|less than|under|max)\s+(\d+)\s*(?:lakhs?|l)?/i);
  if (amountMaxMatch) {
    filter.amountMax = parseInt(amountMaxMatch[1], 10);
    matched = true;
  }

  // 3. States
  for (const st of STATES) {
    if (q.includes(st.toLowerCase())) {
      filter.state = st;
      matched = true;
      break;
    }
  }

  // 4. Status words
  if (q.includes('flagged')) { filter.status = 'Flagged'; matched = true; }
  else if (q.includes('matured')) { filter.status = 'Matured'; matched = true; }
  else if (q.includes('expiring')) { filter.status = 'Expiring'; matched = true; }
  else if (q.includes('released')) { filter.status = 'Released'; matched = true; }
  else if (q.includes('renewed')) { filter.status = 'Renewed'; matched = true; }
  else if (q.includes('active')) { filter.status = 'Active'; matched = true; }
  else if (q.includes('under verification') || q.includes('pending verification')) {
    filter.status = 'Under verification';
    matched = true;
  }

  // 5. Risk bands
  if (q.includes('high risk') || q.includes('high-risk')) {
    filter.riskBand = 'high';
    matched = true;
  } else if (q.includes('medium risk') || q.includes('moderate risk')) {
    filter.riskBand = 'medium';
    matched = true;
  } else if (q.includes('low risk')) {
    filter.riskBand = 'low';
    matched = true;
  }

  // 6. Coverage gap
  if (q.includes('coverage gap') || q.includes('gap risk') || q.includes('gap')) {
    filter.isCoverageGap = true;
    matched = true;
  }

  // 7. Bank names
  for (const b of BANKS) {
    if (q.includes(b.toLowerCase())) {
      filter.bankName = b === 'SBI' ? 'State Bank of India' : b === 'PNB' ? 'Punjab National Bank' : b;
      matched = true;
      break;
    }
  }

  if (!matched) return null;
  filter.querySummary = query;
  return filter;
}

export function buildChips(filter: AskFilter): AskChip[] {
  const chips: AskChip[] = [];
  if (filter.daysMax !== undefined) {
    chips.push({ id: 'daysMax', label: `Maturity ≤ ${filter.daysMax} days`, key: 'daysMax' });
  }
  if (filter.amountMin !== undefined) {
    chips.push({ id: 'amountMin', label: `Amount ≥ ₹${filter.amountMin} Lakh`, key: 'amountMin' });
  }
  if (filter.amountMax !== undefined) {
    chips.push({ id: 'amountMax', label: `Amount ≤ ₹${filter.amountMax} Lakh`, key: 'amountMax' });
  }
  if (filter.state) {
    chips.push({ id: 'state', label: `State: ${filter.state}`, key: 'state' });
  }
  if (filter.status) {
    chips.push({ id: 'status', label: `Status: ${filter.status}`, key: 'status' });
  }
  if (filter.riskBand) {
    chips.push({ id: 'riskBand', label: `Risk: ${filter.riskBand.toUpperCase()}`, key: 'riskBand' });
  }
  if (filter.isCoverageGap) {
    chips.push({ id: 'isCoverageGap', label: `Coverage Gap: Yes`, key: 'isCoverageGap' });
  }
  if (filter.bankName) {
    chips.push({ id: 'bankName', label: `Bank: ${filter.bankName}`, key: 'bankName' });
  }
  return chips;
}

export function applyAskFilter(
  instruments: Instrument[],
  institutions: Array<{ id: string; name: string; state: string }>,
  filter: AskFilter,
  currentDate: string,
  userInstitutionId?: string
): Instrument[] {
  if (!validateFilter(filter as Record<string, unknown>)) {
    return [];
  }

  return instruments.filter(inst => {
    // Role scope
    if (userInstitutionId && inst.institutionId !== userInstitutionId) {
      return false;
    }

    const instInstitution = institutions.find(i => i.id === inst.institutionId);

    // Days max
    if (filter.daysMax !== undefined) {
      const d = daysToMaturity(inst.maturityDate, currentDate);
      if (d < 0 || d > filter.daysMax) return false;
    }

    // Amount min / max
    if (filter.amountMin !== undefined && inst.amount < filter.amountMin) return false;
    if (filter.amountMax !== undefined && inst.amount > filter.amountMax) return false;

    // State
    if (filter.state && instInstitution?.state.toLowerCase() !== filter.state.toLowerCase()) {
      return false;
    }

    // Status
    if (filter.status && inst.status !== filter.status) {
      return false;
    }

    // Risk band
    if (filter.riskBand) {
      const b = getRiskBand(inst.riskScore);
      if (b !== filter.riskBand) return false;
    }

    // Coverage gap
    if (filter.isCoverageGap) {
      if (!inst.coverageRequired || inst.amount >= inst.coverageRequired) return false;
    }

    // Bank name
    if (filter.bankName && !inst.bankName.toLowerCase().includes(filter.bankName.toLowerCase())) {
      return false;
    }

    return true;
  });
}
