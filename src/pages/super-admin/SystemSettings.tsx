import React from 'react';
import { Card, Button, Input } from '../../components/ui';
import { Settings, Save, Globe, Lock, Mail, Bell } from 'lucide-react';

const SystemSettings = () => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h1>
      <Button><Save className="w-4 h-4" /> Save All Changes</Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 bg-indigo-50 text-indigo-700 font-bold"><Globe className="w-4 h-4" /> General</Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500"><Lock className="w-4 h-4" /> Security</Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500"><Mail className="w-4 h-4" /> Email SMTP</Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500"><Bell className="w-4 h-4" /> Notifications</Button>
      </div>

      <div className="md:col-span-2 space-y-6">
        <Card>
          <h3 className="font-bold text-slate-900 mb-6">General Settings</h3>
          <div className="space-y-4">
            <Input label="Application Name" defaultValue="LMSPRO E-Learning" />
            <Input label="Support Email" defaultValue="support@lmspro.com" />
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Maintenance Mode</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                </div>
                <span className="text-xs font-bold text-slate-500">Disabled</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

export default SystemSettings;
