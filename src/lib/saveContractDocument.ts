import { supabase } from "@/integrations/supabase/client";
import { generateLoanContractPDF, LoanContractData } from "./generateLoanContract";

export interface SaveContractPDFParams {
  contractId: string;
  clientId: string;
  userId: string;
  contractData: LoanContractData;
}

export async function saveContractPDFToDocuments({
  contractId,
  clientId,
  userId,
  contractData,
}: SaveContractPDFParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate the PDF blob
    const pdfBlob = generateLoanContractPDF(contractData);
    
    // Create file name
    const fileName = `contrato_${contractData.clientName.replace(/\s+/g, "_")}_${contractId.substring(0, 8)}.pdf`;
    const filePath = `${userId}/${clientId}/${Date.now()}-${fileName}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
      });
    
    if (uploadError) {
      console.error("Error uploading contract PDF:", uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // Save metadata to document_files table
    const { error: dbError } = await supabase
      .from("document_files")
      .insert({
        user_id: userId,
        client_id: clientId,
        contract_id: contractId,
        file_name: fileName,
        file_path: filePath,
        file_type: "contract",
        file_size: pdfBlob.size,
        mime_type: "application/pdf",
        description: `Contrato de empréstimo - ${contractData.clientName}`,
      });
    
    if (dbError) {
      console.error("Error saving contract document metadata:", dbError);
      // Try to delete the uploaded file if metadata save fails
      await supabase.storage.from("documents").remove([filePath]);
      return { success: false, error: dbError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in saveContractPDFToDocuments:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
