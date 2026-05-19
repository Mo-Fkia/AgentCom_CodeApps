export type CommissionSourceRecord = {
  AgentCompanyName?: string;
  AmountToPayOverride?: number;
  PaymentAmountSubject?: number;
  ProgramCode?: string;
  ProgramName?: string;
  ProgramStage?: string;
  TotalPayment2?: number;
};

export type ProgramCodeMapping = {
  category: string;
  programCode: string;
  programName: string;
  programStage: string;
};

const IDP_COMMISSION_RATE = 12;
const DEFAULT_COMMISSION_RATE = 10;

function includesText(value: string | undefined, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function asAmount(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function totalPayment(record: CommissionSourceRecord) {
  const amountToPayOverride = asAmount(record.AmountToPayOverride);

  if (amountToPayOverride > 0) {
    return amountToPayOverride;
  }

  return asAmount(record.PaymentAmountSubject);
}

export function nonFee(record: CommissionSourceRecord) {
  const programName = record.ProgramName ?? "";
  const programStage = record.ProgramStage ?? "";

  if (includesText(programName, "bachelor")) {
    const hasHigherNonFeeBachelorComponent =
      includesText(programName, "food and beverage service") ||
      includesText(programName, "kitchen operations management");

    return hasHigherNonFeeBachelorComponent ? 1580 : 375;
  }

  const isCertificateThreePatisserieSuperior =
    includesText(programName, "certificate iii") &&
    includesText(programName, "patisserie") &&
    includesText(programStage, "superior");

  if (isCertificateThreePatisserieSuperior) {
    return 597;
  }

  if (includesText(programName, "certificate iv")) {
    return 1397;
  }

  return 0;
}

export function baseAmount(record: CommissionSourceRecord) {
  return Math.max(totalPayment(record) - nonFee(record), 0);
}

export function commissionRate(record: CommissionSourceRecord) {
  return includesText(record.AgentCompanyName, "idp")
    ? IDP_COMMISSION_RATE
    : DEFAULT_COMMISSION_RATE;
}

export function commissionAmount(record: CommissionSourceRecord) {
  return (baseAmount(record) * commissionRate(record)) / 100;
}

export function programCode(record: CommissionSourceRecord): ProgramCodeMapping {
  const programName = record.ProgramName ?? "";
  const programStage = record.ProgramStage ?? "";

  let category = "Other";

  if (includesText(programName, "bachelor")) {
    category = "Bachelor";
  } else if (includesText(programName, "certificate iii")) {
    category = includesText(programName, "patisserie")
      ? "Certificate III Patisserie"
      : "Certificate III";
  } else if (includesText(programName, "certificate iv")) {
    category = "Certificate IV";
  } else if (includesText(programName, "diploma")) {
    category = "Diploma";
  }

  return {
    category,
    programCode: record.ProgramCode ?? "",
    programName,
    programStage,
  };
}

export const calculateTotalPayment = totalPayment;
export const calculateNonFeeAmount = nonFee;
export const calculateBaseAmount = baseAmount;
export const calculateCommissionRate = commissionRate;
export const calculateCommissionAmount = commissionAmount;
export const getProgramCodeMapping = programCode;
