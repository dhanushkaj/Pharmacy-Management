// Shared formatter so the same count session always shows the same unique
// document number across draft, approval, history, print and Excel export.
export const formatCountDocumentNumber = (session) => {
  if (!session || session.id == null) return 'N/A';
  const version = session.versionNumber != null ? session.versionNumber : 1;
  return `PC-${String(session.id).padStart(6, '0')}-V${version}`;
};
