
export const ACCOUNT_DETAILS_BASE_STORAGE_KEY = "moneywise-accountDetails";
// Agora armazena um array de objetos: { companyName: string, email: string, password?: string, phone?: string, status?: string }
export const SIMULATED_CREDENTIALS_STORAGE_KEY = "moneywise-simulatedCredentials";
export const REMEMBERED_CREDENTIALS_KEY = "moneywise-rememberedCredentials"; // Modificado
export const AUTH_STATUS_KEY = "moneywise-auth";
export const CURRENT_COMPANY_KEY = "moneywise-currentCompany";

export const STORAGE_KEY_NOTEBOOK_BASE = "moneywise-transactions";
export const STORAGE_KEY_CREDIT_NOTEBOOK_BASE = "moneywise-creditEntries";
export const STORAGE_KEY_CUSTOMERS_BASE = "moneywise-customers";
export const STORAGE_KEY_PRODUCTS_BASE = "moneywise-products";
export const STORAGE_KEY_SALES_RECORD_BASE = "moneywise-salesHistory";

export function getCompanySpecificKey(baseKey: string, companyName: string | null): string | null {
  if (!companyName) {
    return null;
  }
  const sanitizedCompanyName = companyName.replace(/\s+/g, '_');
  return `${baseKey}_${sanitizedCompanyName}`;
}
