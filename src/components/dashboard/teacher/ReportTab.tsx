"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Database, Box, Palette } from "lucide-react";

export function ReportTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <FileText className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl">Entegrasyon Raporu: Değerlendirme Aracı</CardTitle>
            <CardDescription>
              Uygulamaya eklenen yeni Puanlama ve Değerlendirme Aracı modülünün detayları.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="font-bold text-lg text-foreground mb-2">1. Amaç ve Kapsam</h3>
          <p className="text-muted-foreground">
            Bu entegrasyonun temel amacı, öğretmenlerin performans, proje ve davranış notlarını belirli kriterlere göre kolayca hesaplayıp yönetebileceği, sonrasında ise bu verileri MEB formatına uygun resmi raporlara dönüştürebileceği bir modül oluşturmaktı. Bu araç, not verme sürecini standartlaştırmak, hızlandırmak ve resmî belge oluşturma yükünü ortadan kaldırmak için tasarlanmıştır.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2"><Box className="text-primary h-5 w-5"/>Eklenen Temel Özellikler</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                        <strong>Dinamik Kriter Yönetimi:</strong> Öğretmenler; Performans, Proje ve Davranış notları için değerlendirme kriterlerini (örn: "Derse Katılım") ve bu kriterlerin maksimum puanlarını Ayarlar menüsünden tamamen kendileri özelleştirebilir.
                    </li>
                    <li>
                        <strong>Akıllı Puanlama Tablosu:</strong> Öğrencilere her kriter için ayrı ayrı not girilebilir. Girilen kriter notlarına göre toplam not otomatik hesaplanır. Ayrıca, sadece toplam not girildiğinde, bu not kriterlerin ağırlıklarına göre akıllı bir şekilde otomatik olarak dağıtılır.
                    </li>
                     <li>
                        <strong>Gelişmiş Word Raporlama:</strong> Girilen tüm notlar, okul ve öğretmen bilgileriyle birleştirilerek, tek tıkla MEB formatına uygun, yazdırmaya hazır <strong>.docx (Word)</strong> belgesi olarak dışa aktarılabilir.
                    </li>
                </ul>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2"><Database className="text-primary h-5 w-5"/>Teknik Entegrasyon Süreci</h3>
                 <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                        <strong>Veritabanı Entegrasyonu:</strong> Tüm veriler (kriterler, ayarlar, notlar), geçici `localStorage` yerine kalıcı ve güvenli olan **Firebase Firestore** veritabanına entegre edilmiştir. Bu, verilerinize her yerden erişebilmenizi sağlar.
                    </li>
                    <li>
                        <strong>Bileşen Yapısı:</strong> Bağımsız çalışan kod, mevcut Next.js ve Shadcn UI altyapısıyla uyumlu, yönetilebilir bileşenlere (`GradingToolTab`, `GradingHeader`, `GradingTable`, `GradingSettingsDialog`) ayrılmıştır.
                    </li>
                     <li>
                        <strong>UI/UX İyileştirmesi:</strong> Arayüz, projenin mevcut tasarım diliyle tutarlı olması için tamamen Shadcn UI bileşenleri kullanılarak modern ve kullanıcı dostu bir şekilde yeniden oluşturulmuştur.
                    </li>
                </ul>
            </div>
        </div>

        <div>
            <h3 className="font-bold text-lg text-foreground mb-2">Sonuç</h3>
            <p className="text-muted-foreground">
             Bu entegrasyon sonucunda, uygulama son derece güçlü ve esnek bir değerlendirme modülüne kavuşmuştur. Öğretmenler artık notlandırma ve raporlama süreçlerini dijital ortamda verimli bir şekilde yürütebilir. Kod, gelecekteki geliştirmelere olanak tanıyacak şekilde modüler ve ölçeklenebilir bir yapıda tasarlanmıştır.
            </p>
        </div>

      </CardContent>
    </Card>
  );
}
