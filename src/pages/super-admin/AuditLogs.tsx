import { Card, Button } from '../../components/ui';
import { Search, Download, Clock } from 'lucide-react';

const AuditLogs = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forensic Audit Logs</h1>
      <Button variant="outline"><Download className="w-4 h-4" /> Download History</Button>
    </div>

    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by user, action or IP..." className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-100 rounded-lg text-sm" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-slate-500">2026-05-04 09:4{i}:12</td>
                <td className="px-6 py-4 font-bold text-slate-900">Admin_User_A</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full" /> UPDATE_SYSTEM_CONFIG
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase">Success</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold"><Clock className="w-3 h-3" /> View Trace</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default AuditLogs;
