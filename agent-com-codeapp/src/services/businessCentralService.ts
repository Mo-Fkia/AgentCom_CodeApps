export function submitToBCMock(draftNm: string, invoiceNumber: string) {
  return {
    draftNm,
    invoiceNumber,
    submitted: true,
    submittedAt: new Date().toISOString(),
  };
}
