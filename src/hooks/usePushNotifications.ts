
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from './useAuth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const usePushNotifications = () => {
    const { appUser, db } = useAuth();
    const [isNotificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [error, setError] = useState<any>(null);

    const requestNotificationPermission = useCallback(async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationPermissionGranted(true);
                return true;
            } else {
                setNotificationPermissionGranted(false);
                return false;
            }
        } catch (err) {
            setError(err);
            return false;
        }
    }, []);

    const getFCMToken = useCallback(async () => {
        if (!db || !appUser) return;
        
        try {
            const messaging = getMessaging();
            const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            
            if (!VAPID_KEY) {
                throw new Error("VAPID key is not configured in environment variables.");
            }

            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                setFcmToken(token);
                
                // Save the token to the user's document
                if (appUser.type === 'student') {
                    const studentRef = doc(db, 'students', appUser.data.id);
                    await updateDoc(studentRef, {
                        fcmTokens: arrayUnion(token)
                    });
                }
                
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            setError(err);
        }
    }, [appUser, db]);


    const initializeNotifications = useCallback(async () => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setNotificationPermissionGranted(true);
                await getFCMToken();
            } else if (Notification.permission !== 'denied') {
                const granted = await requestNotificationPermission();
                if (granted) {
                    await getFCMToken();
                }
            }
        }
    }, [getFCMToken, requestNotificationPermission]);
    
    // Listen for foreground messages
    useEffect(() => {
        const messaging = getMessaging();
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            // You can show a custom in-app notification here
            // For example, using a toast library
        });

        return () => unsubscribe();
    }, []);

    return {
        isNotificationPermissionGranted,
        fcmToken,
        error,
        initializeNotifications,
    };
};
