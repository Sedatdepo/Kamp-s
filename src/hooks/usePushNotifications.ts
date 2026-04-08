
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from './useAuth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from './use-toast';

export const usePushNotifications = () => {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const [isNotificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [error, setError] = useState<any>(null);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermissionGranted(Notification.permission === 'granted');
        } else {
            setNotificationPermissionGranted(false);
        }
    }, []);

    const getFCMToken = useCallback(async () => {
        if (!db || !appUser) return null;
        
        setIsSubscribing(true);
        setError(null);
        try {
            const messaging = getMessaging();
            const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            
            if (!VAPID_KEY) {
                throw new Error("VAPID key is not configured in environment variables.");
            }

            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                setFcmToken(token);
                setNotificationPermissionGranted(true);
                
                let userRef;
                if (appUser.type === 'student_session') {
                    userRef = doc(db, 'students', (appUser as any).data.uid);
                } else if (appUser.type === 'teacher') {
                    userRef = doc(db, 'teachers', appUser.data.uid);
                }

                if (userRef) {
                    await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
                }
                
                return token;
            } else {
               setError(new Error('No registration token available. Request permission to generate one.'));
               setNotificationPermissionGranted(false);
               return null;
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            setError(err);
            setNotificationPermissionGranted(false);
            return null;
        } finally {
            setIsSubscribing(false);
        }
    }, [appUser, db]);


    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            setError(new Error('This browser does not support desktop notification'));
            return;
        }

        setIsSubscribing(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await getFCMToken();
            } else {
                setNotificationPermissionGranted(false);
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsSubscribing(false);
        }
    }, [getFCMToken]);

    const unsubscribeFromNotifications = useCallback(async () => {
        if (!db || !appUser) return;

        setIsSubscribing(true);
        try {
            const currentToken = await getFCMToken(); // Get the token for this device
            if (currentToken) {
                let userRef;
                if (appUser.type === 'student_session') {
                    userRef = doc(db, 'students', (appUser as any).data.uid);
                } else if (appUser.type === 'teacher') {
                    userRef = doc(db, 'teachers', appUser.data.uid);
                }

                if (userRef) {
                    await updateDoc(userRef, {
                        fcmTokens: arrayRemove(currentToken)
                    });
                }
                setFcmToken(null);
                setNotificationPermissionGranted(false);
                toast({title: "Bildirimler kapatıldı", description: "Bu cihaz için bildirim aboneliği kaldırıldı."});
            }
        } catch (err) {
            console.error("Error unsubscribing:", err);
            setError(err);
            toast({variant: 'destructive', title: "Hata", description: "Bildirimler kapatılamadı."})
        } finally {
            setIsSubscribing(false);
        }
    }, [db, appUser, getFCMToken, toast]);
    
    // Listen for foreground messages
    useEffect(() => {
        if (typeof window !== 'undefined' && 'firebase' in window) {
            try {
                const messaging = getMessaging();
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log('Foreground message received. ', payload);
                    // Optionally show a custom in-app notification here
                });
                return () => unsubscribe();
            } catch (e) {
                console.error("Could not initialize messaging:", e);
            }
        }
    }, []);

    return {
        isNotificationPermissionGranted,
        requestNotificationPermission,
        isSubscribing,
        error,
        unsubscribeFromNotifications,
        getFCMToken,
    };
};
