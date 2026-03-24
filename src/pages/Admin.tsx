import { useState, useEffect, useMemo } from "react";
import { getFunnelStats, getLeads, type Lead, type LeadStatus } from "@/lib/funnel-tracking";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, UserPlus, MousePointerClick, UserCheck, MessageSquare, MessageCircle, TrendingDown, CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import KanbanBoard from "@/components/admin/KanbanBoard";
import { quizQuestions } from "@/components/quiz/QuizData";

const STEP_LABELS: Record<string, string> = {
  landing: "Landing",
  quiz_pergunta_1: "Pergunta 1",
  quiz_pergunta_2: "Pergunta 2",
  quiz_pergunta_3: "Pergunta 3",
  quiz_pergunta_4: "Pergunta 4",
  quiz_pergunta_5: "Pergunta 5",
  resultado: "Resultado",
  pagina_vendas: "Vendas",
  pre_checkout: "Checkout",
};

function getStepLabel(step: string) {
  return STEP_LABELS[step] || step;
}

function getStepBadge(step: string) {
  if (step === "pre_checkout") return "bg-emerald-50 text-emerald-600";
  if (step === "pagina_vendas") return "bg-blue-50 text-blue-600";
  if (step === "resultado") return "bg-violet-50 text-violet-600";
  if (step.startsWith("quiz_")) return "bg-amber-50 text-amber-600";
  return "bg-gray-50 text-gray-500";
}

const ANSWER_LABELS: Record<string, string> = {
  iniciante: "Nunca estudei",
  basico: "Sei algumas palavras",
  intermediario: "Conversa simples",
  avancado: "Avançado",
  viagem: "Viagem",
  carreira: "Carreira",
  morar: "Morar fora",
  cultura: "Cultura",
  "15min": "15 min/dia",
  "30min": "30 min/dia",
  "1hora": "1 hora/dia",
  mais1hora: "+1 hora/dia",
  video: "Vídeo-aulas",
  conversacao: "Conversação",
  exercicios: "Exercícios",
  imersao: "Imersão",
  "3meses": "3 meses",
  "6meses": "6 meses",
  "1ano": "1 ano",
  sempressa: "Sem pressa",
};

function getAnswerLabel(value: string) {
  return ANSWER_LABELS[value] || value;
}

// Soft pastel column colors for the response heat map
const COL_COLORS = [
  { header: "bg-[#f3f0ff]", filled: "bg-[#ede9fe] text-[#6d28d9]", empty: "" },
  { header: "bg-[#ecfdf5]", filled: "bg-[#d1fae5] text-[#047857]", empty: "" },
  { header: "bg-[#fefce8]", filled: "bg-[#fef9c3] text-[#a16207]", empty: "" },
  { header: "bg-[#fff1f2]", filled: "bg-[#ffe4e6] text-[#be123c]", empty: "" },
  { header: "bg-[#eff6ff]", filled: "bg-[#dbeafe] text-[#1d4ed8]", empty: "" },
];

// Stat card styles matching reference — very light pastel with subtle border
const CARD_STYLES = [
  { bg: "bg-white", border: "border-[#e8e5f0]", iconBg: "bg-[#f3f0ff]", iconColor: "text-[#7c3aed]" },
  { bg: "bg-white", border: "border-[#d5f0e3]", iconBg: "bg-[#ecfdf5]", iconColor: "text-[#059669]" },
  { bg: "bg-white", border: "border-[#fde68a]", iconBg: "bg-[#fefce8]", iconColor: "text-[#d97706]" },
  { bg: "bg-white", border: "border-[#fecdd3]", iconBg: "bg-[#fff1f2]", iconColor: "text-[#e11d48]" },
  { bg: "bg-white", border: "border-[#bfdbfe]", iconBg: "bg-[#eff6ff]", iconColor: "text-[#2563eb]" },
];

type PresetRange = "24h" | "7d" | "30d" | "custom";

const Admin = () => {
  const [stats, setStats] = useState<ReturnType<typeof getFunnelStats> extends Promise<infer T> ? T : never | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetRange>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => {
    const load = async () => {
      const [s, l] = await Promise.all([getFunnelStats(), getLeads()]);
      setStats(s);
      setLeads(l);
      setLoading(false);
    };
    load();
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (preset === "24h") return { from: subDays(now, 1), to: now };
    if (preset === "7d") return { from: subDays(now, 7), to: now };
    if (preset === "30d") return { from: subMonths(now, 1), to: now };
    return {
      from: customFrom ? startOfDay(customFrom) : subDays(now, 7),
      to: customTo ? endOfDay(customTo) : now,
    };
  }, [preset, customFrom, customTo]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const d = new Date(l.created_at);
      return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
    });
  }, [leads, dateRange]);

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent("Gostei do seu curso, quero comprar mas tenho dúvidas")}`, "_blank");
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 font-sans text-sm">Carregando...</p>
      </div>
    );
  }

  const contactLeads = filteredLeads.filter((l) => l.name && l.email && l.phone);
  const totalFiltered = filteredLeads.length || 1;

  const stepOrder = ["landing", "quiz_pergunta_1", "quiz_pergunta_2", "quiz_pergunta_3", "quiz_pergunta_4", "quiz_pergunta_5", "resultado", "pagina_vendas", "pre_checkout"];
  const reachedStep: Record<string, number> = {};
  for (let i = 0; i < stepOrder.length; i++) {
    reachedStep[stepOrder[i]] = filteredLeads.filter((l) => {
      const idx = stepOrder.indexOf(l.last_step);
      return idx >= i;
    }).length;
  }
  const stoppedAt: Record<string, number> = {};
  for (const step of stepOrder) {
    stoppedAt[step] = filteredLeads.filter((l) => l.last_step === step).length;
  }

  const interacted = filteredLeads.filter((l) => l.last_step !== "landing").length;
  const interactionRate = ((interacted / totalFiltered) * 100).toFixed(1);
  const qualified = filteredLeads.filter((l) => {
    const idx = stepOrder.indexOf(l.last_step);
    return idx >= stepOrder.indexOf("resultado");
  }).length;
  const completed = filteredLeads.filter((l) => l.last_step === "pre_checkout").length;

  const topStats = [
    { label: "Visitas e Acessos", value: filteredLeads.length, sub: "Visitantes que acessaram o funil", icon: Eye },
    { label: "Leads adquiridos", value: interacted, sub: "Iniciaram interação com o funil", icon: UserPlus },
    { label: "Taxa de interação", value: `${interactionRate}%`, sub: "Visitantes que interagiram", icon: MousePointerClick },
    { label: "Leads qualificados", value: qualified, sub: "Completaram o quiz", icon: UserCheck },
    { label: "Fluxos completos", value: completed, sub: "Chegaram ao pré-checkout", icon: MessageSquare },
  ];

  const presetButtons: { label: string; value: PresetRange }[] = [
    { label: "30 dias", value: "30d" },
    { label: "7 dias", value: "7d" },
    { label: "24 horas", value: "24h" },
  ];

  const questionSteps = quizQuestions.map((q, i) => ({
    question: q,
    reached: reachedStep[`quiz_pergunta_${i + 1}`] || 0,
    rate: (((reachedStep[`quiz_pergunta_${i + 1}`] || 0) / totalFiltered) * 100).toFixed(0),
  }));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* Header */}
        <h1 className="text-[22px] font-sans font-bold text-gray-900 mb-8">Painel Administrativo - Quiz</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {topStats.map((s, i) => {
            const style = CARD_STYLES[i];
            return (
              <div key={s.label} className={`${style.bg} rounded-2xl p-5 border ${style.border} shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow`}>
                <p className="text-[11px] font-sans text-gray-400 uppercase tracking-wide mb-3">{s.label}</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${style.iconColor}`} />
                  </div>
                  <p className="text-[28px] font-sans font-bold text-gray-900 leading-none">{s.value}</p>
                </div>
                <p className="text-[11px] font-sans text-gray-400">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs + Time filter */}
        <Tabs defaultValue="respostas" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <TabsList className="bg-transparent p-0 h-auto gap-6">
              {["respostas", "leads", "crm", "performance"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="font-sans text-[13px] uppercase tracking-wide text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 pb-2"
                >
                  {tab === "crm" ? "CRM" : tab === "performance" ? "Performance" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {presetButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setPreset(btn.value)}
                  className={cn(
                    "font-sans text-[13px] px-3.5 py-1.5 rounded-md transition-all",
                    preset === btn.value
                      ? "bg-white text-gray-900 font-medium shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {btn.label}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setPreset("custom")}
                    className={cn(
                      "font-sans text-[13px] px-3 py-1.5 rounded-md transition-all flex items-center gap-1",
                      preset === "custom"
                        ? "bg-white text-gray-900 font-medium shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {preset === "custom" && customFrom ? format(customFrom, "dd/MM") : "Data"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="flex gap-2 p-2">
                    <div>
                      <p className="text-[11px] font-sans text-gray-400 px-3 py-1">De</p>
                      <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setPreset("custom"); }} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </div>
                    <div>
                      <p className="text-[11px] font-sans text-gray-400 px-3 py-1">Até</p>
                      <Calendar mode="single" selected={customTo} onSelect={(d) => { setCustomTo(d); setPreset("custom"); }} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ===== RESPOSTAS ===== */}
          <TabsContent value="respostas" className="mt-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide bg-gray-50/50 w-10 border-r border-gray-100">—</TableHead>
                      <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide bg-gray-50/50 min-w-[110px] border-r border-gray-100">Entrada</TableHead>
                      {questionSteps.map((qs, i) => {
                        const color = COL_COLORS[i];
                        return (
                          <TableHead key={i} className={`font-sans text-[11px] min-w-[150px] border-r border-gray-100 ${color.header}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-600">
                                <span className="font-bold text-gray-900">{i + 1}</span>
                                {" "}{qs.question.question.split("?")[0].slice(0, 18)}…
                              </span>
                              <span className="text-[13px] font-bold text-gray-900">{qs.rate}%</span>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + quizQuestions.length} className="text-center py-20 text-gray-400 font-sans text-sm">
                          Nenhum lead neste período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead, index) => {
                        const answers = (lead.quiz_answers || {}) as Record<string, string>;
                        return (
                          <TableRow key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-sans text-[12px] text-gray-400 border-r border-gray-100 text-center">{index + 1}</TableCell>
                            <TableCell className="font-sans border-r border-gray-100">
                              <p className="text-[12px] font-mono text-gray-500">{lead.id.slice(0, 6)}</p>
                              <p className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
                            </TableCell>
                            {quizQuestions.map((q, i) => {
                              const ans = answers[String(q.id)];
                              const color = COL_COLORS[i];
                              return (
                                <TableCell key={q.id} className={`font-sans text-[12px] border-r border-gray-100 ${ans ? color.filled : ""}`}>
                                  {ans ? (
                                    <span className="font-medium">{getAnswerLabel(ans)}</span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ===== LEADS ===== */}
          <TabsContent value="leads" className="mt-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">Nome</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">E-mail</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">Telefone</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">Parou em</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide">Data</TableHead>
                    <TableHead className="font-sans text-[11px] text-gray-400 uppercase tracking-wide text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-gray-400 font-sans text-sm">
                        Nenhum lead neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-sans text-[13px] font-medium text-gray-900">
                          {lead.name || <span className="text-gray-400 italic text-[12px]">Anônimo</span>}
                        </TableCell>
                        <TableCell className="font-sans text-[13px] text-gray-500">
                          {lead.email || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="font-sans text-[13px] text-gray-500">
                          {lead.phone || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            lead.status === "comprou" ? "bg-emerald-50 text-emerald-600" :
                            lead.status === "nao_comprou" ? "bg-red-50 text-red-600" :
                            "bg-amber-50 text-amber-600"
                          }`}>
                            {lead.status === "comprou" ? "Comprou" : lead.status === "nao_comprou" ? "Não Comprou" : "Aguardando"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${getStepBadge(lead.last_step)}`}>
                            {getStepLabel(lead.last_step)}
                          </span>
                        </TableCell>
                        <TableCell className="font-sans text-[13px] text-gray-400">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {lead.phone ? (
                            <button
                              onClick={() => openWhatsApp(lead.phone!)}
                              className="inline-flex items-center gap-1.5 text-[12px] font-sans font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[12px]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ===== CRM ===== */}
          <TabsContent value="crm" className="mt-0">
            <KanbanBoard leads={contactLeads} onStatusChange={handleStatusChange} />
          </TabsContent>

          {/* ===== PERFORMANCE ===== */}
          <TabsContent value="performance" className="mt-0">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-[28px] font-sans font-bold text-gray-900 leading-none mb-1">{stats.quizDropoffRate}%</p>
                <p className="text-[12px] font-sans text-gray-400">Abandono no Quiz</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[28px] font-sans font-bold text-gray-900 leading-none mb-1">{stats.salesDropoffRate}%</p>
                <p className="text-[12px] font-sans text-gray-400">Abandono na Vendas</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] font-sans font-semibold text-gray-900 mb-5">Abandono por Etapa</p>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {stepOrder.map((step) => {
                  const stopped = stoppedAt[step] || 0;
                  const pct = ((stopped / totalFiltered) * 100).toFixed(1);
                  const isHigh = parseFloat(pct) > 15;
                  return (
                    <div key={step} className={`rounded-xl p-3 border text-center ${
                      stopped === 0 ? "bg-gray-50 border-gray-100" : isHigh ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                    }`}>
                      <p className={`text-[18px] font-sans font-bold ${
                        stopped === 0 ? "text-gray-300" : isHigh ? "text-red-600" : "text-amber-600"
                      }`}>{pct}%</p>
                      <p className="text-[10px] font-sans text-gray-400 leading-tight mt-1">{getStepLabel(step)}</p>
                      <p className="text-[10px] font-sans text-gray-300">{stopped}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
