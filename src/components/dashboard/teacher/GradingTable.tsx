
"use client";

import React, { useMemo } from 'react';
import { Student, Criterion } from '@/lib/types';
import { ActiveGradingTab } from './GradingToolTab';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GradingTableProps {
  activeTab: ActiveGradingTab;
  students: Student[];
  currentCriteria: Criterion[];
  updateStudents: (updatedStudents: Student[]) => Promise<void>;
  termGradesKey: 'term1Grades' | 'term2Grades';
}

export function GradingTable({
  activeTab,
  students,
  currentCriteria,
  updateStudents,
  termGradesKey
}: GradingTableProps) {
    const getScoreTargetKey = (tab: ActiveGradingTab) => {
        switch (tab) {
            case 1: return 'scores1';
            case 2: return 'scores2';
            case 3: return 'projectScores';
            case 4: return 'behaviorScores';
        }
    };
    const scoreKey = getScoreTargetKey(activeTab);

  const calculateTotal = (scores: { [key: string]: number } | undefined) => {
    if (!scores) return 0;
    return currentCriteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
  };
  
  const maxTotal = useMemo(() => currentCriteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0), [currentCriteria]);

  const updateScore = (studentId: string, criteriaId: string, value: string) => {
    const criterion = currentCriteria.find(c => c.id === criteriaId);
    const limit = criterion ? criterion.max : 100;
    let numValue = parseInt(value, 10) || 0;
    if (numValue < 0) numValue = 0;
    if (numValue > limit) numValue = limit;
    
    const updatedStudents = students.map(s => {
        if (s.id === studentId) {
            const currentTermGrades = s[termGradesKey] || {};
            const currentScores = currentTermGrades[scoreKey] || {};
            return {
                 ...s, 
                 [termGradesKey]: {
                    ...currentTermGrades,
                    [scoreKey]: { ...currentScores, [criteriaId]: numValue }
                 }
            };
        }
        return s;
    });
    updateStudents(updatedStudents);
  };

  const distributeTotalScore = (studentId: string, totalStr: string) => {
    let newTotal = parseInt(totalStr, 10);
    if (isNaN(newTotal)) newTotal = 0;
    if (newTotal < 0) newTotal = 0;
    if (newTotal > maxTotal) newTotal = maxTotal;

    const ratio = maxTotal > 0 ? newTotal / maxTotal : 0;
    let newScores: { [key: string]: number } = {};
    let currentSum = 0;

    currentCriteria.forEach(c => {
        let val = Math.round(c.max * ratio);
        newScores[c.id] = val;
        currentSum += val;
    });

    let diff = newTotal - currentSum;
    const sortedIds = [...currentCriteria].sort((a, b) => b.max - a.max).map(c => c.id);
    let i = 0;
    while (diff !== 0 && i < 100) { // Failsafe for infinite loop
        const cId = sortedIds[i % sortedIds.length];
        const maxVal = currentCriteria.find(c => c.id === cId)!.max;
        if (diff > 0 && newScores[cId] < maxVal) { newScores[cId]++; diff--; }
        else if (diff < 0 && newScores[cId] > 0) { newScores[cId]--; diff++; }
        i++;
    }

    const updatedStudents = students.map(s => {
        if (s.id === studentId) {
            const currentTermGrades = s[termGradesKey] || {};
            return { 
                ...s,
                [termGradesKey]: {
                    ...currentTermGrades,
                    [scoreKey]: newScores
                }
            };
        }
        return s;
    });
    updateStudents(updatedStudents);
  };
  
    const toggleProjectAssignment = (studentId: string) => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                return { ...s, hasProject: !s.hasProject };
            }
            return s;
        });
        updateStudents(updatedStudents);
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-emerald-600 font-bold";
        if (score >= 70) return "text-blue-600 font-bold";
        if (score >= 50) return "text-yellow-600 font-bold";
        return "text-red-600 font-bold";
    };

    const visibleStudents = activeTab === 3 ? students.filter(s => s.hasProject) : students;

    if (students.length === 0) {
        return (
            <div className="text-center py-20 px-4 bg-white rounded-2xl shadow-sm border">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500">Bu sınıfta öğrenci bulunmuyor.</p>
                <p className="text-sm text-slate-400 mt-2">Öğrenci eklemek için "Öğrenci Listesi" sekmesine gidin.</p>
            </div>
        )
    }

    if (activeTab === 3 && visibleStudents.length === 0) {
        return (
            <div className="text-center py-20 px-4 bg-white rounded-2xl shadow-sm border border-violet-200">
                <Users size={48} className="mx-auto text-violet-200 mb-4" />
                <p className="text-slate-500 font-medium">Bu sınıfta henüz proje alan öğrenci yok.</p>
                <p className="text-sm text-slate-400 mt-2">Öğrencilere proje atamak için "Proje Dağılımı" sekmesini kullanabilirsiniz.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className={`h-1 w-full ${activeTab === 1 ? 'bg-blue-500' : activeTab === 2 ? 'bg-orange-500' : activeTab === 3 ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="p-4 font-semibold sticky left-0 bg-slate-50 z-10 w-48 min-w-[200px] shadow-sm">Öğrenci</TableHead>
                            {currentCriteria.map(c => <TableHead key={c.id} className="p-4 text-center min-w-[100px]">{c.name.split(' ')[0]} <span className="opacity-50">({c.max})</span></TableHead>)}
                            <TableHead className="p-4 text-center w-24">Toplam</TableHead>
                            {activeTab === 3 && <TableHead className="p-4 w-12 text-center">Kaldır</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleStudents.map(student => {
                            const termGrades = student[termGradesKey];
                            const scores = termGrades ? termGrades[scoreKey] : undefined;
                            const total = calculateTotal(scores);
                            return (
                                <TableRow key={student.id} className="group">
                                    <TableCell className="p-3 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50">{student.name}</TableCell>
                                    {currentCriteria.map(c => (
                                        <TableCell key={`${student.id}-${c.id}`} className="p-2 text-center">
                                            <Input type="number" title={c.name} value={scores?.[c.id] ?? ''} onChange={(e) => updateScore(student.id, c.id, e.target.value)} className="w-16 h-9 p-1.5 text-center bg-slate-50 border-slate-200 rounded-lg focus:ring-blue-500 focus:bg-white font-mono" />
                                        </TableCell>
                                    ))}
                                    <TableCell className="p-3 text-center font-bold">
                                        <Input type="number" min="0" max={maxTotal} className={`w-16 h-9 p-1.5 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 ${getScoreColor(total)}`} value={total} onChange={(e) => distributeTotalScore(student.id, e.target.value)} />
                                    </TableCell>
                                    {activeTab === 3 && (
                                        <TableCell className="p-3 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => toggleProjectAssignment(student.id)} title="Projeyi Kaldır">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
