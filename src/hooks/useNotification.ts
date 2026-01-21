
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { Class, Message } from '@/lib/types';
import { doc, getDoc, updateDoc, collection, query, where } from 'firebase/firestore';

type NotificationType = 'announcements' | 'riskForm' | 'infoForm' | 'homeworks' | 'election' | 'messages';

interface NotificationState {
  announcements: boolean;
  riskForm: boolean;
  infoForm: boolean;
  homeworks: boolean;
  election: boolean;
  messages: boolean;
}

export const useNotification = () => {
  const { appUser, db } = useAuth();
  const [notifications, setNotifications] = useState<NotificationState>({
    announcements: false,
    riskForm: false,
    infoForm: false,
    homeworks: false,
    election: false,
    messages: false,
  });
  
  const studentId = useMemo(() => appUser?.type === 'student' ? appUser.data.id : null, [appUser]);
  const classId = useMemo(() => appUser?.type === 'student' ? appUser.data.classId : null, [appUser]);

  const classQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return doc(db, 'classes', classId);
  }, [db, classId]);
  const { data: currentClass } = useDoc<Class>(classQuery);

  // CRITICAL FIX: Do not run this query if there is no studentId.
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'messages'), where('participants', 'array-contains', studentId), where('isRead', '==', false), where('receiverId', '==', studentId));
  }, [db, studentId]);
  const { data: unreadMessages } = useCollection<Message>(messagesQuery);


  const checkNotifications = useCallback(async () => {
    if (!currentClass || !studentId || !db) {
        // Eğer kritik data hazır değilse, tüm bildirimleri false yap.
        setNotifications({
            announcements: false, riskForm: false, infoForm: false, 
            homeworks: false, election: false, messages: false
        });
        return;
    }

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
    
    // 5. Seçim Kontrolü
    const hasNewElection = currentClass.isElectionActive === true && currentClass.election?.votedStudentIds && !currentClass.election.votedStudentIds.includes(studentId);

    // 6. Mesaj Kontrolü
    const hasNewMessage = unreadMessages && unreadMessages.length > 0;

    setNotifications({
      announcements: hasNewAnnouncement,
      riskForm: hasNewRiskForm,
      infoForm: hasNewInfoForm,
      homeworks: hasNewHomework,
      election: hasNewElection,
      messages: hasNewMessage,
    });

  }, [currentClass, studentId, appUser, db, unreadMessages]);

  useEffect(() => {
    // Sadece gerekli bilgiler hazır olduğunda bildirimleri kontrol et
    if (appUser && studentId && classId && db) {
        checkNotifications();
    }
  }, [appUser, studentId, classId, db, checkNotifications]);

  const markAsSeen = useCallback(async (type: NotificationType) => {
    if (!studentId || !currentClass || !classId || !db) return;

    const classRef = doc(db, 'classes', classId);

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
    // Message notifications are cleared in the TeacherChatsTab/StudentCommunicationTab components.
    
    // Refresh notifications after marking as seen
    checkNotifications();
  }, [studentId, classId, currentClass, checkNotifications, db]);

  return { notifications, markAsSeen };
};
