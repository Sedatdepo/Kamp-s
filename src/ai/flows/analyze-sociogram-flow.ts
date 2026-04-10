'use server';
/**
 * @fileOverview Sosyogram verilerini analiz ederek sınıf içi sosyal dinamikler hakkında içgörüler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SociogramAnalysisInput, SociogramAnalysisOutput } from '@/lib/types';


export const analysisFlow = ai.defineFlow(
  {
    name: 'sociogramAnalysisFlow',
    inputSchema: SociogramAnalysisInput,
    outputSchema: SociogramAnalysisOutput,
  },
  async (input) => {
    const prompt = `
      Sen deneyimli bir okul psikoloğu ve rehber öğretmensin. Görevin, sana JSON formatında verilen bir sınıfın sosyogram verilerini analiz ederek, hem sınıfın geneli hem de her bir öğrenci için ayrı ayrı, derinlemesine ve eyleme geçirilebilir içgörüler sunmaktır.

      VERİLER:
      - Öğrenci Listesi: ${JSON.stringify(input.studentNames)}
      - İlişki Seçimleri: ${JSON.stringify(input.relationships)}
        - "type: 'positive'": Öğrencinin iyi anlaştığı, birlikte olmak istediği kişiler.
        - "type: 'negative'": Öğrencinin anlaşamadığı, birlikte olmak istemediği kişiler.
        - "type: 'leadership'": Öğrencinin lider olarak gördüğü kişiler.

      ANALİZ VE ÇIKTI GÖREVLERİN:
      Aşağıdaki JSON formatına harfiyen uyarak bir çıktı oluştur. Açıklamalarını kısa, net ve bir rehber öğretmenin kullanacağı profesyonel bir dille yap.

      Çıktın iki ana bölümden oluşmalı: 'classAnalysis' ve 'studentAnalyses'.

      1.  **classAnalysis (Sınıf Geneli Analizi)**:
          - **summary**: Sınıfın genel sosyal yapısı hakkında 1-2 cümlelik bir özet yap. (Örn: "Sınıfta belirgin bir şekilde gruplaşmalar gözlenmektedir ve birkaç öğrenci izole durumdadır.")
          - **cliques**: Birbirini karşılıklı olarak POZİTİF seçen 3 veya daha fazla öğrenciden oluşan grupları (klikleri) tespit et.
          - **leaders**: Sınıfın liderlerini belirle. Sadece en çok 'leadership' oyu alanları değil, farklı gruplardan pozitif oylar alarak köprü görevi gören "gizli liderleri" de tespit et.
          - **risks**: Genel olarak sosyal risk altındaki öğrencileri (izole, reddedilmiş) ve onlara yönelik genel bir tavsiyeyi belirt.
          - **tensions**: Karşılıklı olarak birbirini NEGATİF seçen öğrenci çiftlerini belirterek potansiyel çatışma alanlarını belirt.

      2.  **studentAnalyses (Bireysel Öğrenci Analizleri)**:
          - Bu bölümde, öğrenci listesindeki **HER BİR ÖĞRENCİ İÇİN** ayrı bir analiz nesnesi oluştur.
          - **studentName**: Değerlendirilen öğrencinin adı.
          - **summary**: Öğrencinin sınıftaki genel sosyal durumunu tek cümleyle özetle. (Örn: "Sınıfın popüler öğrencilerinden biridir ve bir klik üyesidir.", "Genellikle yalnızdır ve hiç pozitif seçim almamıştır.", "Sınıfta ortalama bir sosyal konuma sahiptir.").
          - **strengths**: Öğrencinin sosyal açıdan güçlü yönlerini belirt. (Örn: "Çok sayıda pozitif seçim almaktadır.", "Farklı gruplardan pozitif seçim alarak birleştirici bir rol üstlenmektedir.").
          - **risksAndChallenges**: Öğrencinin karşılaştığı sosyal riskleri ve zorlukları belirt. (Örn: "Hiçbir öğrenciden pozitif seçim almamıştır, izole durumdadır.", "X ve Y kişileri tarafından karşılıklı olarak reddedilmektedir, bu durum çatışma potansiyeli taşımaktadır.").
          - **recommendation**: Bu öğrenciye özel, öğretmenin sınıfta hemen uygulayabileceği somut ve pratik bir pedagojik tavsiye yaz. (Örn: "Grup çalışmalarında lider bir öğrenciyle eşleştirilerek sosyal etkileşimi artırılabilir.", "Derste söz hakkı verilerek özgüveni desteklenmelidir.").
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: { schema: SociogramAnalysisOutput },
    });
    return output!;
  }
);

export async function analyzeSociogram(
  input: SociogramAnalysisInput
): Promise<SociogramAnalysisOutput> {
  return await analysisFlow(input);
}

