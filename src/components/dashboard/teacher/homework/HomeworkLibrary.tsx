'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Class, Student, TeacherProfile, Homework } from '@/lib/types';
import { doc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { assignmentsData, initialRubricDefinitions, getRubricType } from '@/lib/maarif-modeli-odevleri';
import { LibraryHeader } from './LibraryHeader';
import { StatsCards } from './StatsCards';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { AssignmentCard } from './AssignmentCard';
import { AssignSettingsModal } from './AssignSettingsModal';
import { SuccessModal } from './SuccessModal';
import { RubricModal } from './RubricModal';
import { AddRubricModal } from './AddRubricModal';
import { EditAssignmentModal } from './EditAssignmentModal';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { Heart, Filter } from 'lucide-react';

export const HomeworkLibrary = ({ classId, teacherProfile, classes, students }: { classId: string; teacherProfile: TeacherProfile | null, classes: Class[], students: Student[] }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [rubricModalOpen, setRubricModalOpen] = useState(false);
    const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
    const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
    const [createAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
    const [assignSettingsModalOpen, setAssignSettingsModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [assignDetails, setAssignDetails] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    
    const [assignments, setAssignments] = useState(assignmentsData);
    const [rubrics, setRubrics] = useState<any>(initialRubricDefinitions);


    const toggleFavorite = (id: number) => {
        setFavorites(prev => 
        prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const toggleFavoritesOnly = () => {
        setShowFavoritesOnly(!showFavoritesOnly);
        if (!showFavoritesOnly) {
        setGradeFilter('');
        setSubjectFilter('');
        }
    };

    const filteredAssignments = assignments.filter(item => {
        if (showFavoritesOnly) {
        return favorites.includes(item.id);
        }
        if (gradeFilter === '' || subjectFilter === '') return false;
        
        const gradeMatch = item.grade === parseInt(gradeFilter);
        const subjectMatch = item.subject === subjectFilter;
        return gradeMatch && subjectMatch;
    });

    const handleAssignClick = (assignment: any) => {
        setSelectedAssignment(assignment);
        setAssignSettingsModalOpen(true);
    };

    const handleAssignConfirm = async (details: { studentIds: string[], date: string, type: 'performance' | 'project' }) => {
        if (!db || !selectedAssignment) return;
    
        const { studentIds, date, type } = details;
        const rubricType = getRubricType(selectedAssignment.formats);
        const rubric = rubrics[rubricType];
    
        try {
            const batch = writeBatch(db);
    
            if (type === 'project') {
                 for (const studentId of studentIds) {
                    const studentRef = doc(db, 'students', studentId);
                    batch.update(studentRef, { 
                        assignedLesson: `project_${selectedAssignment.id}`,
                        hasProject: true,
                    });
                }
            }

            // Group students by class to create separate homework docs for each class
            const studentsByClass: { [classId: string]: string[] } = {};
            studentIds.forEach(studentId => {
                const student = students.find(s => s.id === studentId);
                // Ensure student and classId are valid before proceeding
                if (student && student.classId) {
                    if (!studentsByClass[student.classId]) {
                        studentsByClass[student.classId] = [];
                    }
                    studentsByClass[student.classId].push(studentId);
                } else {
                    console.warn(`Student with ID ${studentId} not found or has no classId.`);
                }
            });
    
            for (const classId in studentsByClass) {
                // Defensive check for classId
                if (typeof classId !== 'string' || classId.trim() === '') {
                    console.error("Invalid classId detected:", classId);
                    continue; // Skip this iteration
                }

                const newHomeworkDoc: Partial<Homework> = {
                    classId: classId,
                    text: selectedAssignment.title,
                    assignedDate: new Date().toISOString(),
                    dueDate: date ? new Date(date).toISOString() : undefined,
                    teacherName: teacherProfile?.name,
                    lessonName: teacherProfile?.branch,
                    rubric: rubric.items,
                    assignedStudents: studentsByClass[classId],
                    seenBy: [],
                    questions: selectedAssignment.questions || [],
                    instructions: selectedAssignment.instructions,
                    assignmentType: type,
                };

                const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
                // For projects, we want a specific ID to find it later.
                const newDocRef = type === 'project' 
                    ? doc(homeworksColRef, `project_${selectedAssignment.id}`)
                    : doc(homeworksColRef);

                batch.set(newDocRef, newHomeworkDoc);
            }
    
            await batch.commit();
            
            const newHistoryItem = {
                title: selectedAssignment.title,
                class: `${details.studentIds.length} öğrenci`,
                date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
    
            setHistory(prev => [newHistoryItem, ...prev]);
            setAssignDetails({assignedTo: `${details.studentIds.length} öğrenci`, date: details.date});
            setSuccessModalOpen(true);
    
        } catch (error) {
            console.error("Assignment Error:", error);
            toast({variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı. Lütfen konsolu kontrol edin.'});
        }
    };
    

    const handleShowRubric = (assignment: any) => {
        setSelectedAssignment(assignment);
        setRubricModalOpen(true);
    };

    const handleEditAssignment = (assignment: any) => {
        setSelectedAssignment(assignment);
        setEditAssignmentModalOpen(true);
    };

    const handleDeleteAssignment = (assignmentId: number) => {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        setFavorites(prev => prev.filter(id => id !== assignmentId));
        toast({ title: 'Ödev Silindi', description: 'Ödev kütüphaneden kaldırıldı.', variant: 'destructive'});
    };

    const handlePrintAssignment = (assignment: any) => {
        setSelectedAssignment(assignment);
        setPrintModalOpen(true);
    }

    const handleSaveEditedAssignment = (updatedFields: any) => {
        setAssignments(prev => prev.map(a => 
        a.id === selectedAssignment.id ? { ...a, ...updatedFields } : a
        ));
    };

    const handleSaveNewAssignment = (newAssignment: any) => {
        const assignmentWithId = {
            ...newAssignment,
            id: Date.now(), 
            grade: parseInt(newAssignment.grade)
        };
        setAssignments(prev => [assignmentWithId, ...prev]);
    };

    const handleSaveNewRubric = (newRubric: any) => {
        const key = `custom_${Date.now()}`;
        setRubrics(prev => ({
        ...prev,
        [key]: newRubric
        }));
    };

    const handleSaveRubric = (key: string, rubric: any) => {
        setRubrics(prev => ({ ...prev, [key]: rubric }));
        toast({title: 'Kriterler Güncellendi', description: 'Değişiklikler bu oturum için kaydedildi.'})
    };

    const hasSelection = (gradeFilter !== '' && subjectFilter !== '') || showFavoritesOnly;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            
            <LibraryHeader 
                onOpenAddRubric={() => setAddRubricModalOpen(true)} 
                history={history}
                toggleFavoritesOnly={toggleFavoritesOnly}
                showFavoritesOnly={showFavoritesOnly}
            />
            
            <main>
            <div className="mb-8">
                {!hasSelection && (
                <StatsCards 
                    total={assignments.length} 
                    assignedCount={history.length} 
                    favoritesCount={favorites.length} 
                />
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Performans Ödevleri (2025-2026 Maarif Modeli)</h2>
                <p className="text-gray-500">
                Yüklediğiniz yıllık planlardaki güncel tema ve kazanımlara uygun, araştırma odaklı performans ödevlerini filtreleyin ve özelleştirin.
                </p>
            </div>

            {!showFavoritesOnly && (
                <FilterBar 
                gradeFilter={gradeFilter}
                subjectFilter={subjectFilter}
                setGradeFilter={setGradeFilter}
                setSubjectFilter={setSubjectFilter}
                disabled={showFavoritesOnly}
                />
            )}

            {showFavoritesOnly && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
                <span className="text-red-700 font-medium flex items-center gap-2"><Heart className="fill-current" size={18}/> Favori Ödevleriniz Listeleniyor</span>
                <button onClick={toggleFavoritesOnly} className="text-sm text-red-600 hover:underline">Tümüne Dön</button>
                </div>
            )}

            {!hasSelection ? (
                <EmptyState />
            ) : filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map(item => (
                    <AssignmentCard 
                    key={item.id} 
                    item={item} 
                    onAssign={handleAssignClick}
                    onShowRubric={handleShowRubric}
                    onEdit={handleEditAssignment}
                    onDelete={handleDeleteAssignment}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                    onPrint={handlePrintAssignment}
                    />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Filter size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
                <p className="text-gray-500">
                    {showFavoritesOnly 
                    ? "Henüz favorilere eklediğiniz bir ödev yok." 
                    : "Seçili filtrelere uygun ödev yok. Lütfen filtreleri değiştirin."}
                </p>
                </div>
            )}
            </main>
        </div>

        <AssignSettingsModal 
            isOpen={assignSettingsModalOpen}
            onClose={() => setAssignSettingsModalOpen(false)}
            assignment={selectedAssignment}
            onConfirm={handleAssignConfirm}
            classes={classes}
            students={students}
        />

        <SuccessModal 
            isOpen={successModalOpen} 
            onClose={() => setSuccessModalOpen(false)} 
            assignment={selectedAssignment}
            details={assignDetails}
        />

        <RubricModal 
            isOpen={rubricModalOpen}
            onClose={() => setRubricModalOpen(false)}
            assignment={selectedAssignment}
            rubrics={rubrics}
            onAddRubricClick={() => setAddRubricModalOpen(true)}
            onSaveRubric={handleSaveRubric}
        />

        <AddRubricModal 
            isOpen={addRubricModalOpen}
            onClose={() => setAddRubricModalOpen(false)}
            onSave={handleSaveNewRubric}
        />

        <EditAssignmentModal 
            isOpen={editAssignmentModalOpen}
            onClose={() => setEditAssignmentModalOpen(false)}
            assignment={selectedAssignment}
            onSave={handleSaveEditedAssignment}
        />

        <CreateAssignmentModal
            isOpen={createAssignmentModalOpen}
            onClose={() => setCreateAssignmentModalOpen(false)}
            onSave={handleSaveNewAssignment}
        />

        <PrintPreviewModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            assignment={selectedAssignment}
        />
        </div>
    );
};
