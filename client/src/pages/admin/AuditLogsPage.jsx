import React, { useState } from 'react';
import { FileText, Search, ShieldCheck, Clock, Terminal } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { DemoBadge } from '../../components/common/DemoBadge';

export const AuditLogsPage = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = (auditLogs || []).filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const actionStr = String(log.action || '').toLowerCase();
    const actorStr = String(log.performedBy?.name || log.performedBy || '').toLowerCase();
    const detailStr = String(typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '')).toLowerCase();
    return actionStr.includes(q) || actorStr.includes(q) || detailStr.includes(q);
  });

  return (
    <RoleLayout
      roleTitle="Immutable System Audit Trail"
      roleIcon={FileText}
    >
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-slate-900">Chain of Custody &amp; Operational Log</h2>
              <DemoBadge text="Append-Only Log" />
            </div>
            <p className="text-xs text-slate-500">
              Cryptographically timestamped transactions for regulatory compliance and food safety tracing.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actions or actors..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Actor</th>
                <th className="py-3 px-6">Entity</th>
                <th className="py-3 px-6">Details</th>
                <th className="py-3 px-6">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-sans font-semibold text-slate-800 whitespace-nowrap">
                    {log.performedBy}
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap text-slate-500">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3.5 px-6 font-sans text-slate-600 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RoleLayout>
  );
};
