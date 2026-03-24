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
  landing: "Landing Page",
  quiz_pergunta_1: "Pergunta 1",
  quiz_pergunta_2: "Pergunta 2",
  quiz_pergunta_3: "Pergunta 3",
  quiz_pergunta_4: "Pergunta 4",
  quiz_pergunta_5: "Pergunta 5",
  resultado: "Resultado",
  pagina_vendas: "Pág. Vendas",
  pre_checkout: "Pré-Checkout",
};

function getStepLabel(step: string) {
  return STEP_LABELS[step] || step;
}

function getStepColor(step: string) {
  if (step === "pre_checkout") return "bg-emerald-500/20 text-emerald-700";
  if (step === "pagina_vendas") return "bg-accent/20 text-accent-foreground";
  if (step === "resultado") return "bg-blue-500/20 text-blue-700";
  if (step.startsWith("quiz_")) return "bg-amber-500/20 text-amber-700";
  return "bg-muted text-muted-foreground";
}

// Map quiz answer values to readable labels
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
    const message = encodeURIComponent("Gostei do seu curso, quero comprar mas tenho dúvidas");
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-sans">Carregando...</p>
      </div>
    );
  }

  const contactLeads = filteredLeads.filter((l) => l.name && l.email && l.phone);
  const totalFiltered = filteredLeads.length || 1;

  // Compute per-step percentages for leads that REACHED each step (not just stopped)
  const stepOrder = ["landing", "quiz_pergunta_1", "quiz_pergunta_2", "quiz_pergunta_3", "quiz_pergunta_4", "quiz_pergunta_5", "resultado", "pagina_vendas", "pre_checkout"];
  const reachedStep: Record<string, number> = {};
  for (let i = 0; i < stepOrder.length; i++) {
    // A lead reached step[i] if their last_step is step[i] or any later step
    reachedStep[stepOrder[i]] = filteredLeads.filter((l) => {
      const idx = stepOrder.indexOf(l.last_step);
      return idx >= i;
    }).length;
  }

  const stoppedAt: Record<string, number> = {};
  for (const step of stepOrder) {
    stoppedAt[step] = filteredLeads.filter((l) => l.last_step === step).length;
  }

  // Leads that interacted (went past landing)
  const interacted = filteredLeads.filter((l) => l.last_step !== "landing").length;
  const interactionRate = ((interacted / totalFiltered) * 100).toFixed(1);
  // Qualified = reached resultado or beyond
  const qualified = filteredLeads.filter((l) => {
    const idx = stepOrder.indexOf(l.last_step);
    return idx >= stepOrder.indexOf("resultado");
  }).length;
  // Completed = pre_checkout
  const completed = filteredLeads.filter((l) => l.last_step === "pre_checkout").length;

  const topStats = [
    { label: "Visitas e Acessos", value: filteredLeads.length, sub: "Visitantes que acessaram o funil", icon: Eye },
    { label: "Leads adquiridos", value: interacted, sub: "Iniciaram alguma interação com o funil", icon: UserPlus },
    { label: "Taxa de interação", value: `${interactionRate}%`, sub: "Visitantes que interagiram com o funil", icon: MousePointerClick },
    { label: "Leads qualificados", value: qualified, sub: "Completaram o quiz", icon: UserCheck },
    { label: "Fluxos completos", value: completed, sub: "Passaram da última etapa do funil", icon: MessageSquare },
  ];

  const presetButtons: { label: string; value: PresetRange }[] = [
    { label: "30 dias", value: "30d" },
    { label: "7 dias", value: "7d" },
    { label: "24 horas", value: "24h" },
    { label: "Personalizado", value: "custom" },
  ];

  // Per-question completion rates
  const questionSteps = quizQuestions.map((q, i) => ({
    questionIndex: i,
    question: q,
    stepKey: `quiz_pergunta_${i + 1}`,
    reached: reachedStep[`quiz_pergunta_${i + 1}`] || 0,
    rate: (((reachedStep[`quiz_pergunta_${i + 1}`] || 0) / totalFiltered) * 100).toFixed(0),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-sans font-bold text-foreground">Painel Administrativo</h1>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {topStats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-sans text-muted-foreground mb-2">{s.label}</p>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-2xl font-sans font-bold text-foreground">{s.value}</p>
              </div>
              <p className="text-[11px] font-sans text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Time filter + Tabs */}
        <Tabs defaultValue="respostas" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="respostas" className="font-sans text-sm">Respostas</TabsTrigger>
              <TabsTrigger value="leads" className="font-sans text-sm">Leads</TabsTrigger>
              <TabsTrigger value="kanban" className="font-sans text-sm">Kanban</TabsTrigger>
              <TabsTrigger value="abandono" className="font-sans text-sm">Abandono</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1">
              {presetButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreset(btn.value)}
                  className={cn("font-sans text-sm", preset === btn.value && "font-bold text-primary underline underline-offset-4")}
                >
                  {btn.label}
                </Button>
              ))}
              {preset === "custom" && (
                <div className="flex items-center gap-1 ml-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("font-sans text-xs h-8", !customFrom && "text-muted-foreground")}>
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {customFrom ? format(customFrom, "dd/MM") : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground text-xs">–</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("font-sans text-xs h-8", !customTo && "text-muted-foreground")}>
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {customTo ? format(customTo, "dd/MM") : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={ptBR} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Respostas Tab */}
          <TabsContent value="respostas">
            {/* Column headers per question with completion % */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-sans text-xs text-muted-foreground w-10">—</TableHead>
                      <TableHead className="font-sans text-xs text-muted-foreground">Entrada</TableHead>
                      {questionSteps.map((qs) => (
                        <TableHead key={qs.stepKey} className="font-sans text-xs text-muted-foreground min-w-[140px]">
                          <span className="font-semibold text-foreground">{qs.questionIndex + 1}</span>
                          {" "}{qs.question.question.split("?")[0].slice(0, 25)}…
                          <span className="ml-2 font-bold text-foreground">{qs.rate}%</span>
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow className="bg-muted/10 border-b">
                      <TableHead className="font-sans text-[10px] text-muted-foreground"></TableHead>
                      <TableHead className="font-sans text-[10px] text-muted-foreground">
                        [ID] Lead / Data
                      </TableHead>
                      {quizQuestions.map((q) => (
                        <TableHead key={q.id} className="font-sans text-[10px] text-muted-foreground">
                          Opções
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + quizQuestions.length} className="text-center py-12 text-muted-foreground font-sans">
                          Nenhum lead neste período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead, index) => {
                        const answers = (lead.quiz_answers || {}) as Record<string, string>;
                        return (
                          <TableRow key={lead.id} className="hover:bg-muted/30">
                            <TableCell className="font-sans text-xs text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-sans">
                              <div className="flex flex-col">
                                <span className="text-xs font-mono text-muted-foreground">{lead.id.slice(0, 6)}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </TableCell>
                            {quizQuestions.map((q) => {
                              const ans = answers[String(q.id)];
                              return (
                                <TableCell key={q.id} className="font-sans text-xs">
                                  {ans ? (
                                    <span className="text-foreground">{getAnswerLabel(ans)}</span>
                                  ) : (
                                    <span className="text-muted-foreground/40">—</span>
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

          {/* Leads Tab */}
          <TabsContent value="leads">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-sans">
                        Nenhum lead neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/30">
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
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            lead.status === "comprou" ? "bg-emerald-500/20 text-emerald-700" :
                            lead.status === "nao_comprou" ? "bg-destructive/20 text-destructive" :
                            "bg-amber-500/20 text-amber-700"
                          }`}>
                            {lead.status === "comprou" ? "Comprou" : lead.status === "nao_comprou" ? "Não Comprou" : "Aguardando"}
                          </span>
                        </TableCell>
                        <TableCell className="font-sans text-sm">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStepColor(lead.last_step)}`}>
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
                              className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-accent hover:underline"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Kanban Tab */}
          <TabsContent value="kanban">
            <KanbanBoard leads={contactLeads} onStatusChange={handleStatusChange} />
          </TabsContent>

          {/* Abandono Tab */}
          <TabsContent value="abandono">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-destructive/10 border border-destructive/20">
                <TrendingDown className="w-5 h-5 mb-2 text-destructive" />
                <p className="text-2xl font-sans font-bold text-destructive">{stats.quizDropoffRate}%</p>
                <p className="text-sm font-sans text-muted-foreground">Abandono no Quiz</p>
              </div>
              <div className="rounded-xl p-4 bg-destructive/10 border border-destructive/20">
                <TrendingDown className="w-5 h-5 mb-2 text-destructive" />
                <p className="text-2xl font-sans font-bold text-destructive">{stats.salesDropoffRate}%</p>
                <p className="text-sm font-sans text-muted-foreground">Abandono na Vendas</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-sans font-semibold text-foreground mb-4">Abandono por Etapa</p>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {stepOrder.map((step) => {
                  const stopped = stoppedAt[step] || 0;
                  const pct = ((stopped / totalFiltered) * 100).toFixed(1);
                  const isHigh = parseFloat(pct) > 15;
                  return (
                    <div key={step} className={`rounded-lg p-3 border text-center ${stopped === 0 ? "bg-muted/30 border-border" : isHigh ? "bg-destructive/10 border-destructive/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                      <p className={`text-lg font-sans font-bold ${stopped === 0 ? "text-muted-foreground" : isHigh ? "text-destructive" : "text-amber-700"}`}>{pct}%</p>
                      <p className="text-[10px] font-sans text-muted-foreground leading-tight mt-1">{getStepLabel(step)}</p>
                      <p className="text-[10px] font-sans text-muted-foreground/60">{stopped}</p>
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
