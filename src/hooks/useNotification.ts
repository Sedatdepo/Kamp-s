
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { Class, Message, Homework } from '@/lib/types';
import { doc, getDoc, updateDoc, collection, query, where, writeBatch, arrayUnion } from 'firebase/firestore';

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

  const homeworksQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'classes', classId, 'homeworks'));
  }, [db, classId]);
  const { data: homeworksData } = useCollection<Homework>(homeworksQuery);


  const messagesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'messages'), where('participants', 'array-contains', studentId), where('isRead', '==', false), where('receiverId', '==', studentId));
  }, [db, studentId]);
  const { data: unreadMessages } = useCollection<Message>(messagesQuery);


  const checkNotifications = useCallback(async () => {
    if (!currentClass || !studentId || !db) {
        setNotifications({
            announcements: false, riskForm: false, infoForm: false, 
            homeworks: false, election: false, messages: false
        });
        return;
    }

    const hasNewAnnouncement = currentClass.announcements?.some(
      (ann) => !ann.seenBy?.includes(studentId)
    ) ?? false;
    
    let hasNewRiskForm = false;
    if (currentClass.isRiskFormActive) {
      const hasSubmittedRisks = appUser?.type === 'student' && appUser.data.risks && appUser.data.risks.length > 0;
      if (!hasSubmittedRisks) {
        hasNewRiskForm = true;
      }
    }
    
    let hasNewInfoForm = false;
    if (currentClass.isInfoFormActive) {
      const infoFormRef = doc(db, 'infoForms', studentId);
      const infoFormSnap = await getDoc(infoFormRef);
      if (!infoFormSnap.exists() || !infoFormSnap.data().submitted) {
        hasNewInfoForm = true;
      }
    }

    // Use homeworksData from the subcollection query
    const hasNewHomework = homeworksData?.some(
        (hw) => !hw.seenBy?.includes(studentId)
    ) ?? false;
    
    const hasNewElection = currentClass.isElectionActive === true && currentClass.election?.votedStudentIds && !currentClass.election.votedStudentIds.includes(studentId);

    const hasNewMessage = unreadMessages && unreadMessages.length > 0;

    setNotifications({
      announcements: hasNewAnnouncement,
      riskForm: hasNewRiskForm,
      infoForm: hasNewInfoForm,
      homeworks: hasNewHomework,
      election: hasNewElection,
      messages: hasNewMessage,
    });

  }, [currentClass, studentId, appUser, db, unreadMessages, homeworksData]);

  useEffect(() => {
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
        if (!homeworksData) return;
        const unseenHomeworks = homeworksData.filter(hw => !hw.seenBy?.includes(studentId));
        if (unseenHomeworks.length > 0) {
            const batch = writeBatch(db);
            unseenHomeworks.forEach(hw => {
                const hwRef = doc(db, 'classes', classId, 'homeworks', hw.id);
                batch.update(hwRef, { seenBy: arrayUnion(studentId) });
            });
            await batch.commit();
        }
    }
    // Message notifications are cleared in the TeacherChatsTab/StudentCommunicationTab components.
    
    // Refresh notifications after marking as seen
    checkNotifications();
  }, [studentId, classId, currentClass, checkNotifications, db, homeworksData]);

  return { notifications, markAsSeen };
};
