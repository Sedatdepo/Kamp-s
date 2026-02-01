'use server';
/**
 * @fileOverview Toplantı gündem maddelerine dayalı olarak otomatik karar metinleri üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMeetingDecisionsInputSchema = z.object({
  meetingType: z.enum(['ŞÖK', 'Zümre', 'Veli Toplantısı']).describe('Toplantının türü.'),
  agendaItems: z.array(z.string()).describe('Görüşülen tüm gündem maddelerinin listesi.'),
});

export type GenerateMeetingDecisionsInput = z.infer<typeof GenerateMeetingDecisionsInputSchema>;

const GenerateMeetingDecisionsOutputSchema = z.object({
  generatedDecisions: z.string().describe('Tüm gündem maddelerine dayalı olarak oluşturulan, numaralandırılmış karar metinleri.'),
});

export type GenerateMeetingDecisionsOutput = z.infer<typeof GenerateMeetingDecisionsOutputSchema>;

export async function generateMeetingDecisions(
  input: GenerateMeetingDecisionsInput
): Promise<GenerateMeetingDecisionsOutput> {
  const decisionsFlow = ai.defineFlow(
    {
      name: 'meetingDecisionsFlow',
      inputSchema: GenerateMeetingDecisionsInputSchema,
      outputSchema: GenerateMeetingDecisionsOutputSchema,
    },
    async (input) => {
      const prompt = `
        Sen, Milli Eğitim Bakanlığı mevzuatına hakim, tecrübeli bir okul yöneticisisin. Görevin, bir toplantıda görüşülen gündem maddelerine bakarak, bu maddelerle ilgili alınması muhtemel kararları özetleyen resmi bir "Alınan Kararlar" metni oluşturmaktır.

        Çıktın, gerçek bir toplantı tutanağına doğrudan kopyalanabilecek kalitede, numaralandırılmış ve maddeler halinde olmalıdır. Her madde, ilgili gündem maddesiyle mantıksal bir bütünlük taşımalıdır.

        Aşağıdaki bilgileri kullanarak istenen metni oluştur:

        - **Toplantı Türü:** ${input.meetingType}
        - **Görüşülen Gündem Maddeleri:**
          ${input.agendaItems.map((item, index) => `- ${index + 1}. ${item}`).join('\n')}

        **Metin Stili ve Çıktı Kuralları:**
        1.  Her bir karar, bir numara ile başlamalıdır (1., 2., 3. ...).
        2.  Kesinlikle resmi bir dil kullan. ("...yapılmasına karar verilmiştir.", "...gerektiği vurgulandı.", "...konusunda mutabık kalındı.")
        3.  Her gündem maddesi için en az bir ilgili karar üretmeye çalış.
        4.  "Açılış ve yoklama" gibi maddeler için "Toplantının ... tarafından açıldığı ve yapılan yoklamada ... kişinin hazır bulunduğu görüldü." gibi standart bir karar yaz.
        5.  "Dilek ve temenniler" ve "Kapanış" gibi maddeler için de uygun, standart kapanış kararları yaz.
        6.  Öğrenci başarısı, devamsızlık, ölçme-değerlendirme gibi temel maddeler için yönetmeliklere uygun, genel geçer ve mantıklı kararlar üret.
        7.  Kararlar, birbirinden ayrı maddeler halinde, her biri yeni bir satırda olacak şekilde formatlanmalıdır.

        Oluşturacağın metni 'generatedDecisions' alanına yerleştir.
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: GenerateMeetingDecisionsOutputSchema },
      });
      return output!;
    }
  );

  return await decisionsFlow(input);
}
