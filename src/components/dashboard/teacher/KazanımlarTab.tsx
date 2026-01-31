'use client';

import React from 'react';
import { BookOpen, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { KAZANIMLAR } from '@/lib/kazanimlar';

export default function KazanımlarTab() {
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
                                {KAZANIMLAR[ders].map((unite: any) => (
                                    <AccordionItem value={`${ders}-${unite.unite}`} key={`${ders}-${unite.unite}`}>
                                        <AccordionTrigger className="text-xl font-bold text-primary hover:no-underline">
                                            {unite.unite}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {unite.konular ? (
                                                <Accordion type="single" collapsible className="w-full pl-4">
                                                    {unite.konular.map((konu: any) => (
                                                        <AccordionItem value={`${ders}-${unite.unite}-${konu.konu}`} key={`${ders}-${unite.unite}-${konu.konu}`}>
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
