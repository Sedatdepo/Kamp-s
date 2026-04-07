// Bu komut dosyası, Firestore veritabanınızdaki 'students' koleksiyonunu tarar.
// 'password' alanı boş olan veya hiç olmayan öğrencileri bulur.
// Bu öğrencilerin şifresini, kendi okul numaraları olarak ayarlar ve
// bir sonraki girişlerinde şifrelerini değiştirmeleri için bir işaret koyar.
// Bu işlem, sadece şifresi olmayan öğrencileri etkiler, mevcut şifreleri değiştirmez.

// --- NASIL KULLANILIR ---
// 1. Firebase Admin SDK'sını yükleyin:
//    Terminalde projenizin ana dizininde `npm install firebase-admin` komutunu çalıştırın.
//
// 2. Hizmet Hesabı Anahtarınızı İndirin:
//    - Firebase projenizin ayarlarına gidin (sağ üstteki çark > Proje Ayarları).
//    - "Hizmet Hesapları" sekmesine tıklayın.
//    - "Yeni özel anahtar oluştur" butonuna tıklayın ve indirilen JSON dosyasını alın.
//
// 3. Anahtarı Projenize Ekleyin:
//    - İndirdiğiniz JSON dosyasının adını `serviceAccountKey.json` olarak değiştirin.
//    - Bu dosyayı, projenizin ana dizinine (bu dosyanın olduğu yere) taşıyın.
//    - DİKKAT: Bu anahtar dosyasını ASLA herkese açık bir yere (örn: GitHub) yüklemeyin.
//
// 4. Komut Dosyasını Çalıştırın:
//    - Terminalde `node migrate_students.js` komutunu çalıştırın.

const admin = require('firebase-admin');

// 2. Adımda indirdiğiniz hizmet hesabı anahtarını referans gösterin.
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin SDK'sını başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateStudentPasswords() {
  console.log('Veritabanındaki öğrenciler okunuyor...');
  
  const studentsSnapshot = await db.collection('students').get();
  
  if (studentsSnapshot.empty) {
    console.log('Şifresi güncellenecek öğrenci bulunamadı.');
    return;
  }

  const batch = db.batch();
  let updatedCount = 0;

  studentsSnapshot.forEach(doc => {
    const studentData = doc.data();
    
    // 'password' alanı yoksa, null ise veya boş bir string ise...
    if (!studentData.password) {
      const studentRef = db.collection('students').doc(doc.id);
      
      console.log(`Öğrenci güncelleniyor: ${studentData.name} (ID: ${doc.id}). Şifre, okul numarası olarak ayarlanıyor: ${studentData.number}`);
      
      // Şifreyi okul numarası olarak ayarla ve bir sonraki girişte şifre değişimini zorunlu kıl.
      batch.update(studentRef, { 
        password: studentData.number,
        needsPasswordChange: true
      });
      
      updatedCount++;
    }
  });

  if (updatedCount === 0) {
    console.log('Tüm öğrencilerin şifresi zaten mevcut. Herhangi bir değişiklik yapılmadı.');
    return;
  }

  try {
    await batch.commit();
    console.log(`\nVeri taşıma başarıyla tamamlandı!`);
    console.log(`${updatedCount} öğrencinin şifresi güncellendi.`);
    console.log("Şifreleri artık okul numaraları olarak ayarlandı ve bir sonraki girişlerinde yeni şifre oluşturmaları istenecek.");
  } catch (error) {
    console.error('Toplu güncelleme sırasında bir hata oluştu:', error);
  }
}

migrateStudentPasswords().catch(error => {
  console.error('Komut dosyası çalıştırılırken beklenmedik bir hata oluştu:', error);
});

    