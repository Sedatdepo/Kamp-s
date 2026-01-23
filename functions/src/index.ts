
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
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
      // SORGULAMA DÜZELTMESİ: Öğrenciler ana 'students' koleksiyonundan 'classId' ile filtrelenerek alınmalı.
      const studentsSnapshot = await db.collection("students").where("classId", "==", classId).get();

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

export const sendNotificationOnGradeUpdate = functions
    .region("us-central1")
    .firestore.document("classes/{classId}/homeworks/{homeworkId}/submissions/{submissionId}")
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();

        // Not alanı yeni eklendiyse veya değiştiyse devam et
        if (afterData.grade === undefined || afterData.grade === beforeData.grade) {
            console.log("Not güncellenmedi, bildirim gönderilmeyecek.");
            return null;
        }

        const studentId = afterData.studentId;
        const homeworkId = context.params.homeworkId;
        const classId = context.params.classId;

        // Öğrenci belgesini al
        const studentDoc = await db.collection("students").doc(studentId).get();
        if (!studentDoc.exists) {
            console.error("Öğrenci bulunamadı:", studentId);
            return null;
        }
        const studentData = studentDoc.data();
        const tokens = studentData?.fcmTokens;

        if (!tokens || tokens.length === 0) {
            console.log("Öğrencinin bildirim token'ı bulunamadı:", studentId);
            return null;
        }

        // Ödev belgesini al
        const homeworkDoc = await db.collection("classes").doc(classId).collection("homeworks").doc(homeworkId).get();
        if (!homeworkDoc.exists) {
            console.error("Ödev bulunamadı:", homeworkId);
            return null;
        }
        const homeworkData = homeworkDoc.data();
        const homeworkTitle = homeworkData?.text || "Ödeviniz";

        const payload = {
            notification: {
                title: "📝 Notunuz Girildi!",
                body: `"${homeworkTitle}" başlıklı ödevinize not verildi: ${afterData.grade}`,
                clickAction: "/dashboard/student", // Öğrenci paneline yönlendirir
            },
        };

        try {
            const response = await messaging.sendToDevice(tokens, payload);
            console.log(`Bildirim başarıyla gönderildi: ${studentId}, Başarılı: ${response.successCount}`);
            // Hatalı veya geçersiz token'ları temizleme
            response.results.forEach((result, index) => {
                const error = result.error;
                if (error) {
                    console.error("Bildirim gönderilirken hata:", tokens[index], error);
                }
            });
        } catch (error) {
            console.error("Bildirim gönderme hatası:", error);
        }

        return null;
    });

export const sendNotificationOnNewHomework = functions
    .region("us-central1")
    .firestore.document("classes/{classId}/homeworks/{homeworkId}")
    .onCreate(async (snapshot, context) => {
        const homeworkData = snapshot.data();
        const classId = context.params.classId;

        if (!homeworkData) {
            console.log("No data associated with the event");
            return null;
        }

        const classNameDoc = await db.collection("classes").doc(classId).get();
        const className = classNameDoc.data()?.name || "sınıfınıza";

        const assignedStudents = homeworkData.assignedStudents || [];

        if (assignedStudents.length === 0) {
            // If no specific students assigned, send to all students in the class
             const studentsSnapshot = await db.collection("students").where("classId", "==", classId).get();
             if (studentsSnapshot.empty) {
                console.log("Sınıfta öğrenci bulunamadı:", classId);
                return null;
             }
             studentsSnapshot.forEach(doc => assignedStudents.push(doc.id));
        }

        if (assignedStudents.length === 0) {
            console.log("Bildirim gönderilecek öğrenci bulunamadı.");
            return null;
        }
        
        const studentDocs = await db.collection("students").where(admin.firestore.FieldPath.documentId(), "in", assignedStudents).get();

        const tokens: string[] = [];
        studentDocs.forEach(doc => {
            const student = doc.data();
            if (student.fcmTokens && Array.isArray(student.fcmTokens)) {
                tokens.push(...student.fcmTokens);
            }
        });


        if (tokens.length === 0) {
            console.log("Bildirim gönderilecek token bulunamadı.");
            return null;
        }
        
        const uniqueTokens = [...new Set(tokens)];

        const payload = {
            notification: {
                title: `Yeni Ödev: ${className}`,
                body: homeworkData.text,
                clickAction: "/dashboard/student", // Redirect to student dashboard
            },
        };

        try {
            const response = await messaging.sendToDevice(uniqueTokens, payload);
            console.log("Ödev bildirimleri başarıyla gönderildi:", response.successCount);
        } catch (error) {
            console.error("Ödev bildirimi gönderme hatası:", error);
        }

        return null;
    });

export const sendNotificationOnNewMessage = functions
    .region("us-central1")
    .firestore.document("messages/{messageId}")
    .onCreate(async (snapshot, context) => {
        const messageData = snapshot.data();
        if (!messageData) {
            return null;
        }

        const receiverId = messageData.receiverId;
        const senderId = messageData.senderId;

        // We only care about teacher -> student messages for this notification
        const receiverDoc = await db.collection("students").doc(receiverId).get();
        if (!receiverDoc.exists) {
            console.log("Alıcı bir öğrenci değil veya bulunamadı:", receiverId);
            return null;
        }

        const senderDoc = await db.collection("teachers").doc(senderId).get();
        if (!senderDoc.exists) {
            console.log("Gönderen bir öğretmen değil:", senderId);
            return null;
        }

        const studentData = receiverDoc.data();
        const teacherData = senderDoc.data();

        const tokens = studentData?.fcmTokens;
        if (!tokens || tokens.length === 0) {
            console.log("Öğrencinin bildirim token'ı bulunamadı:", receiverId);
            return null;
        }
        
        const payload = {
            notification: {
                title: `Yeni Mesaj: ${teacherData?.name}`,
                body: messageData.text,
                clickAction: "/dashboard/student",
            },
        };
        
        try {
            await messaging.sendToDevice(tokens, payload);
            console.log("Mesaj bildirimi başarıyla gönderildi:", receiverId);
        } catch (error) {
            console.error("Mesaj bildirimi gönderme hatası:", error);
        }

        return null;
    });

export const resetStudentPassword = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
        // 1. Check if the caller is an authenticated teacher
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Bu işlemi yapmak için giriş yapmalısınız.');
        }

        const teacherDoc = await db.collection('teachers').doc(context.auth.uid).get();
        if (!teacherDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'Bu işlemi yapmak için öğretmen yetkiniz olmalı.');
        }

        const { studentId } = data;
        if (!studentId || typeof studentId !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Öğrenci IDsi sağlanmalıdır.');
        }

        try {
            const studentRef = db.collection('students').doc(studentId);
            const studentDoc = await studentRef.get();

            if (!studentDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Öğrenci bulunamadı.');
            }
            const studentData = studentDoc.data()!;

            if (studentData.teacherId !== context.auth.uid) {
                 throw new functions.https.HttpsError('permission-denied', 'Bu öğrenci sizin tarafınızdan yönetilmiyor.');
            }

            const studentAuthUid = studentData.authUid;

            if (!studentAuthUid) {
                 await studentRef.update({ needsPasswordChange: true });
                 return { success: true, message: 'Öğrencinin ilk giriş şifresi okul numarası olarak ayarlandı.' };
            }
            
            const defaultPassword = String(studentData.number).padEnd(6, '0');

            await auth.updateUser(studentAuthUid, {
                password: defaultPassword,
            });

            await studentRef.update({
                needsPasswordChange: true,
            });

            return { success: true, message: 'Öğrenci şifresi başarıyla okul numarasına sıfırlandı.' };
        } catch (error: any) {
            console.error('Şifre sıfırlama hatası:', error);
            if (error.code === 'auth/user-not-found') {
                // This case can happen if the auth user was deleted manually.
                // We can still reset the state in our DB.
                const studentRef = db.collection('students').doc(studentId);
                await studentRef.update({
                    needsPasswordChange: true,
                    authUid: null // Clear the invalid authUid
                });
                return { success: true, message: 'Öğrencinin kimlik doğrulama kaydı bulunamadı, giriş bilgileri sıfırlandı.' };
            }
            throw new functions.https.HttpsError('internal', 'Şifre sıfırlanırken bir hata oluştu.', error);
        }
    });
