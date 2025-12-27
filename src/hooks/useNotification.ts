
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { Class } from '@/lib/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type NotificationType = 'announcements' | 'riskForm' | 'infoForm' | 'homeworks';

interface NotificationState {
  announcements: boolean;
  riskForm: boolean;
  infoForm: boolean;
  homeworks: boolean;
}

// Helper function to safely parse date strings
const parseDate = (dateString: string): Date | null => {
  // Check if it's already an ISO 8601 format
  if (dateString.includes('T') && dateString.includes('Z')) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Check for "DD.MM.YYYY" format
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  
  // Fallback for other potential formats that new Date() can handle
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};


export const useNotification = () => {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationState>({
    announcements: false,
    riskForm: false,
    infoForm: false,
    homeworks: false,
  });
  
  const studentId = appUser?.type === 'student' ? appUser.data.id : null;
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;

  const classQuery = classId ? doc(db, 'classes', classId) : null;
  const { data: classData } = useFirestore<Class>(`class-for-notif-${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const checkNotifications = useCallback(async () => {
    if (!currentClass || !studentId) return;

    // 1. Duyuru Kontrolü
    const hasNewAnnouncement = currentClass.announcements?.some(
      (ann) => !ann.seenBy?.includes(studentId)
    ) ?? false;
    
    // 2. Risk Formu Kontrolü
    let hasNewRiskForm = false;
    if (currentClass.isRiskFormActive) {
      const hasSubmittedRisks = appUser?.type === 'student' && appUser.data.risks && appUser.data.risks.length > 0;
      if (!hasSubmittedRisks) {
        hasNewRiskForm = true;
      }
    }
    
    // 3. Bilgi Formu Kontrolü
    let hasNewInfoForm = false;
    if (currentClass.isInfoFormActive) {
      const infoFormRef = doc(db, 'infoForms', studentId);
      const infoFormSnap = await getDoc(infoFormRef);
      if (!infoFormSnap.exists() || !infoFormSnap.data().submitted) {
        hasNewInfoForm = true;
      }
    }

    // 4. Ödev Kontrolü
    const hasNewHomework = currentClass.homeworks?.some(
        (hw) => !hw.seenBy?.includes(studentId)
    ) ?? false;

    setNotifications({
      announcements: hasNewAnnouncement,
      riskForm: hasNewRiskForm,
      infoForm: hasNewInfoForm,
      homeworks: hasNewHomework
    });

  }, [currentClass, studentId, appUser]);

  useEffect(() => {
    checkNotifications();
  }, [checkNotifications]);

  const markAsSeen = useCallback(async (type: NotificationType) => {
    if (!studentId || !currentClass) return;

    const classRef = doc(db, 'classes', classId!);

    if (type === 'announcements') {
        const updatedAnnouncements = currentClass.announcements?.map(ann => {
            if (!ann.seenBy?.includes(studentId)) {
                return { ...ann, seenBy: [...(ann.seenBy || []), studentId] };
            }
            return ann;
        });
        if (updatedAnnouncements) {
            await updateDoc(classRef, { announcements: updatedAnnouncements });
        }
    } else if (type === 'homeworks') {
        const updatedHomeworks = currentClass.homeworks?.map(hw => {
            if (!hw.seenBy?.includes(studentId)) {
                return { ...hw, seenBy: [...(hw.seenBy || []), studentId] };
            }
            return hw;
        });
        if (updatedHomeworks) {
            await updateDoc(classRef, { homeworks: updatedHomeworks });
        }
    }
    
    // Refresh notifications after marking as seen
    checkNotifications();
  }, [studentId, classId, currentClass, checkNotifications]);

  return { notifications, markAsSeen };
};
