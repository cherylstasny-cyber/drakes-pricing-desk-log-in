import { findAttribute } from './taxonomy';
import type { MatchResult } from './types';

export type PropertySummary = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  price: number;
  photoUrl?: string;
};

export type ClientSummary = { id: string; fullName: string; email: string };
export type AgentSummary = { id: string; fullName: string; email: string; brandName: string };

export type BuyerAlertEmail = {
  to: string;
  subject: string;
  property: PropertySummary;
  matchPercent: number;
  topMatchingTraits: string[];
  missingPreferredTraits: string[];
  whySelected: string;
  requestShowingUrl: string;
  agent: AgentSummary;
};

export type AgentAlertNotice = {
  to: string;
  subject: string;
  body: string;
};

export type LoggedAlert = {
  matchResultId: string;
  buyerEmail: BuyerAlertEmail;
  agentNotice: AgentAlertNotice;
  status: 'delivered' | 'opened' | 'clicked' | 'saved' | 'dismissed' | 'showing_requested' | 'pending';
  sentAt: string;
};

function describeReason(categoryKey: string, attributeKey: string): string {
  return findAttribute(categoryKey, attributeKey)?.label ?? attributeKey;
}

export function buildBuyerAlertEmail(
  result: MatchResult,
  property: PropertySummary,
  client: ClientSummary,
  agent: AgentSummary,
  requestShowingUrl: string
): BuyerAlertEmail {
  const topMatchingTraits = result.reasons
    .filter((r) => r.matched && r.requirement !== 'AVOID')
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map((r) => describeReason(r.categoryKey, r.attributeKey));

  const missingPreferredTraits = result.missingPreferred.map((r) => describeReason(r.categoryKey, r.attributeKey));

  return {
    to: client.email,
    subject: `${result.score}% match: ${property.addressLine1}`,
    property,
    matchPercent: result.score,
    topMatchingTraits,
    missingPreferredTraits,
    whySelected: `This home matched ${topMatchingTraits.length} of your top preferences${
      missingPreferredTraits.length ? `, though it's missing ${missingPreferredTraits.length} preferred feature(s)` : ''
    }.`,
    requestShowingUrl,
    agent,
  };
}

export function buildAgentAlertNotice(result: MatchResult, property: PropertySummary, client: ClientSummary): AgentAlertNotice {
  return {
    to: '', // filled by caller with the agent's email
    subject: `New ${result.score}% match sent to ${client.fullName}`,
    body: `${property.addressLine1}, ${property.city} matched ${client.fullName}'s Design Scout watch at ${result.score}%. They were copied automatically.`,
  };
}

/**
 * Swappable interface: v1 is an in-memory/console adapter with no real email
 * provider wired up (none configured yet -- see STATUS_REPORT.md). A real
 * adapter (e.g. SES/Postmark/Resend) implements the same interface.
 */
export interface NotificationAdapter {
  sendBuyerAlert(email: BuyerAlertEmail): Promise<{ id: string }>;
  sendAgentNotice(notice: AgentAlertNotice): Promise<{ id: string }>;
}

export class ConsoleNotificationAdapter implements NotificationAdapter {
  sent: Array<{ kind: 'buyer' | 'agent'; payload: BuyerAlertEmail | AgentAlertNotice; id: string }> = [];

  async sendBuyerAlert(email: BuyerAlertEmail): Promise<{ id: string }> {
    const id = `buyer-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    this.sent.push({ kind: 'buyer', payload: email, id });
    // eslint-disable-next-line no-console
    console.log('[design-scout] buyer alert (not actually sent - no email provider configured):', {
      id,
      to: email.to,
      subject: email.subject,
    });
    return { id };
  }

  async sendAgentNotice(notice: AgentAlertNotice): Promise<{ id: string }> {
    const id = `agent-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    this.sent.push({ kind: 'agent', payload: notice, id });
    // eslint-disable-next-line no-console
    console.log('[design-scout] agent notice (not actually sent - no email provider configured):', {
      id,
      to: notice.to,
      subject: notice.subject,
    });
    return { id };
  }
}

export function createNotificationAdapter(): NotificationAdapter {
  return new ConsoleNotificationAdapter();
}
