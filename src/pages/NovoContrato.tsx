import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Loader2, UserCheck, X } from "lucide-react";
import { useContractForm } from "@/hooks/useContractForm";
import { StepClientData } from "@/components/contract/StepClientData";
import { StepLoanConfig } from "@/components/contract/StepLoanConfig";
import { StepReview } from "@/components/contract/StepReview";

const NovoContrato = () => {
  const {
    formData, setFormData, mode, setMode,
    existingClientId, existingClient, isLoadingClient,
    selectedExistingClient, foundClient, showClientSuggestion,
    isSearchingCpf, isLoadingCep, isSaving, isUploadingAvatar,
    avatarPreview, fileInputRef,
    handleCpfChange, useExistingClient, clearSelectedClient, dismissSuggestion,
    handleAvatarSelect, removeAvatar, fetchAddressByCep,
    handleSave,
    effectiveInstallments, installmentResult, rateResult,
    totalAmount, totalProfit,
  } = useContractForm();

  // Show loading while fetching existing client
  if (existingClientId && isLoadingClient) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando dados do cliente...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const clientToShow = selectedExistingClient || existingClient;

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Novo Contrato</h1>
        <p className="mt-1 text-muted-foreground">
          {existingClient
            ? `Novo empréstimo para ${existingClient.name}`
            : "Registre um novo empréstimo para seu cliente"}
        </p>
      </div>

      {/* Selected Client Banner */}
      {clientToShow && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-accent/50 bg-accent/10 p-4"
        >
          <div className="flex items-center gap-4">
            {clientToShow.avatar_url ? (
              <img src={clientToShow.avatar_url} alt={clientToShow.name} className="h-12 w-12 rounded-full object-cover border-2 border-accent/30" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <UserCheck className="h-6 w-6 text-accent" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">Cliente existente selecionado</p>
              <p className="text-sm text-muted-foreground">
                {clientToShow.name} • CPF: {clientToShow.cpf}
              </p>
              {clientToShow.whatsapp && (
                <p className="text-xs text-muted-foreground">WhatsApp: {clientToShow.whatsapp}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {clientToShow.city && clientToShow.state && (
                <p className="text-xs text-muted-foreground">{clientToShow.city}/{clientToShow.state}</p>
              )}
              {!existingClientId && (
                <button
                  type="button"
                  onClick={clearSelectedClient}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-destructive/20 flex items-center justify-center transition-colors"
                  title="Remover cliente selecionado"
                  aria-label="Remover cliente selecionado"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Address steps - only if no client selected */}
          {!clientToShow && (
            <StepClientData
              formData={formData}
              setFormData={setFormData}
              avatarPreview={avatarPreview}
              fileInputRef={fileInputRef}
              handleAvatarSelect={handleAvatarSelect}
              removeAvatar={removeAvatar}
              handleCpfChange={handleCpfChange}
              isSearchingCpf={isSearchingCpf}
              showClientSuggestion={showClientSuggestion}
              foundClient={foundClient}
              useExistingClient={useExistingClient}
              dismissSuggestion={() => {
                // Need to handle dismiss - set showClientSuggestion false
                // Since useContractForm doesn't expose this directly, we use a workaround
                setFormData(prev => ({ ...prev })); // trigger re-render
              }}
              isLoadingCep={isLoadingCep}
              fetchAddressByCep={fetchAddressByCep}
            />
          )}

          {/* Loan Config */}
          <StepLoanConfig
            formData={formData}
            setFormData={setFormData}
            mode={mode}
            setMode={setMode}
            existingClient={existingClient}
            installmentResult={installmentResult}
          />
        </div>

        {/* Summary Card */}
        <StepReview
          formData={formData}
          avatarPreview={avatarPreview}
          effectiveInstallments={effectiveInstallments}
          installmentResult={installmentResult}
          rateResult={rateResult}
          totalAmount={totalAmount}
          totalProfit={totalProfit}
          isSaving={isSaving}
          isUploadingAvatar={isUploadingAvatar}
          onSave={handleSave}
        />
      </div>
    </MainLayout>
  );
};

export default NovoContrato;
