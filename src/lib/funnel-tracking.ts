import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "aguardando" | "comprou" | "nao_comprou";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  created_at: string;
}

export interface FunnelEvent {
  type: "page_view" | "quiz_start" | "quiz_complete" | "sales_view" | "pre_checkout";
}

export async function saveLead(lead: { name: string; email: string; phone: string; status: LeadStatus }): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .insert({ name: lead.name, email: lead.email, phone: lead.phone, status: lead.status })
    .select()
    .single();
  if (error) { console.error("saveLead error:", error); return null; }
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
