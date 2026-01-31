'use client';

import React, { useMemo } from 'react';
import { BookOpen, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KAZANIMLAR as EDEBIYAT_KAZANIMLAR } from '@/lib/kazanimlar';
import { ALL_PLANS } from '@/lib/plans';

export default function KazanımlarTab() {

    const FIZIK_KAZANIMLAR = useMemo(() => {
        const fizikPlanData = ALL_PLANS.Fizik?.data;
        if (!fizikPlanData) return [];

        return Object.keys(fizikPlanData).map(grade => {
            const gradeData = fizikPlanData[grade].data;
            
            const groupedByUnit = gradeData.reduce((acc: { [key: string]: { [key: string]: Set<string> } }, week: any) => {
                if (!week.unit || !week.topic || week.isBreak || !week.learningOutcome || week.learningOutcome.includes('Devamı...')) {
                    return acc;
                }
                
                if (!acc[week.unit]) {
                    acc[week.unit] = {};
                }
                
                if (!acc[week.unit][week.topic]) {
                    acc[week.unit][week.topic] = new Set();
                }
                
                const cleanOutcome = week.learningOutcome.replace(/^[A-ZİÖÜÇĞŞ]+\.\d+\.\d+\.\d+\.\s*/, '');
                acc[week.unit][week.topic].add(cleanOutcome);
                
                return acc;
            }, {});

            const konular = Object.entries(groupedByUnit).map(([unitName, topics]) => {
                const subKonular = Object.entries(topics).map(([topicName, outcomesSet]) => ({
                    konu: topicName,
                    kazanimlar: Array.from(outcomesSet),
                }));
                // We'll use the main unit name as the 'konu' for the accordion trigger
                return {
                    konu: unitName,
                    // We can flatten the kazanımlar for simplicity if sub-topics aren't displayed separately
                    kazanimlar: subKonular.flatMap(sk => sk.kazanimlar),
                };
            });
            
            return {
                unite: `${grade}. Sınıf`,
                konular: konular.filter(k => k.kazanimlar.length > 0),
            };
        });
    }, []);

    const KAZANIMLAR = useMemo(() => ({
        "Fizik": FIZIK_KAZANIMLAR,
        "Edebiyat": EDEBIYAT_KAZANIMLAR.Edebiyat
    }), [FIZIK_KAZANIMLAR]);


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
                                            {unite.konular ? (
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
                                            ) : unite.kazanimlar ? (
                                                <div className="pl-4 border-l">
                                                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                                                        {unite.kazanimlar.map((kazanimText: string, i: number) => (
                                                            <li key={i} className="whitespace-pre-line">{kazanimText}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}
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
