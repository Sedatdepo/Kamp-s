'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, writeBatch, collection, query, where } from 'firebase/firestore';
import { Student, Class, SociogramQuestion, SociogramSurvey, SociogramAnalysisOutput } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Share2, Users, User, UserCheck, UserX, Star, BookOpen, Coffee, FileDown, CheckCircle, AlertTriangle, Wand2, Lightbulb, Heart, Group, Frown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportSociogramToRtf } from '@/lib/word-export';
import { analyzeSociogram } from '@/ai/flows/analyze-sociogram-flow';
import { useCollection, useMemoFirebase } from '@/firebase';


interface SociogramTabProps {
  students: Student[];
  currentClass: Class | null;
}

const DEFAULT_SURVEY: SociogramSurvey = {
    title: 'Sınıf Sosyal İlişki Analizi',
    questions: [
      { id: 1, text: 'Sınıfta en iyi anlaştığın 3 arkadaşın kim?', type: 'positive', maxSelections: 3, active: true, icon: 'Users' },
      { id: 4, text: 'Teneffüste kiminle vakit geçirmek istersin?', type: 'positive', maxSelections: 2, active: true, icon: 'Coffee' },
      { id: 5, text: 'Ders çalışırken anlamadığın bir konuyu kime sorarsın?', type: 'positive', maxSelections: 2, active: true, icon: 'BookOpen' },
      { id: 2, text: 'Sınıfta yan yana oturmak istemediğin kişiler kim?', type: 'negative', maxSelections: 2, active: true, icon: 'UserX' },
      { id: 3, text: 'Sınıf başkanı olmasa bile sınıfı kim yönetir?', type: 'leadership', maxSelections: 1, active: true, icon: 'Star' },
    ],
};

const SociogramGraph = ({ students, relationships }: { students: Student[], relationships: any[] }) => {
    const width = 600;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;

    const nodes = students.map((student, index) => {
      const angle = (index / students.length) * 2 * Math.PI - (Math.PI / 2);
      return {
        ...student,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    return (
      <div className="w-full overflow-x-auto flex justify-center bg-white rounded-xl border p-4">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker id="arrow-positive" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
            </marker>
            <marker id="arrow-negative" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
             <marker id="arrow-mutual" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          {relationships.map((rel, idx) => {
            const source = nodes.find(n => n.id === rel.from);
            const target = nodes.find(n => n.id === rel.to);
            if (!source || !target) return null;
            const isMutual = rel.mutual;
            return (
              <line
                key={idx}
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke={rel.type === 'negative' ? '#ef4444' : isMutual ? '#3b82f6' : '#10b981'}
                strokeWidth={isMutual ? 2.5 : 1.5}
                strokeDasharray={rel.type === 'negative' ? '5,5' : '0'}
                markerEnd={`url(#arrow-${rel.type === 'negative' ? 'negative' : isMutual ? 'mutual' : 'positive'})`}
                opacity={0.6}
              />
            );
          })}

          {nodes.map(node => {
            return (
              <g key={node.id} className="cursor-pointer transition-transform hover:scale-110">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={20}
                  fill={node.gender === 'F' ? '#fbcfe8' : '#bfdbfe'}
                  stroke={'#fff'}
                  strokeWidth={2}
                  className="shadow-sm"
                />
                <text x={node.x} y={node.y} dy="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">
                  {node.name.charAt(0)}{node.name.split(' ')[1]?.charAt(0)}
                </text>
                <text x={node.x} y={node.y + 35} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {node.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
};

export function SociogramTab({ students, currentClass }: SociogramTabProps) {
  const { appUser, db } = useAuth();
  const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<SociogramSurvey>(currentClass?.sociogramSurvey || DEFAULT_SURVEY);
  const [aiAnalysis, setAiAnalysis] = useState<SociogramAnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
    if (currentClass && !currentClass.sociogramSurvey && db) {
        const classRef = doc(db, 'classes', currentClass.id);
        updateDoc(classRef, { sociogramSurvey: DEFAULT_SURVEY })
            .then(() => {
                setSurvey(DEFAULT_SURVEY);
                toast({ title: 'Sosyogram Anketi Oluşturuldu', description: 'Bu sınıf için varsayılan anket soruları eklendi.'});
            })
            .catch(error => {
                console.error("Failed to initialize sociogram survey:", error);
                toast({ variant: 'destructive', title: 'Hata', description: 'Varsayılan anket oluşturulamadı.'});
            });
    } else if (currentClass?.sociogramSurvey) {
        setSurvey(currentClass.sociogramSurvey);
    }
  }, [currentClass, db, toast]);


  const handleToggleActive = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    try {
      await updateDoc(classRef, { isSociogramActive: checked });
      toast({
        title: 'Başarılı',
        description: `Sosyogram seçimi öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.' });
    }
  };
  
  const handleSurveyChange = async (newSurvey: SociogramSurvey) => {
      setSurvey(newSurvey);
      if(!currentClass || !db) return;
      const classRef = doc(db, 'classes', currentClass.id);
      await updateDoc(classRef, { sociogramSurvey: newSurvey });
  }

  const analysis = useMemo(() => {
    const whoChoseWhom: Record<string, {pos: string[], neg: string[], lead: string[]}> = {};
    const timesChosen: Record<string, {pos: number, neg: number, lead: number}> = {};

    students.forEach(student => {
      timesChosen[student.id] = { pos: 0, neg: 0, lead: 0 };
      whoChoseWhom[student.id] = { pos: [], neg: [], lead: [] };
    });

    students.forEach(student => {
      student.positiveSelections?.forEach(id => {
        if (timesChosen[id]) {
            timesChosen[id].pos++;
            whoChoseWhom[id].pos.push(student.name);
        }
      });
      student.negativeSelections?.forEach(id => {
        if (timesChosen[id]) {
            timesChosen[id].neg++;
            whoChoseWhom[id].neg.push(student.name);
        }
      });
      student.leadershipSelections?.forEach(id => {
        if (timesChosen[id]) {
            timesChosen[id].lead++;
            whoChoseWhom[id].lead.push(student.name);
        }
      });
    });

    const popular = Object.entries(timesChosen)
      .sort(([, a], [, b]) => (b.pos + b.lead) - (a.pos + a.lead))
      .slice(0, 5)
      .map(([id, count]) => ({ student: students.find(s => s.id === id)!, ...count }));

    const rejected = Object.entries(timesChosen)
      .sort(([, a], [, b]) => b.neg - a.neg)
      .slice(0, 5)
      .filter(([, count]) => count.neg > 0)
      .map(([id, count]) => ({ student: students.find(s => s.id === id)!, ...count }));

    const isolated = students.filter(s => (timesChosen[s.id]?.pos || 0) === 0 && (s.positiveSelections?.length || 0) === 0);
    
    const relationships = students.flatMap(student => [
        ...(student.positiveSelections || []).map(toId => ({ from: student.id, to: toId, type: 'positive', mutual: (students.find(s => s.id === toId)?.positiveSelections || []).includes(student.id) })),
        ...(student.negativeSelections || []).map(toId => ({ from: student.id, to: toId, type: 'negative' })),
    ]);

    return { popular, isolated, rejected, relationships };
  }, [students]);

  const handleExport = () => {
    if (!currentClass || !students || !teacherProfile) return;
    exportSociogramToRtf({ students, analysis, currentClass, teacherProfile, survey });
  }

  const handleAnalyzeWithAI = async () => {
      setIsAnalyzing(true);
      setAiAnalysis(null);
      const relationships = students.flatMap(student => [
        ...(student.positiveSelections || []).map(toId => ({ from: student.name, to: students.find(s => s.id === toId)?.name || '', type: 'positive' })),
        ...(student.negativeSelections || []).map(toId => ({ from: student.name, to: students.find(s => s.id === toId)?.name || '', type: 'negative' })),
        ...(student.leadershipSelections || []).map(toId => ({ from: student.name, to: students.find(s => s.id === toId)?.name || '', type: 'leadership' }))
      ]);

      try {
          const result = await analyzeSociogram({
              studentNames: students.map(s => s.name),
              relationships: relationships.filter(r => r.to) as any,
          });
          setAiAnalysis(result);
      } catch (error) {
          console.error("AI Analysis failed:", error);
          toast({ variant: 'destructive', title: 'Analiz Başarısız', description: 'Yapay zeka ile iletişim kurulamadı.' });
      } finally {
          setIsAnalyzing(false);
      }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Yönetim Paneli</CardTitle>
            <CardDescription>Anketi aktif edin ve soruları yönetin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 p-3 bg-muted rounded-lg">
              <Label htmlFor="sociogram-toggle" className="font-semibold">
                Sosyogram Seçimi {currentClass?.isSociogramActive ? 'Aktif' : 'Pasif'}
              </Label>
              <Switch 
                  id="sociogram-toggle" 
                  checked={currentClass?.isSociogramActive || false}
                  onCheckedChange={handleToggleActive}
                  disabled={!currentClass}
              />
            </div>
            {survey.questions.map((q, i) => (
                <div key={q.id} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
                     <Label htmlFor={`q-active-${q.id}`} className="text-sm font-medium">{q.text}</Label>
                     <Switch 
                        id={`q-active-${q.id}`}
                        checked={q.active}
                        onCheckedChange={(checked) => {
                            const newQuestions = [...survey.questions];
                            newQuestions[i].active = checked;
                            handleSurveyChange({...survey, questions: newQuestions});
                        }}
                     />
                </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb /> AI Analiz Sonuçları</CardTitle>
                 <CardDescription>Yapay zekanın sınıf dinamikleri hakkındaki yorumları.</CardDescription>
                 <Button onClick={handleAnalyzeWithAI} disabled={isAnalyzing} size="sm" className="mt-2">
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    Yapay Zeka ile Yorumla
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm max-h-96 overflow-y-auto">
                 {aiAnalysis ? (
                    <div className="space-y-4">
                        <p className="p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-100">{aiAnalysis.summary}</p>
                        
                        {aiAnalysis.leaders.length > 0 && <div><h4 className="font-bold flex items-center gap-1"><Star size={16} className="text-yellow-500"/>Liderler</h4>{aiAnalysis.leaders.map(l => <p key={l.student}>- <strong>{l.student}:</strong> {l.reason}</p>)}</div>}

                        {aiAnalysis.cliques.length > 0 && <div><h4 className="font-bold flex items-center gap-1"><Group size={16} className="text-green-600"/>Gruplar (Klikler)</h4>{aiAnalysis.cliques.map(c => <p key={c.members.join('-')}>- <strong>{c.members.join(', ')}:</strong> {c.description}</p>)}</div>}

                        {aiAnalysis.risks.length > 0 && <div><h4 className="font-bold flex items-center gap-1"><AlertTriangle size={16} className="text-red-500"/>Risk Grubu</h4>{aiAnalysis.risks.map(r => <p key={r.student}>- <strong>{r.student} ({r.reason}):</strong> {r.recommendation}</p>)}</div>}
                        
                        {aiAnalysis.tensions.length > 0 && <div><h4 className="font-bold flex items-center gap-1"><Frown size={16} className="text-orange-500"/>Gerilimler</h4>{aiAnalysis.tensions.map(t => <p key={t.students.join('-')}>- <strong>{t.students.join(' ↔ ')}:</strong> {t.description}</p>)}</div>}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                        {isAnalyzing ? 'Analiz ediliyor...' : 'Analiz sonuçlarını görmek için butona tıklayın.'}
                    </p>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><UserCheck /> Analiz Sonuçları</CardTitle>
                <Button onClick={handleExport} variant="outline"><FileDown className="mr-2 h-4 w-4"/> Raporu İndir</Button>
            </div>
            <CardDescription>Sınıfın sosyal dinamikleri, yıldızları ve gruplaşmaları.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Öğrenci</TableHead><TableHead>Pozitif Seçim</TableHead><TableHead>Negatif Seçim</TableHead><TableHead>Liderlik Seçimi</TableHead></TableRow></TableHeader>
                <TableBody>
                    {analysis.popular.map(({student, pos, neg, lead}) => (
                        <TableRow key={student?.id}>
                            <TableCell className="font-medium">{student?.name}</TableCell>
                            <TableCell><Badge variant="default" className="bg-green-500">{pos}</Badge></TableCell>
                            <TableCell><Badge variant="destructive">{neg}</Badge></TableCell>
                            <TableCell><Badge variant="default" className="bg-yellow-500">{lead}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {analysis.popular.filter(p => p.pos > 0).length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Henüz seçim yapılmadı.</p>}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>İlişki Ağı Grafiği (Sosyogram)</CardTitle>
            </CardHeader>
            <CardContent>
                <SociogramGraph students={students} relationships={analysis.relationships} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
