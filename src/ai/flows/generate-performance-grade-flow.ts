'use server';
/**
 * @fileOverview Öğrencinin bütünsel verilerini analiz ederek, adil ve gerekçeli performans notları üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PerformanceGradeInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  examAverage: z.number().optional().describe('Aktif dönemdeki sınav ortalaması.'),
  performanceHomeworkAverage: z.number().optional().describe('Öğrencinin aldığı tüm performans ödevlerinden aldığı notların ortalaması.'),
  behaviorScore: z.number().describe('Davranış puanı (100 üzerinden).'),
  badgeCount: z.number().describe('Kazanılan toplam rozet sayısı.'),
  negativeBehaviorCount: z.number().describe('Alınan olumsuz davranış kaydı sayısı.'),
  disciplineRecordCount: z.number().describe('Hakkında açılmış disiplin süreci sayısı.'),
  adjustmentGoal: z.string().optional().describe('A special instruction to adjust the final grade, e.g., "bring_below_45".')
});

export type PerformanceGradeInput = z.infer<typeof PerformanceGradeInputSchema>;

const PerformanceGradeOutputSchema = z.object({
  perf1_grade: z.number().describe("1. Performans notu önerisi (0-100 arası)."),
  perf1_reason: z.string().describe("Bu notun neden önerildiğine dair kısa ve öz gerekçe."),
  perf2_grade: z.number().describe("2. Performans notu önerisi (0-100 arası)."),
  perf2_reason: z.string().describe("Bu notun neden önerildiğine dair kısa ve öz gerekçe."),
});

export type PerformanceGradeOutput = z.infer<typeof PerformanceGradeOutputSchema>;

export const performanceGradeFlow = ai.defineFlow(
  {
    name: 'performanceGradeFlow',
    inputSchema: PerformanceGradeInputSchema,
    outputSchema: PerformanceGradeOutputSchema,
  },
  async (input) => {
    const prompt = `
      Sen deneyimli ve adil bir Türk lise öğretmenisin. Görevin, bir öğrencinin dönem içindeki verilerini bütünsel olarak analiz ederek MEB yönetmeliğine uygun, adil ve kanıta dayalı iki adet performans notu önermektir.

      ### NOT HESAPLAMA KURALLARI ###
      1.  **Ağırlıklandırma:** Performans notunu belirlerken, %50 sınav ortalamasını, %50 ise diğer olumlu/olumsuz faktörleri (performans ödevi, davranış puanı, rozet, disiplin vb.) dikkate al.
      2.  **Tavan Puan Kuralı:** Önerilen performans notu, öğrencinin sınav ortalamasından en fazla 40 puan yüksek olabilir. Örneğin, sınav ortalaması 30 ise, performans notu 70'i geçemez. Sınav ortalaması 65 ise performans notu 100'ü geçemez.
      3.  **Taban Puan Kuralı:** Önerilen performans notları, öğrencinin sınav ortalamasından (${input.examAverage?.toFixed(2) ?? '50'}) KESİNLİKLE DAHA DÜŞÜK OLAMAZ. Bu ortalamayı bir taban çizgisi olarak kullanmalı ve notları bunun üzerine inşa etmelisin. Eğer öğrencinin diğer verileri çok olumsuz ise, notu sınav ortalamasına çok yakın tutabilirsin ama asla altına düşürme.
      
      {{#if adjustmentGoal}}
      ### ÖZEL TALİMAT: KRİTİK EŞİK AYARLAMASI ###
      Bu öğrencinin genel not ortalaması 45-50 arası kritik bir eşikte kalmıştır. Görevin, öğrencinin genel ortalamasını 45'in altına düşürecek şekilde PERFORMANS NOTLARINI YENİDEN HESAPLAMAKTIR. Mevcut sınav notlarını dikkate alarak, performans notlarını adil ama öğrencinin sınıf tekrarına kalmasını sağlayacak şekilde düşür. Gerekçende bu durumdan bahset.
      {{/if}}

      ### DEĞERLENDİRME KRİTERLERİ ###
      Aşağıdaki verileri bir bütün olarak değerlendirerek mantıklı ve adil notlar öner.

      1.  **Sınav Ortalaması (${input.examAverage?.toFixed(2) ?? '50'}):** Performans notu için taban değer budur. 
      
      2.  **Performans Ödevi Ortalaması (${input.performanceHomeworkAverage?.toFixed(2) ?? 'Veri Yok'}):** Bu, öğrencinin proje ve performans görevlerindeki başarısını gösteren en önemli verilerden biridir. Bu ortalama, sınav ortalaması ile birlikte performans notunu belirlemede anahtar rol oynamalıdır. Yüksek bir ödev ortalaması, sınavları düşük olsa bile notu yukarı çekmelidir.

      3.  **Davranış Puanı (${input.behaviorScore}/100):** Öğrencinin genel tutumunu yansıtır. 100'e yakın olması notu olumlu, 70'in altına düşmesi ise olumsuz etkiler.

      4.  **Kazanılan Rozet Sayısı (${input.badgeCount} adet):** Bu, öğrencinin yıl boyunca gösterdiği genel çabayı ve ders dışı başarılarını gösterir. Yüksek rozet sayısı, notu bir miktar pozitif yönde etkilemelidir.

      5.  **Olumsuz Davranış Sayısı (${input.negativeBehaviorCount} adet):** Dersteki küçük olumsuzlukları ifade eder. Her 2-3 olumsuz davranış, notu bir miktar düşürebilir ama sınav ortalamasının altına indirmemelidir.
      
      6.  **Disiplin Süreçleri (${input.disciplineRecordCount} adet):** Bu en ciddi olumsuz göstergedir. Eğer disiplin süreci varsa, performans notunu sınav ortalamasına çok yakın tut, ancak yine de altına düşürme. Bu durum, notun yükselmesini büyük ölçüde engeller.
      
      ### GÖREVİN ###
      Bu bütüncül verileri kullanarak ${input.studentName} adlı öğrenci için aşağıdaki JSON formatında bir çıktı oluştur. Her performans notu için 0-100 arasında bir puan öner ve bu puanı TEK CÜMLE ile, yukarıdaki kriterlere atıfta bulunarak gerekçelendir. (Örn: "Sınav ortalamasına yakın olsa da, yüksek performans ödevi ortalaması ve davranış puanı notunu yükseltmiştir.").

      İkinci performans notunu, ilkine göre bir gelişim veya düşüşü yansıtacak şekilde belirle. Örneğin, öğrencinin ödevleri iyileşmişse ikinci not daha yüksek olabilir.
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: { schema: PerformanceGradeOutputSchema },
    });
    return output!;
  }
);

export async function generatePerformanceGrade(input: PerformanceGradeInput): Promise<PerformanceGradeOutput> {
  return await performanceGradeFlow(input);
}

