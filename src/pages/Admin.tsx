import { useState, useEffect, useMemo } from "react";
import { getFunnelStats, getLeads, type Lead, type LeadStatus } from "@/lib/funnel-tracking";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, UserPlus, MousePointerClick, UserCheck, MessageSquare, MessageCircle, TrendingDown, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  if (step === "pre_checkout") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (step === "pagina_vendas") return "bg-blue-100 text-blue-700 border-blue-200";
  if (step === "resultado") return "bg-violet-100 text-violet-700 border-violet-200";
  if (step.startsWith("quiz_")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
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

// Pastel colors for each question column — creates a visual "heat map" of funnel progress
const QUESTION_COLORS = [
  { bg: "bg-violet-50", header: "bg-violet-100", text: "text-violet-700", filled: "bg-violet-100 text-violet-800", border: "border-violet-200" },
  { bg: "bg-sky-50", header: "bg-sky-100", text: "text-sky-700", filled: "bg-sky-100 text-sky-800", border: "border-sky-200" },
  { bg: "bg-emerald-50", header: "bg-emerald-100", text: "text-emerald-700", filled: "bg-emerald-100 text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-amber-50", header: "bg-amber-100", text: "text-amber-700", filled: "bg-amber-100 text-amber-800", border: "border-amber-200" },
  { bg: "bg-rose-50", header: "bg-rose-100", text: "text-rose-700", filled: "bg-rose-100 text-rose-800", border: "border-rose-200" },
];

// Stat card pastel backgrounds
const STAT_CARD_STYLES = [
  "bg-violet-50 border-violet-100",
  "bg-sky-50 border-sky-100",
  "bg-emerald-50 border-emerald-100",
  "bg-amber-50 border-amber-100",
  "bg-rose-50 border-rose-100",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-sans text-sm">Carregando...</p>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <h1 className="text-2xl font-sans font-bold text-foreground mb-8">Painel Administrativo - Quiz</h1>

        {/* Top stat cards — pastel style like reference */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {topStats.map((s, i) => (
            <div key={s.label} className={`rounded-2xl p-5 border ${STAT_CARD_STYLES[i]} transition-shadow hover:shadow-md`}>
              <p className="text-xs font-sans text-muted-foreground mb-3">{s.label}</p>
              <div className="flex items-center gap-2.5 mb-1.5">
                <s.icon className="w-5 h-5 text-muted-foreground/60" />
                <p className="text-3xl font-sans font-bold text-foreground tracking-tight">{s.value}</p>
              </div>
              <p className="text-[11px] font-sans text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs + time filter */}
        <Tabs defaultValue="respostas" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3 mb-6">
            <TabsList className="bg-transparent p-0 h-auto gap-0">
              <TabsTrigger value="respostas" className="font-sans text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 pb-3">
                Respostas
              </TabsTrigger>
              <TabsTrigger value="leads" className="font-sans text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 pb-3">
                Leads
              </TabsTrigger>
              <TabsTrigger value="kanban" className="font-sans text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 pb-3">
                Kanban
              </TabsTrigger>
              <TabsTrigger value="abandono" className="font-sans text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 pb-3">
                Performance
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {presetButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setPreset(btn.value)}
                  className={cn(
                    "font-sans text-sm px-3 py-1.5 rounded-md transition-all",
                    preset === btn.value
                      ? "bg-card text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
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
                      "font-sans text-sm px-3 py-1.5 rounded-md transition-all flex items-center gap-1",
                      preset === "custom"
                        ? "bg-card text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {preset === "custom" && customFrom ? format(customFrom, "dd/MM") : "Data"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="flex gap-2 p-2">
                    <div>
                      <p className="text-xs font-sans text-muted-foreground px-3 py-1">De</p>
                      <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setPreset("custom"); }} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </div>
                    <div>
                      <p className="text-xs font-sans text-muted-foreground px-3 py-1">Até</p>
                      <Calendar mode="single" selected={customTo} onSelect={(d) => { setCustomTo(d); setPreset("custom"); }} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ===== RESPOSTAS TAB ===== */}
          <TabsContent value="respostas" className="mt-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {/* Question headers with colored backgrounds and completion % */}
                    <TableRow className="border-b-0">
                      <TableHead className="font-sans text-xs text-muted-foreground bg-muted/30 w-10 border-r border-border">—</TableHead>
                      <TableHead className="font-sans text-xs text-muted-foreground bg-muted/30 min-w-[120px] border-r border-border">Entrada</TableHead>
                      {questionSteps.map((qs, i) => {
                        const color = QUESTION_COLORS[i];
                        return (
                          <TableHead key={i} className={`font-sans text-xs min-w-[160px] border-r border-border ${color.header}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${color.text}`}>{i + 1} {qs.question.question.split("?")[0].slice(0, 20)}…</span>
                              <span className={`text-sm font-bold ${color.text}`}>{qs.rate}%</span>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + quizQuestions.length} className="text-center py-16 text-muted-foreground font-sans text-sm">
                          Nenhum lead neste período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead, index) => {
                        const answers = (lead.quiz_answers || {}) as Record<string, string>;
                        return (
                          <TableRow key={lead.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-sans text-xs text-muted-foreground border-r border-border text-center">{index + 1}</TableCell>
                            <TableCell className="font-sans border-r border-border">
                              <p className="text-xs font-mono text-muted-foreground">{lead.id.slice(0, 6)}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
                            </TableCell>
                            {quizQuestions.map((q, i) => {
                              const ans = answers[String(q.id)];
                              const color = QUESTION_COLORS[i];
                              return (
                                <TableCell key={q.id} className={`font-sans text-xs border-r border-border ${ans ? color.bg : ""}`}>
                                  {ans ? (
                                    <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-medium ${color.filled}`}>
                                      {getAnswerLabel(ans)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
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

          {/* ===== LEADS TAB ===== */}
          <TabsContent value="leads" className="mt-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Nome</TableHead>
                    <TableHead className="font-sans text-xs">E-mail</TableHead>
                    <TableHead className="font-sans text-xs">Telefone</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs">Parou em</TableHead>
                    <TableHead className="font-sans text-xs">Data</TableHead>
                    <TableHead className="font-sans text-xs text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground font-sans text-sm">
                        Nenhum lead neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-sans text-sm font-semibold text-foreground">
                          {lead.name || <span className="text-muted-foreground italic text-xs">Anônimo</span>}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">
                          {lead.email || <span className="italic text-xs">—</span>}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">
                          {lead.phone || <span className="italic text-xs">—</span>}
                        </TableCell>
                        <TableCell className="font-sans text-sm">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            lead.status === "comprou" ? "bg-emerald-100 text-emerald-700" :
                            lead.status === "nao_comprou" ? "bg-rose-100 text-rose-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {lead.status === "comprou" ? "Comprou" : lead.status === "nao_comprou" ? "Não Comprou" : "Aguardando"}
                          </span>
                        </TableCell>
                        <TableCell className="font-sans text-sm">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStepBadge(lead.last_step)}`}>
                            {getStepLabel(lead.last_step)}
                          </span>
                        </TableCell>
                        <TableCell className="font-sans text-muted-foreground text-sm">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {lead.phone ? (
                            <button
                              onClick={() => openWhatsApp(lead.phone!)}
                              className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ===== KANBAN TAB ===== */}
          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard leads={contactLeads} onStatusChange={handleStatusChange} />
          </TabsContent>

          {/* ===== PERFORMANCE / ABANDONO TAB ===== */}
          <TabsContent value="abandono" className="mt-0">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl p-5 bg-rose-50 border border-rose-100">
                <TrendingDown className="w-5 h-5 mb-2 text-rose-500" />
                <p className="text-3xl font-sans font-bold text-rose-700 tracking-tight">{stats.quizDropoffRate}%</p>
                <p className="text-sm font-sans text-muted-foreground mt-1">Abandono no Quiz</p>
              </div>
              <div className="rounded-2xl p-5 bg-amber-50 border border-amber-100">
                <TrendingDown className="w-5 h-5 mb-2 text-amber-500" />
                <p className="text-3xl font-sans font-bold text-amber-700 tracking-tight">{stats.salesDropoffRate}%</p>
                <p className="text-sm font-sans text-muted-foreground mt-1">Abandono na Vendas</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-sm font-sans font-semibold text-foreground mb-5">Abandono por Etapa</p>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {stepOrder.map((step, i) => {
                  const stopped = stoppedAt[step] || 0;
                  const pct = ((stopped / totalFiltered) * 100).toFixed(1);
                  const isHigh = parseFloat(pct) > 15;
                  return (
                    <div key={step} className={`rounded-xl p-3 border text-center transition-shadow hover:shadow-sm ${
                      stopped === 0 ? "bg-muted/20 border-border" : isHigh ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                    }`}>
                      <p className={`text-lg font-sans font-bold ${
                        stopped === 0 ? "text-muted-foreground/40" : isHigh ? "text-rose-700" : "text-amber-700"
                      }`}>{pct}%</p>
                      <p className="text-[10px] font-sans text-muted-foreground leading-tight mt-1">{getStepLabel(step)}</p>
                      <p className="text-[10px] font-sans text-muted-foreground/50">{stopped}</p>
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
