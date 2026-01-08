'use server';
/**
 * @fileOverview Öğrenci verilerini analiz ederek bütüncül bir gelişim raporu ve tavsiyeler üreten yapay zeka akışı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentReportInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı ve soyadı.'),
  classInfo: z.string().describe('Öğrencinin sınıfı, örneğin "10/A".'),
  finalAverage: z.number().optional().describe('Öğrencinin yıl sonu not ortalaması.'),
  term1Average: z.number().optional().describe('Öğrencinin 1. dönem not ortalaması.'),
  term2Average: z.number().optional().describe('Öğrencinin 2. dönem not ortalaması.'),
  attendanceCount: z.number().describe('Öğrencinin toplam devamsız gün sayısı.'),
  behaviorScore: z.number().describe('Öğrencinin davranış puanı (100 üzerinden).'),
  riskFactors: z.array(z.string()).describe('Öğrencinin kendisi için işaretlediği risk faktörlerinin listesi.'),
  infoFormData: z.string().describe('Öğrencinin doldurduğu bilgi formundan elde edilen kişisel ve ailevi bilgileri içeren metin.'),
  teacherNotes: z.string().optional().describe('Öğretmenin öğrenci hakkındaki ek gözlem notları.'),
});

export type StudentReportInput = z.infer<typeof StudentReportInputSchema>;

const StudentReportOutputSchema = z.object({
  academicStatus: z.string().describe("Öğrencinin genel akademik durumunun, not ortalamaları ve ders başarısı temelinde analizi. Başarılı ve zayıf yönlerini vurgulayın."),
  socialAndBehavioralStatus: z.string().describe("Öğrencinin davranış puanı, devamsızlık durumu ve sosyal uyumu hakkında bir değerlendirme. Arkadaş ilişkileri ve okul kurallarına uyumu hakkında yorum yapın."),
  riskAnalysis: z.string().describe("Öğrencinin işaretlediği risk faktörleri (ailevi durum, ekonomik zorluklar, sağlık sorunları vb.) ile akademik ve davranışsal durumu arasındaki olası bağlantıları analiz eden derinlemesine bir yorum. Bu faktörlerin öğrenciyi nasıl etkileyebileceğini açıklayın."),
  strengths: z.string().describe("Tüm veriler ışığında öğrencinin öne çıkan güçlü yönleri, potansiyeli ve olumlu özellikleri. (Madde madde yaz)"),
  recommendations: z.string().describe("Öğretmene yönelik, bu öğrenciye özel uygulanabilecek somut pedagojik tavsiyeler. İletişim kurma, ders işleme, motivasyon sağlama ve veli işbirliği gibi konularda yol gösterici öneriler sunun. (Madde madde yaz)"),
});

export type StudentReportOutput = z.infer<typeof StudentReportOutputSchema>;


export async function generateStudentReport(
  input: StudentReportInput
): Promise<StudentReportOutput> {
  const studentReportFlow = ai.defineFlow(
    {
      name: 'studentReportFlow',
      inputSchema: StudentReportInputSchema,
      outputSchema: StudentReportOutputSchema,
    },
    async (input) => {
      const prompt = `
        Sen deneyimli bir rehber öğretmen ve eğitim psikoloğusun. Görevin, sana sunulan verileri analiz ederek bir öğrenci için bütüncül, derinlemesine ve yapıcı bir gelişim raporu hazırlamaktır. Cevapların pedagojik bir dilde, profesyonel ve yol gösterici olmalıdır.

        Aşağıda bilgileri verilen öğrenciyi analiz et:
        - Öğrenci Adı: ${input.studentName}
        - Sınıfı: ${input.classInfo}
        - Yıl Sonu Ortalaması: ${input.finalAverage?.toFixed(2) ?? 'N/A'}
        - 1. Dönem Ortalaması: ${input.term1Average?.toFixed(2) ?? 'N/A'}
        - 2. Dönem Ortalaması: ${input.term2Average?.toFixed(2) ?? 'N/A'}
        - Davranış Puanı: ${input.behaviorScore}
        - Toplam Devamsızlık: ${input.attendanceCount} gün
        - Öğretmen Notları: ${input.teacherNotes || 'Yok'}

        Öğrencinin Beyan Ettiği Risk Faktörleri:
        ${input.riskFactors.length > 0 ? input.riskFactors.map(r => `- ${r}`).join('\n') : '- Risk faktörü belirtilmemiş.'}

        Öğrenci Bilgi Formu Özeti:
        ${input.infoFormData || 'Öğrenci bilgi formu doldurulmamış.'}

        Bu verileri kullanarak aşağıdaki JSON formatında bir rapor oluştur:

        1.  **academicStatus:** Öğrencinin not ortalamalarını temel alarak genel akademik başarısını yorumla. Sadece notları tekrar etme, bu notların ne anlama geldiğini (örneğin, 'istikrarlı bir başarı grafiği', 'ikinci dönemde belirgin bir düşüş', 'sayısal derslerde zorlanma eğilimi' gibi) analiz et.

        2.  **socialAndBehavioralStatus:** Davranış puanını ve devamsızlık sayısını birlikte değerlendir. Bu veriler öğrencinin okula uyumu, sorumluluk bilinci ve sosyal çevresi hakkında ne gibi ipuçları veriyor? Yorumla.

        3.  **riskAnalysis:** En önemli bölüm burası. Öğrencinin beyan ettiği risk faktörleri ile akademik ve davranışsal verileri arasında bağlantı kur. Örneğin, 'Ailevi sorunlar yaşayan öğrencinin ikinci dönem notlarındaki düşüş, bu durumun motivasyonunu etkilediğini düşündürebilir.' gibi derinlemesine analizler yap. Her bir risk faktörünün potansiyel etkilerini profesyonel bir dille açıkla.

        4.  **strengths:** Tüm bu verilere rağmen öğrencinin mutlaka sahip olduğu güçlü yönleri ve potansiyeli ortaya çıkar. Örneğin, 'Zorlu koşullara rağmen okula devam etmesi, mücadeleci bir yapıya sahip olduğunu gösteriyor.' gibi olumlu ve yapıcı çıkarımlar yap. Bu bölümü madde madde yaz.

        5.  **recommendations:** Tüm analizlerin sonucunda, bu öğrencinin öğretmenine yönelik somut, uygulanabilir ve pedagojik tavsiyeler sun. Örneğin: 'Öğrenciyle birebir iletişim kurularak ders dışı konularda sohbet edilmesi, güven ilişkisini artırabilir.', 'Matematik dersinde temel eksikleri olabileceğinden, öncelikle temel konuları içeren bir çalışma kağıdı verilebilir.', 'Veli ile yapılacak görüşmede, öğrencinin evdeki çalışma ortamı hakkında bilgi alınması faydalı olacaktır.' gibi net önerilerde bulun. Bu bölümü madde madde yaz.
      `;

      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: StudentReportOutputSchema },
      });
      return output!;
    }
  );

  return await studentReportFlow(input);
}
