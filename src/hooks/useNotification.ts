
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
    const lastSeenAnnouncementDate = localStorage.getItem(`lastSeenAnnouncement_${studentId}`);
    const latestAnnouncement = currentClass.announcements?.[0];
    const hasNewAnnouncement = latestAnnouncement && (!lastSeenAnnouncementDate || new Date(latestAnnouncement.date) > new Date(lastSeenAnnouncementDate));
    
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
      announcements: hasNewAnnouncement,
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
        localStorage.setItem(`lastSeenAnnouncement_${studentId}`, new Date(latestAnnouncement.date).toISOString());
      }
    }
    // riskForm ve infoForm için, öğrenci formu doldurduğunda bildirim zaten kaybolacak.
    // Sadece sekmeye tıklayınca kaybolması için bir logiğe gerek yok, çünkü asıl amaç formu doldurması.
    
    checkNotifications(); // Durumu anında güncelle
  }, [studentId, currentClass, checkNotifications]);

  return { notifications, markAsSeen };
};
