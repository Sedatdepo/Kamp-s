'use client';

import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_PLANS } from '@/lib/plans';

export default function KazanımlarTab() {

    const KAZANIMLAR = useMemo(() => {
        const result: { [key: string]: any[] } = {};
        
        for (const subject in ALL_PLANS) {
            const subjectData = ALL_PLANS[subject].data;
            result[subject] = [];
            
            for (const gradeKey in subjectData) {
                const gradePlan = subjectData[gradeKey].data;
                const uniteName = `${gradeKey === '0' ? 'Hazırlık' : gradeKey}. Sınıf`;

                const konularMap = gradePlan.reduce((acc: any, week: any) => {
                    if (week.isBreak || !week.topic || !week.learningOutcome) return acc;
                    
                    if (!acc[week.topic]) {
                        acc[week.topic] = new Set();
                    }
                    
                    const cleanOutcome = week.learningOutcome.replace(/^[A-ZİÖÜÇĞŞ]+\.\\d+\.\\d+\.\\d+\\.\\s*/, '');
                    acc[week.topic].add(cleanOutcome);
                    return acc;
                }, {});

                const konular = Object.keys(konularMap).map(konu => ({
                    konu,
                    kazanimlar: Array.from(konularMap[konu] as Set<string>)
                }));

                result[subject].push({
                    unite: uniteName,
                    konular: konular,
                });
            }
        }
        return result;
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookOpen />
                            Kazanım Kütüphanesi
                        </CardTitle>
                        <CardDescription>Milli Eğitim Bakanlığı müfredatına uygun ders kazanımları.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="Fizik" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="Fizik">Fizik</TabsTrigger>
                        <TabsTrigger value="Edebiyat">Türk Dili ve Edebiyatı</TabsTrigger>
                    </TabsList>
                    
                    {Object.keys(KAZANIMLAR).map(ders => (
                        <TabsContent key={ders} value={ders} className="mt-4">
                            <Accordion type="single" collapsible className="w-full">
                                {(KAZANIMLAR as any)[ders].map((unite: any, uniteIndex: number) => (
                                    <AccordionItem value={`${ders}-${unite.unite}-${uniteIndex}`} key={`${ders}-${unite.unite}-${uniteIndex}`}>
                                        <AccordionTrigger className="text-xl font-bold text-primary hover:no-underline">
                                            {unite.unite}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Accordion type="single" collapsible className="w-full pl-4">
                                                {unite.konular.map((konu: any, konuIndex: number) => (
                                                    <AccordionItem value={`${ders}-${unite.unite}-${konu.konu}-${konuIndex}`} key={`${ders}-${unite.unite}-${konu.konu}-${konuIndex}`}>
                                                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                                            {konu.konu}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pl-4 border-l">
                                                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                                                                {konu.kazanimlar.map((kazanimText: string, i: number) => (
                                                                    <li key={i}>{kazanimText}</li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
