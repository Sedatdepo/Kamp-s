'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2, FileDown } from 'lucide-react';
import { Student, Criterion, TeacherProfile, Class, ActiveTerm, GradingScores } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportGradingToRtf } from '@/lib/word-export';

interface CriteriaGradingTableProps {
  students: Student[];
  criteria: Criterion[];
  scoreKey: 'scores1' | 'scores2' | 'projectScores' | 'behaviorScores';
  activeTerm: ActiveTerm;
  onScoresChange: (studentId: string, criteriaId: string, value: number | null) => void;
  onTotalScoreChange: (studentId: string, value: number | null) => void;
  onSave: () => void;
  onDeleteAssignment?: (studentId: string) => void; // Optional for project
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

const CriteriaInput = React.memo(({ value, onChange, max, disabled }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, max: number, disabled: boolean }) => (
    <Input
        type="number"
        max={max}
        min={0}
        value={value}
        onChange={onChange}
        className="w-20 mx-auto text-center h-9"
        disabled={disabled}
    />
));
CriteriaInput.displayName = 'CriteriaInput';

const TotalScoreInput = React.memo(({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <Input
        type="number"
        max={100}
        min={0}
        value={value}
        onChange={onChange}
        className="w-24 mx-auto text-center font-bold text-lg h-10 border-2 border-primary/50"
        placeholder='-'
    />
));
TotalScoreInput.displayName = 'TotalScoreInput';


export function CriteriaGradingTable({
  students,
  criteria,
  scoreKey,
  activeTerm,
  onScoresChange,
  onTotalScoreChange,
  onSave,
  onDeleteAssignment,
  teacherProfile,
  currentClass,
}: CriteriaGradingTableProps) {
  
  const handleExport = () => {
    if (!currentClass || !teacherProfile) return;
    
    let activeTab: ActiveGradingTab;
    if (scoreKey === 'scores1') activeTab = 1;
    else if (scoreKey === 'scores2') activeTab = 2;
    else if (scoreKey === 'projectScores') activeTab = 3;
    else activeTab = 4;

    exportGradingToRtf({
        activeTab,
        activeTerm,
        students,
        currentCriteria: criteria,
        currentClass,
        teacherProfile,
    });
  };

  return (
    <div>
        <div className="flex justify-end gap-2 mb-4">
             <Button onClick={handleExport} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Raporu İndir</Button>
            <Button onClick={onSave}><Save className="mr-2 h-4 w-4" /> Tümünü Kaydet</Button>
        </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-secondary z-10">Öğrenci</TableHead>
              {criteria.map(c => (
                <TableHead key={c.id} className="text-center">{c.name} ({c.max} P)</TableHead>
              ))}
              <TableHead className="text-center">Toplam Not</TableHead>
              {onDeleteAssignment && <TableHead className="text-right">İşlemler</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => {
              const termGradesKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
              const termGrades = student[termGradesKey] as GradingScores | undefined;
              const scores = termGrades ? termGrades[scoreKey] : undefined;
              
              let perfGradeKey: 'perf1' | 'perf2' | 'projectGrade' | null = null;
              if (scoreKey === 'scores1') perfGradeKey = 'perf1';
              else if (scoreKey === 'scores2') perfGradeKey = 'perf2';
              else if (scoreKey === 'projectScores') perfGradeKey = 'projectGrade';
              
              const total = perfGradeKey && termGrades?.[perfGradeKey] !== undefined && termGrades?.[perfGradeKey] !== null
                ? termGrades[perfGradeKey]
                : criteria.reduce((sum, c) => sum + (Number(scores?.[c.id]) || 0), 0);
              
              const isManualTotal = perfGradeKey && termGrades?.[perfGradeKey] !== undefined && termGrades?.[perfGradeKey] !== null;


              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    ({student.number}) {student.name}
                  </TableCell>
                  {criteria.map(c => (
                    <TableCell key={c.id} className="text-center">
                      <CriteriaInput
                        value={scores?.[c.id] || ''}
                        onChange={(e) => onScoresChange(student.id, c.id, e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        max={c.max}
                        disabled={isManualTotal}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-lg">
                    <TotalScoreInput
                        value={total ?? ''}
                        onChange={(e) => onTotalScoreChange(student.id, e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    />
                  </TableCell>
                   {onDeleteAssignment && (
                     <TableCell className="text-right">
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                             <Trash2 size={16} />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                             <AlertDialogDescription>
                               {student.name} adlı öğrencinin proje atamasını iptal etmek istediğinizden emin misiniz? Girilen tüm notlar silinecektir.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>İptal</AlertDialogCancel>
                             <AlertDialogAction onClick={() => onDeleteAssignment(student.id)} className="bg-destructive hover:bg-destructive/90">
                               Atamayı İptal Et
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </TableCell>
                   )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
