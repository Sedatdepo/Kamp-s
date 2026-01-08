'use server';
/**
 * @fileOverview Soru üretme yapay zeka akışı.
 *
 * - generateQuestion - Kazanım ve soru tipine göre soru üreten fonksiyon.
 * - GenerateQuestionInput - generateQuestion fonksiyonunun giriş tipi.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input and output schemas inside the function scope
// to avoid exporting them from a 'use server' file.

export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;
const GenerateQuestionInputSchema = z.object({
  kazanim: z.string().describe('Sorunun üretileceği öğrenme kazanımı.'),
  type: z.enum(["multiple-choice", "true-false", "open-ended"]).describe('Üretilecek sorunun tipi.'),
});

export type QuestionOutput = z.infer<typeof QuestionOutputSchema>;
const QuestionOutputSchema = z.object({
    text: z.string().describe("Sorunun ana metni."),
    type: z.enum(["multiple-choice", "true-false", "open-ended"]).describe("Sorunun tipi."),
    options: z.array(z.string()).optional().describe("Çoktan seçmeli soru için seçenekler. Diğer türler için boş bırakılmalıdır."),
    correctAnswer: z.any().optional().describe("Doğru cevap. Çoktan seçmeli için seçenek metni, doğru/yanlış için boolean, açık uçlu için örnek cevap."),
    points: z.number().default(10).describe("Sorunun varsayılan puanı."),
});

export async function generateQuestion(input: GenerateQuestionInput): Promise<QuestionOutput> {
  const generateQuestionFlow = ai.defineFlow(
    {
      name: 'generateQuestionFlow',
      inputSchema: GenerateQuestionInputSchema,
      outputSchema: QuestionOutputSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'generateQuestionPrompt',
            input: { schema: GenerateQuestionInputSchema },
            output: { schema: QuestionOutputSchema },
            prompt: `Sen bir eğitim teknolojileri uzmanısın ve MEB müfredatına hakim, yaratıcı bir soru yazarsın.
Aşağıda verilen KAZANIM ve SORU TİPİ'ne uygun bir sınav sorusu oluştur.

KAZANIM: {{{kazanim}}}
SORU TİPİ: {{{type}}}

Kurallar:
- Soru metni, kazanımı doğrudan ölçmeli ve öğrencinin anlama, yorumlama veya uygulama becerisini test etmelidir.
- 'multiple-choice' (çoktan seçmeli) tipi için:
  - 4 adet seçenek ('options' dizisi) oluştur.
  - Bir doğru cevap ('correctAnswer' alanı) belirle.
  - Seçenekler mantıklı ve çeldiriciler güçlü olmalı.
- 'true-false' (doğru-yanlış) tipi için:
  - 'correctAnswer' alanına 'true' veya 'false' boolean değerini ata.
- 'open-ended' (açık uçlu) tipi için:
  - 'options' dizisini boş bırak.
  - 'correctAnswer' alanına örnek bir cevap veya değerlendirme kriteri yaz.
- Üretilen soru nesnesi, belirtilen JSON formatına tam olarak uymalıdır.
`,
        });

        const { output } = await prompt(input);
        return output!;
    }
  );

  return await generateQuestionFlow(input);
}
