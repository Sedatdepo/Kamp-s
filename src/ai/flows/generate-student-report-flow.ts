'use server';
/**
 * @fileOverview Öğrenci verilerini analiz ederek bütüncül bir gelişim raporu ve tavsiyeler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudentReportInput, StudentReportOutput, StudentReportInputSchema, StudentReportOutputSchema } from '@/lib/types';


export const studentReportFlow = ai.defineFlow(
  {
    name: 'studentReportFlow',
    inputSchema: StudentReportInputSchema,
    outputSchema: StudentReportOutputSchema,
  },
  async (input) => {
    const prompt = `
      Sen deneyimli bir rehber öğretmen ve eğitim psikoloğusun. Görevin, sana sunulan tüm verileri bütüncül bir şekilde analiz ederek bir öğrenci için derinlemesine ve yapıcı bir gelişim raporu hazırlamaktır. Cevapların pedagojik bir dilde, profesyonel ve yol gösterici olmalıdır.

      Aşağıda bilgileri verilen öğrenciyi analiz et:
      - Öğrenci Adı: ${input.studentName}
      - Sınıfı: ${input.classInfo}
      - 1. Dönem Ortalaması: ${input.term1Average?.toFixed(2) ?? 'N/A'}
      - 2. Dönem Ortalaması: ${input.term2Average?.toFixed(2) ?? 'N/A'}
      - Yıl Sonu Ortalaması: ${input.finalAverage?.toFixed(2) ?? 'N/A'}
      - Davranış Puanı: ${input.behaviorScore}
      - Toplam Devamsızlık: ${input.attendanceCount} gün
      - Öğretmen Notları: ${input.teacherNotes || 'Yok'}

      Öğrencinin Beyan Ettiği Risk Faktörleri:
      ${input.riskFactors.length > 0 ? input.riskFactors.map(r => `- ${r}`).join('\n') : '- Risk faktörü belirtilmemiş.'}

      Öğrenci Bilgi Formu Özeti:
      ${input.infoFormData || 'Öğrenci bilgi formu doldurulmamış.'}

      Bu verileri kullanarak aşağıdaki JSON formatında bir rapor oluştur:

      1.  **term1Analysis (1. Dönem Analizi):** Öğrencinin ilk dönem notlarını, davranış puanını ve devamsızlık durumunu bir arada değerlendir. Bu dönemdeki akademik başarısını (veya başarısızlığını) ve sosyal durumunu yorumla. Başarılı olduğu veya zorlandığı noktaları belirt.
      
      2.  **term2Analysis (2. Dönem Analizi):** İkinci dönem notlarını, davranış ve devamsızlık verilerini ilk dönemle karşılaştır. Akademik bir gelişim mi, yoksa bir düşüş mü var? Bu değişimin olası nedenlerini diğer verilerle (davranış, devamsızlık, risk faktörleri) ilişkilendirerek analiz et.

      3.  **socialAndBehavioralStatus (Genel Sosyal ve Davranışsal Durum):** Davranış puanını ve devamsızlık sayısını yıl geneli olarak birlikte değerlendir. Bu veriler öğrencinin okula uyumu, sorumluluk bilinci ve sosyal çevresi hakkında ne gibi ipuçları veriyor? Yorumla.

      4.  **overallRiskAnalysis (Risk ve Ailevi Durum Analizi):** En önemli bölüm burası. Öğrencinin beyan ettiği risk faktörleri ve bilgi formundaki ailevi/kişisel bilgiler ile akademik ve davranışsal verileri arasında bağlantı kur. Örneğin, 'Ailevi sorunlar yaşayan öğrencinin ikinci dönem notlarındaki düşüş, bu durumun motivasyonunu etkilediğini düşündürebilir.' veya 'Ekonomik zorluklar, öğrencinin devamsızlık yapmasına neden oluyor olabilir.' gibi derinlemesine analizler yap.

      5.  **strengths (Öne Çıkan Güçlü Yönler):** Tüm bu zorlu verilere rağmen öğrencinin mutlaka sahip olduğu güçlü yönleri ve potansiyeli ortaya çıkar. Örneğin, 'Zorlu koşullara rağmen okula devam etmesi, mücadeleci bir yapıya sahip olduğunu gösteriyor.' gibi olumlu ve yapıcı çıkarımlar yap. Bu bölümü madde madde yaz.

      6.  **recommendations (Öğretmene Yönelik Tavsiyeler):** Tüm analizlerin sonucunda, bu öğrencinin öğretmenine yönelik somut, uygulanabilir ve pedagojik tavsiyeler sun. Örneğin: 'Öğrenciyle birebir iletişim kurularak ders dışı konularda sohbet edilmesi, güven ilişkisini artırabilir.', 'Matematik dersinde temel eksikleri olabileceğinden, öncelikle temel konuları içeren bir çalışma kağıdı verilebilir.', 'Veli ile yapılacak görüşmede, öğrencinin evdeki çalışma ortamı hakkında bilgi alınması faydalı olacaktır.' gibi net önerilerde bulun. Bu bölümü madde madde yaz.
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: { schema: StudentReportOutputSchema },
    });
    return output!;
  }
);

export async function generateStudentReport(
  input: StudentReportInput
): Promise<StudentReportOutput> {
  return await studentReportFlow(input);
}

