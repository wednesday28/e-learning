import React from 'react';
import { Card, Button } from '../../components/ui';
import { PlusCircle } from 'lucide-react';

const ManageQuizzes = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Quiz</h1>
      <Button><PlusCircle className="w-4 h-4" /> Buat Quiz Baru</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="hover:ring-2 hover:ring-indigo-500 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg uppercase">Aktif</span>
            <span className="text-xs text-slate-400 font-medium">12 Mei 2026</span>
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Quiz Aljabar Part {i}</h3>
          <p className="text-xs text-slate-500 mb-6 line-clamp-2">Latihan soal mengenai persamaan linear dan variabel bebas.</p>
          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
            <span className="text-xs font-bold text-slate-400">15 Pertanyaan</span>
            <Button variant="ghost" size="sm" className="text-indigo-600">Edit</Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default ManageQuizzes;
