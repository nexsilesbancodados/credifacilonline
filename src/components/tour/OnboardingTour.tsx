import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    title: "Bem-vindo ao CreditWise! 🎉",
    description:
      "Este é o seu sistema completo de gestão de empréstimos. Vamos fazer um tour rápido para você conhecer as principais funcionalidades.",
  },
  {
    title: "Dashboard",
    description:
      "Aqui você tem uma visão geral da sua carteira: clientes ativos, parcelas pendentes, receitas e metas do mês.",
    target: "dashboard",
  },
  {
    title: "Clientes",
    description:
      "Gerencie todos os seus clientes, veja o score de cada um, envie cobranças via WhatsApp e acompanhe o histórico de pagamentos.",
    target: "clientes",
  },
  {
    title: "Contratos",
    description:
      "Crie novos contratos com cálculo automático de parcelas e juros. O sistema gera o cronograma completo para você.",
    target: "contratos",
  },
  {
    title: "Mesa de Cobrança",
    description:
      "Visualize todas as parcelas pendentes e atrasadas. Use a IA para gerar mensagens de cobrança personalizadas.",
    target: "cobranca",
  },
  {
    title: "Busca Rápida",
    description:
      "Use Ctrl+K (ou Cmd+K) a qualquer momento para buscar clientes e contratos rapidamente.",
  },
  {
    title: "Tudo pronto!",
    description:
      "Você está pronto para começar! Se precisar de ajuda, clique no ícone de configurações para mais opções.",
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has already completed the tour
    const tourCompleted = localStorage.getItem("onboarding_tour_completed");
    if (tourCompleted) {
      setHasCompleted(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_tour_completed", "true");
    setHasCompleted(true);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_tour_completed", "true");
    onClose();
  };

  if (!isOpen || hasCompleted) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        />

        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Passo {currentStep + 1} de {tourSteps.length}
                  </p>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {step.title}
                  </h2>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === currentStep
                        ? "w-6 bg-primary"
                        : index < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-secondary"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground leading-relaxed"
              >
                {step.description}
              </motion.p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/20">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular tour
              </button>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrev}
                    className="flex items-center gap-1 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-xl bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground shadow-gold hover:shadow-gold-lg transition-all"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4" />
                      Começar
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook to manage tour state
export function useOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem("onboarding_tour_completed");
    if (!tourCompleted) {
      // Delay showing the tour by 1 second for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem("onboarding_tour_completed");
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    resetTour,
  };
}
