import React from 'react';
import { Card, Button } from '../../components/ui';

const Quiz = () => (
  <div className="max-w-3xl mx-auto space-y-8 py-10">
    <div className="text-center">
      <h1 className="text-3xl font-black mb-2 tracking-tight text-slate-900">Quiz Aljabar Dasar</h1>
      <p className="text-slate-500 font-medium">Jawablah pertanyaan berikut dengan teliti.</p>
    </div>
    <Card className="space-y-6 shadow-xl shadow-indigo-100/50">
      <div className="flex justify-between items-center text-xs font-bold text-indigo-600 uppercase tracking-widest">
        <span>Pertanyaan 1 dari 10</span>
        <span>Waktu: 14:55</span>
      </div>
      <p className="text-lg font-bold text-slate-800">Berapakah nilai x dalam persamaan 2x + 5 = 15?</p>
      <div className="grid grid-cols-1 gap-3">
        {['5', '10', '15', '20'].map((opt) => (
          <button key={opt} className="p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left font-bold text-slate-700">
            {opt}
          </button>
        ))}
      </div>
      <Button className="w-full h-12 text-base font-bold">Pertanyaan Berikutnya</Button>
    </Card>
  </div>
);

export default Quiz;
