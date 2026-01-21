import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface LoanContractData {
  contractId: string;
  creditorName: string;
  clientName: string;
  clientCpf: string;
  startDate: string;
  capital: number;
  installments: number;
  installmentValue: number;
  frequency: string;
  firstDueDate: string;
  finePercentage: number;
  dailyInterestRate: number;
  city?: string;
  state?: string;
}

const frequencyLabels: Record<string, string> = {
  diario: "diária",
  semanal: "semanal",
  quinzenal: "quinzenal",
  mensal: "mensal",
};

const frequencyDayLabels: Record<string, string> = {
  diario: "todos os dias",
  semanal: "toda",
  quinzenal: "a cada 15 dias",
  mensal: "todo dia",
};

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const days = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  return days[date.getDay()];
}

function getDayOfMonth(dateStr: string): number {
  const date = new Date(dateStr + "T12:00:00");
  return date.getDate();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCurrencyWords(value: number): string {
  return formatCurrency(value).replace("R$", "R$").trim();
}

export function generateLoanContractPDF(data: LoanContractData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let y = 30;
  const lineHeight = 8;
  
  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATO DE EMPRÉSTIMO PESSOAL", pageWidth / 2, y, { align: "center" });
  y += lineHeight * 2;
  
  // Contract content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const addField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, marginLeft, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    doc.text(value, marginLeft + labelWidth, y);
    y += lineHeight;
  };
  
  // Credor
  addField("Credor", data.creditorName);
  y += 4;
  
  // Devedor
  addField("Devedor", `${data.clientName}, CPF ${data.clientCpf}`);
  y += 4;
  
  // Data inicial
  const startDateFormatted = format(new Date(data.startDate + "T12:00:00"), "dd/MM/yy", { locale: ptBR });
  addField("Data inicial", startDateFormatted);
  y += 4;
  
  // Valor do Empréstimo
  addField("Valor do Empréstimo", formatCurrency(data.capital));
  y += 4;
  
  // Parcelamento
  const frequencyLabel = frequencyLabels[data.frequency] || data.frequency;
  const installmentText = `${data.installments} parcela${data.installments > 1 ? "s" : ""} ${frequencyLabel}${data.installments > 1 ? "s" : ""} de ${formatCurrency(data.installmentValue)}`;
  addField("Parcelamento", installmentText);
  y += 4;
  
  // Vencimento
  let vencimentoText = "";
  if (data.frequency === "semanal") {
    const dayOfWeek = getDayOfWeek(data.firstDueDate);
    vencimentoText = `Toda ${dayOfWeek}`;
  } else if (data.frequency === "mensal") {
    const dayOfMonth = getDayOfMonth(data.firstDueDate);
    vencimentoText = `Todo dia ${dayOfMonth}`;
  } else if (data.frequency === "diario") {
    vencimentoText = "Todos os dias úteis";
  } else if (data.frequency === "quinzenal") {
    const dayOfMonth = getDayOfMonth(data.firstDueDate);
    vencimentoText = `A cada 15 dias (iniciando dia ${dayOfMonth})`;
  }
  addField("Vencimento", vencimentoText);
  y += 4;
  
  // Horário pagamento
  addField("Horário pagamento", "09:00 às 18:00");
  y += 4;
  
  // Multa por Atraso
  const fineText = `${data.finePercentage}% + ${data.dailyInterestRate}% ao dia`;
  addField("Multa por Atraso", fineText);
  y += 4;
  
  // Garantia
  addField("Garantia", "Sem garantia");
  y += 4;
  
  // Foro
  const foroText = data.city && data.state ? `${data.city}/${data.state}` : "São Paulo/SP";
  doc.setFont("helvetica", "normal");
  doc.text(`Foro: ${foroText}`, marginLeft, y);
  y += lineHeight * 2;
  
  // Closing text
  doc.text("Firmam este contrato em duas vias de igual teor.", marginLeft, y);
  y += lineHeight * 2;
  
  // Date and location
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const location = data.city || "São Paulo";
  doc.setFont("helvetica", "bold");
  doc.text(`${location}, ${currentDate}`, marginLeft, y);
  y += lineHeight * 4;
  
  // Signature lines
  const signatureY = y + 20;
  doc.setDrawColor(100, 100, 100);
  
  // Client signature
  doc.line(marginLeft, signatureY, marginLeft + 70, signatureY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Devedor", marginLeft + 35, signatureY + 6, { align: "center" });
  
  // Creditor signature
  doc.line(pageWidth - marginRight - 70, signatureY, pageWidth - marginRight, signatureY);
  doc.text("Credor", pageWidth - marginRight - 35, signatureY + 6, { align: "center" });
  
  // Footer with contract ID
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Contrato ID: ${data.contractId.substring(0, 8).toUpperCase()}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
  
  // Return as Blob instead of saving
  return doc.output("blob");
}

// Convenience function to download the PDF
export function downloadLoanContractPDF(data: LoanContractData): void {
  const blob = generateLoanContractPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contrato_${data.clientName.replace(/\s+/g, "_")}_${data.contractId.substring(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
