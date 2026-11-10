import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useDashboard } from './hooks/useDashboard.js';
import KpiRow from './components/KpiRow.jsx';
import OverdueCapaTable from './components/OverdueCapaTable.jsx';

export default function App() {
  const { data, loading, error } = useDashboard();

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">Could not load the dashboard: {error}</p>;
  if (!data) return <p>No data.</p>;

  return (
    <div style={{ padding: 16 }}>
      <KpiRow kpis={data.kpis} />
      <h3>Deviations by site</h3>
      {data.bySite.length === 0 ? (
        <p>No deviations logged yet.</p>
      ) : (
        <BarChart width={500} height={260} data={data.bySite}>
          <XAxis dataKey="site" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      )}
      <h3>Overdue CAPAs</h3>
      <OverdueCapaTable rows={data.overdueCapas} />
    </div>
  );
}
