'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Grade options
const GRADES = [
  { id: '9', name: '9. Sınıf' },
  { id: '10', name: '10. Sınıf' },
  { id: '11', name: '11. Sınıf' },
  { id: '12', name: '12. Sınıf' },
];

// Comprehensive Subject Registry
const SUBJECTS_REGISTRY: Record<string, { id: string, name: string }[]> = {
  '9': [
    { id: 'biology-9', name: 'Biyoloji' },
    { id: 'physics-9', name: 'Fizik' },
    { id: 'chemistry-9', name: 'Kimya' },
    { id: 'math-9', name: 'Matematik' },
    { id: 'literature-9', name: 'Türk Dili ve Edebiyatı' },
    { id: 'geography-9', name: 'Coğrafya' },
    { id: 'history-9', name: 'Tarih' },
  ],
  '10': [
    { id: 'biology-10', name: 'Biyoloji' },
    { id: 'physics-10', name: 'Fizik' },
    { id: 'chemistry-10', name: 'Kimya' },
    { id: 'math-10', name: 'Matematik' },
    { id: 'literature-10', name: 'Türk Dili ve Edebiyatı' },
    { id: 'history-10', name: 'Tarih' },
    { id: 'philosophy-10', name: 'Felsefe' },
  ],
  '11': [
    { id: 'biology-11', name: 'Biyoloji' },
    { id: 'physics-11', name: 'Fizik' },
    { id: 'math-11', name: 'Matematik' },
    { id: 'philosophy-11', name: 'Felsefe' },
  ],
  '12': [
    { id: 'biology-12', name: 'Biyoloji' },
    { id: 'math-12', name: 'Matematik' },
    { id: 'history-12', name: 'İnkılap Tarihi' },
  ],
};

export default function MaarifModeliTab() {
  const [selectedGrade, setSelectedGrade] = useState<string>('9');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('biology-9');
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-select first subject when grade changes
  useEffect(() => {
    const subjects = SUBJECTS_REGISTRY[selectedGrade] || [];
    if (subjects.length > 0 && !subjects.find(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedGrade]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Dynamic import based on selection
        const data = await import(`@/lib/data/curriculum/${selectedSubjectId}.json`);
        setCurriculumData(data.default || data);
      } catch (error) {
        console.error("Failed to load curriculum data:", error);
        setCurriculumData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedSubjectId]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <BookOpen className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline">Müfredat Kütüphanesi</h3>
                <p className="text-sm text-muted-foreground italic">Türkiye Yüzyılı Maarif Modeli kapsamında güncel kazanımlar.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full sm:w-[140px] bg-background">
                  <SelectValue placeholder="Sınıf" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-full sm:w-[220px] bg-background">
                  <SelectValue placeholder="Ders Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {(SUBJECTS_REGISTRY[selectedGrade] || []).map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2 shrink-0">
                <Download className="w-4 h-4" />
                RTF İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Müfredat verileri getiriliyor...</p>
        </div>
      ) : curriculumData ? (
        <Card className="border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-primary/50 text-primary font-bold">
                    {curriculumData.model}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-none">
                    {curriculumData.grade}. Sınıf
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  {curriculumData.subject} Dersi Öğretim Programı
                </CardTitle>
                <CardDescription>
                  Bu programdaki kazanımlar resmi müfredatla %100 uyumludur.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {curriculumData.units.map((unit: any) => (
                <AccordionItem key={unit.id} value={`unit-${unit.id}`} className="border rounded-lg px-4 overflow-hidden">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {unit.id}
                      </div>
                      <span className="font-bold text-lg">{unit.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <div className="space-y-6">
                      {unit.outcomes.map((outcome: any) => (
                        <div key={outcome.code} className="bg-muted/30 p-4 rounded-xl border border-border/50 group hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="space-y-1">
                              <code className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                                {outcome.code}
                              </code>
                              <p className="font-semibold text-base leading-snug">
                                {outcome.statement}
                              </p>
                            </div>
                            <Button size="sm" className="gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Sparkles className="w-4 h-4" />
                              AI Materyal Üret
                            </Button>
                          </div>
                          <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                            {outcome.subOutcomes.map((sub: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                {sub}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 border-t border-dashed flex justify-center">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
                            <FileText className="w-4 h-4" />
                            Bu Ünite İçin Ders Planı Oluştur
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Veri Yüklenemedi</CardTitle>
            <CardDescription>Seçilen dersin müfredatı şu an sistemde bulunamadı veya bir hata oluştu.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button onClick={() => window.location.reload()}>Yeniden Dene</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
