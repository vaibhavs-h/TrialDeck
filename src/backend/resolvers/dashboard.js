// Week 3: aggregate Protocol Deviation issues (JQL) into KPIs and chart series.
export async function getDashboard() {
  return {
    kpis: { open: 0, major: 0, overdueCapas: 0, sitesAffected: 0 },
    bySite: [],
    byCategory: [],
    trend: [],
    overdueCapas: [],
  };
}
