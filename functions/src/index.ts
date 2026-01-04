
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

      // Duyuru eklenmemişse veya silinmişse işlem yapma
      if (!afterData.announcements || afterData.announcements.length <= (beforeData.announcements || []).length) {
        return null;
      }
      
      const beforeAnnouncements = beforeData.announcements || [];
      const afterAnnouncements = afterData.announcements || [];

      // En son eklenen duyuruyu bul
      const newAnnouncement = afterAnnouncements.find((ann: any) =>
        !beforeAnnouncements.some((bAnn: any) => bAnn.id === ann.id)
      );

      if (!newAnnouncement) {
        console.log("Yeni bir duyuru bulunamadı.");
        return null;
      }

      const classId = context.params.classId;
      // Hatalı sorgu düzeltildi: Öğrenciler artık doğru alt koleksiyondan alınıyor.
      const studentsSnapshot = await db.collection("classes").doc(classId).collection("students").get();

      if (studentsSnapshot.empty) {
        console.log("Sınıfta öğrenci bulunamadı:", classId);
        return null;
      }

      const tokens: string[] = [];
      studentsSnapshot.forEach((doc) => {
        const student = doc.data();
        // fcmTokens alanının varlığını ve bir dizi olduğunu kontrol et
        if (student.fcmTokens && Array.isArray(student.fcmTokens) && student.fcmTokens.length > 0) {
          tokens.push(...student.fcmTokens);
        }
      });

      if (tokens.length === 0) {
        console.log("Bildirim gönderilecek token bulunamadı:", classId);
        return null;
      }

      // Tekrarlanan tokenları temizle
      const uniqueTokens = [...new Set(tokens)];

      const payload = {
        notification: {
          title: `${afterData.name} Sınıfına Yeni Duyuru`,
          body: newAnnouncement.text,
          clickAction: "/dashboard/student", // Öğrenci paneline yönlendir
        },
      };

      try {
        const response = await messaging.sendToDevice(uniqueTokens, payload);
        console.log("Bildirimler başarıyla gönderildi:", response.successCount);
        // Hatalı veya geçersiz tokenları temizleme (isteğe bağlı)
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error("Bildirim gönderilirken hata:", uniqueTokens[index], error);
                // Eğer token geçersizse (unregister), veritabanından silinebilir
            }
        });
      } catch (error) {
        console.error("Bildirim gönderme hatası:", error);
      }

      return null;
    });
