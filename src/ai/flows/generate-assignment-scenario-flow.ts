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
  taskType: z.string().describe('Görevin ana türü (örn: "Performans Görevi", "Proje Ödevi").'),
  taskSubtype: z.string().describe('Görevin alt türü (örn: "Pekiştirici Performans Görevi", "Yapı/Maket Projesi").'),
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
        Sen, Türkiye Yüzyılı Maarif Modeli'ne hakim, yaratıcı bir eğitim programı geliştirme uzmanısın. Görevin, lise öğrencileri için, verilen bilgilere ve istenen görev türüne uygun, ilgi çekici ve pedagojik olarak değerli görevler oluşturmaktır.

        Aşağıdaki bilgileri kullanarak, öğrencinin bir konuyu derinlemesini, bir problemi çözmesini veya bir ürün ortaya koymasını sağlayacak bir görev metni oluştur.

        - **Ders:** ${input.lesson}
        - **Sınıf Seviyesi:** ${input.grade}
        - **Konu:** ${input.topic}
        - **Hedeflenen Kazanım:** "${input.outcome}"
        - **İstenen Görev Türü:** ${input.taskType} - ${input.taskSubtype}

        **İLHAM ALINACAK ÖRNEKLER VE TANIMLAR:**
        ---
        **Performans Görevi Türleri:**
        1.  **Derse Hazırlık:** Amacı öğrencileri yeni konuya hazırlamak, merak uyandırmaktır. (Örnek: Belgesel izleyip özet çıkarma, konuyla ilgili ön araştırma yapma).
        2.  **Pekiştirici:** Amacı öğrenilen bilgilerin kalıcılığını artırmaktır. (Örnek: Konuyla ilgili ek problemler çözme, kavram haritası oluşturma).
        3.  **Geliştirmeye Yönelik:** Amacı üst düzey düşünme becerilerini kullanarak yaratıcı ve özgün ürünler ortaya koymaktır. (Örnek: Bir maket yapma, bir senaryo yazma, bir poster tasarlama).
        4.  **Düzeltmeye Yönelik:** Amacı tespit edilen eksik veya yanlış öğrenmeleri gidermektir. (Örnek: Konuyla ilgili bir test hazırlama ve cevaplarını açıklama, yanlış yapılan sorular üzerine bir sunum yapma).

        **Proje Türleri:**
        1.  **Yapı/Maket Projesi:** Somut, üç boyutlu bir ürün oluşturmayı hedefler. (Örnek: Hücre modeli, tarihi bir yapı maketi).
        2.  **Deneysel/Araştırma Projesi:** Bilimsel yöntem basamaklarını kullanarak bir hipotezi test etmeyi veya bir konuyu derinlemesine araştırmayı hedefler. (Örnek: Bitki büyümesinde ışığın etkisini araştırma raporu).
        ---

        **ÇIKTI KURALLARI:**
        1.  **Başlık (taskTitle):** Görev için yaratıcı, kısa ve dikkat çekici bir başlık bul. Başlık, seçilen alt türe tam olarak uygun olmalıdır.
        2.  **Açıklama (taskDescription):** Görevin detaylı açıklamasını yaz. Bu metin, seçilen görev türüne ve alt türüne uygun bir problem durumu, araştırma sorusu, tasarım projesi veya yaratıcı bir senaryo olabilir. Metin, öğrenciye ne yapması gerektiğini net bir şekilde anlatmalı ve onu motive etmelidir. ASLA bir rol verme (örn: "Sen bir mühendissin..."). Doğrudan görevi açıkla.

        **Örnek Çıktı (Fizik, Geliştirmeye Yönelik Performans Görevi için):**
        {
          "taskTitle": "Kaldıraç Simülatörü Tasarımı",
          "taskDescription": "Basit makineler konusunu pekiştirmek amacıyla, farklı kuvvet ve destek noktalarıyla bir kaldıraç sisteminin nasıl çalıştığını gösteren interaktif bir dijital simülatör veya fiziksel bir maket tasarlayın. Çalışmanızın sonunda, tasarladığınız sistemin tork ve denge prensiplerini nasıl gösterdiğini anlatan kısa bir rapor hazırlayın."
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
