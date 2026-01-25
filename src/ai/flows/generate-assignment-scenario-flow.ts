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
  taskTitle: z.string().describe("Görev için yaratıcı ve ilgi çekici bir başlık."),
  taskDescription: z.string().describe("Öğrenciye verilecek görevin açıklaması. Bu bir problem durumu, bir araştırma sorusu, bir tasarım projesi veya yaratıcı bir senaryo olabilir."),
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
        Sen deneyimli bir eğitim programı geliştirme uzmanısın. Görevin, lise öğrencileri için, verilen kazanımlara uygun, yaratıcı ve ilgi çekici görevler oluşturmaktır.

        Aşağıdaki bilgileri kullanarak, öğrencinin bir konuyu derinlemesine araştırmasını, bir problemi çözmesini veya bir ürün ortaya koymasını sağlayacak bir görev metni oluştur.

        - **Ders:** ${input.lesson}
        - **Sınıf Seviyesi:** ${input.grade}
        - **Konu:** ${input.topic}
        - **Hedeflenen Kazanım:** "${input.outcome}"

        **Çıktı Kuralları:**
        1.  **Başlık (taskTitle):** Görev için yaratıcı, kısa ve dikkat çekici bir başlık bul. Bu başlık, görevin ne olduğunu özetlemelidir. (Örnek: 'Geçmişin Dedektifleri: Birincil Kaynak Analizi', 'Enerji Dönüşüm Simülatörü', 'Şiirdeki Gizli Anlamlar').
        2.  **Açıklama (taskDescription):** Görevin detaylı açıklamasını yaz. Bu metin, bir senaryo olmak zorunda değil. Bir araştırma sorusu, bir tasarım problemi, bir analiz görevi veya yaratıcı bir yazma istemi olabilir. Metin, öğrenciye ne yapması gerektiğini net bir şekilde anlatmalı ve onu motive etmelidir.
        
        Örnek Çıktı (Fizik - Tork konusu için):
        {
          "taskTitle": "Robotik Kol Dengeleme Meydan Okuması",
          "taskDescription": "Katıldığınız teknoloji yarışmasında, takımınızın geliştirdiği robot kolunun hassas bir nesneyi devirmeden kaldırıp taşıması gerekiyor. Bu görevi başarmak için, robot kolunun eklemlerindeki tork dengesini ve kuvvetin uygulama noktalarını mükemmel bir şekilde hesaplamalısınız. Analizlerinizi ve hesaplamalarınızı içeren bir rapor hazırlayın."
        }
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: GenerateAssignmentScenarioOutputSchema },
      });
      return output!;
    }
  );

  