
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, RosterItem } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users } from 'lucide-react';

export function DutyRosterTab() {
  const { appUser } = useAuth();
  if (appUser?.type !== 'student') return null;

  const studentId = appUser.data.id;
  const classId = appUser.data.classId;

  const classQuery = useMemo(() => classId ? doc(db, 'classes', classId) : null, [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`class-duty-roster-${classId}`, classQuery);
  const currentClass = useMemo(() => classData.length > 0 ? classData[0] : null, [classData]);
  const dutyRoster = useMemo(() => currentClass?.dutyRoster || [], [currentClass]);

  if (classLoading) {
    return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  if (!dutyRoster || dutyRoster.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Users /> Nöbetçi Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Henüz bir nöbetçi listesi oluşturulmadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Users /> Nöbetçi Listesi</CardTitle>
        <CardDescription>Sınıf nöbetçi çizelgesini aşağıda görebilirsin. Kendi nöbet günlerin vurgulanmıştır.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[70vh] overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Gün</TableHead>
                <TableHead>Nöbetçi Öğrenciler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dutyRoster.map((item, idx) => {
                const isMyDuty = item.studentIds.includes(studentId);
                return (
                  <TableRow key={idx} className={isMyDuty ? "bg-primary/10" : ""}>
                    <TableCell className={isMyDuty ? "font-bold" : ""}>{item.date}</TableCell>
                    <TableCell className={isMyDuty ? "font-bold" : ""}>{item.day}</TableCell>
                    <TableCell className={`font-medium ${isMyDuty ? "text-primary font-extrabold" : ""}`}>
                      {item.student}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
