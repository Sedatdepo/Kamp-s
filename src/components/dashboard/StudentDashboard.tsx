"use client";

import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeTab } from './student/HomeTab';
import { RiskFormTab } from './student/RiskFormTab';
import { InfoFormTab } from './student/InfoFormTab';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function StudentDashboard() {
  const { appUser } = useAuth();

  if (!appUser || appUser.type !== 'student') {
    return null; // Or a loading/error state
  }

  return (
    <div>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Welcome, {appUser.data.name}</CardTitle>
                <div className="text-muted-foreground flex items-center gap-4">
                    <span>Student No: {appUser.data.number}</span>
                    <span>|</span>
                    <span>Behavior Score: <span className="font-bold text-primary">{appUser.data.behaviorScore}</span></span>
                </div>
            </CardHeader>
        </Card>

        <Tabs defaultValue="home">
            <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Home & Projects</TabsTrigger>
            <TabsTrigger value="risk-form">Risk Form</TabsTrigger>
            <TabsTrigger value="info-form">Info Form</TabsTrigger>
            </TabsList>
            <TabsContent value="home" className="mt-4">
                <HomeTab />
            </TabsContent>
            <TabsContent value="risk-form" className="mt-4">
                <RiskFormTab />
            </TabsContent>
            <TabsContent value="info-form" className="mt-4">
                <InfoFormTab />
            </TabsContent>
      </Tabs>
    </div>
  );
}
