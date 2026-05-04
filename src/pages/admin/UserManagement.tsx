import React from 'react';
import { Card, Button } from '../../components/ui';
import { Search, Filter, ShieldCheck, Trash2, Edit2 } from 'lucide-react';

const UserManagement = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
      <div className="flex gap-2">
        <Button variant="outline"><Filter className="w-4 h-4" /> Filter</Button>
        <Button>Eksport CSV</Button>
      </div>
    </div>

    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari berdasarkan nama atau email..." className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-100 rounded-lg text-sm" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Terdaftar</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">U</div>
                    <div>
                      <p className="font-bold text-slate-900">User Ke-{i}</p>
                      <p className="text-[10px] text-slate-400">user{i}@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">Student</span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="w-3 h-3" /> Active
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs font-medium">May 04, 2026</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="text-indigo-600"><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default UserManagement;
