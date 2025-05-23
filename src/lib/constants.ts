
export const ACCOUNT_DETAILS_BASE_STORAGE_KEY = "moneywise-accountDetails";
export const SIMULATED_CREDENTIALS_STORAGE_KEY = "moneywise-simulatedCredentials";
export const REMEMBERED_COMPANY_NAME_KEY = "moneywise-rememberedCompanyName";
export const AUTH_STATUS_KEY = "moneywise-auth";
export const CURRENT_COMPANY_KEY = "moneywise-currentCompany";

export const STORAGE_KEY_NOTEBOOK_BASE = "moneywise-transactions";
export const STORAGE_KEY_CREDIT_NOTEBOOK_BASE = "moneywise-creditEntries";
export const STORAGE_KEY_CUSTOMERS_BASE = "moneywise-customers";
export const STORAGE_KEY_PRODUCTS_BASE = "moneywise-products";
export const STORAGE_KEY_SALES_RECORD_BASE = "moneywise-salesHistory";

export function getCompanySpecificKey(baseKey: string, companyName: string | null): string | null {
  if (!companyName) {
    // console.warn(`Attempted to get company specific key for baseKey "${baseKey}" without a companyName.`);
    return null;
  }
  // Limpar e normalizar o companyName para usar como parte da chave
  // Removendo espaços e convertendo para minúsculas pode ser uma boa prática,
  // mas para manter a compatibilidade com o login que usa o nome exato, vamos usar o nome como está.
  // Apenas substituímos espaços por underscores para segurança da chave.
  const sanitizedCompanyName = companyName.replace(/\s+/g, '_');
  return `${baseKey}_${sanitizedCompanyName}`;
}
