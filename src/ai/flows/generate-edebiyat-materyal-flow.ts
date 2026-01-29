'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const GenerateEdebiyatMateryalInputSchema = z.object({
  selectedClass: z.string(),
  selectedOutcome: z.string(),
  dualColumnMode: z.boolean(),
  lessonPlanMode: z.boolean(),
  comparisonMode: z.boolean(),
  filters: z.object({
    type: z.string(),
    scope: z.string(),
    period: z.string(),
    theme: z.string(),
  }),
  questionRequest: z.string(),
});
export type GenerateEdebiyatMateryalInput = z.infer<typeof GenerateEdebiyatMateryalInputSchema>;

// Output Schema
const MetaSchema = z.object({
  title: z.string(),
  author: z.string(),
  period: z.string(),
});
const TextContentSchema = z.object({
  title: z.string(),
  author: z.string(),
  body_original: z.string(),
  body_modern: z.string().optional(),
});
const GlossarySchema = z.object({
  word: z.string(),
  mean: z.string(),
});
const AnalysisSchema = z.object({
  summary: z.string(),
  theme: z.string(),
  narrator: z.string(),
  style: z.string(),
  structure: z.string(),
  context: z.string(),
  inference: z.string(),
});
const QuestionSchema = z.object({
  q: z.string(),
  a: z.string(),
  type: z.string(),
  rubric: z.string(),
});
const LessonPlanSchema = z.object({
  intro: z.string(),
  development: z.string(),
  activity: z.string(),
  conclusion: z.string(),
});

const GenerateEdebiyatMateryalOutputSchema = z.object({
  meta: MetaSchema,
  text_content: z.array(TextContentSchema),
  glossary: z.array(GlossarySchema),
  analysis: AnalysisSchema,
  questions: z.array(QuestionSchema),
  lesson_plan: z.optional(LessonPlanSchema),
});
export type GenerateEdebiyatMateryalOutput = z.infer<typeof GenerateEdebiyatMateryalOutputSchema>;

// AI Flow
export async function generateEdebiyatMateryal(
  input: GenerateEdebiyatMateryalInput
): Promise<GenerateEdebiyatMateryalOutput> {
  
  const edebiyatFlow = ai.defineFlow(
    {
      name: 'generateEdebiyatMateryalFlow',
      inputSchema: GenerateEdebiyatMateryalInputSchema,
      outputSchema: GenerateEdebiyatMateryalOutputSchema,
    },
    async (input) => {

      const systemPrompt = `
      Sen uzman bir Türk Dili ve Edebiyatı öğretmenisin. Aşağıdaki müfredat kriterlerine tam uyumlu sınav materyali hazırlamalısın.
      
      MÜFREDAT VE HEDEF KİTLE:
      - Sınıf Seviyesi: ${input.selectedClass}
      - Hedef Kazanım / Ünite / Konu: ${input.selectedOutcome || 'Genel Değerlendirme'}
      
      MOD AYARLARI:
      - Çift Sütun (Sadeleştirme): ${input.dualColumnMode ? 'EVET (Orijinal Metin ve Günümüz Türkçesi Yan Yana)' : 'HAYIR'}
      - Ders Planı: ${input.lessonPlanMode ? 'EVET (40 Dakikalık Ders Akışı)' : 'HAYIR'}
      - Karşılaştırma Modu: ${input.comparisonMode ? 'EVET' : 'HAYIR'}

      METİN KRİTERLERİ:
      - Tür: ${input.filters.type}
      - Alan: ${input.filters.scope}
      - Dönem: ${input.filters.period}
      - Tema: ${input.filters.theme}
      
      ÇOK ÖNEMLİ - METİN SEÇİMİ KURALLARI (ZORUNLU):
      1. GERÇEKLİK ZORUNLULUĞU: Sadece edebiyat literatüründe var olan, yayımlanmış, GERÇEK kitaplardan/eserlerden BİREBİR alıntı yap.
      2. DOĞRULANABİLİRLİK: Yazarın üslubuna benzetilerek yazılmış taklit metinler KABUL EDİLEMEZ.
      3. ÇİFT SÜTUN VARSA: "body_original" kısmına eserin orijinalini, "body_modern" kısmına ise günümüz Türkçesine çevrilmiş/sadeleştirilmiş halini yaz. Çift sütun kapalıysa "body_modern" boş kalabilir.
      
      SINAV SORULARI VE RUBRİK TALİMATI:
      Toplamda ${input.questionRequest || '10 adet soru'} hazırla.
      HER SORU İÇİN "rubric" (Puanlama Anahtarı) OLUŞTUR. Örneğin: "Yazar adı 5 puan, Eser adı 5 puan."

      İSTENEN ÇIKTI FORMATI (SADECE JSON):
      {
        "meta": { "title": "${input.comparisonMode ? 'Karşılaştırmalı Edebiyat Analizi' : 'Eser Başlığı'}", "author": "${input.comparisonMode ? 'Çeşitli Yazarlar' : 'Yazar Adı'}", "period": "Dönem Bilgisi" },
        "text_content": [ { "title": "Metin Başlığı", "author": "Yazar", "body_original": "Gerçek metin alıntısı (Orijinal dil)...", "body_modern": "Günümüz Türkçesi / Sadeleştirilmiş Hali (Sadece çift sütun modundaysa dolacak)" } ${input.comparisonMode ? ', { "title": "2. Metin", "author": "2. Yazar", "body_original": "...", "body_modern": "..." }' : ''} ],
        "glossary": [ { "word": "Zor Kelime", "mean": "Anlamı" } ],
        "analysis": { "summary": "Özet", "theme": "Tema", "narrator": "Anlatıcı", "style": "Dil ve Üslup", "structure": "Yapı", "context": "Dönem İlişkisi", "inference": "Kazanım Yorumu" },
        "questions": [ { "q": "Soru metni", "a": "Cevap", "type": "Soru Tipi", "rubric": "Puanlama kriteri ve puan dağılımı (Örn: Tanım 10p)" } ],
        ${input.lessonPlanMode ? '"lesson_plan": { "intro": "Ders Girişi (5 dk) - Dikkat çekme sorusu vb.", "development": "Gelişme (25 dk) - Metni işleme yöntemi", "activity": "Sınıf İçi Etkinlik - Örn: Beyin fırtınası", "conclusion": "Kapanış ve Değerlendirme (10 dk)" }' : ''}
      }
    `;
      
      const { output } = await ai.generate({
        prompt: systemPrompt,
        output: { schema: GenerateEdebiyatMateryalOutputSchema },
      });
      return output!;
    }
  );

  return await edebiyatFlow(input);
}
