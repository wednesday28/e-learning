import { useState, useEffect } from 'react';
2: import { supabase } from '../../lib/supabase';
3: import { Card, Button, Progress, Spinner } from '../../components/ui';
4: import { ChevronLeft, Timer, Award, BookOpen, ChevronRight, Target } from 'lucide-react';
5: 
6: import { useNavigate, useLocation } from 'react-router-dom';
7: import { useAuthStore } from '../../store/useAuthStore';
8: 
9: 
10: const RESTRICTED_LEVELS = ['CPNS', 'POLRI', 'Kedinasan', 'UTBK-SNBT'];
11: 
12: 
13: const Quiz = () => {
14:   const navigate = useNavigate();
15:   const location = useLocation();
16: 
17:   const { profile } = useAuthStore();
18:   const [step, setStep] = useState<'selection' | 'class-selection' | 'class-assignments' | 'quiz' | 'result'>('selection');
19:   const [levels, setLevels] = useState<any[]>([]);
20:   const [subjects, setSubjects] = useState<any[]>([]);
21:   const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
22:   
23:   const [userClasses, setUserClasses] = useState<any[]>([]);
24:   const [classAssignments, setClassAssignments] = useState<any[]>([]);
25:   const [selectedClass, setSelectedClass] = useState<any>(null);
26:   const [isLoading, setIsLoading] = useState(true);
27: 
28:   const [questions, setQuestions] = useState<any[]>([]);
29:   const [currentIndex, setCurrentIndex] = useState(0);
30:   const [answers, setAnswers] = useState<Record<string, string>>({});
31:   const [score, setScore] = useState(0);
32:   const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
33: 
34: 
35:   useEffect(() => {
36:     fetchInitialData();
37:     
38:     const params = new URLSearchParams(location.search);
39:     const subjectId = params.get('subjectId');
40:     const packageId = params.get('packageId');
41:     
42:     if (subjectId) {
43:       startQuiz(subjectId, 'subject');
44:     } else if (packageId) {
45:       startQuiz(packageId, 'package');
46:     }
47:   }, [location.search]);
48: 
49:   const fetchInitialData = async () => {
50:     const { data } = await supabase.from('levels').select('*');
51:     let filteredLevels = data || [];
52:     if (profile?.role === 'student') {
53:       filteredLevels = filteredLevels.filter(l => !RESTRICTED_LEVELS.includes(l.name));
54:     }
55:     setLevels(filteredLevels);
56:     setIsLoading(false);
57:   };
58: 
59:   const fetchSubjects = async (lId: string) => {
60:     setIsLoading(true);
61:     setSelectedLevel(lId);
62:     const { data } = await supabase.from('subjects').select('*').eq('level_id', lId);
63:     setSubjects(data || []);
64:     setIsLoading(false);
65:   };
66: 
67:   const startQuiz = async (id: string, type: 'subject' | 'package' = 'subject') => {
68:     setIsLoading(true);
69:     try {
70:       let qData: any[] = [];
71:       if (type === 'subject') {
72:         const { data } = await supabase
73:           .from('questions')
74:           .select('*, choices (*)')
75:           .eq('subject_id', id)
76:           .limit(10);
77:         qData = data || [];
78:       } else {
79:         const { data } = await supabase
80:           .from('quiz_package_questions')
81:           .select('questions(*, choices(*))')
82:           .eq('package_id', id)
83:           .order('order_index', { ascending: true });
84:         qData = data?.map(d => d.questions) || [];
85:       }
86: 
87:       if (!qData || qData.length === 0) {
88:         alert('Tidak ada soal ditemukan.');
89:         return;
90:       }
91:       setQuestions(qData);
92:       setTimeLeft(15 * 60);
93:       setCurrentIndex(0);
94:       setAnswers({});
95:       setStep('quiz');
96:     } catch (err) {
103:       console.error('Error starting quiz:', err);
104:     } finally {
105:       setIsLoading(false);
106:     }
107:   };
108: 
109:   const fetchUserClasses = async () => {
110:     setIsLoading(true);
111:     const { data } = await supabase
112:       .from('class_students')
113:       .select('*, classes(*)')
114:       .eq('student_id', profile?.id);
115:     setUserClasses(data?.map(d => d.classes) || []);
116:     setStep('class-selection');
117:     setIsLoading(false);
118:   };
119: 
120:   const fetchClassAssignments = async (cls: any) => {
121:     setIsLoading(true);
122:     setSelectedClass(cls);
123:     const { data } = await supabase
124:       .from('class_quizzes')
125:       .select('*, subjects(name), quiz_packages(title, description)')
126:       .eq('class_id', cls.id);
127:     setClassAssignments(data || []);
128:     setStep('class-assignments');
129:     setIsLoading(false);
130:   };
131: 
132:   const handleAnswer = (choiceId: string) => {
133:     setAnswers({ ...answers, [questions[currentIndex].id]: choiceId });
134:   };
135: 
136:   const nextQuestion = () => {
137:     if (currentIndex < questions.length - 1) {
138:       setCurrentIndex(currentIndex + 1);
139:     } else {
140:       calculateResult();
141:     }
142:   };
143: 
144:   useEffect(() => {
145:     let timer: any;
146:     if (step === 'quiz' && timeLeft > 0) {
147:       timer = setInterval(() => {
148:         setTimeLeft(prev => {
149:           if (prev <= 1) {
150:             clearInterval(timer);
151:             calculateResult();
152:             return 0;
153:           }
154:           return prev - 1;
155:         });
156:       }, 1000);
157:     }
158:     return () => clearInterval(timer);
159:   }, [step, timeLeft]);
160: 
161:   const formatTime = (seconds: number) => {
162:     const mins = Math.floor(seconds / 60);
163:     const secs = seconds % 60;
164:     return `${mins}:${secs.toString().padStart(2, '0')}`;
165:   };
166: 
167:   const calculateResult = () => {
168:     let correctCount = 0;
169:     questions.forEach(q => {
170:       const selectedChoiceId = answers[q.id];
171:       const correctChoice = q.choices.find((c: any) => c.is_correct);
172:       if (selectedChoiceId === correctChoice?.id) {
173:         correctCount++;
174:       }
175:     });
176:     setScore(Math.round((correctCount / questions.length) * 100));
177:     setStep('result');
178:   };
179: 
180:   if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
181: 
182:   if (step === 'class-selection') {
183:     return (
184:       <div className="max-w-4xl mx-auto space-y-10 py-10">
185:         <div className="flex items-center gap-4">
186:            <Button variant="ghost" onClick={() => setStep('selection')} className="rounded-full">
187:              <ChevronLeft className="w-6 h-6" />
188:            </Button>
189:            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pilih Kelas Kamu</h1>
190:         </div>
191:         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
192:            {userClasses.map(cls => (
193:              <div key={cls.id} onClick={() => fetchClassAssignments(cls)}>
194:                 <Card className="p-8 flex items-center gap-6 hover:border-indigo-500 cursor-pointer group shadow-xl">
195:                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
196:                      {cls.name[0]}
197:                    </div>
198:                    <div>
199:                      <h3 className="text-xl font-black text-slate-900">{cls.name}</h3>
200:                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ketuk untuk lihat kuis</p>
201:                    </div>
202:                 </Card>
203:              </div>
204:            ))}
205:            {userClasses.length === 0 && <p className="col-span-full text-center py-20 text-slate-400 italic">Kamu belum terdaftar di kelas manapun.</p>}
206:         </div>
207:       </div>
208:     );
209:   }
210: 
211:   if (step === 'class-assignments') {
212:     return (
213:       <div className="max-w-4xl mx-auto space-y-10 py-10">
214:         <div className="flex items-center gap-4">
215:            <Button variant="ghost" onClick={() => setStep('class-selection')} className="rounded-full">
216:              <ChevronLeft className="w-6 h-6" />
217:            </Button>
218:            <div>
219:              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Kuis: {selectedClass?.name}</h1>
220:              <p className="text-slate-500 font-medium italic">Pilih kuis yang ingin kamu kerjakan.</p>
221:            </div>
222:         </div>
223:         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
224:            {classAssignments.map(as => (
225:              <div key={as.id} onClick={() => startQuiz(as.package_id || as.subject_id, as.package_id ? 'package' : 'subject')}>
226:                 <Card className="p-8 space-y-6 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
227:                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:bg-amber-500 transition-colors" />
228:                    <div className="relative z-10">
229:                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
230:                         <Award className="w-6 h-6" />
231:                      </div>
232:                      <h3 className="text-xl font-black text-slate-900">{as.quiz_packages?.title || as.subjects?.name}</h3>
233:                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-2">{as.quiz_packages?.description || 'Latihan mata pelajaran reguler.'}</p>
234:                      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
235:                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{as.package_id ? 'Paket Tes' : 'Mata Pelajaran'}</span>
236:                         <ChevronRight className="w-4 h-4 text-slate-300" />
237:                      </div>
238:                    </div>
239:                 </Card>
240:              </div>
241:            ))}
242:            {classAssignments.length === 0 && <p className="col-span-full text-center py-20 text-slate-400 italic">Belum ada tugas kuis di kelas ini.</p>}
243:         </div>
244:       </div>
245:     );
246:   }
247: 
248:   if (step === 'selection') {
249:     return (
250:       <div className="max-w-4xl mx-auto space-y-10 py-10">
251:         <div className="text-center space-y-4">
252:           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pusat Latihan Kuis</h1>
253:           <p className="text-slate-500 font-medium text-lg italic">Uji pemahamanmu dan raih XP maksimal!</p>
254:         </div>
255: 
256:         {!selectedLevel ? (
257:           <div className="space-y-10">
258:             {profile?.role === 'student' && (
259:                <div onClick={fetchUserClasses}>
260:                  <Card className="p-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group rounded-[40px] flex flex-col items-center text-center">
261:                     <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform shadow-xl">
262:                       <Target className="w-10 h-10" />
263:                     </div>
264:                     <h3 className="text-2xl font-black mb-2 tracking-tight">Kuis dari Kelas Saya</h3>
265:                     <p className="text-sm font-medium opacity-70">Akses tugas kuis dan paket tes yang diberikan oleh gurumu.</p>
266:                  </Card>
267:                </div>
268:             )}
269: 
270:             <div className="space-y-4">
271:               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Latihan Publik</h3>
272:               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
273:                 {levels.map(l => (
274:                   <div key={l.id} onClick={() => fetchSubjects(l.id)}>
275:                     <Card className="p-8 text-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group shadow-xl shadow-slate-100 h-full">
276:                       <div className="w-16 h-16 bg-indigo-50 rounded-3xl mx-auto mb-4 flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
277:                         <Award className="w-8 h-8" />
278:                       </div>
279:                       <span className="font-black text-lg tracking-tight">{l.name}</span>
280:                     </Card>
281:                   </div>
282:                 ))}
283:               </div>
284:             </div>
285:           </div>
286: 
287:         ) : (
288:           <div className="space-y-6">
289:              <Button variant="ghost" onClick={() => setSelectedLevel(null)} className="text-slate-500">
290:               <ChevronLeft className="w-4 h-4 mr-2" /> Kembali ke Jenjang
291:             </Button>
292:             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
293:               {subjects.map(s => (
294:                 <div key={s.id} onClick={() => startQuiz(s.id)}>
295:                   <Card className="p-6 flex items-center justify-between hover:border-indigo-500 cursor-pointer group shadow-lg shadow-slate-50">
296:                     <div className="flex items-center gap-4">
297:                       <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
298:                         <BookOpen className="w-6 h-6" />
299:                       </div>
300:                       <span className="font-black text-slate-800">{s.name}</span>
301:                     </div>
302:                     <ChevronRight className="w-5 h-5 text-slate-300" />
303:                   </Card>
304:                 </div>
305:               ))}
306:             </div>
307:           </div>
308:         )}
309:       </div>
310:     );
311:   }
312: 
313:   if (step === 'quiz') {
314:     const q = questions[currentIndex];
315:     return (
316:       <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 py-6 sm:py-10">
317:         <div className="flex items-center justify-between gap-4">
318:           <div className="space-y-1">
319:             <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">Kuis Berjalan</h2>
320:             <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.1em]">Soal {currentIndex + 1} / {questions.length}</p>
321:           </div>
322:           <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl font-black text-xs sm:text-sm ${timeLeft < 60 ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'} text-white shrink-0`}>
323:             <Timer className={`w-4 h-4 ${timeLeft < 60 ? 'text-white' : 'text-amber-400'}`} /> {formatTime(timeLeft)}
324:           </div>
325:         </div>
326: 
327:         <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2 rounded-full bg-slate-100" />
328: 
329:         <Card className="p-5 sm:p-8 space-y-6 sm:space-y-8 shadow-2xl shadow-indigo-100/50">
330:           <p className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{q.question_text}</p>
331:           <div className="grid grid-cols-1 gap-3 sm:gap-4">
332:             {q.choices.map((choice: any) => (
333:               <button 
334:                 key={choice.id} 
335:                 onClick={() => handleAnswer(choice.id)}
336:                 className={`p-4 sm:p-6 rounded-2xl border-2 text-left font-black transition-all transform active:scale-95 ${
337:                   answers[q.id] === choice.id 
338:                     ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' 
339:                     : 'border-slate-100 hover:border-indigo-300 text-slate-600 hover:bg-slate-50'
340:                 }`}
341:               >
342:                 <div className="flex items-center gap-3 sm:gap-4">
343:                   <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border-2 shrink-0 ${
344:                     answers[q.id] === choice.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'
345:                   }`}>
346:                     {String.fromCharCode(65 + q.choices.indexOf(choice))}
347:                   </div>
348:                   <span className="text-sm sm:text-base">{choice.text}</span>
349:                 </div>
350:               </button>
351:             ))}
352:           </div>
353:           <Button 
354:             onClick={nextQuestion} 
355:             disabled={!answers[q.id]}
356:             className="w-full h-12 sm:h-14 text-base sm:text-lg font-black shadow-xl shadow-indigo-200"
357:           >
358:             {currentIndex < questions.length - 1 ? 'Pertanyaan Berikutnya' : 'Selesaikan Kuis'}
359:           </Button>
360:         </Card>
361:       </div>
362:     );
363:   }
364: 
365:   return (
366:     <div className="max-w-2xl mx-auto py-10 sm:py-20 text-center space-y-10">
367:       <div className="relative inline-block">
368:         <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
369:         <Card className="p-8 sm:p-12 relative z-10 space-y-6 rounded-[48px] border-none shadow-2xl shadow-indigo-200">
370:           <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-600 text-white rounded-[24px] sm:rounded-[32px] flex items-center justify-center mx-auto shadow-xl">
371:             <Award className="w-10 h-10 sm:w-12 sm:h-12" />
372:           </div>
373:           <div className="space-y-2">
374:             <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Skor Akhir Kamu</h2>
375:             <p className="text-5xl sm:text-6xl font-black text-indigo-600">{score}%</p>
376:           </div>
377:           <div className="flex justify-center gap-4 sm:gap-8 py-4 border-y border-slate-100">
378:             <div>
379:               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benar</p>
380:               <p className="text-lg sm:text-xl font-black text-emerald-500">{(score / 100) * questions.length}</p>
381:             </div>
382:             <div>
383:               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Diperoleh</p>
384:               <p className="text-lg sm:text-xl font-black text-amber-500">+{score * 10}</p>
385:             </div>
386:           </div>
387:           <div className="flex flex-col sm:flex-row gap-3 pt-4">
388:             <Button onClick={() => setStep('selection')} variant="outline" className="flex-1 h-12 rounded-2xl">Main Lagi</Button>
389:             <Button onClick={() => navigate('/dashboard')} className="flex-1 h-12 rounded-2xl">Ke Dashboard</Button>
390:           </div>
391:         </Card>
392:       </div>
393:     </div>
394:   );
395: };
396: 
397: export default Quiz;
