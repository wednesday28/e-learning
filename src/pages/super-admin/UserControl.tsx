import React from 'react';
import { Card, Button } from '../../components/ui';
import { ShieldAlert, Users, Trash2, Key } from 'lucide-react';

const UserControl = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Root User Control</h1>
      <Button variant="danger"><ShieldAlert className="w-4 h-4" /> Hard Reset Permissions</Button>
    </div>
    <Card>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[20px] border border-transparent hover:border-rose-100 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-500">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Admin User {i}</h3>
                <p className="text-xs text-slate-500 font-medium">Privileges: FULL_ADMIN • Last login: 10m ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm"><Key className="w-3 h-3" /> Reset API Key</Button>
              <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default UserControl;
