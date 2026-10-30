import { create } from 'zustand';
import type {
  Role,
  OfficerRegion,
  Instrument,
  Institution,
  AuditEvent,
  InstrumentStatus,
  TrustLevel,
  BankConfirmationToken,
  ReminderAlert,
  ReleaseRequest,
} from '../types';
import {
  seedInstitutions,
  seedInstruments,
  seedAuditEvents,
  seedBankTokens,
  seedReleaseRequests,
  SEED_CURRENT_DATE,
} from '../data/seed';
import { buildAuditEvent, recomputeAuditChain } from '../lib/audit';
import {
  computeRisk,
  DEFAULT_FRAUD_WEIGHTS,
  DEFAULT_RISK_BANDS,
  type FraudWeightsConfig,
  type RiskBandConfig,
} from '../lib/fraud';
import { daysToMaturity } from '../lib/dates';

export interface SchedulerConfig {
  stages: Array<{
    stage: 'T-90' | 'T-60' | 'T-30' | 'T-15' | 'T-7' | 'T-0' | 'Overdue+7';
    daysThreshold: number;
    recipientRole: string;
    description: string;
  }>;
  defaultCoverageRequired: number; // in lakhs, default 40
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  stages: [
    { stage: 'T-90', daysThreshold: 90, recipientRole: 'Institution', description: 'T-90: Institution notice for maturity preparation' },
    { stage: 'T-60', daysThreshold: 60, recipientRole: 'Institution + Bureau Officer', description: 'T-60: Institution and Bureau officer alert' },
    { stage: 'T-30', daysThreshold: 30, recipientRole: 'Institution + Bureau Officer', description: 'T-30: Formal reminder to Institution and Officer' },
    { stage: 'T-15', daysThreshold: 15, recipientRole: 'Institution Head + Bureau Officer', description: 'T-15: Critical escalation to Institution Head and Officer' },
    { stage: 'T-7', daysThreshold: 7, recipientRole: 'Section Head', description: 'T-7: Section Head urgent flag' },
    { stage: 'T-0', daysThreshold: 0, recipientRole: 'Bureau Officer', description: 'T-0: Matured without renewal; status moved to Matured' },
    { stage: 'Overdue+7', daysThreshold: -7, recipientRole: 'Competent Authority', description: 'Overdue+7: Unresolved maturity report to Competent Authority' },
  ],
  defaultCoverageRequired: 40,
};

interface AppState {
  // Role & selection
  role: Role;
  setRole: (role: Role) => void;
  officerRegion: OfficerRegion;
  setOfficerRegion: (region: OfficerRegion) => void;
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;

  // Time Machine Clock, Rules & Thresholds
  currentDate: string;
  setCurrentDate: (d: string) => void;
  schedulerConfig: SchedulerConfig;
  updateSchedulerConfig: (cfg: Partial<SchedulerConfig>) => void;
  fraudWeights: FraudWeightsConfig;
  updateFraudWeights: (weights: FraudWeightsConfig) => void;
  riskBandThresholds: RiskBandConfig;
  updateRiskBandThresholds: (bands: RiskBandConfig) => void;

  // Core Data
  institutions: Institution[];
  instruments: Instrument[];
  auditEvents: AuditEvent[];
  bankTokens: BankConfirmationToken[];
  alerts: ReminderAlert[];
  releaseRequests: ReleaseRequest[];

  // Actions: Instruments & Audits
  addInstrument: (inst: Instrument, actor: string) => Promise<void>;
  updateInstrumentStatus: (id: string, status: InstrumentStatus, actor: string, note?: string) => Promise<void>;
  upgradeFieldTrust: (id: string, field: keyof Instrument['fieldTrust'], level: TrustLevel, actor: string) => Promise<void>;
  addAuditEvent: (actor: string, action: string, entity: string, entityId: string, extra?: Record<string, unknown>) => Promise<void>;
  addScrutinyNote: (id: string, note: string, actor: string) => Promise<void>;

  // Actions: Audit Tampering & Repair
  simulateTampering: () => Promise<string | null>;
  repairAuditChain: () => Promise<void>;

  // Actions: Bank Token & Portal
  createBankToken: (instrumentId: string, actor: string) => Promise<string>;
  confirmBankToken: (token: string, actor: string) => Promise<void>;
  mismatchBankToken: (token: string, actor: string) => Promise<void>;

  // Actions: Renewal Linking
  linkRenewal: (oldInstrumentId: string, newInstrument: Instrument | string, actor: string) => Promise<void>;

  // Actions: Release Workflow
  requestRelease: (instrumentId: string, reason: string, documentName: string, actor: string) => Promise<string>;
  updateReleaseStage: (
    requestId: string,
    nextStage: 'Checker' | 'Approver' | 'Approved' | 'Rejected',
    notes: string,
    actor: string,
    concurredOrRecommended?: boolean
  ) => Promise<void>;

  // Time Machine & Alerts
  advanceClockDays: (days: number) => Promise<{ alertsFired: number; instrumentsMatured: number }>;
  resetClock: () => Promise<void>;
  resetDemo: () => void;
  loadDemoScenario: () => void;
}

export const useStore = create<AppState>()(
  (set, get) => ({
      role: 'Officer',
      setRole: (role) => set({ role }),
      officerRegion: 'North',
      setOfficerRegion: (officerRegion) => set({ officerRegion }),
      selectedInstitutionId: 'inst-01',
      setSelectedInstitutionId: (id) => set({ selectedInstitutionId: id }),

      currentDate: SEED_CURRENT_DATE,
      setCurrentDate: (d) => set({ currentDate: d }),
      schedulerConfig: DEFAULT_SCHEDULER_CONFIG,
      updateSchedulerConfig: (cfg) => set({ schedulerConfig: { ...get().schedulerConfig, ...cfg } }),
      fraudWeights: DEFAULT_FRAUD_WEIGHTS,
      updateFraudWeights: (weights) => set({ fraudWeights: weights }),
      riskBandThresholds: DEFAULT_RISK_BANDS,
      updateRiskBandThresholds: (bands) => set({ riskBandThresholds: bands }),

      institutions: seedInstitutions,
      instruments: seedInstruments,
      auditEvents: seedAuditEvents,
      bankTokens: seedBankTokens,
      alerts: [],
      releaseRequests: seedReleaseRequests,

      addInstrument: async (inst, actor) => {
        const { instruments, fraudWeights, addAuditEvent } = get();
        const updatedList = [inst, ...instruments];
        const { score, signals } = computeRisk(inst, updatedList, fraudWeights);
        const finalInst: Instrument = {
          ...inst,
          riskScore: score,
          riskSignals: signals,
          status: score >= get().riskBandThresholds.high ? 'Flagged' : inst.status,
        };
        const finalList = [finalInst, ...instruments];
        set({ instruments: finalList });
        await addAuditEvent(actor, 'INSTRUMENT_CREATED', 'instrument', inst.id, {
          instrumentNo: inst.instrumentNo,
          amount: inst.amount,
          riskScore: score,
          status: finalInst.status,
        });
      },

      updateInstrumentStatus: async (id, status, actor, note) => {
        const { instruments, addAuditEvent } = get();
        set({
          instruments: instruments.map(inst =>
            inst.id === id ? { ...inst, status, notes: note || inst.notes } : inst
          ),
        });
        await addAuditEvent(actor, `STATUS_CHANGED_${status.toUpperCase().replace(/ /g, '_')}`, 'instrument', id, { status, note });
      },

      upgradeFieldTrust: async (id, field, level, actor) => {
        const { instruments, addAuditEvent } = get();
        set({
          instruments: instruments.map(inst =>
            inst.id === id
              ? { ...inst, fieldTrust: { ...inst.fieldTrust, [field]: level } }
              : inst
          ),
        });
        await addAuditEvent(actor, `FIELD_TRUST_${field}_${level}`, 'instrument', id, { field, level });
      },

      addAuditEvent: async (actor, action, entity, entityId, extra) => {
        const { auditEvents } = get();
        const prevHash = auditEvents.length > 0 ? auditEvents[auditEvents.length - 1].hash : '0'.repeat(64);
        const event = await buildAuditEvent(actor, action, entity, entityId, prevHash, extra);
        set({ auditEvents: [...auditEvents, event] });
      },

      addScrutinyNote: async (id, note, actor) => {
        const { instruments, addAuditEvent } = get();
        set({
          instruments: instruments.map(inst =>
            inst.id === id ? { ...inst, notes: note } : inst
          ),
        });
        await addAuditEvent(actor, 'SCRUTINY_NOTE_ADDED', 'instrument', id, { note });
      },

      simulateTampering: async () => {
        const { auditEvents } = get();
        if (auditEvents.length < 3) return null;
        // Pick an old event (e.g. index 2 or 3)
        const targetIndex = 2;
        const targetEvent = auditEvents[targetIndex];

        // Tamper payload silently without updating payloadHash or block hash!
        const tamperedEvents = auditEvents.map((e, idx) => {
          if (idx === targetIndex) {
            return {
              ...e,
              payloadData: {
                ...e.payloadData,
                action: 'UNAUTHORIZED_RECORD_ALTERATION',
                tampered: true,
              },
            };
          }
          return e;
        });

        set({ auditEvents: tamperedEvents });
        return targetEvent.id;
      },

      repairAuditChain: async () => {
        const { auditEvents } = get();
        const repaired = await recomputeAuditChain(auditEvents);
        set({ auditEvents: repaired });
      },

      createBankToken: async (instrumentId, actor) => {
        const { bankTokens, instruments, addAuditEvent } = get();
        const inst = instruments.find(i => i.id === instrumentId);
        const token = `tok-${instrumentId}-${Math.random().toString(36).slice(2, 8)}`;
        const newToken: BankConfirmationToken = {
          token,
          instrumentId,
          bankName: inst?.bankName || 'Unknown Bank',
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        set({ bankTokens: [newToken, ...bankTokens.filter(t => t.instrumentId !== instrumentId)] });
        await addAuditEvent(actor, 'BANK_TOKEN_CREATED', 'bankToken', token, { instrumentId, token });
        return token;
      },

      confirmBankToken: async (token, actor) => {
        const { bankTokens, instruments, addAuditEvent } = get();
        const tok = bankTokens.find(t => t.token === token);
        if (!tok) return;

        set({
          bankTokens: bankTokens.map(t => (t.token === token ? { ...t, status: 'confirmed' } : t)),
        });

        const targetInst = instruments.find(i => i.id === tok.instrumentId);
        if (targetInst) {
          const updatedFieldTrust = {
            ...targetInst.fieldTrust,
            bank: 'L2' as TrustLevel,
            instrumentNo: 'L2' as TrustLevel,
            amount: 'L2' as TrustLevel,
            maturityDate: 'L2' as TrustLevel,
            issueDate: 'L2' as TrustLevel,
            lien: 'L2' as TrustLevel,
          };
          set({
            instruments: instruments.map(i =>
              i.id === tok.instrumentId ? { ...i, fieldTrust: updatedFieldTrust, status: 'Under verification' } : i
            ),
          });
        }

        await addAuditEvent(actor, 'BANK_CONFIRMED_FIELDS_L2', 'instrument', tok.instrumentId, { token });
      },

      mismatchBankToken: async (token, actor) => {
        const { bankTokens, instruments, addAuditEvent } = get();
        const tok = bankTokens.find(t => t.token === token);
        if (!tok) return;

        set({
          bankTokens: bankTokens.map(t => (t.token === token ? { ...t, status: 'mismatch' } : t)),
        });

        const targetInst = instruments.find(i => i.id === tok.instrumentId);
        if (targetInst) {
          const bankMismatchSignal = { label: 'Bank mismatch (document vs declared)', weight: 50, triggered: true };
          const otherSignals = targetInst.riskSignals.filter(s => s.label !== bankMismatchSignal.label);
          const newSignals = [...otherSignals, bankMismatchSignal];
          const newScore = Math.min(100, targetInst.riskScore + 50);

          set({
            instruments: instruments.map(i =>
              i.id === tok.instrumentId
                ? {
                    ...i,
                    status: 'Flagged',
                    riskScore: newScore,
                    riskSignals: newSignals,
                    notes: (i.notes ? i.notes + ' | ' : '') + 'Bank nodal officer reported mismatch via portal.',
                  }
                : i
            ),
          });
        }

        await addAuditEvent(actor, 'BANK_MISMATCH_REPORTED', 'instrument', tok.instrumentId, { token, addedRisk: 50 });
      },

      linkRenewal: async (oldInstrumentId, newInstrumentOrId, actor) => {
        const { instruments, addAuditEvent } = get();
        let newId: string;

        if (typeof newInstrumentOrId === 'string') {
          newId = newInstrumentOrId;
          set({
            instruments: instruments.map(i => {
              if (i.id === oldInstrumentId) return { ...i, status: 'Renewed' as InstrumentStatus, renewedToId: newId };
              if (i.id === newId) return { ...i, status: 'Active' as InstrumentStatus, renewedFromId: oldInstrumentId };
              return i;
            }),
          });
        } else {
          newId = newInstrumentOrId.id;
          const updatedNew: Instrument = {
            ...newInstrumentOrId,
            status: 'Active' as InstrumentStatus,
            renewedFromId: oldInstrumentId,
          };
          set({
            instruments: [
              updatedNew,
              ...instruments.map(i => (i.id === oldInstrumentId ? { ...i, status: 'Renewed' as InstrumentStatus, renewedToId: newId } : i)),
            ],
          });
        }

        await addAuditEvent(actor, 'INSTRUMENT_RENEWAL_LINKED', 'instrument', oldInstrumentId, {
          oldInstrumentId,
          newInstrumentId: newId,
        });
      },

      requestRelease: async (instrumentId, reason, documentName, actor) => {
        const { releaseRequests, instruments, addAuditEvent } = get();
        const inst = instruments.find(i => i.id === instrumentId);
        if (!inst) throw new Error('Instrument not found');

        const newReqId = `rel-${Date.now().toString().slice(-4)}`;
        const isMatured = inst.status === 'Matured' || new Date(inst.maturityDate) <= new Date(get().currentDate);
        const checklist = {
          approvalCycleComplete: true,
          noPendingCompliance: true,
          noLegalHold: true,
          instrumentStatusValid: isMatured || inst.status === 'Active',
        };

        const newReq: ReleaseRequest = {
          id: newReqId,
          instrumentId,
          institutionId: inst.institutionId,
          requestedDate: get().currentDate,
          reason,
          documentName,
          stage: 'Maker',
          checklist,
        };

        set({
          releaseRequests: [newReq, ...releaseRequests],
          instruments: instruments.map(i => (i.id === instrumentId ? { ...i, status: 'Release requested' } : i)),
        });

        await addAuditEvent(actor, 'RELEASE_REQUESTED', 'release', newReqId, { instrumentId, reason });
        return newReqId;
      },

      updateReleaseStage: async (requestId, nextStage, notes, actor, concurredOrRecommended) => {
        const { releaseRequests, instruments, addAuditEvent, currentDate } = get();
        const req = releaseRequests.find(r => r.id === requestId);
        if (!req) return;

        // Strict enforcement: Block if any checklist item failed
        const allPass =
          req.checklist.approvalCycleComplete &&
          req.checklist.noPendingCompliance &&
          req.checklist.noLegalHold &&
          req.checklist.instrumentStatusValid;

        if (nextStage !== 'Rejected' && !allPass) {
          throw new Error('Statutory Release Enforcement: Cannot advance or approve request when checklist items fail.');
        }

        let esignStamp = req.esignStamp;
        let bankNoticeSent = req.bankNoticeSent;
        let bankNoticeAck = req.bankNoticeAck;

        if (nextStage === 'Approved') {
          esignStamp = {
            signedBy: actor,
            timestamp: new Date().toISOString(),
            certSerial: `AICTE-DS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            hash: `sha256-${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`,
          };
          bankNoticeSent = true;
          bankNoticeAck = `ACK-BANK-${Math.floor(100000 + Math.random() * 900000)}`;

          set({
            instruments: instruments.map(i =>
              i.id === req.instrumentId ? { ...i, status: 'Released', lienInFavourAicte: false } : i
            ),
          });
        } else if (nextStage === 'Rejected') {
          const inst = instruments.find(i => i.id === req.instrumentId);
          if (inst) {
            const isMatured = new Date(inst.maturityDate) <= new Date(currentDate);
            set({
              instruments: instruments.map(i =>
                i.id === req.instrumentId ? { ...i, status: isMatured ? 'Matured' : 'Active' } : i
              ),
            });
          }
        }

        const updatedReq: ReleaseRequest = {
          ...req,
          stage: nextStage,
          esignStamp,
          bankNoticeSent,
          bankNoticeAck,
          makerNotes: req.stage === 'Maker' ? notes : req.makerNotes,
          makerRecommended: req.stage === 'Maker' ? (concurredOrRecommended ?? true) : req.makerRecommended,
          checkerNotes: req.stage === 'Checker' ? notes : req.checkerNotes,
          checkerConcurred: req.stage === 'Checker' ? (concurredOrRecommended ?? true) : req.checkerConcurred,
          approverNotes: req.stage === 'Approver' ? notes : req.approverNotes,
        };

        set({
          releaseRequests: releaseRequests.map(r => (r.id === requestId ? updatedReq : r)),
        });

        await addAuditEvent(actor, `RELEASE_STAGE_${nextStage.toUpperCase()}`, 'release', requestId, {
          stage: nextStage,
          notes,
        });
      },

      advanceClockDays: async (days) => {
        const { currentDate, instruments, alerts, schedulerConfig, addAuditEvent } = get();
        const base = new Date(currentDate);
        base.setDate(base.getDate() + days);
        const newDateStr = base.toISOString().slice(0, 10);

        let newAlertsCount = 0;
        let newMaturedCount = 0;
        const currentAlerts = [...alerts];

        const updatedInstruments = instruments.map(inst => {
          if (inst.status === 'Released' || inst.status === 'Renewed') return inst;
          const d = daysToMaturity(inst.maturityDate, newDateStr);

          let newStatus = inst.status;
          if (d <= 0 && inst.status !== 'Matured' && !inst.renewedToId) {
            newStatus = 'Matured';
            newMaturedCount++;
          } else if (d > 0 && d <= 30 && inst.status === 'Active') {
            newStatus = 'Expiring';
          }

          for (const stg of schedulerConfig.stages) {
            let triggered = false;
            if (stg.stage === 'T-90' && d <= 90 && d > 60) triggered = true;
            else if (stg.stage === 'T-60' && d <= 60 && d > 30) triggered = true;
            else if (stg.stage === 'T-30' && d <= 30 && d > 15) triggered = true;
            else if (stg.stage === 'T-15' && d <= 15 && d > 7) triggered = true;
            else if (stg.stage === 'T-7' && d <= 7 && d > 0) triggered = true;
            else if (stg.stage === 'T-0' && d <= 0 && d > -7 && !inst.renewedToId) triggered = true;
            else if (stg.stage === 'Overdue+7' && d <= -7 && !inst.renewedToId) triggered = true;

            if (triggered) {
              const alertId = `${inst.id}-${stg.stage}`;
              if (!currentAlerts.some(a => a.id === alertId)) {
                currentAlerts.unshift({
                  id: alertId,
                  instrumentId: inst.id,
                  stage: stg.stage,
                  recipientRole: stg.recipientRole,
                  date: newDateStr,
                  message: `${stg.description} for FDR ••••${inst.instrumentNo.slice(-4)} (${inst.bankName})`,
                });
                newAlertsCount++;
              }
            }
          }

          return newStatus !== inst.status ? { ...inst, status: newStatus } : inst;
        });

        set({
          currentDate: newDateStr,
          instruments: updatedInstruments,
          alerts: currentAlerts,
        });

        await addAuditEvent(
          'system-timemachine',
          `CLOCK_ADVANCED_${days >= 0 ? '+' : ''}${days}D`,
          'system',
          newDateStr,
          { previousDate: currentDate, newDate: newDateStr, days, alertsFired: newAlertsCount, instrumentsMatured: newMaturedCount }
        );

        return { alertsFired: newAlertsCount, instrumentsMatured: newMaturedCount };
      },

      resetClock: async () => {
        const { addAuditEvent } = get();
        // Reset clock back to SEED_CURRENT_DATE and reset instruments to original seed
        set({
          currentDate: SEED_CURRENT_DATE,
          instruments: JSON.parse(JSON.stringify(seedInstruments)),
          alerts: [],
        });
        await addAuditEvent(
          'system-timemachine',
          'CLOCK_RESET',
          'system',
          SEED_CURRENT_DATE,
          { resetTo: SEED_CURRENT_DATE }
        );
      },

      resetDemo: () => {
        set({
          institutions: JSON.parse(JSON.stringify(seedInstitutions)),
          instruments: JSON.parse(JSON.stringify(seedInstruments)),
          auditEvents: JSON.parse(JSON.stringify(seedAuditEvents)),
          bankTokens: JSON.parse(JSON.stringify(seedBankTokens)),
          releaseRequests: JSON.parse(JSON.stringify(seedReleaseRequests)),
          alerts: [],
          currentDate: SEED_CURRENT_DATE,
          role: 'Officer',
          officerRegion: 'North',
          selectedInstitutionId: 'inst-01',
          fraudWeights: { ...DEFAULT_FRAUD_WEIGHTS },
          riskBandThresholds: { ...DEFAULT_RISK_BANDS },
        });
      },

      loadDemoScenario: () => {
        set({
          institutions: JSON.parse(JSON.stringify(seedInstitutions)),
          instruments: JSON.parse(JSON.stringify(seedInstruments)),
          auditEvents: JSON.parse(JSON.stringify(seedAuditEvents)),
          bankTokens: JSON.parse(JSON.stringify(seedBankTokens)),
          releaseRequests: JSON.parse(JSON.stringify(seedReleaseRequests)),
          alerts: [],
          currentDate: SEED_CURRENT_DATE,
          role: 'Officer',
          officerRegion: 'North',
          selectedInstitutionId: 'inst-01',
          fraudWeights: { ...DEFAULT_FRAUD_WEIGHTS },
          riskBandThresholds: { ...DEFAULT_RISK_BANDS },
        });
      },
  })
);
