
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { Class, Survey, SurveyResponse, Message } from '@/lib/types';
import { doc, getDoc, updateDoc, collection, query, where } from 'firebase/firestore';

type NotificationType = 'announcements' | 'riskForm' | 'infoForm' | 'homeworks' | 'election' | 'surveys' | 'messages';

interface NotificationState {
  announcements: boolean;
  riskForm: boolean;
  infoForm: boolean;
  homeworks: boolean;
  election: boolean;
  surveys: boolean;
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
    surveys: false,
    messages: false,
  });
  
  const studentId = appUser?.type === 'student' ? appUser.data.id : null;
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;

  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass } = useDoc<Class>(classQuery);

  const surveysQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'surveys'), where('classId', '==', classId), where('isActive', '==', true));
  }, [db, classId]);
  const { data: activeSurveys } = useCollection<Survey>(surveysQuery);

  const responsesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'surveyResponses'), where('studentId', '==', studentId));
  }, [db, studentId]);
  const { data: userResponses } = useCollection<SurveyResponse>(responsesQuery);

  const hasUnansweredSurvey = useMemo(() => {
    if (!activeSurveys || !userResponses) return false;
    const respondedSurveyIds = new Set(userResponses.map(r => r.surveyId));
    return activeSurveys.some(s => !respondedSurveyIds.has(s.id));
  }, [activeSurveys, userResponses]);
  
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'messages'), where('participants', 'array-contains', studentId), where('isRead', '==', false), where('receiverId', '==', studentId));
  }, [db, studentId]);
  const { data: unreadMessages } = useCollection<Message>(messagesQuery);


  const checkNotifications = useCallback(async () => {
    if (!currentClass || !studentId || !db) return;

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
      surveys: hasUnansweredSurvey,
      messages: hasNewMessage,
    });

  }, [currentClass, studentId, appUser, db, hasUnansweredSurvey, unreadMessages]);

  useEffect(() => {
    checkNotifications();
  }, [checkNotifications]);

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

  return { notifications, markAsSeen, hasUnansweredSurvey };
};
