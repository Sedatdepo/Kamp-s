// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Kurulumu ---
// Bu kısım, sunucu tarafında yönetici yetkileriyle hareket etmemizi sağlar.

// Ortam değişkenlerini güvenli bir şekilde alıyoruz.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

// Firebase Admin'i başlat (eğer daha önce başlatılmadıysa)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${projectId}.appspot.com`,
  });
}

const adminDb = getFirestore();
const adminStorage = getStorage();
const bucket = adminStorage.bucket();

// --- API Rotası (POST Metodu) ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classId,
      homeworkId,
      studentId,
      studentName,
      studentNumber,
      text,
      fileDataUrl, // Dosya base64 formatında gelecek
      fileName,
      fileType,
    } = body;

    // --- Güvenlik Kontrolü ---
    // Gelen verilerin temel düzeyde doğruluğunu kontrol et
    if (!classId || !homeworkId || !studentId) {
      return NextResponse.json({ error: 'Eksik veya geçersiz bilgi.' }, { status: 400 });
    }

    let fileUrl: string | undefined = undefined;

    // --- Dosya Yükleme (Eğer dosya varsa) ---
    if (fileDataUrl && fileName && fileType) {
      // Base64 data URL'den asıl veriyi ve formatı ayır
      const matches = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Geçersiz dosya formatı.' }, { status: 400 });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const filePath = `homework_submissions/${classId}/${homeworkId}/${studentId}/${fileName}`;
      const file = bucket.file(filePath);

      // Dosyayı Firebase Storage'a yükle
      await file.save(buffer, {
        metadata: { contentType: fileType },
      });
      
      // Yüklenen dosyanın herkes tarafından okunabilir URL'ini al
      fileUrl = (await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Çok uzak bir tarih
      }))[0];
    }
    
    // --- Firestore'a Teslimat Bilgisini Kaydetme ---
    const submissionData: any = {
      studentId,
      studentName,
      studentNumber,
      homeworkId,
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

    // Firestore'da ilgili ödevin altına yeni bir teslimat belgesi ekle
    const submissionsColRef = adminDb.collection(`classes/${classId}/homeworks/${homeworkId}/submissions`);
    await submissionsColRef.add(submissionData);

    return NextResponse.json({ success: true, message: 'Ödev başarıyla teslim edildi.' }, { status: 200 });

  } catch (error) {
    console.error('Upload API Error:', error);
    // Hata durumunda istemciye genel bir hata mesajı gönder
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
