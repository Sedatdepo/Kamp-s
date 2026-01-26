'use server';
/**
 * @fileOverview Gelişmiş editör için içerik üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMaterialInputSchema = z.object({
  topic: z.string().describe("Dersin konusu."),
  course: z.string().describe("Dersin adı (örn: Biyoloji)."),
  grade: z.string().describe("Sınıf seviyesi (örn: 9)."),
  sources: z.string().optional().describe("Kullanıcı tarafından sağlanan PDF kaynaklarından çıkarılan metin içeriği."),
  images: z.array(z.string()).optional().describe("Kullanıcı tarafından sağlanan görsellerin data URI'leri.")
});

export type GenerateMaterialInput = z.infer<typeof GenerateMaterialInputSchema>;

const SlideSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  points: z.array(z.string()).optional(),
  imageKeyword: z.string().optional(),
  customImage: z.string().optional(),
  data: z.any().optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const FlashcardSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const LessonPlanSchema = z.object({
    hour1: z.object({
        objective: z.string(),
        steps: z.array(z.string())
    }),
    hour2: z.object({
        objective: z.string(),
        steps: z.array(z.string())
    })
});

const GenerateMaterialOutputSchema = z.object({
  meta: z.object({
    topic: z.string(),
    grade: z.string(),
    course: z.string(),
  }),
  lessonPlan: LessonPlanSchema,
  slides: z.array(SlideSchema),
  flashcardsData: z.array(FlashcardSchema),
});

export type GenerateMaterialOutput = z.infer<typeof GenerateMaterialOutputSchema>;


export async function generateMaterial(input: GenerateMaterialInput): Promise<GenerateMaterialOutput> {
  const materialGenerationFlow = ai.defineFlow(
    {
      name: 'materialGenerationFlow',
      inputSchema: GenerateMaterialInputSchema,
      outputSchema: GenerateMaterialOutputSchema,
    },
    async (input) => {
      
      const promptParts: any[] = [];
      const textPart = `
        Sen bir eğitim materyali hazırlama uzmanısın.
        Konu: "${input.topic}" (${input.course}, ${input.grade}. Sınıf).
        ${input.sources ? `Aşağıdaki kaynak metinleri ana referans olarak kullan:\nKAYNAKLAR:\n${input.sources}` : ''}
      
        ${input.images && input.images.length > 0 ? `Sana sağlanan görselleri, hazırlayacağın slaytlarda 'customImage' alanı için kullanarak anlamlı bir şekilde yerleştir. Görselleri JSON çıktısına olduğu gibi, data URI formatında ekle. Bir görseli birden fazla kullanmaktan kaçın.` : ''}

        GÖREV: Aşağıdaki JSON yapısına harfiyen uyarak, lise öğrencileri için ilgi çekici ve öğretici bir ders materyali seti oluştur.

        JSON YAPISI:
        {
          "meta": { "topic": "${input.topic}", "grade": "${input.grade}", "course": "${input.course}" },
          "lessonPlan": {
            "hour1": { "objective": "1. Dersin hedefi...", "steps": ["Adım 1", "Adım 2"] },
            "hour2": { "objective": "2. Dersin hedefi...", "steps": ["Adım 1", "Adım 2"] }
          },
          "flashcardsData": [ // Konuyla ilgili EN AZ 10 adet soru-cevap kartı oluştur.
            { "q": "...", "a": "..." }
          ],
          "slides": [ // Toplamda EN AZ 15 slayt oluştur. Slayt türlerini çeşitlendir.
            { "type": "cover", "title": "...", "subtitle": "..." },
            { "type": "text-detailed", "title": "...", "content": "...", "points": ["...", "...", "..."] },
            { "type": "text-image", "title": "Görselli Metin", "content": "Metin...", "customImage": "SAĞLANAN GÖRSELLERDEN BİRİNİN DATA URI'Sİ" },
            { "type": "diagram-map", "title": "Zihin Haritası", "data": { "title": "Ana Kavram", "items": [{"main": "Alt Başlık 1", "sub": "Detay"}, {"main": "Alt Başlık 2", "sub": "Detay"}] } },
            { "type": "diagram-infographic", "title": "Süreç/Zaman Çizelgesi", "data": [ {"title": "Adım 1", "desc": "Açıklama"}, {"title": "Adım 2", "desc": "Açıklama"} ] },
            { "type": "table", "title": "Karşılaştırma Tablosu", "data": { "headers": ["Özellik","Açıklama"], "rows": [["...", "..."]] } },
            { "type": "quiz", "title": "Test Sorusu", "question": "...", "options": ["A","B","C","D"] }
          ]
        }
      `;
      promptParts.push({ text: textPart });

      if (input.images) {
        input.images.forEach(imgDataUri => {
            promptParts.push({ media: { url: imgDataUri } });
        });
      }

      const { output } = await ai.generate({
        prompt: promptParts,
        output: { schema: GenerateMaterialOutputSchema },
      });

      return output!;
    }
  );

  return await materialGenerationFlow(input);
}
