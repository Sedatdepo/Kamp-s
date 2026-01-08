
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function MebClubTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Trophy />
          Öğrenci Kulübü
        </CardTitle>
        <CardDescription>
          Sosyal etkinlik ve öğrenci kulübü yönetimi modülü.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-10 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            Bu modül yakında aktif olacaktır.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
