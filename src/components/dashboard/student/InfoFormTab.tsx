"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const infoFormSchema = z.object({
  birthDate: z.date().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  healthIssues: z.string().optional(),
  hobbies: z.string().optional(),
  techUsage: z.string().optional(),
  motherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  motherEducation: z.string().optional(),
  motherJob: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  fatherEducation: z.string().optional(),
  fatherJob: z.string().optional(),
  siblingsInfo: z.string().optional(),
  economicStatus: z.enum(['low', 'middle', 'high']).optional(),
});

type InfoFormData = z.infer<typeof infoFormSchema>;

export function InfoFormTab() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setFormLoading] = useState(true);

  const form = useForm<InfoFormData>({
    resolver: zodResolver(infoFormSchema),
  });

  useEffect(() => {
    const fetchFormData = async () => {
      if (appUser?.type === 'student') {
        setFormLoading(true);
        const formRef = doc(db, 'infoForms', appUser.data.id);
        const formSnap = await getDoc(formRef);
        if (formSnap.exists()) {
          const data = formSnap.data();
          const defaultValues: any = {};
          for (const key in data) {
            if (data[key] instanceof Timestamp) {
                defaultValues[key] = data[key].toDate();
            } else {
                defaultValues[key] = data[key];
            }
          }
          form.reset(defaultValues);
        }
        setFormLoading(false);
      }
    };
    fetchFormData();
  }, [appUser, form]);

  const onSubmit = async (data: InfoFormData) => {
    if (appUser?.type !== 'student') return;
    setIsLoading(true);
    try {
      const formRef = doc(db, 'infoForms', appUser.data.id);
      const dataToSave = {
        ...data,
        studentId: appUser.data.id,
        submitted: true,
        birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : undefined,
      };
      await setDoc(formRef, dataToSave, { merge: true });
      toast({ title: 'Success', description: 'Your information has been saved.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save information.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFormLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Student Information Form</CardTitle>
        <CardDescription>Please fill out the form below. All information is confidential.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Info */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="birthDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus/>
                        </PopoverContent></Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="birthPlace" render={({ field }) => (<FormItem><FormLabel>Place of Birth</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="healthIssues" render={({ field }) => (<FormItem><FormLabel>Health Issues</FormLabel><FormControl><Input {...field} placeholder="e.g., Asthma, Allergies"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hobbies" render={({ field }) => (<FormItem><FormLabel>Hobbies</FormLabel><FormControl><Input {...field} placeholder="e.g., Reading, Sports" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="techUsage" render={({ field }) => (<FormItem><FormLabel>Daily Tech Usage</FormLabel><FormControl><Input {...field} placeholder="e.g., 3 hours" /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            {/* Parent Info */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Parent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="motherStatus" render={({ field }) => (<FormItem><FormLabel>Mother's Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Alive</SelectItem><SelectItem value="deceased">Deceased</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motherEducation" render={({ field }) => (<FormItem><FormLabel>Mother's Education</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motherJob" render={({ field }) => (<FormItem><FormLabel>Mother's Job</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherStatus" render={({ field }) => (<FormItem><FormLabel>Father's Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Alive</SelectItem><SelectItem value="deceased">Deceased</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherEducation" render={({ field }) => (<FormItem><FormLabel>Father's Education</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherJob" render={({ field }) => (<FormItem><FormLabel>Father's Job</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            {/* Family Info */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Family Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="siblingsInfo" render={({ field }) => (<FormItem><FormLabel>Siblings Information</FormLabel><FormControl><Textarea {...field} placeholder="e.g., 1 older sister, 1 younger brother"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="economicStatus" render={({ field }) => (<FormItem><FormLabel>Family Economic Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="middle">Middle</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Information
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
