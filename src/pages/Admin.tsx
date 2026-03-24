import { useState, useEffect, useMemo } from "react";
import { getFunnelStats, getLeads, type Lead, type LeadStatus } from "@/lib/funnel-tracking";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Users, MousePointerClick, ShoppingCart, TrendingDown, MessageCircle, MapPin, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import KanbanBoard from "@/components/admin/KanbanBoard";

const STEP_LABELS: Record<string, string> = {
  landing: "Landing Page",
  quiz_pergunta_1: "Quiz — Pergunta 1",
  quiz_pergunta_2: "Quiz — Pergunta 2",
  quiz_pergunta_3: "Quiz — Pergunta 3",
  quiz_pergunta_4: "Quiz — Pergunta 4",
  quiz_pergunta_5: "Quiz — Pergunta 5",
  resultado: "Resultado do Quiz",
  pagina_vendas: "Página de Vendas",
  pre_checkout: "Pré-Checkout (dados preenchidos)",
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

type PresetRange = "24h" | "7d" | "30d" | "custom";

const Admin = () => {
  const [stats, setStats] = useState<ReturnType<typeof getFunnelStats> extends Promise<infer T> ? T : never | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filter state
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
    // custom
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

  // Per-question abandonment: count leads whose last_step is each stage
  const stepOrder = ["landing", "quiz_pergunta_1", "quiz_pergunta_2", "quiz_pergunta_3", "quiz_pergunta_4", "quiz_pergunta_5", "resultado", "pagina_vendas", "pre_checkout"];
  const stoppedAt: Record<string, number> = {};
  for (const step of stepOrder) {
    stoppedAt[step] = filteredLeads.filter((l) => l.last_step === step).length;
  }
  const totalFiltered = filteredLeads.length || 1;

  const questionDropoffs = [
    { label: "Landing", stopped: stoppedAt["landing"], pct: ((stoppedAt["landing"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pergunta 1", stopped: stoppedAt["quiz_pergunta_1"], pct: ((stoppedAt["quiz_pergunta_1"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pergunta 2", stopped: stoppedAt["quiz_pergunta_2"], pct: ((stoppedAt["quiz_pergunta_2"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pergunta 3", stopped: stoppedAt["quiz_pergunta_3"], pct: ((stoppedAt["quiz_pergunta_3"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pergunta 4", stopped: stoppedAt["quiz_pergunta_4"], pct: ((stoppedAt["quiz_pergunta_4"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pergunta 5", stopped: stoppedAt["quiz_pergunta_5"], pct: ((stoppedAt["quiz_pergunta_5"] / totalFiltered) * 100).toFixed(1) },
    { label: "Resultado", stopped: stoppedAt["resultado"], pct: ((stoppedAt["resultado"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pág. Vendas", stopped: stoppedAt["pagina_vendas"], pct: ((stoppedAt["pagina_vendas"] / totalFiltered) * 100).toFixed(1) },
    { label: "Pré-Checkout", stopped: stoppedAt["pre_checkout"], pct: ((stoppedAt["pre_checkout"] / totalFiltered) * 100).toFixed(1) },
  ];

  const statCards = [
    { label: "Page Views", value: stats.pageViews, pct: "100%", icon: BarChart3, color: "bg-primary text-primary-foreground" },
    { label: "Iniciaram Quiz", value: stats.quizStarts, pct: `${stats.quizStartRate}%`, icon: MousePointerClick, color: "bg-accent/20 text-accent-foreground" },
    { label: "Completaram Quiz", value: stats.quizCompletes, pct: `${stats.quizCompleteRate}%`, icon: Users, color: "bg-accent/20 text-accent-foreground" },
    { label: "Viram Vendas", value: stats.salesViews, pct: `${stats.salesViewRate}%`, icon: ShoppingCart, color: "bg-accent/20 text-accent-foreground" },
    { label: "Pré-Checkouts", value: stats.preCheckouts, pct: `${stats.preCheckoutRate}%`, icon: ShoppingCart, color: "bg-accent text-accent-foreground" },
  ];

  const dropoffCards = [
    { label: "Abandono no Quiz", pct: `${stats.quizDropoffRate}%`, icon: TrendingDown },
    { label: "Abandono na Vendas", pct: `${stats.salesDropoffRate}%`, icon: TrendingDown },
  ];

  const presetButtons: { label: string; value: PresetRange }[] = [
    { label: "24h", value: "24h" },
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "Personalizado", value: "custom" },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground font-sans mb-6">Analytics do funil e leads capturados</p>

        {/* Date Filter */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8">
          <p className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Filtrar por período
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {presetButtons.map((btn) => (
              <Button
                key={btn.value}
                variant={preset === btn.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(btn.value)}
                className="font-sans"
              >
                {btn.label}
              </Button>
            ))}

            {preset === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("font-sans", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {customFrom ? format(customFrom, "dd/MM/yyyy") : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customFrom}
                      onSelect={setCustomFrom}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-sm">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("font-sans", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {customTo ? format(customTo, "dd/MM/yyyy") : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customTo}
                      onSelect={setCustomTo}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-2">
            Mostrando {filteredLeads.length} lead(s) de {format(dateRange.from, "dd/MM/yyyy")} a {format(dateRange.to, "dd/MM/yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-xl p-4 ${card.color} border border-border`}>
              <card.icon className="w-5 h-5 mb-2 opacity-70" />
              <p className="text-2xl font-display font-bold">{card.value}</p>
              <p className="text-xs font-sans opacity-70">{card.label}</p>
              <p className="text-sm font-sans font-semibold mt-1">{card.pct}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {dropoffCards.map((card) => (
            <div key={card.label} className="rounded-xl p-4 bg-destructive/10 border border-destructive/20">
              <card.icon className="w-5 h-5 mb-2 text-destructive" />
              <p className="text-2xl font-display font-bold text-destructive">{card.pct}</p>
              <p className="text-sm font-sans text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Kanban de Leads ({contactLeads.length})
        </h2>
        <div className="mb-10">
          <KanbanBoard leads={contactLeads} onStatusChange={handleStatusChange} />
        </div>

        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Todos os Leads ({filteredLeads.length})
        </h2>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sans">Nenhum lead neste período.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Nome</TableHead>
                  <TableHead className="font-sans">E-mail</TableHead>
                  <TableHead className="font-sans">Telefone</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans">Parou em</TableHead>
                  <TableHead className="font-sans">Data</TableHead>
                  <TableHead className="font-sans text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell className="font-sans font-semibold text-foreground">
                      {lead.name || <span className="text-muted-foreground italic text-xs">Anônimo</span>}
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">
                      {lead.email || <span className="italic text-xs">—</span>}
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">
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
                        <span className="text-xs text-muted-foreground italic">Sem telefone</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
