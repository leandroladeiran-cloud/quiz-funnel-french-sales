import { useState, type DragEvent } from "react";
import { type Lead, type LeadStatus, updateLeadStatus } from "@/lib/funnel-tracking";
import { MessageCircle, GripVertical } from "lucide-react";

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

const COLUMNS: { id: LeadStatus; label: string; color: string; borderColor: string }[] = [
  { id: "aguardando", label: "Aguardando", color: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  { id: "comprou", label: "Comprou ✅", color: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  { id: "nao_comprou", label: "Não Comprou ❌", color: "bg-destructive/10", borderColor: "border-destructive/30" },
];

const KanbanBoard = ({ leads, onStatusChange }: KanbanBoardProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const message = encodeURIComponent("Gostei do seu curso, quero comprar mas tenho dúvidas");
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  const handleDragStart = (e: DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, colId: LeadStatus) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDrop = async (e: DragEvent, colId: LeadStatus) => {
    e.preventDefault();
    if (draggedId) {
      await updateLeadStatus(draggedId, colId);
      onStatusChange(draggedId, colId);
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.id);
        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-xl border-2 ${col.borderColor} ${col.color} p-3 min-h-[200px] transition-all ${
              isOver ? "ring-2 ring-primary/50 scale-[1.01]" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sans font-bold text-foreground text-sm">{col.label}</h3>
              <span className="text-xs font-sans bg-background/60 rounded-full px-2 py-0.5 text-muted-foreground">
                {colLeads.length}
              </span>
            </div>

            <div className="space-y-2">
              {colLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-opacity ${
                    draggedId === lead.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-semibold text-foreground text-sm truncate">{lead.name}</p>
                      <p className="font-sans text-muted-foreground text-xs truncate">{lead.email}</p>
                      <p className="font-sans text-muted-foreground text-xs">{lead.phone}</p>
                    </div>
                    <button
                      onClick={() => openWhatsApp(lead.phone)}
                      className="shrink-0 text-accent hover:text-accent/80"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {colLeads.length === 0 && (
                <p className="text-xs text-muted-foreground font-sans text-center py-6 opacity-50">
                  Arraste leads aqui
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
