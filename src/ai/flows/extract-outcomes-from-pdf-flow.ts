'use server';
/**
 * @fileOverview Extracts a structured curriculum from a textbook PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the output schema to match the structure of kazanimlar.ts
const KazanımSchema = z.object({
    konu: z.string().describe("The main topic title."),
    kazanimlar: z.array(z.string()).describe("A list of learning outcomes for this topic."),
});

const UniteSchema = z.object({
    unite: z.string().describe("The unit name or grade level (e.g., '9. Sınıf', '1. TEMA: SÖZÜN İNCELİĞİ')."),
    konular: z.array(KazanımSchema).describe("A list of topics within this unit."),
});

export const ExtractedOutcomesSchema = z.object({
    // Using a record to represent the dynamic subject key, e.g., "Edebiyat"
    curriculum: z.record(z.array(UniteSchema)).describe("The structured curriculum, keyed by subject name."),
});
export type ExtractedOutcomes = z.infer<typeof ExtractedOutcomesSchema>;


export const ExtractOutcomesInputSchema = z.object({
  textbookPdf: z
    .string()
    .describe(
      "A textbook as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractOutcomesInput = z.infer<typeof ExtractOutcomesInputSchema>;

export async function extractOutcomesFromPdf(input: ExtractOutcomesInput): Promise<ExtractedOutcomes> {
  const extractFlow = ai.defineFlow(
    {
      name: 'extractOutcomesFlow',
      inputSchema: ExtractOutcomesInputSchema,
      outputSchema: ExtractedOutcomesSchema,
    },
    async (input) => {
        
        const prompt = `
        Sen bir eğitim programı geliştirme uzmanısın ve Türk Dili ve Edebiyatı müfredatına hakimsin.
        Görevin, sana verilen bir lise Türk Dili ve Edebiyatı ders kitabının PDF içeriğini analiz ederek, içindeki üniteleri, konuları ve kazanımları yapılandırılmış bir JSON formatında çıkarmaktır.

        DİKKAT EDİLECEK HUSUSLAR:
        1.  **YAPIYI KORU:** Kitabın 'İçindekiler' veya ünite başlıklarından yola çıkarak yapıyı (Ünite -> Konu -> Kazanımlar) koru. 'unite' alanı sınıf seviyesini (örn: "9. Sınıf") içermelidir.
        2.  **KAZANIMLARI DOĞRU ÇIKAR:** Genellikle "Kazanım:", "Öğrenme Çıktısı:" gibi ifadelerle veya madde imleriyle belirtilen öğrenme hedeflerini eksiksiz ve doğru bir şekilde al.
        3.  **GEREKSİZ BİLGİYİ ATLA:** Sayfa numaraları, resim alt yazıları, örnek metinler gibi müfredat yapısıyla ilgisi olmayan kısımları çıktıya dahil etme.
        4.  **JSON FORMATI:** Çıktın, belirttiğim JSON formatına %100 uymalıdır. Alan isimleri ve veri tipleri tam olarak eşleşmelidir. Kitabın dersi ne ise (örn: 'Edebiyat') onu ana anahtar olarak kullan.

        PDF İÇERİĞİ:
        {{media url=textbookPdf}}
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: ExtractedOutcomesSchema },
        model: 'googleai/gemini-2.5-flash',
      });
      return output!;
    }
  );

  return await extractFlow(input);
}
