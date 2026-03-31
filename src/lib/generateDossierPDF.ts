import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/dateUtils";

interface ClientData {
  name: string;
  cpf: string;
  email?: string;
  whatsapp?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  status: string;
}

interface ContractData {
  id: string;
  capital: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  total_profit: number;
  frequency: string;
  start_date: string;
  first_due_date: string;
  status: string;
}

interface InstallmentData {
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid?: number;
  status: string;
  payment_date?: string;
  fine?: number;
}

interface ActivityData {
  type: string;
  description: string;
  created_at: string;
}

interface DossierData {
  client: ClientData;
  contract?: ContractData;
  installments: InstallmentData[];
  activities: ActivityData[];
  score?: number;
}

export const generateClientDossierPDF = (data: DossierData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Dossiê do Cliente", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 15;

  // Client Info Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Cliente", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const clientInfo = [
    ["Nome", data.client.name],
    ["CPF", data.client.cpf],
    ["Status", data.client.status],
    ["E-mail", data.client.email || "Não informado"],
    ["WhatsApp", data.client.whatsapp || "Não informado"],
  ];

  if (data.client.street) {
    const address = `${data.client.street}, ${data.client.number || "S/N"} ${
      data.client.complement ? `- ${data.client.complement}` : ""
    }, ${data.client.neighborhood || ""} - ${data.client.city || ""}/${
      data.client.state || ""
    } - CEP: ${data.client.cep || ""}`;
    clientInfo.push(["Endereço", address]);
  }

  if (data.score !== undefined) {
    clientInfo.push(["Score de Pagamento", `${data.score}%`]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: clientInfo,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: "auto" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Contract Info Section (if exists)
  if (data.contract) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Contrato", 14, yPos);
    yPos += 8;

    const frequencyMap: Record<string, string> = {
      diario: "Diário",
      semanal: "Semanal",
      quinzenal: "Quinzenal",
      mensal: "Mensal",
    };

    const contractInfo = [
      ["Nº Contrato", data.contract.id.slice(0, 8).toUpperCase()],
      ["Status", data.contract.status],
      ["Capital", formatCurrency(data.contract.capital)],
      ["Taxa de Juros", `${data.contract.interest_rate.toFixed(2)}%`],
      ["Parcelas", `${data.contract.installments}x de ${formatCurrency(data.contract.installment_value)}`],
      ["Total", formatCurrency(data.contract.total_amount)],
      ["Lucro", formatCurrency(data.contract.total_profit)],
      ["Frequência", frequencyMap[data.contract.frequency] || data.contract.frequency],
      ["Data Início", format(parseLocalDate(data.contract.start_date), "dd/MM/yyyy")],
      ["Primeiro Vencimento", format(parseLocalDate(data.contract.first_due_date), "dd/MM/yyyy")],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: contractInfo,
      theme: "plain",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: "auto" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Installments Section
  if (data.installments.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Cronograma de Parcelas", 14, yPos);
    yPos += 8;

    const installmentRows = data.installments.map((inst) => [
      `${inst.installment_number}`,
      format(new Date(inst.due_date), "dd/MM/yyyy"),
      formatCurrency(inst.amount_due),
      inst.amount_paid ? formatCurrency(inst.amount_paid) : "-",
      inst.status,
      inst.payment_date ? format(new Date(inst.payment_date), "dd/MM/yyyy") : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Vencimento", "Valor", "Pago", "Status", "Data Pgto"]],
      body: installmentRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page for activities
  if (yPos > 250 && data.activities.length > 0) {
    doc.addPage();
    yPos = 20;
  }

  // Activities Section
  if (data.activities.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Histórico de Atividades", 14, yPos);
    yPos += 8;

    const activityRows = data.activities.slice(0, 20).map((act) => [
      format(new Date(act.created_at), "dd/MM/yyyy HH:mm"),
      act.type,
      act.description,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Tipo", "Descrição"]],
      body: activityRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: "auto" },
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `dossie-${data.client.name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
