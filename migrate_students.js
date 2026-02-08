
// Bu komut dosyası, Firestore veritabanınızdaki mevcut 'students' koleksiyonunu okur
// ve her öğrenci için 'publicStudentInfos' adlı yeni bir koleksiyona
// herkese açık bir kayıt oluşturur. Bu, öğrenci giriş sayfasının
// güvenli bir şekilde çalışması için gereklidir.

// Terminalden çalıştırmadan önce Firebase Admin SDK'sını yükleyin:
// npm install firebase-admin

// Gerekli Firebase Admin SDK modüllerini içe aktar
const admin = require('firebase-admin');

// Firebase projenizin hizmet hesabı anahtarını buraya ekleyin.
// BU DOSYAYI GITHUB'A VEYA HERKESE AÇIK BİR YERE YÜKLEMEYİN!
// Firebase konsolundan yeni bir anahtar oluşturabilirsiniz:
// Proje Ayarları -> Hizmet Hesapları -> Yeni Özel Anahtar Oluştur
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin SDK'sını başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateStudents() {
  console.log('Mevcut öğrenciler okunuyor...');
  
  const studentsSnapshot = await db.collection('students').get();
  
  if (studentsSnapshot.empty) {
    console.log('Taşınacak öğrenci bulunamadı.');
    return;
  }

  console.log(`${studentsSnapshot.size} öğrenci bulundu. Veriler 'publicStudentInfos' koleksiyonuna kopyalanıyor...`);

  const batch = db.batch();

  studentsSnapshot.forEach(doc => {
    const studentData = doc.data();
    
    // Sadece gerekli ve hassas olmayan verileri al
    const publicInfo = {
      name: studentData.name,
      classId: studentData.classId
    };

    // Yeni koleksiyonda, aynı öğrenci ID'si ile bir belge referansı oluştur
    const publicInfoRef = db.collection('publicStudentInfos').doc(doc.id);
    
    batch.set(publicInfoRef, publicInfo);
  });

  try {
    await batch.commit();
    console.log('Veri taşıma başarıyla tamamlandı!');
    console.log(`${studentsSnapshot.size} öğrenci bilgisi 'publicStudentInfos' koleksiyonuna eklendi.`);
  } catch (error) {
    console.error('Veri taşıma sırasında bir hata oluştu:', error);
  }
}

migrateStudents().catch(error => {
  console.error('Komut dosyası çalıştırılırken beklenmedik bir hata oluştu:', error);
});
