import { useState, useEffect } from "react";
import { getFunnelStats, getLeads, getLeadStatuses, type Lead, type LeadStatus } from "@/lib/funnel-tracking";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Users, MousePointerClick, ShoppingCart, TrendingDown, MessageCircle } from "lucide-react";
import KanbanBoard from "@/components/admin/KanbanBoard";

const Admin = () => {
  const [stats, setStats] = useState(getFunnelStats());
  const [leads, setLeads] = useState<Lead[]>([]);

  const loadLeads = () => {
    const statuses = getLeadStatuses();
    const allLeads = getLeads()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((l) => ({ ...l, status: (statuses[l.id] || l.status || "aguardando") as LeadStatus }));
    setLeads(allLeads);
  };

  useEffect(() => {
    setStats(getFunnelStats());
    loadLeads();
  }, []);

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const message = encodeURIComponent("Gostei do seu curso, quero comprar mas tenho dúvidas");
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

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

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground font-sans mb-8">Analytics do funil e leads capturados</p>

        {/* Funnel Stats */}
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

        {/* Dropoff */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {dropoffCards.map((card) => (
            <div key={card.label} className="rounded-xl p-4 bg-destructive/10 border border-destructive/20">
              <card.icon className="w-5 h-5 mb-2 text-destructive" />
              <p className="text-2xl font-display font-bold text-destructive">{card.pct}</p>
              <p className="text-sm font-sans text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Kanban de Leads ({leads.length})
        </h2>
        <div className="mb-10">
          <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
        </div>

        {/* Leads Table */}
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Tabela de Leads
        </h2>

        {leads.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sans">Nenhum lead capturado ainda.</p>
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
                  <TableHead className="font-sans">Data</TableHead>
                  <TableHead className="font-sans text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openWhatsApp(lead.phone)}>
                    <TableCell className="font-sans font-semibold text-foreground">{lead.name}</TableCell>
                    <TableCell className="font-sans text-muted-foreground">{lead.email}</TableCell>
                    <TableCell className="font-sans text-muted-foreground">{lead.phone}</TableCell>
                    <TableCell className="font-sans text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        lead.status === "comprou" ? "bg-emerald-500/20 text-emerald-700" :
                        lead.status === "nao_comprou" ? "bg-destructive/20 text-destructive" :
                        "bg-amber-500/20 text-amber-700"
                      }`}>
                        {lead.status === "comprou" ? "Comprou" : lead.status === "nao_comprou" ? "Não Comprou" : "Aguardando"}
                      </span>
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground text-sm">
                      {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone); }}
                        className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-accent hover:underline"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
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
