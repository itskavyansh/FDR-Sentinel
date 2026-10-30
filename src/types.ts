// Types for FDR Sentinel

export type Role =
  | 'Officer'
  | 'Officer-Maker'
  | 'Officer-Checker'
  | 'Officer-Approver'
  | 'Institution'
  | 'Bank'
  | 'Auditor'
  | 'Admin';

export type OfficerRegion = 'All' | 'North' | 'South' | 'West' | 'East' | 'Central';

export type TrustLevel = 'L0' | 'L1' | 'L2' | 'L3';

export type InstrumentStatus =
  | 'Draft'
  | 'Submitted'
  | 'Auto-checked'
  | 'Under verification'
  | 'Flagged'
  | 'Active'
  | 'Expiring'
  | 'Matured'
  | 'Renewal pending'
  | 'Renewed'
  | 'Release requested'
  | 'Under review'
  | 'Released';

export type RiskBand = 'low' | 'medium' | 'high';

export interface RiskSignal {
  label: string;
  weight: number;
  triggered: boolean;
}

export interface FieldTrust {
  bank: TrustLevel;
  instrumentNo: TrustLevel;
  amount: TrustLevel;
  issueDate: TrustLevel;
  maturityDate: TrustLevel;
  lien: TrustLevel;
}

export interface Institution {
  id: string;
  name: string;
  state: string;
  region: string;
  approvalNo: string;
  contactEmail: string;
}

export interface Instrument {
  id: string;
  institutionId: string;
  bankName: string;
  ifsc: string;
  instrumentNo: string; // full, displayed masked
  amount: number; // in lakhs
  issueDate: string; // ISO date
  maturityDate: string; // ISO date
  lienInFavourAicte: boolean;
  status: InstrumentStatus;
  riskScore: number;
  riskSignals: RiskSignal[];
  fieldTrust: FieldTrust;
  fileHash?: string;
  pdfModifiedAfterCreation?: boolean;
  imageTampered?: boolean;
  hasAicteWording?: boolean;
  coverageRequired?: number; // in lakhs
  notes?: string;
  renewedFromId?: string; // previous instrument id if this is a renewal
  renewedToId?: string; // next instrument id that renewed this
}

export interface BankConfirmationToken {
  token: string;
  instrumentId: string;
  bankName: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'mismatch';
}

export interface ReminderAlert {
  id: string;
  instrumentId: string;
  stage: 'T-90' | 'T-60' | 'T-30' | 'T-15' | 'T-7' | 'T-0' | 'Overdue+7';
  recipientRole: string;
  date: string;
  message: string;
}

export interface ReleaseChecklist {
  approvalCycleComplete: boolean;
  noPendingCompliance: boolean;
  noLegalHold: boolean;
  instrumentStatusValid: boolean;
}

export interface ReleaseRequest {
  id: string;
  instrumentId: string;
  institutionId: string;
  requestedDate: string;
  reason: string;
  documentName: string;
  stage: 'Maker' | 'Checker' | 'Approver' | 'Approved' | 'Rejected';
  checklist: ReleaseChecklist;
  makerNotes?: string;
  makerRecommended?: boolean;
  checkerNotes?: string;
  checkerConcurred?: boolean;
  approverNotes?: string;
  esignStamp?: {
    signedBy: string;
    timestamp: string;
    certSerial: string;
    hash: string;
  };
  bankNoticeSent?: boolean;
  bankNoticeAck?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  payloadHash: string;
  prevHash: string;
  hash: string;
  payloadData?: Record<string, unknown>;
}
