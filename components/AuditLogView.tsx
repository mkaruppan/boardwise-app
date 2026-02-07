import React from 'react';
import { AuditLogEntry } from '../types';
import { Shield, ChevronLeft, FileText, Lock, Activity } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onBack: () => void;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="w-6 h-6 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-brand-gold" />
                Audit Trail
              </h1>
              <p className="text-slate-500 text-sm">Immutable record of governance events (King IV Principle 10)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-200 px-3 py-1.5 rounded text-slate-600">
            <Lock className="w-3 h-3" />
            <span>SECURE_LOG_V2</span>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">User</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Action</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Details</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Ref Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                      No events recorded in this session.
                    </td>
                  </tr>
                ) : (
                  [...logs].reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString('en-ZA', { 
                          year: 'numeric', month: '2-digit', day: '2-digit', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-brand-900/10 flex items-center justify-center text-[10px] font-bold text-brand-900">
                            {log.userName.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          log.action.includes('LOGIN') ? 'bg-green-50 text-green-700 border-green-100' :
                          log.action.includes('ALERT') ? 'bg-red-50 text-red-700 border-red-100' :
                          log.action.includes('MEETING') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {log.ipHash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start space-x-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>System Note:</strong> This log is stored in transient memory for this demo. In a production environment, this data is written to a tamper-proof blockchain ledger or WORM (Write Once Read Many) storage.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuditLogView;