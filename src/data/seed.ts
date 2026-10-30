// Seed data for FDR Sentinel demo
// currentDate = 2026-10-30

import type { Institution, Instrument, AuditEvent } from '../types';

export const SEED_CURRENT_DATE = '2026-10-30';

export const seedInstitutions: Institution[] = [
  { id: 'inst-01', name: 'Delhi Institute of Technology & Management', state: 'Delhi', region: 'North', approvalNo: 'AICTE/DL/2018/1042', contactEmail: 'principal@ditm.edu.in' },
  { id: 'inst-02', name: 'Maharashtra Institute of Engineering, Pune', state: 'Maharashtra', region: 'West', approvalNo: 'AICTE/MH/2017/0831', contactEmail: 'director@miepune.edu.in' },
  { id: 'inst-03', name: 'Uttar Pradesh College of Engineering, Lucknow', state: 'Uttar Pradesh', region: 'North', approvalNo: 'AICTE/UP/2019/2254', contactEmail: 'registrar@upce.edu.in' },
  { id: 'inst-04', name: 'Visvesvaraya Polytechnic Institute, Bengaluru', state: 'Karnataka', region: 'South', approvalNo: 'AICTE/KA/2016/0712', contactEmail: 'admin@vpi.edu.in' },
  { id: 'inst-05', name: 'Chennai College of Applied Sciences', state: 'Tamil Nadu', region: 'South', approvalNo: 'AICTE/TN/2020/3301', contactEmail: 'principal@ccas.edu.in' },
  { id: 'inst-06', name: 'Rajasthan School of Technology, Jaipur', state: 'Rajasthan', region: 'North', approvalNo: 'AICTE/RJ/2018/1556', contactEmail: 'hod@rst.edu.in' },
  { id: 'inst-07', name: 'Gujarat Technological University Campus, Ahmedabad', state: 'Gujarat', region: 'West', approvalNo: 'AICTE/GJ/2015/0623', contactEmail: 'registrar@gtuca.edu.in' },
  { id: 'inst-08', name: 'Andhra Pradesh Institute of Advanced Studies', state: 'Andhra Pradesh', region: 'South', approvalNo: 'AICTE/AP/2021/4112', contactEmail: 'director@apias.edu.in' },
  { id: 'inst-09', name: 'Madhya Pradesh College of Science & Technology', state: 'Madhya Pradesh', region: 'Central', approvalNo: 'AICTE/MP/2019/2887', contactEmail: 'principal@mpcst.edu.in' },
  { id: 'inst-10', name: 'West Bengal Institute of Professional Studies', state: 'West Bengal', region: 'East', approvalNo: 'AICTE/WB/2017/1794', contactEmail: 'admin@wbips.edu.in' },
  { id: 'inst-11', name: 'Punjab Engineering & Management College', state: 'Punjab', region: 'North', approvalNo: 'AICTE/PB/2018/1233', contactEmail: 'director@pemc.edu.in' },
  { id: 'inst-12', name: 'Odisha College of Technology', state: 'Odisha', region: 'East', approvalNo: 'AICTE/OD/2020/3102', contactEmail: 'registrar@oct.edu.in' },
];

// --- Instruments ---
// Note: 3 flagged cases, 5 maturing within 30 days, 2 coverage gap, 2 release requests, a few released

export const seedInstruments: Instrument[] = [
  // ACTIVE instruments
  {
    id: 'fdr-001', institutionId: 'inst-01', bankName: 'State Bank of India',
    ifsc: 'SBIN0001203', instrumentNo: 'SBI20240001', amount: 25, issueDate: '2024-01-15',
    maturityDate: '2026-12-15', lienInFavourAicte: true, status: 'Active',
    riskScore: 5, riskSignals: [], fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-001',
  },
  {
    id: 'fdr-002', institutionId: 'inst-02', bankName: 'HDFC Bank',
    ifsc: 'HDFC0001456', instrumentNo: 'HDFC20240052', amount: 40, issueDate: '2024-03-01',
    maturityDate: '2027-01-20', lienInFavourAicte: true, status: 'Active',
    riskScore: 8, riskSignals: [], fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-002',
  },
  {
    id: 'fdr-003', institutionId: 'inst-04', bankName: 'Canara Bank',
    ifsc: 'CNRB0005012', instrumentNo: 'CNR20230312', amount: 30, issueDate: '2023-09-10',
    maturityDate: '2026-11-28', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 12, riskSignals: [], fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-003',
  },
  // Maturing within 30 days (5 instruments) - currentDate 2026-10-30
  {
    id: 'fdr-004', institutionId: 'inst-03', bankName: 'Punjab National Bank',
    ifsc: 'PUNB0087600', instrumentNo: 'PNB20230154', amount: 20, issueDate: '2023-11-05',
    maturityDate: '2026-11-04', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 15, riskSignals: [], fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-004',
  },
  {
    id: 'fdr-005', institutionId: 'inst-05', bankName: 'Indian Overseas Bank',
    ifsc: 'IOBA0002345', instrumentNo: 'IOB20230088', amount: 15, issueDate: '2023-11-10',
    maturityDate: '2026-11-10', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 10, riskSignals: [], fieldTrust: { bank: 'L1', instrumentNo: 'L2', amount: 'L2', issueDate: 'L1', maturityDate: 'L1', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-005',
  },
  {
    id: 'fdr-006', institutionId: 'inst-06', bankName: 'Bank of Baroda',
    ifsc: 'BARB0JAIPUR', instrumentNo: 'BOB20231101', amount: 35, issueDate: '2023-11-12',
    maturityDate: '2026-11-12', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 18, riskSignals: [], fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-006',
  },
  {
    id: 'fdr-007', institutionId: 'inst-07', bankName: 'Union Bank of India',
    ifsc: 'UBIN0537246', instrumentNo: 'UBI20231205', amount: 50, issueDate: '2023-11-20',
    maturityDate: '2026-11-20', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 12, riskSignals: [], fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-007',
  },
  {
    id: 'fdr-008', institutionId: 'inst-08', bankName: 'Indian Bank',
    ifsc: 'IDIB000H009', instrumentNo: 'IDB20231218', amount: 22, issueDate: '2023-11-25',
    maturityDate: '2026-11-25', lienInFavourAicte: true, status: 'Expiring',
    riskScore: 20, riskSignals: [], fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L2', issueDate: 'L1', maturityDate: 'L1', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-008',
  },
  // FLAGGED case 1: Duplicate instrument number across two institutions
  {
    id: 'fdr-009', institutionId: 'inst-09', bankName: 'State Bank of India',
    ifsc: 'SBIN0002456', instrumentNo: 'SBI20240099', amount: 28, issueDate: '2024-02-10',
    maturityDate: '2027-02-10', lienInFavourAicte: true, status: 'Flagged',
    riskScore: 72, riskSignals: [
      { label: 'Duplicate instrument number', weight: 40, triggered: true },
      { label: 'PDF modified after creation date', weight: 15, triggered: true },
      { label: 'Image tampering detected', weight: 15, triggered: true },
    ],
    fieldTrust: { bank: 'L1', instrumentNo: 'L0', amount: 'L1', issueDate: 'L1', maturityDate: 'L0', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-009-dup', pdfModifiedAfterCreation: true, imageTampered: true,
  },
  // FLAGGED case 1 duplicate (same instrumentNo as fdr-009, different institution)
  {
    id: 'fdr-010', institutionId: 'inst-10', bankName: 'State Bank of India',
    ifsc: 'SBIN0003789', instrumentNo: 'SBI20240099', amount: 28, issueDate: '2024-02-10',
    maturityDate: '2027-02-10', lienInFavourAicte: true, status: 'Flagged',
    riskScore: 72, riskSignals: [
      { label: 'Duplicate instrument number', weight: 40, triggered: true },
      { label: 'Duplicate file hash (same PDF)', weight: 30, triggered: true },
    ],
    fieldTrust: { bank: 'L0', instrumentNo: 'L0', amount: 'L0', issueDate: 'L0', maturityDate: 'L0', lien: 'L0' },
    hasAicteWording: true, fileHash: 'hash-009-dup',
  },
  // FLAGGED case 2: Maturity before issue date
  {
    id: 'fdr-011', institutionId: 'inst-11', bankName: 'ICICI Bank',
    ifsc: 'ICIC0001234', instrumentNo: 'ICICI20240177', amount: 18, issueDate: '2024-06-15',
    maturityDate: '2024-01-10', // BEFORE issue date - error!
    lienInFavourAicte: true, status: 'Flagged',
    riskScore: 85, riskSignals: [
      { label: 'Maturity not after issue / odd tenure', weight: 35, triggered: true },
      { label: 'PDF modified after creation date', weight: 15, triggered: true },
      { label: 'Bank mismatch (document vs declared)', weight: 50, triggered: false }, // not triggered here
    ],
    fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L1', issueDate: 'L0', maturityDate: 'L0', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-011', pdfModifiedAfterCreation: true,
  },
  // FLAGGED case 3: Bank mismatch
  {
    id: 'fdr-012', institutionId: 'inst-12', bankName: 'Punjab National Bank',
    ifsc: 'HDFC0009988', // HDFC IFSC but declared as PNB!
    instrumentNo: 'PNB20240301', amount: 32, issueDate: '2024-03-01',
    maturityDate: '2027-03-01', lienInFavourAicte: false,
    status: 'Flagged',
    riskScore: 95, riskSignals: [
      { label: 'Bank mismatch (document vs declared)', weight: 50, triggered: true },
      { label: 'IFSC prefix vs bank name mismatch', weight: 20, triggered: true },
      { label: 'Missing AICTE lien wording', weight: 10, triggered: true },
    ],
    fieldTrust: { bank: 'L0', instrumentNo: 'L0', amount: 'L0', issueDate: 'L0', maturityDate: 'L0', lien: 'L0' },
    hasAicteWording: false, fileHash: 'hash-012',
  },
  // Coverage gap instruments (2)
  {
    id: 'fdr-013', institutionId: 'inst-01', bankName: 'Canara Bank',
    ifsc: 'CNRB0002034', instrumentNo: 'CNR20240115', amount: 12, // Low amount
    issueDate: '2024-01-20', maturityDate: '2027-01-20', lienInFavourAicte: true,
    status: 'Active', coverageRequired: 25, // Gap!
    riskScore: 35, riskSignals: [
      { label: 'Amount below AICTE requirement', weight: 20, triggered: true },
    ],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L1', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-013',
  },
  {
    id: 'fdr-014', institutionId: 'inst-03', bankName: 'Bank of India',
    ifsc: 'BKID0003412', instrumentNo: 'BOI20240220', amount: 10,
    issueDate: '2024-02-20', maturityDate: '2027-02-20', lienInFavourAicte: true,
    status: 'Active', coverageRequired: 20, // Gap!
    riskScore: 38, riskSignals: [
      { label: 'Amount below AICTE requirement', weight: 20, triggered: true },
    ],
    fieldTrust: { bank: 'L1', instrumentNo: 'L2', amount: 'L0', issueDate: 'L2', maturityDate: 'L2', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-014',
  },
  // Release requested (2)
  {
    id: 'fdr-015', institutionId: 'inst-02', bankName: 'HDFC Bank',
    ifsc: 'HDFC0002345', instrumentNo: 'HDFC20230033', amount: 30,
    issueDate: '2021-04-01', maturityDate: '2024-04-01', lienInFavourAicte: false,
    status: 'Release requested',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-015',
  },
  {
    id: 'fdr-016', institutionId: 'inst-05', bankName: 'Indian Overseas Bank',
    ifsc: 'IOBA0003456', instrumentNo: 'IOB20210088', amount: 18,
    issueDate: '2021-06-15', maturityDate: '2024-06-15', lienInFavourAicte: false,
    status: 'Release requested',
    riskScore: 8, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-016',
  },
  // Released
  {
    id: 'fdr-017', institutionId: 'inst-06', bankName: 'Bank of Baroda',
    ifsc: 'BARB0JAIPU2', instrumentNo: 'BOB20200445', amount: 15,
    issueDate: '2020-01-01', maturityDate: '2023-01-01', lienInFavourAicte: false,
    status: 'Released',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-017',
  },
  {
    id: 'fdr-018', institutionId: 'inst-07', bankName: 'Union Bank of India',
    ifsc: 'UBIN0537250', instrumentNo: 'UBI20210601', amount: 20,
    issueDate: '2021-01-15', maturityDate: '2024-01-15', lienInFavourAicte: false,
    status: 'Released',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-018',
  },
  // Under verification
  {
    id: 'fdr-019', institutionId: 'inst-08', bankName: 'Indian Bank',
    ifsc: 'IDIB000H010', instrumentNo: 'IDB20240501', amount: 45,
    issueDate: '2024-05-01', maturityDate: '2027-05-01', lienInFavourAicte: true,
    status: 'Under verification',
    riskScore: 28, riskSignals: [
      { label: 'Missing AICTE lien wording', weight: 10, triggered: false },
    ],
    fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L1', issueDate: 'L1', maturityDate: 'L1', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-019',
  },
  {
    id: 'fdr-020', institutionId: 'inst-09', bankName: 'UCO Bank',
    ifsc: 'UCBA0000123', instrumentNo: 'UCO20240612', amount: 38,
    issueDate: '2024-06-12', maturityDate: '2027-06-12', lienInFavourAicte: true,
    status: 'Under verification',
    riskScore: 22, riskSignals: [],
    fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L1', issueDate: 'L1', maturityDate: 'L1', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-020',
  },
  // Submitted / Auto-checked
  {
    id: 'fdr-021', institutionId: 'inst-10', bankName: 'State Bank of India',
    ifsc: 'SBIN0004567', instrumentNo: 'SBI20241001', amount: 22,
    issueDate: '2024-10-01', maturityDate: '2027-10-01', lienInFavourAicte: true,
    status: 'Submitted',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L0', instrumentNo: 'L0', amount: 'L0', issueDate: 'L0', maturityDate: 'L0', lien: 'L0' },
    hasAicteWording: true, fileHash: 'hash-021',
  },
  {
    id: 'fdr-022', institutionId: 'inst-11', bankName: 'ICICI Bank',
    ifsc: 'ICIC0002345', instrumentNo: 'ICICI20241002', amount: 17,
    issueDate: '2024-10-02', maturityDate: '2027-10-02', lienInFavourAicte: true,
    status: 'Auto-checked',
    riskScore: 10, riskSignals: [],
    fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L1', issueDate: 'L1', maturityDate: 'L1', lien: 'L0' },
    hasAicteWording: true, fileHash: 'hash-022',
  },
  // Matured / Renewal pending / Renewed
  {
    id: 'fdr-023', institutionId: 'inst-12', bankName: 'Canara Bank',
    ifsc: 'CNRB0006789', instrumentNo: 'CNR20200099', amount: 25,
    issueDate: '2020-10-01', maturityDate: '2026-10-01', lienInFavourAicte: true,
    status: 'Matured',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-023',
  },
  {
    id: 'fdr-024', institutionId: 'inst-01', bankName: 'Punjab National Bank',
    ifsc: 'PUNB0099900', instrumentNo: 'PNB20200444', amount: 20,
    issueDate: '2020-08-15', maturityDate: '2026-08-15', lienInFavourAicte: true,
    status: 'Renewal pending',
    riskScore: 8, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-024',
  },
  {
    id: 'fdr-025', institutionId: 'inst-02', bankName: 'HDFC Bank',
    ifsc: 'HDFC0003456', instrumentNo: 'HDFC20200555', amount: 40,
    issueDate: '2020-06-01', maturityDate: '2026-06-01', lienInFavourAicte: true,
    status: 'Renewed',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-025',
  },
  // More active for variety
  {
    id: 'fdr-026', institutionId: 'inst-03', bankName: 'Bank of Baroda',
    ifsc: 'BARB0LUCKNO', instrumentNo: 'BOB20240801', amount: 32,
    issueDate: '2024-08-01', maturityDate: '2027-08-01', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-026',
  },
  {
    id: 'fdr-027', institutionId: 'inst-04', bankName: 'Union Bank of India',
    ifsc: 'UBIN0537999', instrumentNo: 'UBI20240802', amount: 48,
    issueDate: '2024-08-02', maturityDate: '2027-08-02', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 8, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-027',
  },
  {
    id: 'fdr-028', institutionId: 'inst-05', bankName: 'State Bank of India',
    ifsc: 'SBIN0005678', instrumentNo: 'SBI20240909', amount: 27,
    issueDate: '2024-09-09', maturityDate: '2027-09-09', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-028',
  },
  {
    id: 'fdr-029', institutionId: 'inst-06', bankName: 'ICICI Bank',
    ifsc: 'ICIC0003456', instrumentNo: 'ICICI20240777', amount: 35,
    issueDate: '2024-07-07', maturityDate: '2027-07-07', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-029',
  },
  {
    id: 'fdr-030', institutionId: 'inst-07', bankName: 'Canara Bank',
    ifsc: 'CNRB0007890', instrumentNo: 'CNR20240606', amount: 42,
    issueDate: '2024-06-06', maturityDate: '2027-06-06', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-030',
  },
  {
    id: 'fdr-031', institutionId: 'inst-08', bankName: 'Punjab National Bank',
    ifsc: 'PUNB0111100', instrumentNo: 'PNB20240505', amount: 19,
    issueDate: '2024-05-05', maturityDate: '2027-05-05', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-031',
  },
  {
    id: 'fdr-032', institutionId: 'inst-09', bankName: 'Bank of India',
    ifsc: 'BKID0004567', instrumentNo: 'BOI20240404', amount: 25,
    issueDate: '2024-04-04', maturityDate: '2027-04-04', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-032',
  },
  {
    id: 'fdr-033', institutionId: 'inst-10', bankName: 'Indian Overseas Bank',
    ifsc: 'IOBA0004567', instrumentNo: 'IOB20240303', amount: 30,
    issueDate: '2024-03-03', maturityDate: '2027-03-03', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-033',
  },
  {
    id: 'fdr-034', institutionId: 'inst-11', bankName: 'UCO Bank',
    ifsc: 'UCBA0000456', instrumentNo: 'UCO20240202', amount: 22,
    issueDate: '2024-02-02', maturityDate: '2027-02-02', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-034',
  },
  {
    id: 'fdr-035', institutionId: 'inst-12', bankName: 'HDFC Bank',
    ifsc: 'HDFC0004567', instrumentNo: 'HDFC20240101', amount: 50,
    issueDate: '2024-01-01', maturityDate: '2027-01-01', lienInFavourAicte: true,
    status: 'Active',
    riskScore: 5, riskSignals: [],
    fieldTrust: { bank: 'L2', instrumentNo: 'L2', amount: 'L2', issueDate: 'L2', maturityDate: 'L2', lien: 'L2' },
    hasAicteWording: true, fileHash: 'hash-035',
  },
  // Under review
  {
    id: 'fdr-036', institutionId: 'inst-01', bankName: 'Bank of Baroda',
    ifsc: 'BARB0DELHI1', instrumentNo: 'BOB20241101', amount: 28,
    issueDate: '2024-11-01', maturityDate: '2027-11-01', lienInFavourAicte: true,
    status: 'Under review',
    riskScore: 20, riskSignals: [],
    fieldTrust: { bank: 'L1', instrumentNo: 'L1', amount: 'L1', issueDate: 'L1', maturityDate: 'L1', lien: 'L1' },
    hasAicteWording: true, fileHash: 'hash-036',
  },
  // Draft
  {
    id: 'fdr-037', institutionId: 'inst-02', bankName: 'Union Bank of India',
    ifsc: 'UBIN0537300', instrumentNo: 'UBI20241201', amount: 36,
    issueDate: '2024-12-01', maturityDate: '2027-12-01', lienInFavourAicte: true,
    status: 'Draft',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L0', instrumentNo: 'L0', amount: 'L0', issueDate: 'L0', maturityDate: 'L0', lien: 'L0' },
    hasAicteWording: true, fileHash: 'hash-037',
  },
  {
    id: 'fdr-038', institutionId: 'inst-03', bankName: 'State Bank of India',
    ifsc: 'SBIN0006789', instrumentNo: 'SBI20241202', amount: 24,
    issueDate: '2024-12-02', maturityDate: '2027-12-02', lienInFavourAicte: true,
    status: 'Draft',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L0', instrumentNo: 'L0', amount: 'L0', issueDate: 'L0', maturityDate: 'L0', lien: 'L0' },
    hasAicteWording: true, fileHash: 'hash-038',
  },
  // Released (more)
  {
    id: 'fdr-039', institutionId: 'inst-04', bankName: 'ICICI Bank',
    ifsc: 'ICIC0004567', instrumentNo: 'ICICI20190099', amount: 15,
    issueDate: '2019-06-01', maturityDate: '2022-06-01', lienInFavourAicte: false,
    status: 'Released',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-039',
  },
  {
    id: 'fdr-040', institutionId: 'inst-05', bankName: 'Canara Bank',
    ifsc: 'CNRB0008901', instrumentNo: 'CNR20190088', amount: 20,
    issueDate: '2019-08-01', maturityDate: '2022-08-01', lienInFavourAicte: false,
    status: 'Released',
    riskScore: 0, riskSignals: [],
    fieldTrust: { bank: 'L3', instrumentNo: 'L3', amount: 'L3', issueDate: 'L3', maturityDate: 'L3', lien: 'L3' },
    hasAicteWording: true, fileHash: 'hash-040',
  },
];

export const seedAuditEvents: AuditEvent[] = [
  {
    id: "ae-001",
    actor: "System",
    action: "GENESIS",
    entity: "system",
    entityId: "genesis",
    timestamp: "2024-01-01T00:00:00.000Z",
    payloadHash: "d6a8d2e931812ac675c5ab717b839410ccad760dbb4332e79df6262bb56da3a1",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: "399f33777440f782f0a3b2e96213daad479d8048cdb31bfefae090a66fe7cc4e",
    payloadData: { id: "ae-001", actor: "System", action: "GENESIS", entity: "system", entityId: "genesis", timestamp: "2024-01-01T00:00:00.000Z" }
  },
  {
    id: "ae-002",
    actor: "inst-01-user",
    action: "INSTRUMENT_SUBMITTED",
    entity: "instrument",
    entityId: "fdr-001",
    timestamp: "2024-01-15T09:15:00.000Z",
    payloadHash: "63571f1edae89b0c0bec1c2bbf189d12f25aa5beb7256236581f2276c87c2e8e",
    prevHash: "399f33777440f782f0a3b2e96213daad479d8048cdb31bfefae090a66fe7cc4e",
    hash: "53e790dabf348dad996885be83ceb4cf81c7e1d6ed75e5a8281ff88149c2a45f",
    payloadData: { id: "ae-002", actor: "inst-01-user", action: "INSTRUMENT_SUBMITTED", entity: "instrument", entityId: "fdr-001", timestamp: "2024-01-15T09:15:00.000Z" }
  },
  {
    id: "ae-003",
    actor: "system-auto",
    action: "AUTO_CHECK_PASSED",
    entity: "instrument",
    entityId: "fdr-001",
    timestamp: "2024-01-15T09:16:30.000Z",
    payloadHash: "c6b4263c12f2f90b324b889245ab8b39b49e76196a7fae1e9bc483fbe68bf687",
    prevHash: "53e790dabf348dad996885be83ceb4cf81c7e1d6ed75e5a8281ff88149c2a45f",
    hash: "771a13e615a70aa8da407314eb71090b47da110d9a1e89fa2de6f96b2a7139a0",
    payloadData: { id: "ae-003", actor: "system-auto", action: "AUTO_CHECK_PASSED", entity: "instrument", entityId: "fdr-001", timestamp: "2024-01-15T09:16:30.000Z" }
  },
  {
    id: "ae-004",
    actor: "officer.kumar@aicte.gov.in",
    action: "FIELD_TRUST_UPGRADED_L2",
    entity: "instrument",
    entityId: "fdr-001",
    timestamp: "2024-01-20T11:00:00.000Z",
    payloadHash: "3a3867e86db5ce6d1a8b5cfdb84208c11b238e841550300af503bbe6a299291e",
    prevHash: "771a13e615a70aa8da407314eb71090b47da110d9a1e89fa2de6f96b2a7139a0",
    hash: "47f38598a88c7db29c4754be3c20c12066aed8234a5eb39778f40e13fa8aa842",
    payloadData: { id: "ae-004", actor: "officer.kumar@aicte.gov.in", action: "FIELD_TRUST_UPGRADED_L2", entity: "instrument", entityId: "fdr-001", timestamp: "2024-01-20T11:00:00.000Z" }
  },
  {
    id: "ae-005",
    actor: "officer.kumar@aicte.gov.in",
    action: "STATUS_CHANGED_ACTIVE",
    entity: "instrument",
    entityId: "fdr-001",
    timestamp: "2024-01-22T14:30:00.000Z",
    payloadHash: "bb2d2243749fd24e8a528350121b074aefdd6e67e9b014a048c35401b75a32f1",
    prevHash: "47f38598a88c7db29c4754be3c20c12066aed8234a5eb39778f40e13fa8aa842",
    hash: "f239046a0737f490a05b0a6bfb41f86144eed985e3140b09af4d5ad9d602445d",
    payloadData: { id: "ae-005", actor: "officer.kumar@aicte.gov.in", action: "STATUS_CHANGED_ACTIVE", entity: "instrument", entityId: "fdr-001", timestamp: "2024-01-22T14:30:00.000Z" }
  },
  {
    id: "ae-006",
    actor: "system-auto",
    action: "RISK_FLAGGED_HIGH",
    entity: "instrument",
    entityId: "fdr-009",
    timestamp: "2024-02-10T10:05:00.000Z",
    payloadHash: "6d404408d9833a29c5b49c3ec802a0854ddc587d7e761c6a410f1f3f0b70d1a2",
    prevHash: "f239046a0737f490a05b0a6bfb41f86144eed985e3140b09af4d5ad9d602445d",
    hash: "6fb95f210c659e3c36a30b5d310e87bd3a1f3a96fea2b00a2be940cfbf4916b9",
    payloadData: { id: "ae-006", actor: "system-auto", action: "RISK_FLAGGED_HIGH", entity: "instrument", entityId: "fdr-009", timestamp: "2024-02-10T10:05:00.000Z" }
  },
  {
    id: "ae-007",
    actor: "system-auto",
    action: "RISK_FLAGGED_HIGH",
    entity: "instrument",
    entityId: "fdr-010",
    timestamp: "2024-02-10T10:05:01.000Z",
    payloadHash: "2c0427efd98a968b149bb547004d81ea269dbe16cfb0abaf2d04ecafe9df3011",
    prevHash: "6fb95f210c659e3c36a30b5d310e87bd3a1f3a96fea2b00a2be940cfbf4916b9",
    hash: "c48cca164ce08b648c480546ae1f700619417c6b11ae4d1d6c1605f6211ebf89",
    payloadData: { id: "ae-007", actor: "system-auto", action: "RISK_FLAGGED_HIGH", entity: "instrument", entityId: "fdr-010", timestamp: "2024-02-10T10:05:01.000Z" }
  },
  {
    id: "ae-008",
    actor: "officer.sharma@aicte.gov.in",
    action: "BANK_CONFIRMATION_SENT",
    entity: "instrument",
    entityId: "fdr-019",
    timestamp: "2024-05-05T09:00:00.000Z",
    payloadHash: "2084cd215f4e8e2de8f2f9eea5872497c6037a33d27786912ec607abfe6836e8",
    prevHash: "c48cca164ce08b648c480546ae1f700619417c6b11ae4d1d6c1605f6211ebf89",
    hash: "10703ddfd914fc310e7be6e24c8efa268362a7420fc7d3bfbead0010b8c14ce0",
    payloadData: { id: "ae-008", actor: "officer.sharma@aicte.gov.in", action: "BANK_CONFIRMATION_SENT", entity: "instrument", entityId: "fdr-019", timestamp: "2024-05-05T09:00:00.000Z" }
  },
  {
    id: "ae-009",
    actor: "inst-02-user",
    action: "RELEASE_REQUESTED",
    entity: "instrument",
    entityId: "fdr-015",
    timestamp: "2024-04-15T11:45:00.000Z",
    payloadHash: "cfcad3832b29915ab492576170db76210f6a7f37ad370b1c07699fe346ccd1b8",
    prevHash: "10703ddfd914fc310e7be6e24c8efa268362a7420fc7d3bfbead0010b8c14ce0",
    hash: "83858af0cabe04a1040b20a34383a3a62a5bf9acfe699846e344781ff5ef5166",
    payloadData: { id: "ae-009", actor: "inst-02-user", action: "RELEASE_REQUESTED", entity: "instrument", entityId: "fdr-015", timestamp: "2024-04-15T11:45:00.000Z" }
  },
  {
    id: "ae-010",
    actor: "officer.gupta@aicte.gov.in",
    action: "SCRUTINY_NOTE_ADDED",
    entity: "instrument",
    entityId: "fdr-011",
    timestamp: "2024-06-20T15:30:00.000Z",
    payloadHash: "bdac7c2cfe7786e5b965edf7ebe25f8a24f76f8d384671b972a76be220c17492",
    prevHash: "83858af0cabe04a1040b20a34383a3a62a5bf9acfe699846e344781ff5ef5166",
    hash: "4a5c58de4b578a182895e226c749e93961c15216e3ba382784b356c186f6f345",
    payloadData: { id: "ae-010", actor: "officer.gupta@aicte.gov.in", action: "SCRUTINY_NOTE_ADDED", entity: "instrument", entityId: "fdr-011", timestamp: "2024-06-20T15:30:00.000Z" }
  },
  {
    id: "ae-011",
    actor: "system-auto",
    action: "MATURITY_ALERT_30D",
    entity: "instrument",
    entityId: "fdr-004",
    timestamp: "2026-10-05T00:01:00.000Z",
    payloadHash: "f59c0d4eb64a0bc95846ec5587d77775e5738e4777e78bb71cbb2af9f5c095fa",
    prevHash: "4a5c58de4b578a182895e226c749e93961c15216e3ba382784b356c186f6f345",
    hash: "3731d69e3a53de73b0d159c22f37823ece732775b0d873ea3e7201d6b4306ca6",
    payloadData: { id: "ae-011", actor: "system-auto", action: "MATURITY_ALERT_30D", entity: "instrument", entityId: "fdr-004", timestamp: "2026-10-05T00:01:00.000Z" }
  },
  {
    id: "ae-012",
    actor: "officer.kumar@aicte.gov.in",
    action: "INSTRUMENT_APPROVED_L3",
    entity: "instrument",
    entityId: "fdr-002",
    timestamp: "2024-03-10T10:00:00.000Z",
    payloadHash: "e0d2a29c083227e48938cd388b8b83e8e68ef8641cf5d63ee2bd32171e28e08a",
    prevHash: "3731d69e3a53de73b0d159c22f37823ece732775b0d873ea3e7201d6b4306ca6",
    hash: "24df24f26be537bfad3a04ca4724c69163a4ed215810b8237ad8a90c7865e182",
    payloadData: { id: "ae-012", actor: "officer.kumar@aicte.gov.in", action: "INSTRUMENT_APPROVED_L3", entity: "instrument", entityId: "fdr-002", timestamp: "2024-03-10T10:00:00.000Z" }
  },
  {
    id: "ae-013",
    actor: "inst-05-user",
    action: "RELEASE_REQUESTED",
    entity: "instrument",
    entityId: "fdr-016",
    timestamp: "2024-07-01T09:00:00.000Z",
    payloadHash: "f0b7cca3cd3a7c541ae4f0bae822928b0a7cada785f465500b8bd6e3b130275b",
    prevHash: "24df24f26be537bfad3a04ca4724c69163a4ed215810b8237ad8a90c7865e182",
    hash: "f8e114e7b4e8a9b9b79a09f69feb3109c7b8a28e3cb5f439d8f47d29aed4b0ed",
    payloadData: { id: "ae-013", actor: "inst-05-user", action: "RELEASE_REQUESTED", entity: "instrument", entityId: "fdr-016", timestamp: "2024-07-01T09:00:00.000Z" }
  },
  {
    id: "ae-014",
    actor: "system-auto",
    action: "COVERAGE_GAP_DETECTED",
    entity: "instrument",
    entityId: "fdr-013",
    timestamp: "2024-01-21T08:00:00.000Z",
    payloadHash: "a68e4d1796e9f760d5bfce2ddc96538e2c6b8490743886c9b58e0468ed838ca0",
    prevHash: "f8e114e7b4e8a9b9b79a09f69feb3109c7b8a28e3cb5f439d8f47d29aed4b0ed",
    hash: "91c726c26cf962c33f9df938a6c0d53c6f7d4e7997948b80a9ff4e7426766bd7",
    payloadData: { id: "ae-014", actor: "system-auto", action: "COVERAGE_GAP_DETECTED", entity: "instrument", entityId: "fdr-013", timestamp: "2024-01-21T08:00:00.000Z" }
  },
  {
    id: "ae-015",
    actor: "officer.singh@aicte.gov.in",
    action: "AUDIT_REPORT_EXPORTED",
    entity: "system",
    entityId: "report-oct-2026",
    timestamp: "2026-10-15T16:00:00.000Z",
    payloadHash: "654e15604d57d856c09bddffa2921ac46201dd7876d0f3b29a43264e6b2bc7f1",
    prevHash: "91c726c26cf962c33f9df938a6c0d53c6f7d4e7997948b80a9ff4e7426766bd7",
    hash: "d2b64d6b21e4fa6f88ecbff54aaaf39f0d1e12fb13148375510d9055af58845c",
    payloadData: { id: "ae-015", actor: "officer.singh@aicte.gov.in", action: "AUDIT_REPORT_EXPORTED", entity: "system", entityId: "report-oct-2026", timestamp: "2026-10-15T16:00:00.000Z" }
  }
];


export const seedBankTokens = [
  {
    token: 'tok-fdr019-demo',
    instrumentId: 'fdr-019',
    bankName: 'Indian Bank',
    createdAt: '2026-10-25T10:00:00.000Z',
    status: 'pending' as const,
  },
  {
    token: 'tok-fdr020-demo',
    instrumentId: 'fdr-020',
    bankName: 'UCO Bank',
    createdAt: '2026-10-26T11:00:00.000Z',
    status: 'pending' as const,
  },
];

export const seedReleaseRequests = [
  {
    id: 'rel-001',
    instrumentId: 'fdr-015',
    institutionId: 'inst-02',
    requestedDate: '2026-10-15',
    reason: 'Closure of approved MCA shift and statutory period completed',
    documentName: 'Closure_Order_AICTE_2024.pdf',
    stage: 'Maker' as const,
    checklist: {
      approvalCycleComplete: true,
      noPendingCompliance: true,
      noLegalHold: true,
      instrumentStatusValid: true,
    },
    makerRecommended: true,
    makerNotes: 'Verified all compliance certificates. Recommended for release.',
  },
  {
    id: 'rel-002',
    instrumentId: 'fdr-016',
    institutionId: 'inst-05',
    requestedDate: '2026-10-18',
    reason: 'Reduction in intake capacity approved by Executive Committee',
    documentName: 'EC_Resolution_Intake_Reduction.pdf',
    stage: 'Maker' as const,
    checklist: {
      approvalCycleComplete: true,
      noPendingCompliance: false, // Intentional failure for demo!
      noLegalHold: true,
      instrumentStatusValid: true,
    },
    makerRecommended: false,
    makerNotes: 'Pending compliance clearance from Southern Regional Office.',
  },
];
