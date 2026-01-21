'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTab } from './ProjectTab';
import { PerformanceHomeworkTab } from './PerformanceHomeworkTab';
import { RegularHomeworkTab } from './RegularHomeworkTab';

export function AllHomeworksTab() {
  return (
    <Tabs defaultValue="performance">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="performance">Performans Ödevleri</TabsTrigger>
        <TabsTrigger value="project">Proje Ödevi</TabsTrigger>
        <TabsTrigger value="regular">Diğer Ödevler</TabsTrigger>
      </TabsList>
      <TabsContent value="performance" className="mt-4">
        <PerformanceHomeworkTab />
      </TabsContent>
      <TabsContent value="project" className="mt-4">
        <ProjectTab />
      </TabsContent>
      <TabsContent value="regular" className="mt-4">
        <RegularHomeworkTab />
      </TabsContent>
    </Tabs>
  );
}
