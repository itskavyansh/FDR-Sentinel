// Audit chain implementation using crypto.subtle SHA-256

import type { AuditEvent } from '../types';

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeHash(payloadHash: string, prevHash: string): Promise<string> {
  return sha256(payloadHash + prevHash);
}

export function extractEventPayload(event: AuditEvent): string {
  // If payloadData is stored, hash that; otherwise serialize deterministic fields
  if (event.payloadData) {
    return JSON.stringify(event.payloadData);
  }
  return JSON.stringify({
    id: event.id,
    actor: event.actor,
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    timestamp: event.timestamp,
  });
}

export async function buildAuditEvent(
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  prevHash: string,
  extraPayload?: Record<string, unknown>
): Promise<AuditEvent> {
  const id = `ae-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();
  const payloadData = { id, actor, action, entity, entityId, timestamp, ...extraPayload };
  const payloadStr = JSON.stringify(payloadData);
  const payloadHash = await sha256(payloadStr);
  const hash = await computeHash(payloadHash, prevHash);
  return { id, actor, action, entity, entityId, timestamp, payloadHash, prevHash, hash, payloadData };
}

// Compute deterministic SHA-256 chain for any list of events
export async function recomputeAuditChain(
  events: AuditEvent[],
  genesisHash = '0'.repeat(64)
): Promise<AuditEvent[]> {
  let prevHash = genesisHash;
  const newEvents: AuditEvent[] = [];
  for (const e of events) {
    const payloadStr = extractEventPayload(e);
    const payloadHash = await sha256(payloadStr);
    const hash = await computeHash(payloadHash, prevHash);
    newEvents.push({
      ...e,
      payloadHash,
      prevHash,
      hash,
    });
    prevHash = hash;
  }
  return newEvents;
}

// Verify audit chain using crypto.subtle SHA-256
export async function verifyAuditChain(
  events: AuditEvent[],
  genesisHash = '0'.repeat(64)
): Promise<{ valid: boolean; brokenIndex?: number; brokenEventId?: number | string; reason?: string }> {
  let expectedPrevHash = genesisHash;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check prevHash pointer
    if (event.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenIndex: i,
        brokenEventId: event.id,
        reason: `Previous hash pointer mismatch at index ${i} (${event.id}). Expected ${expectedPrevHash.slice(0, 12)}… but found ${event.prevHash.slice(0, 12)}…`,
      };
    }

    // Check payload hash
    const expectedPayload = extractEventPayload(event);
    const computedPayloadHash = await sha256(expectedPayload);
    if (computedPayloadHash !== event.payloadHash) {
      return {
        valid: false,
        brokenIndex: i,
        brokenEventId: event.id,
        reason: `Payload tampering detected at event #${i + 1} (${event.id}). Computed payload hash does not match stored payloadHash.`,
      };
    }

    // Check block hash
    const computedBlockHash = await computeHash(event.payloadHash, event.prevHash);
    if (computedBlockHash !== event.hash) {
      return {
        valid: false,
        brokenIndex: i,
        brokenEventId: event.id,
        reason: `Hash signature invalid at event #${i + 1} (${event.id}). Block hash does not match computed value.`,
      };
    }

    expectedPrevHash = event.hash;
  }

  return { valid: true };
}
