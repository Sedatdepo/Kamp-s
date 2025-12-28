
export interface MevzuatOzet {
  id: string;
  kategori: string;
  baslik: string;
  madde: string;
  ozet: string;
  anahtarKelimeler?: string[];
}

export const MEVZUAT_OZETLERI: MevzuatOzet[] = [
  {
    id: "meb-izin-1",
    kategori: "İzinler",
    baslik: "657 Sayılı Devlet Memurları Kanunu",
    madde: "Madde 104",
    ozet: "Devlet memurlarına; merkezde atamaya yetkili amir, illerde vali, ilçelerde kaymakam ve yurt dışında diplomatik misyon şefi tarafından, birim amirinin muvafakati ile bir yıl içinde toptan veya bölümler halinde, mazeretleri sebebiyle on gün izin verilebilir. Zaruret halinde öğretmenler hariç olmak üzere, aynı usulle on gün daha mazeret izni verilebilir.",
    anahtarKelimeler: ["mazeret", "izin", "657"],
  },
  {
    id: "meb-gezi-1",
    kategori: "Sosyal Etkinlikler ve Geziler",
    baslik: "Millî Eğitim Bakanlığı Eğitim Kurumları Sosyal Etkinlikler Yönetmeliği",
    madde: "Madde 21",
    ozet: "Eğitim kurumu müdürlüklerince il/ilçe millî eğitim müdürlüklerine bilgi vermek suretiyle, il sınırları içinde geziler düzenlenebilir. İl dışı ve yurt dışı geziler için ise il/ilçe millî eğitim müdürlüğünün onayı gereklidir. Gezilerde, öğrencilerin güvenliği için her türlü tedbir alınır ve veli izin belgeleri zorunludur.",
    anahtarKelimeler: ["gezi", "sosyal etkinlik", "veli izni"],
  },
  {
    id: "meb-hizmetici-1",
    kategori: "Hizmet İçi Eğitim",
    baslik: "Millî Eğitim Bakanlığı Hizmetiçi Eğitim Yönetmeliği",
    madde: "Madde 9",
    ozet: "Bakanlık personeli, adaylık eğitimi, hizmet içi eğitim ve görevde yükselme eğitimlerine katılmakla yükümlüdür. Eğitim faaliyetine katılacak personelin seçimi, duyurulan şartlara uygun olarak ilgili birimlerce yapılır.",
    anahtarKelimeler: ["hizmetiçi", "seminer", "eğitim"],
  },
  {
    id: "meb-veli-1",
    kategori: "Veli Toplantısı ve İş Birliği",
    baslik: "Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği",
    madde: "Madde 35",
    ozet: "Okul yönetimi, öğretmenler, rehber öğretmenler ve veliler arasında iş birliğini sağlamak amacıyla veli toplantıları düzenlenir. Toplantıların zamanı, en az bir hafta önceden velilere duyurulur. Toplantıda öğrencilerin başarı, devam-devamsızlık, ödül ve disiplin durumları gibi konular görüşülür.",
    anahtarKelimeler: ["veli toplantısı", "okul aile", "işbirliği"],
  },
  {
    id: "meb-disiplin-1",
    kategori: "Öğrenci Davranışları ve Disiplin",
    baslik: "Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği",
    madde: "Madde 164",
    ozet: "Öğrencilerden beklenen olumlu davranışlar ve bu davranışlara uymamaları halinde uygulanacak yaptırımlar belirtilmiştir. Kınama, okuldan kısa süreli uzaklaştırma ve okul değiştirme cezaları öğrenci davranışlarını değerlendirme kurulunun teklifi üzerine müdür tarafından verilir.",
    anahtarKelimeler: ["disiplin", "kınama", "uzaklaştırma", "davranış"],
  },
  {
    id: "meb-egzersiz-1",
    kategori: "Ders Dışı Eğitim Çalışmaları (Egzersiz)",
    baslik: "Millî Eğitim Bakanlığı Yönetici ve Öğretmenlerinin Ders ve Ek Ders Saatlerine İlişkin Karar",
    madde: "Madde 17",
    ozet: "Ders dışı eğitim çalışmaları (egzersiz) kapsamında, öğrencilerin ilgi ve yeteneklerini geliştirmek amacıyla çeşitli alanlarda (spor, sanat, bilim vb.) kurslar açılabilir. Bu çalışmalarda görev alan öğretmenlere haftada 6 saate kadar ek ders ücreti ödenir. Çalışmanın açılabilmesi için ilgili mevzuata uygun olarak plan hazırlanması ve il/ilçe millî eğitim müdürlüğünce onaylanması gerekir.",
    anahtarKelimeler: ["egzersiz", "kurs", "ek ders"],
  }
];
