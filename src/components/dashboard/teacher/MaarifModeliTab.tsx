'use client';

import React from 'react';
import { BookOpen, Sparkles, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import biologyData from '@/lib/data/curriculum/biyoloji-9.json';

export default function MaarifModeliTab() {
  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-primary text-primary font-bold">
                {biologyData.model}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <BookOpen className="text-primary" />
              {biologyData.subject} - {biologyData.grade}. Sınıf Kazanımları
            </CardTitle>
            <CardDescription>
              tymm.meb.gov.tr adresinden çekilen güncel müfredat verileri.
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Tümünü İndir (RTF)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {biologyData.units.map((unit) => (
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
                  {unit.outcomes.map((outcome) => (
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
                        {outcome.subOutcomes.map((sub, idx) => (
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
  );
}
