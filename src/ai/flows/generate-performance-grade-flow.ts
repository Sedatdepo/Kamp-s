'use server';
/**
 * @fileOverview Öğrenci verilerini analiz ederek performans notları ve geçme durumu hakkında tavsiyeler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { INITIAL_PERF_CRITERIA } from '@/lib/grading-defaults';

const PerformanceGradeInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  exam1Average: z.number().optional().describe('1. Dönem sınav ortalaması.'),
  exam2Average: z.number().optional().describe('2. Dönem sınav ortalaması.'),
  homeworkSubmissionRate: z.string().describe('Ödev teslim oranı (örn: "10 ödevden 8 tanesini yaptı").'),
  attendanceCount: z.number().describe('Toplam devamsız gün sayısı.'),
  behaviorScore: z.number().describe('Davranış puanı (100 üzerinden).'),
  riskFactors: z.array(z.string()).describe('Öğrencinin sahip olduğu risk faktörleri.'),
  teacherNotes: z.string().optional().describe('Öğretmenin öğrenci hakkındaki ek notları.'),
});

export type PerformanceGradeInput = z.infer<typeof PerformanceGradeInputSchema>;

const PerformanceGradeOutputSchema = z.object({
  term1_perf1_grade: z.number().describe("1. Dönem 1. Performans notu önerisi (0-100 arası)."),
  term1_perf1_reason: z.string().describe("Bu notun neden önerildiğine dair kısa gerekçe."),
  term1_perf2_grade: z.number().describe("1. Dönem 2. Performans notu önerisi (0-100 arası)."),
  term1_perf2_reason: z.string().describe("Bu notun neden önerildiğine dair kısa gerekçe."),
  term2_perf1_grade: z.number().describe("2. Dönem 1. Performans notu önerisi (0-100 arası)."),
  term2_perf1_reason: z.string().describe("Bu notun neden önerildiğine dair kısa gerekçe."),
  term2_perf2_grade: z.number().describe("2. Dönem 2. Performans notu önerisi (0-100 arası)."),
  term2_perf2_reason: z.string().describe("Bu notun neden önerildiğine dair kısa gerekçe."),
  finalRecommendation: z.string().describe("Öğrencinin dersi geçip geçemeyeceği ve genel durumu hakkında nihai tavsiye."),
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
      const performanceCriteriaText = INITIAL_PERF_CRITERIA.map(c => `- ${c.name} (${c.max} Puan)`).join('\n');

      const prompt = `
        Sen deneyimli bir lise öğretmenisin. Görevin, bir öğrencinin yıl içindeki verilerini analiz ederek MEB yönetmeliğine uygun, adil ve kanıta dayalı performans notları önermektir.
        
        Performans notlarını değerlendirirken şu kriterleri ve ağırlıklarını dikkate al:
        ${performanceCriteriaText}

        Aşağıda bilgileri verilen öğrenciyi analiz et:
        - Öğrenci Adı: ${input.studentName}
        - 1. Dönem Sınav Ortalaması: ${input.exam1Average?.toFixed(2) ?? 'Girilmemiş'}
        - 2. Dönem Sınav Ortalaması: ${input.exam2Average?.toFixed(2) ?? 'Girilmemiş'}
        - Ödev Teslim Durumu: ${input.homeworkSubmissionRate}
        - Toplam Devamsızlık: ${input.attendanceCount} gün
        - Davranış Puanı: ${input.behaviorScore} / 100
        - Risk Faktörleri: ${input.riskFactors.length > 0 ? input.riskFactors.join(', ') : 'Yok'}
        - Öğretmen Notları: ${input.teacherNotes || 'Yok'}

        Bu verileri kullanarak aşağıdaki JSON formatında bir çıktı oluştur. Her performans notu için 0-100 arasında bir puan öner ve bu puanı neden verdiğini kısaca gerekçelendir.
        
        Örnek Gerekçe: "Ödevlerini zamanında yapması ve derse katılımı yüksek olduğu için yüksek bir not önerildi."
        Örnek Gerekçe: "Sınav başarısı iyi olmasına rağmen devamsızlığı ve ödev eksikliği nedeniyle daha düşük bir not takdir edildi."

        1.  **term1_perf1_grade / term1_perf1_reason**: 1. Dönem başındaki genel durumuna göre bir not ve gerekçe.
        2.  **term1_perf2_grade / term1_perf2_reason**: 1. Dönem sonundaki gelişimini de dikkate alarak bir not ve gerekçe.
        3.  **term2_perf1_grade / term2_perf1_reason**: 2. Dönemin başındaki durumunu (1. dönemden devraldığı alışkanlıklar dahil) değerlendirerek bir not ve gerekçe.
        4.  **term2_perf2_grade / term2_perf2_reason**: Tüm yılı kapsayan genel performansını yansıtan nihai bir not ve gerekçe.
        5.  **finalRecommendation**: Tüm bu veriler ışığında, öğrencinin bu dersten geçip geçemeyeceği hakkında bir öngörüde bulun ve öğretmene yönelik kısa bir tavsiye yaz. (Örn: "Öğrencinin genel ortalaması geçmesi için yeterli görünüyor, ancak ikinci dönemdeki motivasyon düşüklüğüne dikkat edilmeli.")
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
