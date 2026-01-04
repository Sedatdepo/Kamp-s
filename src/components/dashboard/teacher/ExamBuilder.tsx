import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, ImageIcon, 
  Trash2, Save, FileText, Plus, Eye, Printer,
  LayoutTemplate, CheckSquare, Type, CheckCircle, GripVertical, Shuffle, RefreshCw, Palette, Settings, Archive, FolderOpen, Send, X, AlignLeft, CaseUpper, KeySquare, Loader2
} from 'lucide-react';
import { Exam, ExamInfo, Question as ExamQuestion, QuestionType, ExamTheme, ExamDocument, Class, Student, TeacherProfile } from '@/lib/types';
import { useDatabase } from '@/hooks/use-database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { doc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { AssignExamModal } from './AssignExamModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExamPaper } from './ExamPaper';

// --- ANA BİLEŞEN ---
export default function ExamBuilder({ classes, students, teacherProfile }: { classes: Class[], students: Student[], teacherProfile: TeacherProfile | null }) {
  const { db, appUser, storage } = useAuth();
  const { toast } = useToast();

  const createNewExam = (): Exam => ({
    examInfo: {
      title: 'Yeni Sınav',
      logo: null,
      group: 'A',
      theme: 'classic',
      settings: { fontSize: 11, lineHeight: 1.5, watermark: '' },
    },
    questions: []
  });

  const [currentExam, setCurrentExam] = useState<Exam>(createNewExam());
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);


  const activeQuestion = currentExam.questions.find(q => q.id === selectedQuestionId);

  const updateExamInfo = (field: keyof ExamInfo, value: any) => {
    setCurrentExam(prev => ({ ...prev, examInfo: { ...prev.examInfo, [field]: value }}));
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: ExamQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      options: type === 'multiple-choice' ? Array(4).fill('') : undefined,
      correctAnswer: null,
      points: 10,
      image: null,
    };
    setCurrentExam(prev => ({...prev, questions: [...prev.questions, newQuestion]}));
    setSelectedQuestionId(newQuestion.id);
  };
  
  const updateQuestion = (id: string|number, field: keyof ExamQuestion, value: any) => {
    setCurrentExam(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const deleteQuestion = (id: string | number) => {
    if(!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
    setCurrentExam(prev => ({...prev, questions: prev.questions.filter(q => q.id !== id)}));
    if(selectedQuestionId === id) {
        setSelectedQuestionId(null);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !activeQuestion || !storage || !appUser) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      setIsUploading(true);
      reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const imageRef = storageRef(storage, `exam_images/${appUser.data.uid}/${Date.now()}_${file.name}`);
          try {
            await uploadString(imageRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(imageRef);
            updateQuestion(activeQuestion.id, 'image', downloadUrl);
            toast({title: "Resim Yüklendi", description: "Resim başarıyla yüklendi ve soruya eklendi."});
          } catch(error) {
            console.error("Image upload error:", error);
            toast({variant: "destructive", title: "Yükleme Hatası", description: "Resim yüklenirken bir hata oluştu."});
          } finally {
            setIsUploading(false);
          }
      };
      reader.readAsDataURL(file);
  };
  
  const handleDeleteImage = async () => {
    if (!activeQuestion?.image || !storage) return;
    try {
        const imageRef = storageRef(storage, activeQuestion.image);
        await deleteObject(imageRef);
        updateQuestion(activeQuestion.id, 'image', null);
        toast({title: "Resim Silindi"});
    } catch(error) {
        // If image not in storage, just remove link
        if ((error as any).code === 'storage/object-not-found') {
             updateQuestion(activeQuestion.id, 'image', null);
        } else {
            console.error("Image delete error:", error);
            toast({variant: "destructive", title: "Hata", description: "Resim silinemedi."});
        }
    }
  };

   const handleAssignConfirm = async (details: { studentIds: string[], date: string }) => {
      if (!db || !currentExam) return;
  
      const { studentIds, date } = details;
  
      try {
          const batch = writeBatch(db);
          const studentsByClass: { [key: string]: string[] } = {};
          
          studentIds.forEach(studentId => {
              const student = students.find(s => s.id === studentId);
              if (student) {
                  if (!studentsByClass[student.classId]) studentsByClass[student.classId] = [];
                  studentsByClass[student.classId].push(studentId);
              }
          });
  
          for (const classId in studentsByClass) {
              const newHomeworkDoc = {
                  classId: classId,
                  text: currentExam.examInfo.title,
                  assignedDate: new Date().toISOString(),
                  dueDate: date ? new Date(date).toISOString() : null,
                  teacherName: teacherProfile?.name,
                  lessonName: teacherProfile?.branch,
                  rubric: null, 
                  assignedStudents: studentsByClass[classId],
                  seenBy: [],
                  questions: currentExam.questions
              };
              
              const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
              const newDocRef = doc(homeworksColRef);
              batch.set(newDocRef, newHomeworkDoc);
          }
  
          await batch.commit();
          toast({ title: "Başarılı!", description: "Sınav, ödev olarak atandı." });
  
      } catch (error) {
          console.error("Assignment error:", error);
          toast({ variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı.' });
      }
  };


  const totalPoints = currentExam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-gray-50">
      {/* SOL PANEL - Soru Listesi ve Sınav Ayarları */}
      <div className="w-full md:w-80 border-r bg-white p-4 flex flex-col space-y-4 overflow-y-auto">
        <Card>
            <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Sınav Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
                <Input placeholder="Sınav Başlığı" value={currentExam.examInfo.title} onChange={e => updateExamInfo('title', e.target.value)} />
                <div className='text-sm font-bold text-center p-2 bg-slate-100 rounded-md'>Toplam Puan: {totalPoints}</div>
            </CardContent>
        </Card>
        
        <div className='flex-1 space-y-2 overflow-y-auto'>
            {currentExam.questions.map((q, index) => (
                 <div key={q.id} onClick={() => setSelectedQuestionId(q.id)} className={`p-2 border rounded-md cursor-pointer ${selectedQuestionId === q.id ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-slate-50'}`}>
                    <div className='flex justify-between items-center'>
                        <span className='text-sm font-semibold'>Soru {index + 1} ({q.points || 0} Puan)</span>
                        <Trash2 className='h-4 w-4 text-red-500 hover:text-red-700' onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id)}}/>
                    </div>
                     <p className='text-xs text-gray-500 truncate'>{q.image ? "[Resimli Soru]" : (q.text || "Boş soru...")}</p>
                </div>
            ))}
        </div>
        <div className='flex gap-2'>
            <Button variant="outline" onClick={() => addQuestion('multiple-choice')} className='flex-1'><CheckSquare className='mr-2'/>Test</Button>
            <Button variant="outline" onClick={() => addQuestion('short-answer')} className='flex-1'><AlignLeft className='mr-2'/>Kısa Cevap</Button>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="flex-1"><Eye className='mr-2'/>Önizleme</Button>
            <Button onClick={() => setIsAssignModalOpen(true)} className="flex-1"><Send className='mr-2'/>Ata & Yayınla</Button>
        </div>
      </div>

      {/* SAĞ PANEL - Soru Editörü */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeQuestion ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6 max-w-3xl mx-auto">
            <div>
              <Label htmlFor="questionText" className="text-lg font-semibold">Soru Metni</Label>
              <div className="flex gap-2 items-center mt-2 mb-4">
                  <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <><Loader2 className="animate-spin mr-2"/> Yükleniyor...</> : <><ImageIcon className="mr-2"/> Resim Ekle</>}
                  </Button>
                  {activeQuestion.image && (
                     <Button variant="destructive" size="sm" onClick={handleDeleteImage}><Trash2 className="mr-2"/> Resmi Sil</Button>
                  )}
              </div>
              {activeQuestion.image && (
                <div className="mb-4 p-2 border rounded-md flex justify-center bg-gray-50">
                    <img src={activeQuestion.image} alt="Soru görseli" className="max-w-full max-h-80 object-contain rounded" />
                </div>
              )}
              <Textarea id="questionText" value={activeQuestion.text} onChange={e => updateQuestion(activeQuestion.id, 'text', e.target.value)} rows={5} className="mt-2" placeholder='Sorunuzu buraya yazın ya da bir resim ekleyin...'/>
            </div>
            
            {activeQuestion.type === 'multiple-choice' && (
                <div>
                    <Label className="text-lg font-semibold">Seçenekler</Label>
                    <div className='mt-2 space-y-3'>
                        {(activeQuestion.options || []).map((opt, i) => (
                             <div key={i} className="flex items-center gap-2">
                                <Label htmlFor={`option-${i}`} className='p-2 bg-slate-100 rounded-md'>{String.fromCharCode(65 + i)}</Label>
                                <Input id={`option-${i}`} value={opt} onChange={e => {
                                    const newOptions = [...(activeQuestion.options || [])];
                                    newOptions[i] = e.target.value;
                                    updateQuestion(activeQuestion.id, 'options', newOptions);
                                }}/>
                                <RadioGroup value={activeQuestion.correctAnswer === i ? 'correct' : ''} onValueChange={() => updateQuestion(activeQuestion.id, 'correctAnswer', i)}>
                                    <RadioGroupItem value="correct" id={`correct-${i}`}/>
                                </RadioGroup>
                             </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeQuestion.type === 'true-false' && (
                <div>
                    <Label className="text-lg font-semibold">Doğru Cevap</Label>
                    <RadioGroup value={activeQuestion.correctAnswer === true ? 'true' : activeQuestion.correctAnswer === false ? 'false' : ''} onValueChange={(val) => updateQuestion(activeQuestion.id, 'correctAnswer', val === 'true')}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="true-opt" /><Label htmlFor="true-opt">Doğru</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="false-opt" /><Label htmlFor="false-opt">Yanlış</Label></div>
                    </RadioGroup>
                </div>
            )}

            {activeQuestion.type === 'short-answer' && (
                <div>
                    <Label className="text-lg font-semibold">Cevap Anahtarı (Opsiyonel)</Label>
                    <Textarea value={activeQuestion.correctAnswer as string || ''} onChange={e => updateQuestion(activeQuestion.id, 'correctAnswer', e.target.value)} rows={2} className="mt-2" placeholder='İdeal cevabı veya anahtar kelimeleri yazın...'/>
                </div>
            )}

             <div>
              <Label htmlFor="questionPoints" className="text-lg font-semibold">Puan</Label>
              <Input id="questionPoints" type="number" value={activeQuestion.points} onChange={e => updateQuestion(activeQuestion.id, 'points', parseInt(e.target.value) || 0)} className="mt-2 w-24"/>
            </div>

          </div>
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <Card className='p-8 text-center'>
                <CardTitle>Soru Seçin veya Ekleyin</CardTitle>
                <CardDescription>Başlamak için soldaki listeden bir soru seçin veya yeni bir soru ekleyin.</CardDescription>
            </Card>
          </div>
        )}
      </div>

      <AssignExamModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        exam={currentExam}
        onConfirm={handleAssignConfirm}
        classes={classes}
        students={students}
      />

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center overflow-y-auto py-10">
            <div className="relative">
                <button onClick={() => setIsPreviewOpen(false)} className="fixed top-5 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition"><X size={24} /></button>
                <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="fixed top-20 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition">
                    <KeySquare size={24} className={showAnswerKey ? 'text-blue-600' : ''}/>
                </button>
                <ExamPaper exam={currentExam} showAnswerKey={showAnswerKey} />
            </div>
        </div>
      )}
    </div>
  );
}
