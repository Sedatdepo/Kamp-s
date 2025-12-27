
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { Class } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type NotificationType = 'announcements' | 'riskForm' | 'infoForm';

interface NotificationState {
  announcements: boolean;
  riskForm: boolean;
  infoForm: boolean;
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
  });
  
  const studentId = appUser?.type === 'student' ? appUser.data.id : null;
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;

  const classQuery = classId ? doc(db, 'classes', classId) : null;
  const { data: classData } = useFirestore<Class>(`class-for-notif-${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const checkNotifications = useCallback(async () => {
    if (!currentClass || !studentId) return;

    // 1. Duyuru Kontrolü
    const lastSeenAnnouncementDateStr = localStorage.getItem(`lastSeenAnnouncement_${studentId}`);
    const lastSeenAnnouncementDate = lastSeenAnnouncementDateStr ? parseDate(lastSeenAnnouncementDateStr) : null;

    const latestAnnouncement = currentClass.announcements?.[0];
    const latestAnnouncementDate = latestAnnouncement ? parseDate(latestAnnouncement.date) : null;

    const hasNewAnnouncement = latestAnnouncementDate && (!lastSeenAnnouncementDate || latestAnnouncementDate > lastSeenAnnouncementDate);
    
    // 2. Risk Formu Kontrolü
    let hasNewRiskForm = false;
    if (currentClass.isRiskFormActive) {
      // Sadece form aktifse ve öğrenci henüz hiç risk belirtmemişse bildirim göster.
      // Bu, formu doldurma zorunluluğunu hatırlatır.
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
      // Form aktifse ve henüz "submitted" değilse bildirim göster.
      if (!infoFormSnap.exists() || !infoFormSnap.data().submitted) {
        hasNewInfoForm = true;
      }
    }

    setNotifications({
      announcements: !!hasNewAnnouncement,
      riskForm: hasNewRiskForm,
      infoForm: hasNewInfoForm
    });

  }, [currentClass, studentId, appUser]);

  useEffect(() => {
    checkNotifications();
  }, [checkNotifications]);

  const markAsSeen = useCallback((type: NotificationType) => {
    if (!studentId || !currentClass) return;

    if (type === 'announcements') {
      const latestAnnouncement = currentClass.announcements?.[0];
      if (latestAnnouncement) {
        const latestDate = parseDate(latestAnnouncement.date);
        if (latestDate) {
          localStorage.setItem(`lastSeenAnnouncement_${studentId}`, latestDate.toISOString());
        }
      }
    }
    // riskForm ve infoForm için, öğrenci formu doldurduğunda bildirim zaten kaybolacak.
    // Sadece sekmeye tıklayınca kaybolması için bir logiğe gerek yok, çünkü asıl amaç formu doldurması.
    
    checkNotifications(); // Durumu anında güncelle
  }, [studentId, currentClass, checkNotifications]);

  return { notifications, markAsSeen };
};
