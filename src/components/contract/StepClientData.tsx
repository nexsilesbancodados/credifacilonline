import { motion } from "framer-motion";
import { Camera, X, Loader2, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskPhone, maskCEP } from "@/lib/masks";
import { CpfSearchResult } from "./CpfSearchResult";
import { ContractFormData } from "@/hooks/useContractForm";
import { Client } from "@/hooks/useClients";
import { MapPin } from "lucide-react";

interface StepClientDataProps {
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  avatarPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAvatar: () => void;
  handleCpfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearchingCpf: boolean;
  showClientSuggestion: boolean;
  foundClient: Client | null;
  useExistingClient: (client: Client) => void;
  dismissSuggestion: () => void;
  isLoadingCep: boolean;
  fetchAddressByCep: (cep: string) => void;
}

export function StepClientData({
  formData, setFormData, avatarPreview, fileInputRef,
  handleAvatarSelect, removeAvatar, handleCpfChange,
  isSearchingCpf, showClientSuggestion, foundClient,
  useExistingClient, dismissSuggestion, isLoadingCep, fetchAddressByCep,
}: StepClientDataProps) {
  return (
    <>
      {/* Step 1: Client Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Dados do Cliente</h2>
            <p className="text-sm text-muted-foreground">Informações pessoais do cliente</p>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" id="avatar-upload" />
            {avatarPreview ? (
              <div className="relative">
                <img src={avatarPreview} alt="Preview" className="h-28 w-28 rounded-full object-cover border-4 border-primary/30" />
                <button type="button" onClick={removeAvatar} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors" aria-label="Remover foto">
                  <X className="h-4 w-4" />
                </button>
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors" aria-label="Trocar foto">
                  <Camera className="h-5 w-5" />
                </label>
              </div>
            ) : (
              <label htmlFor="avatar-upload" className="flex flex-col items-center justify-center h-28 w-28 rounded-full border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Foto</span>
              </label>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Nome Completo *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="João da Silva" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">CPF * <span className="text-xs text-accent">(digite para buscar cliente)</span></label>
            <div className="relative">
              <input type="text" value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14} className={cn("h-11 w-full rounded-xl border bg-secondary/50 px-4 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1", showClientSuggestion ? "border-accent focus:border-accent focus:ring-accent" : "border-border focus:border-primary focus:ring-primary")} />
              {isSearchingCpf && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
              {!isSearchingCpf && formData.cpf.replace(/\D/g, "").length === 11 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Search className="h-4 w-4 text-muted-foreground" /></div>}
            </div>
            <CpfSearchResult show={showClientSuggestion} foundClient={foundClient} onUseClient={useExistingClient} onDismiss={dismissSuggestion} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">E-mail</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="joao@email.com" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">WhatsApp</label>
            <input type="text" value={formData.whatsapp} onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </motion.div>

      {/* Step 2: Address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">2</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Endereço</h2>
            <p className="text-sm text-muted-foreground">Localização do cliente</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">CEP</label>
            <div className="relative">
              <input type="text" value={formData.cep} onChange={(e) => { const masked = maskCEP(e.target.value); setFormData(prev => ({ ...prev, cep: masked })); const clean = masked.replace(/\D/g, ""); if (clean.length === 8) fetchAddressByCep(clean); }} placeholder="00000-000" maxLength={9} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              {isLoadingCep && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Rua</label>
            <input type="text" value={formData.street} onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))} placeholder="Rua das Flores" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Número</label>
            <input type="text" value={formData.number} onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))} placeholder="123" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Bairro</label>
            <input type="text" value={formData.neighborhood} onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))} placeholder="Centro" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Cidade</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="São Paulo" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Estado</label>
            <input type="text" value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="SP" maxLength={2} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Complemento</label>
            <input type="text" value={formData.complement} onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))} placeholder="Apto 101, Bloco B" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </motion.div>
    </>
  );
}
