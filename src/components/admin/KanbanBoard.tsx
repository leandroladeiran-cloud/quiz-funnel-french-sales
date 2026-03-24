import { useState, type DragEvent } from "react";
import { type Lead, type LeadStatus, updateLeadStatus } from "@/lib/funnel-tracking";
import { GripVertical, FileText } from "lucide-react";
import { quizQuestions } from "@/components/quiz/QuizData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

const COLUMNS: { id: LeadStatus; label: string; bg: string; border: string; dot: string }[] = [
  { id: "aguardando", label: "Aguardando", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400" },
  { id: "comprou", label: "Comprou", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-400" },
  { id: "nao_comprou", label: "Não Comprou", bg: "bg-red-50", border: "border-red-100", dot: "bg-red-400" },
];

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
  imersao: "Imersão total",
  "3meses": "3 meses",
  "6meses": "6 meses",
  "1ano": "1 ano",
  sempressa: "Sem pressa",
};

const KanbanBoard = ({ leads, onStatusChange }: KanbanBoardProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent("Gostei do seu curso, quero comprar mas tenho dúvidas")}`, "_blank");
  };

  const handleDragStart = (e: DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = "move";
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

  const sheetAnswers = selectedLead ? ((selectedLead.quiz_answers || {}) as Record<string, string>) : {};

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border ${col.border} ${col.bg} p-4 min-h-[200px] transition-all ${
                isOver ? "ring-2 ring-gray-300 scale-[1.005]" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h3 className="font-sans font-semibold text-gray-700 text-[13px]">{col.label}</h3>
                </div>
                <span className="text-[11px] font-sans bg-white/80 rounded-full px-2 py-0.5 text-gray-400 font-medium">
                  {colLeads.length}
                </span>
              </div>

              <div className="space-y-2">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                    className={`bg-white border border-gray-100 rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all ${
                      draggedId === lead.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-medium text-gray-900 text-[13px] truncate">{lead.name || "Anônimo"}</p>
                        <p className="font-sans text-gray-400 text-[11px] truncate">{lead.email}</p>
                        <p className="font-sans text-gray-400 text-[11px]">{lead.phone}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                          className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Ver respostas do quiz"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {lead.phone && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone!); }}
                            className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <p className="text-[11px] text-gray-300 font-sans text-center py-8">
                    Arraste leads aqui
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-sans text-lg">{selectedLead?.name || "Anônimo"}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Lead info */}
            <div className="space-y-2">
              <p className="text-[11px] font-sans font-semibold text-gray-400 uppercase tracking-wide">Informações</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[12px] font-sans text-gray-400">E-mail</span>
                  <span className="text-[12px] font-sans font-medium text-gray-700">{selectedLead?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] font-sans text-gray-400">Telefone</span>
                  <span className="text-[12px] font-sans font-medium text-gray-700">{selectedLead?.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] font-sans text-gray-400">Parou em</span>
                  <span className="text-[12px] font-sans font-medium text-gray-700">{selectedLead?.last_step || "—"}</span>
                </div>
              </div>
            </div>

            {/* Quiz answers */}
            <div className="space-y-2">
              <p className="text-[11px] font-sans font-semibold text-gray-400 uppercase tracking-wide">Respostas do Quiz</p>
              {Object.keys(sheetAnswers).length > 0 ? (
                <div className="space-y-2">
                  {quizQuestions.map((q) => {
                    const answer = sheetAnswers[String(q.id)];
                    if (!answer) return null;
                    return (
                      <div key={q.id} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-[11px] font-sans text-gray-400 leading-tight">{q.question}</p>
                        <p className="text-[13px] font-sans font-medium text-gray-800 mt-1">
                          {ANSWER_LABELS[answer] || answer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] font-sans text-gray-300 italic py-4">Nenhuma resposta registrada</p>
              )}
            </div>

            {/* WhatsApp CTA */}
            {selectedLead?.phone && (
              <button
                onClick={() => openWhatsApp(selectedLead.phone!)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-sans font-medium text-[13px] rounded-xl py-3 hover:bg-emerald-600 transition-colors"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 brightness-0 invert" />
                Entrar em contato via WhatsApp
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default KanbanBoard;