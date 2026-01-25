'use server';
/**
 * @fileOverview Öğrenciler için bir öğrenme kazanımına dayalı yaratıcı görev senaryoları üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAssignmentScenarioInputSchema = z.object({
  lesson: z.string().describe('Dersin adı (örn: Fizik, Edebiyat).'),
  grade: z.string().describe('Sınıf seviyesi (örn: 9. Sınıf).'),
  topic: z.string().describe('Ödevin ilgili olduğu konu başlığı.'),
  outcome: z.string().describe('Ödevin hedeflediği öğrenme kazanımı.'),
});

export type GenerateAssignmentScenarioInput = z.infer<typeof GenerateAssignmentScenarioInputSchema>;

const GenerateAssignmentScenarioOutputSchema = z.object({
  role: z.string().describe("Öğrencinin bürüneceği profesyonel rol (örn: 'Ar-Ge Mühendisi', 'Müze Küratörü')."),
  scenario: z.string().describe("Öğrenciyi göreve motive edecek, rolüne uygun, yaratıcı ve gerçekçi bir problem durumu veya görev senaryosu."),
});

export type GenerateAssignmentScenarioOutput = z.infer<typeof GenerateAssignmentScenarioOutputSchema>;

export async function generateAssignmentScenario(
  input: GenerateAssignmentScenarioInput
): Promise<GenerateAssignmentScenarioOutput> {
  const scenarioFlow = ai.defineFlow(
    {
      name: 'assignmentScenarioFlow',
      inputSchema: GenerateAssignmentScenarioInputSchema,
      outputSchema: GenerateAssignmentScenarioOutputSchema,
    },
    async (input) => {
      const prompt = `
        Sen deneyimli bir eğitim programı geliştirme uzmanı ve yaratıcı bir senaristtin. Görevin, lise öğrencileri için ilgi çekici ve gerçekçi görev senaryoları oluşturmaktır.

        Aşağıdaki bilgileri kullanarak, öğrencinin bir role bürünmesini sağlayacak ve onu belirli bir problemi çözmeye veya bir ürün ortaya koymaya teşvik edecek bir senaryo yaz.

        - **Ders:** ${input.lesson}
        - **Sınıf Seviyesi:** ${input.grade}
        - **Konu:** ${input.topic}
        - **Hedeflenen Kazanım:** "${input.outcome}"

        **Çıktı Kuralları:**
        1.  **Rol (role):** Öğrenciye profesyonel ve ilginç bir rol ver. (Örnek: 'Bilim Dergisi Editörü', 'Arkeolog', 'Şehir Planlamacısı', 'Yazılım Geliştirici'). Bu rol, konuyla doğrudan ilişkili olmalı.
        2.  **Senaryo (scenario):** Öğrencinin bu roldeyken karşılaşacağı, hedef kazanımı kullanmasını gerektiren kısa, net ve motive edici bir problem durumu veya görev tanımı yaz. Senaryo, öğrenciye "Ne yapmam gerekiyor?" sorusunun cevabını vermelidir. Cümlelerin kısa ve etkili olsun.

        Örnek Çıktı (Fizik - Tork konusu için):
        {
          "role": "Robotik Tasarım Mühendisi",
          "scenario": "Katıldığınız teknoloji yarışmasında, takımınızın geliştirdiği robot kolunun hassas bir nesneyi devirmeden kaldırıp taşıması gerekiyor. Bu görevi başarmak için, robot kolunun eklemlerindeki tork dengesini ve kuvvetin uygulama noktalarını mükemmel bir şekilde hesaplamalısınız."
        }
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: GenerateAssignmentScenarioOutputSchema },
      });
      return output!;
    }
  );

  return await scenarioFlow(input);
}
