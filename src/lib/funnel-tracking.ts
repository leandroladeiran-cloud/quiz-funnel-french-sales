import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "aguardando" | "comprou" | "nao_comprou";

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  last_step: string;
  quiz_answers: Record<string, string> | null;
  created_at: string;
}

export interface FunnelEvent {
  type: "page_view" | "quiz_start" | "quiz_complete" | "sales_view" | "pre_checkout";
}

const VISITOR_KEY = "visitor_lead_id";

function getVisitorLeadId(): string | null {
  return localStorage.getItem(VISITOR_KEY);
}

function setVisitorLeadId(id: string) {
  localStorage.setItem(VISITOR_KEY, id);
}

export async function ensureVisitorLead(): Promise<string | null> {
  const existing = getVisitorLeadId();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("leads")
    .insert({ status: "aguardando", last_step: "landing" })
    .select("id")
    .single();
  if (error) { console.error("ensureVisitorLead error:", error); return null; }
  setVisitorLeadId(data.id);
  return data.id;
}

export async function updateVisitorStep(step: string) {
  const leadId = getVisitorLeadId();
  if (!leadId) return;
  const { error } = await supabase
    .from("leads")
    .update({ last_step: step })
    .eq("id", leadId);
  if (error) console.error("updateVisitorStep error:", error);
}

/** Save a quiz answer for the current visitor */
export async function saveQuizAnswer(questionId: number, answer: string) {
  const leadId = getVisitorLeadId();
  if (!leadId) return;

  // Fetch current answers first
  const { data } = await supabase
    .from("leads")
    .select("quiz_answers")
    .eq("id", leadId)
    .single();

  const current = (data?.quiz_answers as Record<string, string>) || {};
  const updated = { ...current, [String(questionId)]: answer };

  const { error } = await supabase
    .from("leads")
    .update({ quiz_answers: updated })
    .eq("id", leadId);
  if (error) console.error("saveQuizAnswer error:", error);
}

export async function completeLeadInfo(info: { name: string; email: string; phone: string }) {
  const leadId = getVisitorLeadId();
  if (!leadId) {
    return saveLead({ ...info, status: "aguardando" });
  }
  const { data, error } = await supabase
    .from("leads")
    .update({ name: info.name, email: info.email, phone: info.phone, last_step: "pre_checkout" })
    .eq("id", leadId)
    .select()
    .single();
  if (error) { console.error("completeLeadInfo error:", error); return null; }
  return data as Lead;
}

export async function saveLead(lead: { name: string; email: string; phone: string; status: LeadStatus }): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .insert({ name: lead.name, email: lead.email, phone: lead.phone, status: lead.status, last_step: "pre_checkout" })
    .select()
    .single();
  if (error) { console.error("saveLead error:", error); return null; }
  setVisitorLeadId(data.id);
  return data as Lead;
}

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("getLeads error:", error); return []; }
  return (data || []) as Lead[];
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) console.error("updateLeadStatus error:", error);
}

export async function trackEvent(type: FunnelEvent["type"]) {
  const { error } = await supabase
    .from("funnel_events")
    .insert({ type });
  if (error) console.error("trackEvent error:", error);
}

export async function getFunnelStats() {
  const { data, error } = await supabase
    .from("funnel_events")
    .select("type");
  if (error) { console.error("getFunnelStats error:", error); }

  const events = data || [];
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
