import React from 'react';

export default function OverdueCapaTable({ rows }) {
  if (!rows.length) return <p>No overdue CAPAs.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Site</th>
          <th>Owner</th>
          <th>Days overdue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.key}</td>
            <td>{r.site}</td>
            <td>{r.owner ?? 'Unassigned'}</td>
            <td>{r.daysOverdue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
