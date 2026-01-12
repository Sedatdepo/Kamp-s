'use server';
/**
 * @fileOverview Soru üretme yapay zeka akışı.
 *
 * - generateQuestion - Kazanım ve soru tipine göre soru üreten fonksiyon.
 * - GenerateQuestionInput - generateQuestion fonksiyonunun giriş tipi.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const GenerateQuestionInputSchema = z.object({
  kazanim: z.string().describe('Sorunun üretileceği öğrenme kazanımı.'),
  type: z.enum(["multiple-choice", "true-false", "open-ended", "matching"]).describe('Üretilecek sorunun tipi.'),
  photoDataUri: z.string().optional().describe("A photo to base the question on, as a data URI."),
});
export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;

const QuestionOutputSchema = z.object({
    text: z.string().describe("Sorunun ana metni veya başlığı."),
    type: z.enum(["multiple-choice", "true-false", "open-ended", "matching"]).describe("Sorunun tipi."),
    options: z.array(z.string()).optional().describe("Çoktan seçmeli soru için seçenekler. Diğer türler için boş bırakılmalıdır."),
    correctAnswer: z.any().optional().describe("Doğru cevap. Çoktan seçmeli için seçenek metni, doğru/yanlış için boolean, açık uçlu için örnek cevap. Eşleştirme için boş bırakılır."),
    matchingPairs: z.array(z.object({
        id: z.string().default(() => uuidv4()),
        question: z.string(),
        answer: z.string()
    })).optional().describe("Eşleştirme soruları için kullanılır. Bir yanda kavramlar (question), diğer yanda tanımlar (answer) yer alır."),
    points: z.number().default(10).describe("Sorunun varsayılan puanı."),
});
export type QuestionOutput = z.infer<typeof QuestionOutputSchema>;


export async function generateQuestion(input: GenerateQuestionInput): Promise<QuestionOutput> {
  const generateQuestionFlow = ai.defineFlow(
    {
      name: 'generateQuestionFlow',
      inputSchema: GenerateQuestionInputSchema,
      outputSchema: QuestionOutputSchema,
      retry: {
        maxAttempts: 3,
        backoff: {
            initial: 2000,
            multiplier: 2,
        }
      }
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'generateQuestionPrompt',
            input: { schema: GenerateQuestionInputSchema },
            output: { schema: QuestionOutputSchema },
            prompt: `Sen bir eğitim teknolojileri uzmanısın ve MEB müfredatına hakim, yaratıcı bir soru yazarsın.
Aşağıda verilen KAZANIM, SORU TİPİ ve (varsa) GÖRSEL'e uygun bir sınav sorusu oluştur.
Eğer bir görsel verilmişse, soru DOĞRUDAN bu görselle ilgili olmalıdır. Örneğin "Yukarıdaki şekilde..." veya "Bu grafiğe göre..." gibi ifadeler kullanmalısın.

KAZANIM: {{{kazanim}}}
SORU TİPİ: {{{type}}}
{{#if photoDataUri}}
GÖRSEL: {{media url=photoDataUri}}
{{/if}}

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
- 'matching' (eşleştirme) tipi için:
  - Soru metni (text) olarak "Aşağıdaki kavramları açıklamalarıyla doğru bir şekilde eşleştiriniz." gibi bir başlık kullan.
  - 'matchingPairs' dizisini doldur. En az 4 çift oluştur.
  - Her bir çiftte, 'question' alanına bir kavram, 'answer' alanına ise o kavramın tanımını yaz.
  - 'options' ve 'correctAnswer' alanlarını boş bırak.
- Üretilen soru nesnesi, belirtilen JSON formatına tam olarak uymalıdır.
`,
        });

        const { output } = await prompt(input);
        return output!;
    }
  );

  return await generateQuestionFlow(input);
}
