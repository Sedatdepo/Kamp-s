'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Class, Student, TeacherProfile, Homework, AssignmentTemplate } from '@/lib/types';
import { doc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { assignmentsData, initialRubricDefinitions, getRubricType } from '@/lib/maarif-modeli-odevleri';
import { LibraryHeader } from './LibraryHeader';
import { StatsCards } from './StatsCards';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { ProjectCard } from './ProjectCard';
import { AssignProjectModal } from './AssignProjectModal';
import { SuccessModal } from './SuccessModal';
import { RubricModal } from './RubricModal';
import { AddRubricModal } from './AddRubricModal';
import { EditProjectModal } from './EditProjectModal';
import { CreateProjectModal } from './CreateProjectModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { Heart, Filter } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';

export const ProjectLibrary = ({ classId, teacherProfile, classes, students }: { classId: string; teacherProfile: TeacherProfile | null, classes: Class[], students: Student[] }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const { db: localDb, setDb: setLocalDb } = useDatabase();
    const { projectAssignments = [], projectFavorites = [] } = localDb;
    
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [rubricModalOpen, setRubricModalOpen] = useState(false);
    const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
    const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [assignProjectModalOpen, setAssignProjectModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [assignDetails, setAssignDetails] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [favorites, setFavorites] = useState<number[]>(projectFavorites);
    const [rubrics, setRubrics] = useState<any>(initialRubricDefinitions);

    const allProjects = useMemo(() => [...assignmentsData, ...projectAssignments], [projectAssignments]);

    useEffect(() => {
        setLocalDb(prev => ({...prev, projectFavorites: favorites}));
    }, [favorites, setLocalDb]);

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

    const filteredProjects = allProjects.filter(item => {
        if (showFavoritesOnly) {
            return favorites.includes(item.id);
        }
        if (gradeFilter === '' || subjectFilter === '') return false;
        
        const gradeMatch = item.grade === parseInt(gradeFilter);
        const subjectMatch = item.subject === subjectFilter;
        return gradeMatch && subjectMatch;
    });

    const handleAssignClick = (project: any) => {
        setSelectedProject(project);
        setAssignProjectModalOpen(true);
    };

    const handleAssignConfirm = async (details: { studentIds: string[], date: string }) => {
        if (!db || !selectedProject) return;
    
        const { studentIds, date } = details;
        const rubricType = getRubricType(selectedProject.formats);
        const rubric = rubrics[rubricType];
    
        try {
            const batch = writeBatch(db);
    
            const studentsByClass: { [classId: string]: string[] } = {};
            studentIds.forEach(studentId => {
                const student = students.find(s => s.id === studentId);
                if (student && student.classId) {
                    if (!studentsByClass[student.classId]) {
                        studentsByClass[student.classId] = [];
                    }
                    studentsByClass[student.classId].push(studentId);
                }
            });
    
            for (const classId in studentsByClass) {
                for (const studentId of studentsByClass[classId]) {
                   const studentRef = doc(db, 'students', studentId);
                   batch.update(studentRef, { 
                       assignedLesson: `project_${selectedProject.id}`,
                       hasProject: true 
                   });
               }
               
                const newHomeworkDoc: Partial<Homework> = {
                    classId: classId,
                    text: selectedProject.title,
                    assignedDate: new Date().toISOString(),
                    dueDate: date ? new Date(date).toISOString() : undefined,
                    teacherName: teacherProfile?.name,
                    lessonName: teacherProfile?.branch,
                    rubric: rubric.items, 
                    assignedStudents: studentsByClass[classId],
                    seenBy: [],
                    instructions: selectedProject.instructions,
                    assignmentType: 'project',
                };
                const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
                const newDocRef = doc(homeworksColRef, `project_${selectedProject.id}`);
                batch.set(newDocRef, newHomeworkDoc);
            }
    
            await batch.commit();
            
            const newHistoryItem = {
                title: selectedProject.title,
                class: `${details.studentIds.length} öğrenci`,
                date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
    
            setHistory(prev => [newHistoryItem, ...prev]);
            setAssignDetails({assignedTo: `${details.studentIds.length} öğrenci`, date: details.date});
            setSuccessModalOpen(true);
    
        } catch (error) {
            console.error("Assignment Error:", error);
            toast({variant: 'destructive', title: 'Hata', description: 'Proje atanamadı. Lütfen konsolu kontrol edin.'});
        }
    };
    
    const handleShowRubric = (project: any) => {
        setSelectedProject(project);
        setRubricModalOpen(true);
    };

    const handleEditProject = (project: any) => {
        setSelectedProject(project);
        setEditProjectModalOpen(true);
    };

    const handleDeleteProject = (projectId: number) => {
        const projectToDelete = allProjects.find(p => p.id === projectId);
        if (projectToDelete && !projectToDelete.isCustom) {
            toast({ title: 'Silinemez', description: 'Varsayılan projeler silinemez.', variant: 'destructive'});
            return;
        }

        setLocalDb(prev => {
            const updatedProjects = (prev.projectAssignments || []).filter(p => p.id !== projectId);
            const updatedFavorites = (prev.projectFavorites || []).filter(id => id !== projectId);
            return {
                ...prev,
                projectAssignments: updatedProjects,
                projectFavorites: updatedFavorites
            }
        });
        toast({ title: 'Proje Silindi', description: 'Proje kütüphaneden kaldırıldı.', variant: 'destructive'});
    };


    const handlePrintProject = (project: any) => {
        setSelectedProject(project);
        setPrintModalOpen(true);
    }

    const handleSaveEditedProject = (updatedFields: any) => {
        const projectToUpdate = allProjects.find(a => a.id === selectedProject.id);
        if (projectToUpdate && !projectToUpdate.isCustom) {
            toast({ title: 'Düzenlenemez', description: 'Varsayılan projeler düzenlenemez.', variant: 'destructive'});
            return;
        }

        setLocalDb(prev => ({
            ...prev,
            projectAssignments: (prev.projectAssignments || []).map(p => 
                p.id === selectedProject.id ? { ...p, ...updatedFields, id: selectedProject.id } : p
            ),
        }));
        setEditProjectModalOpen(false);
        toast({title: 'Proje Güncellendi'});
    };

    const handleSaveNewProject = (newProject: any) => {
        const projectWithId: AssignmentTemplate = {
            ...newProject,
            id: Date.now(), 
            grade: parseInt(newProject.grade),
            isCustom: true,
        };
        setLocalDb(prev => ({
            ...prev,
            projectAssignments: [...(prev.projectAssignments || []), projectWithId]
        }));
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
                onOpenCreateProject={() => setCreateProjectModalOpen(true)}
                history={history}
                toggleFavoritesOnly={toggleFavoritesOnly}
                showFavoritesOnly={showFavoritesOnly}
            />
            
            <main>
            <div className="mb-8">
                {!hasSelection && (
                <StatsCards 
                    total={allProjects.length} 
                    assignedCount={history.length} 
                    favoritesCount={favorites.length} 
                />
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Performans Projeleri (2025-2026 Maarif Modeli)</h2>
                <p className="text-gray-500">
                Yüklediğiniz yıllık planlardaki güncel tema ve kazanımlara uygun, araştırma odaklı performans projelerini filtreleyin ve özelleştirin.
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
                <span className="text-red-700 font-medium flex items-center gap-2"><Heart className="fill-current" size={18}/> Favori Projeleriniz Listeleniyor</span>
                <button onClick={toggleFavoritesOnly} className="text-sm text-red-600 hover:underline">Tümüne Dön</button>
                </div>
            )}

            {!hasSelection ? (
                <EmptyState />
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(item => (
                    <ProjectCard 
                    key={item.id} 
                    item={item} 
                    onAssign={handleAssignClick}
                    onShowRubric={handleShowRubric}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                    onPrint={handlePrintProject}
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
                    ? "Henüz favorilere eklediğiniz bir proje yok." 
                    : "Seçili filtrelere uygun proje yok. Lütfen filtreleri değiştirin."}
                </p>
                </div>
            )}
            </main>
        </div>

        <AssignProjectModal 
            isOpen={assignProjectModalOpen}
            onClose={() => setAssignProjectModalOpen(false)}
            project={selectedProject}
            onConfirm={handleAssignConfirm}
            classes={classes}
            students={students}
        />

        <SuccessModal 
            isOpen={successModalOpen} 
            onClose={() => setSuccessModalOpen(false)} 
            project={selectedProject}
            details={assignDetails}
        />

        <RubricModal 
            isOpen={rubricModalOpen}
            onClose={() => setRubricModalOpen(false)}
            project={selectedProject}
            rubrics={rubrics}
            onAddRubricClick={() => setAddRubricModalOpen(true)}
            onSaveRubric={handleSaveRubric}
        />

        <AddRubricModal 
            isOpen={addRubricModalOpen}
            onClose={() => setAddRubricModalOpen(false)}
            onSave={handleSaveNewRubric}
        />

        <EditProjectModal 
            isOpen={editProjectModalOpen}
            onClose={() => setEditProjectModalOpen(false)}
            project={selectedProject}
            onSave={handleSaveEditedProject}
        />

        <CreateProjectModal
            isOpen={createProjectModalOpen}
            onClose={() => setCreateProjectModalOpen(false)}
            onSave={handleSaveNewProject}
        />

        <PrintPreviewModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            project={selectedProject}
        />
        </div>
    );
};
