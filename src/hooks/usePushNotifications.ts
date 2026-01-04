

"use client";

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from './useAuth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const usePushNotifications = () => {
    const { appUser, db } = useAuth();
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
        if (!db || !appUser) return;
        
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
                
                if (appUser.type === 'student') {
                    const studentRef = doc(db, 'students', appUser.data.id);
                    await updateDoc(studentRef, {
                        fcmTokens: arrayUnion(token)
                    });
                }
                
            } else {
               setError(new Error('No registration token available. Request permission to generate one.'));
               setNotificationPermissionGranted(false);
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            setError(err);
            setNotificationPermissionGranted(false);
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
    
    // Listen for foreground messages
    useEffect(() => {
        if (typeof window !== 'undefined' && 'firebase' in window) {
            const messaging = getMessaging();
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received. ', payload);
            });

            return () => unsubscribe();
        }
    }, []);

    return {
        isNotificationPermissionGranted,
        requestNotificationPermission,
        isSubscribing,
        error,
    };
};
