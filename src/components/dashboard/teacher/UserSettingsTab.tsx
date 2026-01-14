
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { useAuth } from '@/hooks/useAuth';
import { updatePassword as firebaseUpdatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

const profileSchema = z.object({
  name: z.string().min(1, "Öğretmen adı zorunludur."),
  email: z.string().email("Geçersiz e-posta adresi."),
  branch: z.string().min(1, "Branş zorunludur."),
  schoolName: z.string().min(1, "Okul adı zorunludur."),
  principalName: z.string().min(1, "Okul müdürü adı zorunludur."),
  guidanceTeacherName: z.string().optional(),
  departmentHeadName: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, "Mevcut şifre en az 6 karakter olmalıdır."),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır."),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Yeni şifreler uyuşmuyor.",
    path: ["confirmPassword"],
});


export function UserSettingsTab() {
    const { db: localDb, setDb } = useDatabase();
    const { toast } = useToast();
    const { appUser, auth } = useAuth();
    const { db } = useAuth();
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;
    const userEmail = appUser?.type === 'teacher' ? appUser.data.email : '';
    
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            branch: '',
            schoolName: '',
            principalName: '',
            guidanceTeacherName: '',
            departmentHeadName: '',
            email: ''
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    useEffect(() => {
        if(teacherProfile) {
            profileForm.reset({
                name: teacherProfile.name || '',
                branch: teacherProfile.branch || '',
                schoolName: teacherProfile.schoolName || '',
                principalName: teacherProfile.principalName || '',
                guidanceTeacherName: teacherProfile.reportConfig?.teacherName || '', // Bu alanın adı değişebilir
                departmentHeadName: localDb.schoolInfo?.departmentHeadName || '',
                email: userEmail || ''
            });
        }
    }, [teacherProfile, userEmail, localDb.schoolInfo, profileForm]);

    const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
        if (!appUser || appUser.type !== 'teacher' || !db) return;

        const teacherRef = doc(db, 'teachers', appUser.data.uid);
        updateDoc(teacherRef, {
            name: values.name,
            branch: values.branch,
            schoolName: values.schoolName,
            principalName: values.principalName,
        }).then(() => {
            toast({ title: 'Başarılı', description: 'Kullanıcı bilgileri güncellendi.' });
        }).catch((error) => {
            toast({ title: 'Hata', description: error.message, variant: 'destructive'});
        });
    };

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        const user = auth?.currentUser;
        if (!user || !user.email) {
            toast({ variant: "destructive", title: "Hata", description: "Kullanıcı bilgileri bulunamadı." });
            return;
        }

        setIsPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await firebaseUpdatePassword(user, values.newPassword);
            
            toast({ title: "Başarılı!", description: "Şifreniz başarıyla değiştirildi." });
            passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: ''});
        } catch (error: any) {
            console.error("Password change error:", error);
            let description = "Bir hata oluştu.";
            if (error.code === 'auth/wrong-password') {
                description = "Mevcut şifreniz yanlış.";
            } else if (error.code === 'auth/requires-recent-login') {
                description = "Güvenlik nedeniyle bu işlem için yeniden giriş yapmanız gerekmektedir. Lütfen çıkış yapıp tekrar girin.";
            } else if (error.code === 'auth/too-many-requests') {
                 description = "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.";
            }
            toast({ variant: "destructive", title: "Hata", description });
        } finally {
            setIsPasswordLoading(false);
        }
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Genel Bilgiler</CardTitle>
                    <CardDescription>Bu bilgiler tutanak ve raporlarda kullanılacaktır.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField control={profileForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Adınız Soyadınız</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={profileForm.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branşınız</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={profileForm.control} name="schoolName" render={({ field }) => (<FormItem><FormLabel>Okul Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={profileForm.control} name="principalName" render={({ field }) => (<FormItem><FormLabel>Okul Müdürü</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-posta Adresiniz</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                            <Button type="submit">Bilgileri Kaydet</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Güvenlik</CardTitle>
                    <CardDescription>Hesap şifrenizi buradan değiştirebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Mevcut Şifre</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>Yeni Şifre</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Yeni Şifre Tekrar</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" disabled={isPasswordLoading}>
                                {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Şifreyi Değiştir
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
