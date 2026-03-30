'use server';
/**
 * @fileOverview Öğrenci verilerine dayanarak etkinlik tamamlama potansiyelini tahmin eden yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    term1Average: z.number().optional().describe("1. Dönem not ortalaması."),
    term2Average: z.number().optional().describe("2. Dönem not ortalaması."),
    behaviorScore: z.number().optional().describe("Davranış puanı (100 üzerinden).")
});

const PredictActivityCompletionInputSchema = z.object({
  students: z.array(StudentProfileSchema).describe("Analiz edilecek öğrenci profilleri listesi."),
  activities: z.array(z.string()).describe("Değerlendirilecek etkinliklerin listesi."),
});
export type PredictActivityCompletionInput = z.infer<typeof PredictActivityCompletionInputSchema>;

export const PredictActivityCompletionOutputSchema = z.record(
    z.string(), 
    z.array(z.number()).describe("Öğrencinin tamamlayacağı tahmin edilen etkinliklerin indeks numaraları (0'dan başlayan).")
).describe("Her öğrenci ID'si için tamamlanması öngörülen etkinlik indekslerinin bir listesi.");
export type PredictActivityCompletionOutput = z.infer<typeof PredictActivityCompletionOutputSchema>;


export async function predictActivityCompletion(input: PredictActivityCompletionInput): Promise<PredictActivityCompletionOutput> {
  
  const predictionFlow = ai.defineFlow(
    {
      name: 'predictActivityCompletionFlow',
      inputSchema: PredictActivityCompletionInputSchema,
      outputSchema: PredictActivityCompletionOutputSchema,
    },
    async (input) => {
      
      const prompt = `
        Sen tecrübeli bir lise öğretmenisin ve görevin öğrencilerin akademik performansına göre etkinlik tamamlama potansiyellerini tahmin etmek.
        
        Sana iki liste verilecek:
        1.  Öğrencilerin bir listesi: Her öğrencinin ID'si, adı, not ortalamaları ve davranış puanı bulunur.
        2.  Bir ünitedeki etkinliklerin listesi.

        GÖREVİN:
        Her bir öğrencinin profilini (not ortalaması ve davranış puanı) analiz et. Bu analize dayanarak, o öğrencinin verilen etkinlik listesinden hangilerini başarıyla tamamlama ihtimali olduğunu tahmin et.
        
        Değerlendirme Kriterleri:
        - Yüksek not ortalaması ve yüksek davranış puanına sahip öğrenciler (örn: 85 üzeri ortalama, 90 üzeri davranış puanı) etkinliklerin çoğunu veya tamamını yapmaya meyillidir.
        - Orta seviye öğrenciler (50-85 arası ortalama) etkinliklerin bir kısmını, genellikle ilk yarıdakileri veya daha kolay olanları tamamlar.
        - Düşük performanslı öğrenciler (50 altı ortalama) çok az etkinliği tamamlar veya hiç tamamlayamaz. Belki sadece ilk 1-2 tanesini işaretleyebilirsin.
        - Davranış puanı da motivasyon göstergesidir. Notları düşük ama davranış puanı yüksek bir öğrenci, notları yüksek ama davranış puanı düşük bir öğrenciden daha fazla çaba gösterebilir.
        - Etkinlik listesindeki sıralama genellikle bir zorluk veya önem sırasını belirtir. Başarılı öğrencilerin listede daha ileri gitmesini bekle.

        ÇIKTI FORMATI:
        Kesinlikle ve sadece aşağıdaki JSON formatında bir çıktı ver. Çıktı, bir JSON nesnesi olmalı. Bu nesnenin anahtarları (key) öğrenci ID'leri, değerleri (value) ise o öğrencinin tamamlayacağı tahmin edilen etkinliklerin SIFIRDAN BAŞLAYAN indeks numaralarını içeren bir sayı dizisi olmalıdır.
        
        ÖRNEK ÇIKTI:
        {
          "student-id-1": [0, 1, 2, 3, 4, 5],
          "student-id-2": [0, 1, 3],
          "student-id-3": [0, 1]
        }

        VERİLER:
        Öğrenciler:
        ${JSON.stringify(input.students, null, 2)}
        
        Etkinlikler (İndeks sırasına göre):
        ${JSON.stringify(input.activities, null, 2)}
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: PredictActivityCompletionOutputSchema },
      });
      return output!;
    }
  );

  return await predictionFlow(input);
}
