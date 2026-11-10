import React from 'react';

const LABELS = [
  ['open', 'Open deviations'],
  ['major', 'Major'],
  ['overdueCapas', 'Overdue CAPAs'],
  ['sitesAffected', 'Sites affected'],
];

export default function KpiRow({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {LABELS.map(([key, label]) => (
        <div key={key} style={{ border: '1px solid #dfe1e6', borderRadius: 3, padding: 12 }}>
          <div style={{ fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{kpis[key]}</div>
        </div>
      ))}
    </div>
  );
}
