'use server';
/**
 * @fileOverview Öğrencinin bütünsel verilerini analiz ederek, adil ve gerekçeli performans notları üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PerformanceGradeInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  examAverage: z.number().optional().describe('Aktif dönemdeki sınav ortalaması. Performans notları için taban çizgisi olarak kullanılmalıdır.'),
  behaviorScore: z.number().describe('Davranış puanı (100 üzerinden). Yüksek puan olumlu bir göstergedir.'),
  positiveBehaviorCount: z.number().describe('Kazanılan olumlu davranış/rozet sayısı. Notu olumlu etkiler.'),
  negativeBehaviorCount: z.number().describe('Alınan olumsuz davranış kaydı sayısı. Notu olumsuz etkileyebilir.'),
  disciplineRecordCount: z.number().describe('Hakkında açılmış disiplin süreci sayısı. Bu, not üzerinde ciddi bir olumsuz etken olabilir.'),
});

export type PerformanceGradeInput = z.infer<typeof PerformanceGradeInputSchema>;

const PerformanceGradeOutputSchema = z.object({
  perf1_grade: z.number().describe("1. Performans notu önerisi (0-100 arası)."),
  perf1_reason: z.string().describe("Bu notun neden önerildiğine dair kısa ve öz gerekçe."),
  perf2_grade: z.number().describe("2. Performans notu önerisi (0-100 arası)."),
  perf2_reason: z.string().describe("Bu notun neden önerildiğine dair kısa ve öz gerekçe."),
});

export type PerformanceGradeOutput = z.infer<typeof PerformanceGradeOutputSchema>;

export async function generatePerformanceGrade(input: PerformanceGradeInput): Promise<PerformanceGradeOutput> {
  const performanceGradeFlow = ai.defineFlow(
    {
      name: 'performanceGradeFlow',
      inputSchema: PerformanceGradeInputSchema,
      outputSchema: PerformanceGradeOutputSchema,
    },
    async (input) => {
      const prompt = `
        Sen deneyimli bir Türk lise öğretmenisin. Görevin, bir öğrencinin dönem içindeki verilerini analiz ederek MEB yönetmeliğine uygun, adil ve kanıta dayalı iki adet performans notu önermektir.

        ### ÇOK KRİTİK KURAL ###
        Önereceğin performans notları, öğrencinin sınav ortalamasından (${input.examAverage?.toFixed(2) ?? '50'}) KESİNLİKLE DAHA DÜŞÜK OLAMAZ. Bu ortalamayı bir taban olarak kullan ve notları bunun üzerine inşa et.

        ### DEĞERLENDİRME KRİTERLERİ ###
        1.  **Sınav Ortalaması (${input.examAverage?.toFixed(2) ?? '50'}):** Bu not, performans notları için bir başlangıç noktasıdır. Notlar bu değerin altına düşemez.
        2.  **Davranış Puanı (${input.behaviorScore}/100):** 100'e ne kadar yakınsa o kadar iyidir. Bu puan, öğrencinin genel tutumunu yansıtır ve notu pozitif yönde etkilemelidir.
        3.  **Olumlu Davranışlar (${input.positiveBehaviorCount} adet):** Rozetler veya pozitif kayıtlar, öğrencinin çabasını gösterir. Her bir olumlu davranış, notu bir miktar artırmalıdır.
        4.  **Olumsuz Davranışlar (${input.negativeBehaviorCount} adet):** Küçük olumsuzluklar notu hafifçe düşürebilir ama sınav ortalamasının altına indirmemelidir.
        5.  **Disiplin Süreçleri (${input.disciplineRecordCount} adet):** Bu en ciddi olumsuz göstergedir. Eğer disiplin süreci varsa, notu sınav ortalamasına yakın tut, ancak yine de altına düşürme.
        
        ### GÖREVİN ###
        Bu verileri kullanarak aşağıdaki JSON formatında bir çıktı oluştur. Her performans notu için 0-100 arasında bir puan öner ve bu puanı neden verdiğini TEK CÜMLE ile gerekçelendir. İkinci performans notu, ilkine göre bir gelişim veya düşüşü yansıtabilir.

        Öğrenci: ${input.studentName}
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: PerformanceGradeOutputSchema },
      });
      return output!;
    }
  );

  return await performanceGradeFlow(input);
}
