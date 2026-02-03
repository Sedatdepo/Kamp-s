'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Class, Student, TeacherProfile, Homework, AssignmentTemplate, Question, QuestionType, MatchingPair } from '@/lib/types';
import { doc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { assignmentsData, initialRubricDefinitions, getRubricType } from '@/lib/maarif-modeli-odevleri';
import { LibraryHeader } from './LibraryHeader';
import { StatsCards } from './StatsCards';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { AssignSettingsModal } from './AssignSettingsModal';
import { SuccessModal } from './SuccessModal';
import { RubricModal } from './RubricModal';
import { AddRubricModal } from './AddRubricModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDatabase } from '@/hooks/use-database';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Filter, Send, ClipboardList, FileDown, Trash2, Pencil, Save, Plus, X, ImageIcon, Loader2, BookOpen, Atom, CheckSquare, AlignLeft, Binary, Shuffle } from 'lucide-react';

const EditableAssignment = ({
    assignment,
    onUpdate,
    onDelete,
    onAssign,
    onShowRubric,
    onPrint,
    isFavorite,
    onToggleFavorite
}: {
    assignment: AssignmentTemplate,
    onUpdate: (id: number, updatedData: Partial<AssignmentTemplate>) => void,
    onDelete: (id: number) => void,
    onAssign: (assignment: AssignmentTemplate) => void,
    onShowRubric: (assignment: AssignmentTemplate) => void,
    onPrint: (assignment: AssignmentTemplate) => void,
    isFavorite: boolean,
    onToggleFavorite: (id: number) => void
}) => {
    
    const isPhysics = assignment.subject === 'physics';
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { storage, appUser } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState<string | number | null>(null);

    const updateField = (field: keyof AssignmentTemplate, value: any) => {
        onUpdate(assignment.id, { [field]: value });
    };

    const updateQuestion = (qId: string|number, field: keyof Question, value: any) => {
        const newQuestions = (assignment.questions || []).map(q => 
            q.id === qId ? { ...q, [field]: value } : q
        );
        updateField('questions', newQuestions);
    };

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            id: uuidv4(),
            text: '',
            type,
            points: 10,
            options: type === 'multiple-choice' ? Array(4).fill('') : undefined,
            matchingPairs: type === 'matching' ? [{id: uuidv4(), question: '', answer: ''}, {id: uuidv4(), question: '', answer: ''}] : undefined,
            correctAnswer: null,
            kazanimId: undefined,
        };
        updateField('questions', [...(assignment.questions || []), newQuestion]);
    };
    
    const deleteQuestion = (qId: string | number) => {
        updateField('questions', (assignment.questions || []).filter(q => q.id !== qId));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string | number) => {
        if (!e.target.files || !storage || !appUser) return;
        const file = e.target.files[0];
        setIsUploading(qId);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const imageRef = storageRef(storage, `exam_images/${appUser.data.uid}/${Date.now()}_${file.name}`);
            try {
              await uploadString(imageRef, dataUrl, 'data_url');
              const downloadUrl = await getDownloadURL(imageRef);
              updateQuestion(qId, 'image', downloadUrl);
              toast({title: "Resim Yüklendi", description: "Resim başarıyla yüklendi ve soruya eklendi."});
            } catch(error) {
              console.error("Image upload error:", error);
              toast({variant: "destructive", title: "Yükleme Hatası", description: "Resim yüklenirken bir hata oluştu."});
            } finally {
              setIsUploading(null);
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleDeleteImage = async (qId: string | number, imageUrl: string) => {
        if (!storage) return;
        try {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
            updateQuestion(qId, 'image', null);
            toast({title: "Resim Silindi"});
        } catch(error) {
           console.error("Image delete error:", error);
           if ((error as any).code === 'storage/object-not-found') {
                updateQuestion(qId, 'image', null);
           }
        }
      };


    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className={`p-6 border-b-4 ${isPhysics ? 'border-cyan-500' : 'border-rose-500'}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <Input value={assignment.title} onChange={e => updateField('title', e.target.value)} className="text-xl font-bold border-0 shadow-none -ml-3 focus-visible:ring-1"/>
                        <div className="flex gap-2">
                             <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">{assignment.grade}. Sınıf</span>
                             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${ isPhysics ? 'bg-cyan-50 text-cyan-700' : 'bg-rose-50 text-rose-700' }`}>
                                {isPhysics ? <Atom size={12} /> : <BookOpen size={12} />}
                                {isPhysics ? 'Fizik' : 'Edebiyat'}
                             </span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(assignment.id)} title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
                            <Heart size={18} className={`transition-colors ${isFavorite ? "text-red-500 fill-current" : "text-gray-400 hover:text-red-400"}`}/>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Ödevi Sil" className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>"{assignment.title}" başlıklı ödevi kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(assignment.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                {/* Description & Instructions */}
                <div>
                    <Label className="text-xs font-semibold text-gray-500">Açıklama</Label>
                    <Textarea value={assignment.description} onChange={e => updateField('description', e.target.value)} rows={2} className="text-sm"/>
                </div>
                 <div className="mt-2">
                    <Label className="text-xs font-semibold text-gray-500">Öğrenci Yönergesi</Label>
                    <Textarea value={assignment.instructions} onChange={e => updateField('instructions', e.target.value)} rows={3} className="text-sm"/>
                </div>
            </div>
            
            {/* Questions */}
            <div className="p-6 space-y-4 bg-gray-50/50 flex-grow">
                 {(assignment.questions || []).map((q, index) => (
                    <div key={q.id} className="p-4 border rounded-lg bg-white space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                            <Label className="font-bold">Soru {index + 1}</Label>
                            <div className="flex items-center gap-1">
                                <Input type="number" value={q.points || 10} onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value))} className="w-20 h-8 text-xs text-center"/>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => imageInputRef.current?.click()}><ImageIcon size={16}/></Button>
                                <input type="file" ref={imageInputRef} onChange={(e) => handleImageUpload(e, q.id)} className="hidden" accept="image/*" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => deleteQuestion(q.id)}><Trash2 size={16}/></Button>
                            </div>
                        </div>
                         {isUploading === q.id && <Loader2 className="animate-spin" />}
                         {q.image && (
                            <div className="relative group/image">
                                <img src={q.image} alt="" className="rounded-md border max-h-48" />
                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100" onClick={() => handleDeleteImage(q.id, q.image!)}><X size={14}/></Button>
                            </div>
                         )}
                        <Textarea value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} placeholder="Soru metnini yazın..." />
                        
                        {q.type === 'multiple-choice' && (
                            <div className="space-y-2">
                                {(q.options || []).map((opt, i) => (
                                     <div key={i} className="flex items-center gap-2">
                                        <Label htmlFor={`option-${i}`} className='p-2 bg-slate-100 rounded-md'>{String.fromCharCode(65 + i)})</Label>
                                        <Input id={`option-${i}`} value={opt} onChange={e => { const newOpts = [...(q.options || [])]; newOpts[i] = e.target.value; updateQuestion(q.id, 'options', newOpts); }}/>
                                        <RadioGroup value={q.correctAnswer === opt ? 'correct' : ''} onValueChange={() => updateQuestion(q.id, 'correctAnswer', opt)}>
                                            <RadioGroupItem value="correct" id={`${q.id}-${i}`} />
                                        </RadioGroup>
                                     </div>
                                ))}
                            </div>
                        )}
                        {/* Diğer soru tipleri için editörler buraya eklenebilir */}
                    </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-dashed" onClick={() => addQuestion('multiple-choice')}><CheckSquare className="mr-2"/>Test Sorusu Ekle</Button>
                    <Button variant="outline" className="border-dashed" onClick={() => addQuestion('open-ended')}><AlignLeft className="mr-2"/>Açık Uçlu Soru Ekle</Button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-100 border-t grid grid-cols-3 gap-3">
                 <Button variant="outline" onClick={() => onShowRubric(assignment)}><ClipboardList size={14} className="mr-2"/>Kriterler</Button>
                 <Button variant="outline" onClick={() => onPrint(assignment)}><FileDown size={14} className="mr-2" />İndir</Button>
                 <Button onClick={() => onAssign(assignment)} className={`${isPhysics ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-rose-600 hover:bg-rose-700'} text-white`}><Send size={14} className="mr-2"/>Sınıfa Ata</Button>
            </div>
        </div>
    );
};


export const HomeworkLibrary = ({ classId, teacherProfile, classes, students }: { classId: string; teacherProfile: TeacherProfile | null, classes: Class[], students: Student[] }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const { db: localDb, setDb: setLocalDb, loading: dbLoading } = useDatabase();
    
    // State for local editing
    const [localAssignments, setLocalAssignments] = useState<AssignmentTemplate[]>([]);
    
    // Filters and modals
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    // Modal states
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [rubricModalOpen, setRubricModalOpen] = useState(false);
    const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
    const [assignSettingsModalOpen, setAssignSettingsModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [assignDetails, setAssignDetails] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [rubrics, setRubrics] = useState<any>(initialRubricDefinitions);

    // Sync local state with data from useDatabase
    useEffect(() => {
        if (!dbLoading) {
            setLocalAssignments([...assignmentsData, ...(localDb.performanceAssignments || [])]);
        }
    }, [localDb.performanceAssignments, dbLoading]);
    
    const favorites = useMemo(() => localDb.performanceFavorites || [], [localDb.performanceFavorites]);

    const handleUpdateAssignment = (id: number, updatedData: Partial<AssignmentTemplate>) => {
        setLocalAssignments(prev =>
            prev.map(a => {
                if (a.id === id) {
                    // Create a new object with the updates
                    const updatedAssignment = { ...a, ...updatedData };
                    // If the original assignment was not custom, this edit makes it custom.
                    if (!a.isCustom) {
                        updatedAssignment.isCustom = true;
                    }
                    return updatedAssignment;
                }
                return a;
            })
        );
    };

    const handleDeleteAssignment = (id: number) => {
        const assignmentToDelete = localAssignments.find(a => a.id === id);
        if (assignmentToDelete && !assignmentToDelete.isCustom) {
            toast({ title: 'Silinemez', description: 'Varsayılan ödevler silinemez.', variant: 'destructive'});
            return;
        }
        setLocalAssignments(prev => prev.filter(a => a.id !== id));
        toast({ title: 'Ödev Silindi', description: 'Değişiklikleri kaydetmeyi unutmayın.'});
    };
    
    const handleAddNewAssignment = () => {
        const newAssignment: AssignmentTemplate = {
            id: Date.now(),
            title: 'Yeni Ödev Taslağı',
            description: '',
            instructions: '',
            grade: parseInt(gradeFilter) || 9,
            subject: (subjectFilter as any) || 'physics',
            formats: 'PDF, Word',
            size: '10 MB',
            questions: [],
            isCustom: true
        };
        setLocalAssignments(prev => [newAssignment, ...prev]);
        toast({ title: 'Yeni Ödev Taslağı Oluşturuldu'});
    };

    const handleSaveToLibrary = () => {
        const customAssignments = localAssignments.filter(a => a.isCustom);
        setLocalDb(prev => ({
            ...prev,
            performanceAssignments: customAssignments
        }));
        toast({title: "Kütüphane Kaydedildi!", description: "Tüm değişiklikleriniz kaydedildi."})
    };
    
    // Other functions (toggleFavorite, handleAssignClick, etc.) remain largely the same
    // but operate on the local `localAssignments` state.
    const toggleFavorite = (id: number) => {
        const newFavorites = favorites.includes(id) ? favorites.filter(fid => fid !== id) : [...favorites, id];
        setLocalDb(prev => ({...prev, performanceFavorites: newFavorites}));
    };

    const filteredAssignments = useMemo(() => localAssignments.filter(item => {
        if (showFavoritesOnly) return favorites.includes(item.id);
        if (gradeFilter === '' || subjectFilter === '') return false;
        const gradeMatch = item.grade === parseInt(gradeFilter);
        const subjectMatch = item.subject === subjectFilter;
        return gradeMatch && subjectMatch;
    }), [localAssignments, gradeFilter, subjectFilter, showFavoritesOnly, favorites]);

    const hasSelection = (gradeFilter !== '' && subjectFilter !== '') || showFavoritesOnly;

    // Functions to open modals
    const handleAssignClick = (assignment: any) => { setSelectedAssignment(assignment); setAssignSettingsModalOpen(true); };
    const handleShowRubric = (assignment: any) => { setSelectedAssignment(assignment); setRubricModalOpen(true); };
    const handlePrintAssignment = (assignment: any) => { setSelectedAssignment(assignment); setPrintModalOpen(true); };

    const handleSaveNewRubric = (newRubric: any) => {
        const key = `custom_${Date.now()}`;
        setRubrics(prev => ({ ...prev, [key]: newRubric }));
    };
    const handleSaveRubric = (key: string, rubric: any) => {
        setRubrics(prev => ({ ...prev, [key]: rubric }));
        toast({title: 'Kriterler Güncellendi'});
    };
    const handleAssignConfirm = async (details: { studentIds: string[], date: string, type: 'performance' | 'project' }) => {
        if (!db || !selectedAssignment || !students || !teacherProfile) {
            toast({ title: 'Hata', description: 'Gerekli bilgiler yüklenemedi.', variant: 'destructive' });
            return;
        }

        const { studentIds, date, type } = details;
        const rubricType = getRubricType(selectedAssignment.formats);
        const assignedRubric = rubrics[rubricType] || null;

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
                const homeworkDocData = {
                    classId: classId,
                    text: selectedAssignment.title,
                    instructions: selectedAssignment.instructions,
                    assignedDate: new Date().toISOString(),
                    dueDate: date ? new Date(date).toISOString() : null,
                    teacherName: teacherProfile.name,
                    lessonName: teacherProfile.branch,
                    rubric: assignedRubric ? assignedRubric.items : null,
                    assignmentType: type, // This is crucial
                    assignedStudents: studentsByClass[classId],
                    seenBy: [],
                    questions: selectedAssignment.questions || [],
                    file: selectedAssignment.file || null,
                };
                
                const cleanDoc = JSON.parse(JSON.stringify(homeworkDocData));
                
                const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
                const newDocRef = doc(homeworksColRef); // Auto-generate ID
                batch.set(newDocRef, cleanDoc);
            }

            await batch.commit();
            setAssignSettingsModalOpen(false); // Close the modal
            setSuccessModalOpen(true); // Open success modal
            setAssignDetails({
                assignedTo: `${studentIds.length} öğrenci`,
                date: date ? format(new Date(date), 'dd MMMM yyyy', { locale: tr }) : 'Tarih yok'
            });

        } catch (error) {
            console.error("Assignment error:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı.' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                 <LibraryHeader 
                    onAddNewAssignment={handleAddNewAssignment}
                    onOpenAddRubric={() => setAddRubricModalOpen(true)} 
                    history={history}
                    toggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    showFavoritesOnly={showFavoritesOnly}
                />
                <main>
                    {!hasSelection && <StatsCards total={localAssignments.length} assignedCount={history.length} favoritesCount={favorites.length} />}
                    <div className="flex justify-between items-center mb-6 mt-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Performans Ödevleri (2025-2026 Maarif Modeli)</h2>
                            <p className="text-gray-500">Yıllık plana uygun performans ödevlerini filtreleyin, düzenleyin ve atayın.</p>
                        </div>
                        <Button onClick={handleSaveToLibrary}><Save className="mr-2"/>Kütüphaneyi Kaydet</Button>
                    </div>

                    {!showFavoritesOnly && <FilterBar gradeFilter={gradeFilter} subjectFilter={subjectFilter} setGradeFilter={setGradeFilter} setSubjectFilter={setSubjectFilter} disabled={showFavoritesOnly} />}
                    {showFavoritesOnly && <div className="mb-4 text-red-600 font-semibold">Favoriler gösteriliyor...</div>}

                    {!hasSelection ? <EmptyState /> : (
                         <div className="space-y-8">
                             {filteredAssignments.map(item => (
                                 <EditableAssignment
                                     key={item.id}
                                     assignment={item}
                                     onUpdate={handleUpdateAssignment}
                                     onDelete={handleDeleteAssignment}
                                     onAssign={handleAssignClick}
                                     onShowRubric={handleShowRubric}
                                     onPrint={handlePrintAssignment}
                                     isFavorite={favorites.includes(item.id)}
                                     onToggleFavorite={toggleFavorite}
                                 />
                             ))}
                         </div>
                    )}
                </main>
            </div>
            
            {/* All modals remain here */}
            <AssignSettingsModal isOpen={assignSettingsModalOpen} onClose={() => setAssignSettingsModalOpen(false)} assignment={selectedAssignment} onConfirm={handleAssignConfirm} classes={classes} students={students} />
            <SuccessModal isOpen={successModalOpen} onClose={() => setSuccessModalOpen(false)} assignment={selectedAssignment} details={assignDetails} />
            <RubricModal isOpen={rubricModalOpen} onClose={() => setRubricModalOpen(false)} assignment={selectedAssignment} rubrics={rubrics} onAddRubricClick={() => { setRubricModalOpen(false); setAddRubricModalOpen(true); }} onSaveRubric={handleSaveRubric} />
            <AddRubricModal isOpen={addRubricModalOpen} onClose={() => setAddRubricModalOpen(false)} onSave={handleSaveNewRubric} />
            <PrintPreviewModal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} assignment={selectedAssignment} rubrics={rubrics} teacherProfile={teacherProfile} />
        </div>
    );
};