'use server';
/**
 * @fileOverview Sosyogram verilerini analiz ederek sınıf içi sosyal dinamikler hakkında içgörüler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SociogramAnalysisInput, SociogramAnalysisOutput } from '@/lib/types';


export async function analyzeSociogram(
  input: SociogramAnalysisInput
): Promise<SociogramAnalysisOutput> {
  const analysisFlow = ai.defineFlow(
    {
      name: 'sociogramAnalysisFlow',
      inputSchema: SociogramAnalysisInput,
      outputSchema: SociogramAnalysisOutput,
    },
    async (input) => {
      const prompt = `
        Sen deneyimli bir okul psikoloğu ve rehber öğretmensin. Görevin, sana JSON formatında verilen bir sınıfın sosyogram verilerini analiz ederek, sınıf içi sosyal dinamikler hakkında derinlemesine ve eyleme geçirilebilir içgörüler sunmaktır.

        VERİLER:
        - Öğrenci Listesi: ${JSON.stringify(input.studentNames)}
        - İlişki Seçimleri: ${JSON.stringify(input.relationships)}
          - "type: 'positive'": Öğrencinin iyi anlaştığı, birlikte olmak istediği kişiler.
          - "type: 'negative'": Öğrencinin anlaşamadığı, birlikte olmak istemediği kişiler.
          - "type: 'leadership'": Öğrencinin lider olarak gördüğü kişiler.

        ANALİZ VE ÇIKTI GÖREVLERİN:
        Aşağıdaki JSON formatına harfiyen uyarak bir çıktı oluştur. Açıklamalarını kısa, net ve bir rehber öğretmenin kullanacağı profesyonel bir dille yap.

        1.  **summary**: Sınıfın genel sosyal yapısı hakkında 1-2 cümlelik bir özet yap. (Örn: "Sınıfta belirgin bir şekilde gruplaşmalar gözlenmektedir ve birkaç öğrenci izole durumdadır.")

        2.  **cliques**: Birbirini karşılıklı olarak POZİTİF seçen 3 veya daha fazla öğrenciden oluşan grupları (klikleri) tespit et. 
            - 'members' dizisine grup üyelerinin isimlerini yaz.
            - 'description' alanına bu grubun özelliğini kısaca belirt. (Örn: "Sınıfın popüler ve akademik olarak başarılı grubu.")

        3.  **leaders**: Sınıfın liderlerini belirle. 
            - Sadece en çok 'leadership' oyu alanları değil, aynı zamanda farklı gruplardan pozitif oylar alarak köprü görevi gören "gizli liderleri" de tespit et.
            - 'student' alanına lider öğrencinin ismini yaz.
            - 'reason' alanına neden lider olarak görüldüğünü açıkla. (Örn: "Hem popüler gruptan hem de diğer öğrencilerden olumlu seçimler alarak sınıfı birleştirici bir rol oynuyor.")

        4.  **risks**: Sosyal risk altındaki öğrencileri belirle.
            - **Izole Edilmişler (isolated):** Hiç kimseden POZİTİF seçim almamış öğrencileri bul.
            - **Reddedilmişler (rejected):** Sınıfta en çok NEGATİF seçim alan öğrencileri (eğer varsa) bul.
            - Bu öğrencileri 'student' alanına ekle.
            - 'reason' alanına öğrencinin neden risk grubunda olduğunu (izole mi, reddedilmiş mi) belirt.
            - 'recommendation' alanına bu öğrenciye yönelik öğretmenin uygulayabileceği SOMUT bir pedagojik tavsiye yaz. (Örn: "Grup çalışmalarında lider bir öğrenciyle eşleştirilerek sosyal etkileşimi artırılabilir.")

        5.  **tensions**: Karşılıklı olarak birbirini NEGATİF seçen öğrenci çiftlerini bularak potansiyel çatışma alanlarını belirt.
            - 'students' dizisine bu iki öğrencinin ismini yaz.
            - 'description' alanına bu gerilimin olası etkisini kısaca yorumla. (Örn: "Bu iki öğrenci arasında belirgin bir çatışma var, grup çalışmalarında ayrı tutulmaları faydalı olabilir.")
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: SociogramAnalysisOutput },
      });
      return output!;
    }
  );

  return await analysisFlow(input);
}
