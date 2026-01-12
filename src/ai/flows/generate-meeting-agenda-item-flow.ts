'use server';
/**
 * @fileOverview Toplantı gündem maddeleri için detaylı ve resmi metinler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMeetingAgendaItemInputSchema = z.object({
  meetingType: z.enum(['ŞÖK', 'Zümre', 'Veli Toplantısı']).describe('Toplantının türü.'),
  agendaTitle: z.string().describe('Görüşülecek gündem maddesinin başlığı.'),
  classInfo: z.string().optional().describe('İlgili sınıf bilgisi, örn: "9/A Sınıfı".'),
  teacherInfo: z.string().optional().describe('Toplantıyı yürüten öğretmen veya zümre başkanı bilgisi.'),
});

export type GenerateMeetingAgendaItemInput = z.infer<typeof GenerateMeetingAgendaItemInputSchema>;

const GenerateMeetingAgendaItemOutputSchema = z.object({
  generatedText: z.string().describe('Gündem maddesi için oluşturulan detaylı ve resmi metin.'),
});

export type GenerateMeetingAgendaItemOutput = z.infer<typeof GenerateMeetingAgendaItemOutputSchema>;

export async function generateMeetingAgendaItem(
  input: GenerateMeetingAgendaItemInput
): Promise<GenerateMeetingAgendaItemOutput> {
  const meetingAgendaFlow = ai.defineFlow(
    {
      name: 'meetingAgendaFlow',
      inputSchema: GenerateMeetingAgendaItemInputSchema,
      outputSchema: GenerateMeetingAgendaItemOutputSchema,
    },
    async (input) => {
      const prompt = `
        Sen, Milli Eğitim Bakanlığı mevzuatına hakim, en az 20 yıllık tecrübeye sahip bir okul müdürü veya kıdemli bir zümre başkanısın. Görevin, resmi toplantı tutanakları için "Görüşmeler" bölümünü doldurmaktır.
        
        Senden istediğim şey, kısa ve baştan savma cevaplar vermek yerine, her bir gündem maddesini ciddiyetle ele alarak, o konuda neler konuşulabileceğini, hangi kararların alınabileceğini ve nelere dikkat edilebileceğini içeren, detaylı, resmi ve doyurucu bir paragraf yazmandır. Metinlerin, bir devlet okulunda hazırlanan gerçek bir tutanağa eklenebilecek kalitede ve uzunlukta olmalı. Evrak dolu dolu gözükmeli.

        Aşağıdaki bilgileri kullanarak istenen metni oluştur:

        - **Toplantı Türü:** ${input.meetingType}
        - **Görüşülen Gündem Maddesi:** "${input.agendaTitle}"
        ${input.classInfo ? `- **İlgili Sınıf:** ${input.classInfo}` : ''}
        ${input.teacherInfo ? `- **Toplantı Yöneticisi:** ${input.teacherInfo}` : ''}

        **Metin Stili Kuralları:**
        - Kesinlikle resmi bir dil kullan. ("yapıldı", "edildi", "görüşüldü", "belirtildi", "vurgulandı", "kararlaştırıldı" gibi edilgen ve resmi fiiller kullan.)
        - Konuyla ilgili yönetmeliklere veya genel eğitim prensiplerine atıfta bulunarak metni zenginleştir.
        - Sadece tek bir cümle yazma. Maddeyi detaylandır, farklı yönlerini ele al. Örneğin, başarı durumu görüşülüyorsa, sadece "başarıları görüşüldü" demek yerine, "sınıfın genel başarı ortalaması, derslere göre başarı dağılımı, deneme sınavı sonuçları ve bireysel öğrenci performansları ele alındı. Özellikle X dersindeki başarı düşüklüğünün nedenleri tartışılarak ek önlemler alınması gerektiği vurgulandı." gibi detaylar ekle.
        - Paragraf formatında, akıcı ve anlamlı bir metin oluştur.

        Oluşturacağın metni 'generatedText' alanına yerleştir.
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: GenerateMeetingAgendaItemOutputSchema },
      });
      return output!;
    }
  );

  return await meetingAgendaFlow(input);
}