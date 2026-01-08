'use client';

import React from 'react';
import { BookOpen, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
                <Accordion type="single" collapsible className="w-full">
                    {Object.entries(KAZANIMLAR).map(([ders, uniteler]) => (
                        <AccordionItem value={ders} key={ders}>
                            <AccordionTrigger className="text-xl font-bold text-primary hover:no-underline">
                                {ders}
                            </AccordionTrigger>
                            <AccordionContent>
                                <Accordion type="single" collapsible className="w-full pl-4">
                                    {(uniteler as any[]).map(unite => (
                                        <AccordionItem value={`${ders}-${unite.unite}`} key={unite.unite}>
                                            <AccordionTrigger className="text-lg font-semibold">
                                                {unite.unite}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Accordion type="single" collapsible className="w-full pl-4">
                                                    {unite.konular.map((konu: any) => (
                                                        <AccordionItem value={`${ders}-${unite.unite}-${konu.konu}`} key={konu.konu}>
                                                            <AccordionTrigger className="text-md font-medium hover:no-underline">
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
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}