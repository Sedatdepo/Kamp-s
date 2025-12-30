
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Kurulumu ---

let adminApp: App;

// Gerekli ortam değişkenlerinin varlığını kontrol et
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

// Sadece gerekli tüm değişkenler varsa Firebase Admin'i başlat
if (!getApps().length) {
    if (privateKey && clientEmail && projectId) {
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${projectId}.appspot.com`,
        });
    } else {
        console.error("Firebase Admin SDK için gerekli ortam değişkenleri eksik. Lütfen FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL ve NEXT_PUBLIC_FIREBASE_PROJECT_ID değişkenlerini ayarlayın.");
    }
} else {
    adminApp = getApps()[0];
}


// --- API Rotası (POST Metodu) ---

export async function POST(request: NextRequest) {
  // Eğer Firebase Admin başlatılamadıysa, hata döndür
  if (!adminApp) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası: Firebase bağlantısı kurulamadı.' }, { status: 500 });
  }

  // Admin servislerini başlatılmış app üzerinden al
  const adminDb = getFirestore(adminApp);
  const adminStorage = getStorage(adminApp);
  const bucket = adminStorage.bucket();

  try {
    const body = await request.json();
    const {
      classId,
      homeworkId,
      studentId,
      studentName,
      studentNumber,
      studentAuthUid, // Bu yeni eklendi
      text,
      fileDataUrl, // Dosya base64 formatında gelecek
      fileName,
      fileType,
    } = body;

    // --- Güvenlik Kontrolü ---
    if (!classId || !homeworkId || !studentId) {
      return NextResponse.json({ error: 'Eksik veya geçersiz bilgi.' }, { status: 400 });
    }

    let fileUrl: string | undefined = undefined;

    // --- Dosya Yükleme (Eğer dosya varsa) ---
    if (fileDataUrl && fileName && fileType) {
      const matches = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Geçersiz dosya formatı.' }, { status: 400 });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const filePath = `homework_submissions/${classId}/${homeworkId}/${studentId}/${fileName}`;
      const file = bucket.file(filePath);

      await file.save(buffer, {
        metadata: { contentType: fileType },
      });
      
      fileUrl = (await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      }))[0];
    }
    
    // --- Firestore'a Teslimat Bilgisini Kaydetme ---
    const submissionData: any = {
      studentId,
      studentName,
      studentNumber,
      homeworkId,
      studentAuthUid, // Yeni alanı ekle
      submittedAt: new Date().toISOString(),
      text: text || null,
    };
    
    if (fileUrl) {
      submissionData.file = {
        url: fileUrl,
        name: fileName,
        type: fileType,
      };
    }

    const submissionsColRef = adminDb.collection(`classes/${classId}/homeworks/${homeworkId}/submissions`);
    await submissionsColRef.add(submissionData);

    return NextResponse.json({ success: true, message: 'Ödev başarıyla teslim edildi.' }, { status: 200 });

  } catch (error: any) {
    console.error('Upload API Error:', error);
    // Hatanın kendisini de loglayarak daha fazla bilgi alabiliriz.
    // İstemciye daha genel bir hata gönderelim.
    return NextResponse.json({ error: 'Sunucu hatası oluştu: ' + error.message }, { status: 500 });
  }
}
