// Simple localStorage-based funnel tracking

export type LeadStatus = "aguardando" | "comprou" | "nao_comprou";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  status: LeadStatus;
}

const LEAD_STATUS_KEY = "funnel_lead_status";

export function getLeadStatuses(): Record<string, LeadStatus> {
  try {
    return JSON.parse(localStorage.getItem(LEAD_STATUS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setLeadStatus(leadId: string, status: LeadStatus) {
  const statuses = getLeadStatuses();
  statuses[leadId] = status;
  localStorage.setItem(LEAD_STATUS_KEY, JSON.stringify(statuses));
}

export interface FunnelEvent {
  type: "page_view" | "quiz_start" | "quiz_complete" | "sales_view" | "pre_checkout";
  timestamp: string;
}

const LEADS_KEY = "funnel_leads";
const EVENTS_KEY = "funnel_events";

export function saveLead(lead: Omit<Lead, "id" | "createdAt">): Lead {
  const leads = getLeads();
  const newLead: Lead = {
    ...lead,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  leads.push(newLead);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  return newLead;
}

export function getLeads(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function trackEvent(type: FunnelEvent["type"]) {
  const events = getEvents();
  events.push({ type, timestamp: new Date().toISOString() });
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function getEvents(): FunnelEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getFunnelStats() {
  const events = getEvents();
  const pageViews = events.filter((e) => e.type === "page_view").length;
  const quizStarts = events.filter((e) => e.type === "quiz_start").length;
  const quizCompletes = events.filter((e) => e.type === "quiz_complete").length;
  const salesViews = events.filter((e) => e.type === "sales_view").length;
  const preCheckouts = events.filter((e) => e.type === "pre_checkout").length;

  const total = pageViews || 1;

  return {
    pageViews,
    quizStarts,
    quizCompletes,
    salesViews,
    preCheckouts,
    quizStartRate: ((quizStarts / total) * 100).toFixed(1),
    quizCompleteRate: ((quizCompletes / total) * 100).toFixed(1),
    salesViewRate: ((salesViews / total) * 100).toFixed(1),
    preCheckoutRate: ((preCheckouts / total) * 100).toFixed(1),
    quizDropoffRate: (((quizStarts - quizCompletes) / (quizStarts || 1)) * 100).toFixed(1),
    salesDropoffRate: (((salesViews - preCheckouts) / (salesViews || 1)) * 100).toFixed(1),
  };
}
