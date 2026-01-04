import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

export const sendNotificationOnNewAnnouncement = functions
    .region("us-central1")
    .firestore.document("classes/{classId}")
    .onUpdate(async (change, context) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      const beforeAnnouncements = beforeData.announcements || [];
      const afterAnnouncements = afterData.announcements || [];

      if (afterAnnouncements.length <= beforeAnnouncements.length) {
        return null; // Sadece yeni duyuru eklendiğinde çalışsın
      }

      const newAnnouncement = afterAnnouncements.find((ann: any) =>
        !beforeAnnouncements.some((bAnn: any) => bAnn.id === ann.id)
      );

      if (!newAnnouncement) {
        return null;
      }

      const classId = context.params.classId;
      const studentsSnapshot = await db.collection("students")
          .where("classId", "==", classId)
          .get();

      if (studentsSnapshot.empty) {
        console.log("No students found for class:", classId);
        return null;
      }

      const tokens: string[] = [];
      studentsSnapshot.forEach((doc) => {
        const student = doc.data();
        if (student.fcmTokens && Array.isArray(student.fcmTokens)) {
          tokens.push(...student.fcmTokens);
        }
      });

      if (tokens.length === 0) {
        console.log("No FCM tokens found for students in class:", classId);
        return null;
      }

      const payload = {
        notification: {
          title: `${afterData.name} Sınıfına Yeni Duyuru`,
          body: newAnnouncement.text,
          clickAction: "/dashboard/student", // Öğrenci paneline yönlendir
        },
      };

      try {
        const response = await messaging.sendToDevice(tokens, payload);
        console.log("Notifications sent successfully:", response.successCount);
        // Hatalı veya geçersiz tokenları temizleme (isteğe bağlı)
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error("Failure sending notification to", tokens[index], error);
                // Eğer token geçersizse (unregister), veritabanından silinebilir
            }
        });
      } catch (error) {
        console.error("Error sending notifications:", error);
      }

      return null;
    });
