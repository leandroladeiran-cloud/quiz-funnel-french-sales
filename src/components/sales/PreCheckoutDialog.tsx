import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLead, trackEvent } from "@/lib/funnel-tracking";
import { CheckCircle } from "lucide-react";

interface PreCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PreCheckoutDialog = ({ open, onOpenChange }: PreCheckoutDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    await saveLead({ name: name.trim(), email: email.trim(), phone: phone.trim(), status: "aguardando" });
    await trackEvent("pre_checkout");
    setSubmitted(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setName("");
      setEmail("");
      setPhone("");
      setSubmitted(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-display text-foreground">
                Obrigado, {name.split(" ")[0]}! 🎉
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-sans mt-2">
                Seus dados foram registrados. Em breve você será redirecionado para o pagamento.
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display text-foreground">
                Quase lá! 🇫🇷
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-sans">
                Preencha seus dados para garantir sua vaga com o preço especial.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-sans">Nome completo</Label>
                <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-sans">WhatsApp / Telefone</Label>
                <Input id="phone" type="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
              </div>
              <button type="submit" className="w-full py-3 bg-accent text-accent-foreground font-sans font-bold text-lg rounded-lg hover:brightness-110 transition-all">
                Garantir Minha Vaga →
              </button>
              <p className="text-xs text-muted-foreground text-center font-sans">
                🔒 Seus dados estão seguros e não serão compartilhados.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PreCheckoutDialog;
