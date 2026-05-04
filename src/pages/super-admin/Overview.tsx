
import { Card, Button } from '../../components/ui';
import { ShieldAlert, Activity, Settings, Database, HardDrive, Cpu, Globe } from 'lucide-react';

const SuperAdminOverview = () => {
  return (
    <div className="space-y-8">
      <div className="bg-slate-900 rounded-[24px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-rose-500 w-8 h-8" />
            <h1 className="text-2xl font-black tracking-tight">Root System Console</h1>
          </div>
          <p className="text-slate-400 max-w-xl font-medium">Monitoring infrastruktur global, manajemen kunci API, dan kendali akses tingkat tinggi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" /> System Health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-slate-50 border-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Cpu className="w-5 h-5" /></div>
                <h4 className="font-bold text-slate-700">CPU Usage</h4>
              </div>
              <p className="text-3xl font-black text-slate-900">12.5%</p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[12.5%]" />
              </div>
            </Card>
            <Card className="bg-slate-50 border-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><HardDrive className="w-5 h-5" /></div>
                <h4 className="font-bold text-slate-700">Memory</h4>
              </div>
              <p className="text-3xl font-black text-slate-900">4.2 GB</p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[45%]" />
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-black text-lg mb-6">Database Clusters</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Database className="text-indigo-600 w-5 h-5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Supabase-SG-01</p>
                    <p className="text-xs text-slate-500">Singapore Region</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Online</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Globe className="text-slate-400 w-5 h-5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Edge-Global-Cache</p>
                    <p className="text-xs text-slate-500">Cloudflare Network</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Online</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" /> Quick Actions
          </h2>
          <Card className="space-y-4">
            <Button className="w-full justify-start gap-4 h-14" variant="outline">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Maintenance Mode
            </Button>
            <Button className="w-full justify-start gap-4 h-14" variant="outline">
              <Database className="w-5 h-5 text-indigo-500" /> Database Backup
            </Button>
            <Button className="w-full justify-start gap-4 h-14" variant="outline">
              <Globe className="w-5 h-5 text-emerald-500" /> Flush Edge Cache
            </Button>
            <Button className="w-full justify-start gap-4 h-14 bg-slate-900 text-white hover:bg-black">
              <Activity className="w-5 h-5 text-amber-500" /> Export System Logs
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
