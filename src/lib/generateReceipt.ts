import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/dateUtils";

interface ReceiptData {
  clientName: string;
  clientCpf: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  paymentDate: string;
  amountDue: number;
  amountPaid: number;
  fine: number;
  paymentMethod: string;
  contractId?: string;
  operatorName?: string;
  companyName?: string;
}

export function generatePaymentReceipt(data: ReceiptData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const companyName = data.companyName || "Credifacil";
  
  // Header
  doc.setFillColor(45, 45, 45);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 200, 50);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 20, 25);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("COMPROVANTE DE PAGAMENTO", pageWidth - 20, 25, { align: "right" });
  
  // Receipt number and date
  const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`Nº: ${receiptNumber}`, pageWidth - 20, 35, { align: "right" });
  
  // Client info section
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Cliente", 20, 55);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.clientName}`, 20, 65);
  doc.text(`CPF: ${data.clientCpf}`, 20, 73);
  if (data.contractId) {
    doc.text(`Contrato: ${data.contractId}`, 20, 81);
  }
  
  // Payment details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Pagamento", 20, 100);
  
  const paymentDetails = [
    ["Parcela", `${data.installmentNumber}/${data.totalInstallments}`],
    ["Vencimento", format(parseLocalDate(data.dueDate), "dd/MM/yyyy", { locale: ptBR })],
    ["Data do Pagamento", format(parseLocalDate(data.paymentDate), "dd/MM/yyyy", { locale: ptBR })],
    ["Forma de Pagamento", data.paymentMethod.toUpperCase()],
    ["Valor da Parcela", formatCurrency(data.amountDue)],
  ];
  
  if (data.fine > 0) {
    paymentDetails.push(["Multa/Juros", formatCurrency(data.fine)]);
  }
  
  paymentDetails.push(["VALOR PAGO", formatCurrency(data.amountPaid)]);
  
  autoTable(doc, {
    body: paymentDetails,
    startY: 108,
    theme: "plain",
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 100, 100], cellWidth: 80 },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === paymentDetails.length - 1) {
        data.cell.styles.fontSize = 14;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [45, 150, 50];
      }
    },
  });
  
  // Status badge
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFillColor(45, 150, 50);
  doc.roundedRect(pageWidth / 2 - 40, finalY, 80, 25, 5, 5, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PAGO", pageWidth / 2, finalY + 16, { align: "center" });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    20,
    footerY
  );
  
  if (data.operatorName) {
    doc.text(`Operador: ${data.operatorName}`, pageWidth - 20, footerY, { align: "right" });
  }
  
  doc.text(
    "Este documento é um comprovante de pagamento. Guarde-o para sua segurança.",
    pageWidth / 2,
    footerY + 10,
    { align: "center" }
  );
  
  // Save
  doc.save(`recibo_${data.clientName.replace(/\s+/g, "_")}_parcela${data.installmentNumber}.pdf`);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Generate contract PDF
interface ContractPDFData {
  contractId: string;
  clientName: string;
  clientCpf: string;
  clientAddress?: string;
  capital: number;
  interestRate: number;
  installments: number;
  installmentValue: number;
  totalAmount: number;
  frequency: string;
  startDate: string;
  firstDueDate: string;
  companyName?: string;
  operatorName?: string;
}

export function generateContractPDF(data: ContractPDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const companyName = data.companyName || "Credifacil";
  
  // Header
  doc.setFillColor(45, 45, 45);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(255, 200, 50);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 20, 22);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`Contrato: ${data.contractId}`, pageWidth - 20, 22, { align: "right" });
  
  // Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATO DE EMPRÉSTIMO", pageWidth / 2, 50, { align: "center" });
  
  // Client info
  doc.setFontSize(12);
  doc.text("DADOS DO CLIENTE", 20, 70);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.clientName}`, 20, 80);
  doc.text(`CPF: ${data.clientCpf}`, 20, 88);
  if (data.clientAddress) {
    doc.text(`Endereço: ${data.clientAddress}`, 20, 96);
  }
  
  // Loan details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES DO EMPRÉSTIMO", 20, 115);
  
  const loanDetails = [
    ["Capital Emprestado", formatCurrency(data.capital)],
    ["Taxa de Juros", `${data.interestRate}% ao mês`],
    ["Número de Parcelas", `${data.installments}x`],
    ["Valor da Parcela", formatCurrency(data.installmentValue)],
    ["Valor Total", formatCurrency(data.totalAmount)],
    ["Frequência", data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1)],
    ["Data de Início", format(new Date(data.startDate), "dd/MM/yyyy", { locale: ptBR })],
    ["Primeiro Vencimento", format(new Date(data.firstDueDate), "dd/MM/yyyy", { locale: ptBR })],
  ];
  
  autoTable(doc, {
    body: loanDetails,
    startY: 122,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right" },
    },
    headStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Terms
  const termsY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TERMOS E CONDIÇÕES:", 20, termsY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const terms = [
    "1. O pagamento das parcelas deve ser realizado até a data de vencimento.",
    "2. Em caso de atraso, será cobrada multa de 2% + juros de 1% ao dia.",
    "3. O não pagamento pode resultar em negativação do CPF.",
    "4. A quitação antecipada é permitida com desconto proporcional dos juros.",
  ];
  
  let y = termsY + 8;
  terms.forEach((term) => {
    doc.text(term, 20, y);
    y += 7;
  });
  
  // Signatures
  const sigY = doc.internal.pageSize.getHeight() - 50;
  
  doc.setDrawColor(100, 100, 100);
  doc.line(20, sigY, 90, sigY);
  doc.line(pageWidth - 90, sigY, pageWidth - 20, sigY);
  
  doc.setFontSize(9);
  doc.text("Assinatura do Cliente", 55, sigY + 8, { align: "center" });
  doc.text("Assinatura do Credor", pageWidth - 55, sigY + 8, { align: "center" });
  
  // Footer
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );
  
  // Save
  doc.save(`contrato_${data.contractId}.pdf`);
}
