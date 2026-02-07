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
  participants: z.array(z.string()).optional().describe('Toplantıya katılan diğer öğretmenlerin listesi.'),
  keywords: z.string().optional().describe('Metinde kullanılması istenen anahtar kelimeler veya ana fikirler.')
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
        Sen, Milli Eğitim Bakanlığı mevzuatına hakim, tecrübeli bir okul yöneticisi veya kıdemli bir zümre başkanısın. Görevin, resmi toplantı tutanakları için "Görüşmeler" bölümünü doldurmaktır.

        Aşağıdaki bilgileri kullanarak, gündem maddesini tüm yönleriyle ele alan, detaylı, resmi ve doyurucu bir paragraf yaz.
        - **Toplantı Türü:** ${input.meetingType}
        - **Görüşülen Gündem Maddesi:** "${input.agendaTitle}"
        ${input.classInfo ? `- **İlgili Sınıf:** ${input.classInfo}` : ''}
        ${input.teacherInfo ? `- **Toplantı Yöneticisi:** ${input.teacherInfo}` : ''}
        
        METİN İÇERİĞİ İÇİN ZORUNLU KURALLAR:
        1.  **Katılımcı Görüşleri:** Aşağıdaki katılımcı listesinden EN AZ 2-3 öğretmene söz hakkı vererek onların konuyla ilgili (kurgusal ama mantıklı) görüşlerini metne dahil et. Örnek: "Matematik öğretmeni Ahmet Yılmaz, öğrencilerin temel konulardaki eksikliklerinin proje başarılarını etkilediğini belirtti." Katılımcılar: ${input.participants ? input.participants.join(', ') : 'Belirtilmemiş'}
        2.  **Anahtar Kelimeler:** Aşağıda verilen anahtar kelimeleri veya cümleleri, oluşturduğun metnin içinde mutlaka anlamlı bir şekilde kullanmalısın. Anahtar Kelimeler: "${input.keywords || 'Belirtilmemiş'}"
        3.  **Resmi Üslup:** Metin, bir devlet okulunda hazırlanan resmi bir tutanağa eklenebilecek kalitede ve uzunlukta olmalı. ("yapıldı", "edildi", "görüşüldü", "belirtildi", "vurgulandı", "kararlaştırıldı" gibi edilgen ve resmi fiiller kullan.)
        4.  **Detaylandırma:** Tek bir cümle yazma. Maddeyi detaylandır, farklı yönlerini ele al, olası çözümleri veya tartışma noktalarını belirt.

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
