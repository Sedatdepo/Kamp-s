'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Class, Student, TeacherProfile } from '@/lib/types';
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

export const ProjectLibrary = ({ classId, teacherProfile, classes, students }: { classId: string; teacherProfile: TeacherProfile | null, classes: Class[], students: Student[] }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [rubricModalOpen, setRubricModalOpen] = useState(false);
    const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
    const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [assignSettingsModalOpen, setAssignSettingsModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [assignDetails, setAssignDetails] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    
    const [projects, setProjects] = useState(assignmentsData);
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

    const filteredProjects = projects.filter(item => {
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
        setAssignSettingsModalOpen(true);
    };

    const handleAssignConfirm = async (details: { studentIds: string[], date: string }) => {
        if (!db || !selectedProject) return;
    
        const studentIds = details.studentIds;

        try {
            const batch = writeBatch(db);
    
            for (const studentId of studentIds) {
                const studentRef = doc(db, 'students', studentId);
                 batch.update(studentRef, { 
                    // We are now assigning the ID of the project, not the title.
                    // The student panel will resolve this ID to show the title.
                    assignedLesson: `project_${selectedProject.id}`,
                    hasProject: true,
                 });
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
            toast({variant: 'destructive', title: 'Hata', description: 'Proje atanamadı.'});
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

    const handlePrintProject = (project: any) => {
        setSelectedProject(project);
        setPrintModalOpen(true);
    }

    const handleSaveEditedProject = (updatedFields: any) => {
        setProjects(prev => prev.map(a => 
        a.id === selectedProject.id ? { ...a, ...updatedFields } : a
        ));
    };

    const handleSaveNewProject = (newProject: any) => {
        const projectWithId = {
            ...newProject,
            id: Date.now(), 
            grade: parseInt(newProject.grade)
        };
        setProjects(prev => [projectWithId, ...prev]);
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
                    total={projects.length} 
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
            isOpen={assignSettingsModalOpen}
            onClose={() => setAssignSettingsModalOpen(false)}
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
