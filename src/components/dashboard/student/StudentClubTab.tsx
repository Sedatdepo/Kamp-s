
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export function StudentClubTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Trophy />
            Kulüp Bilgilerim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">Bu bölüm yapım aşamasındadır. Yakında kulüp bilgilerinizi buradan görebileceksiniz.</p>
        </div>
      </CardContent>
    </Card>
  );
}
