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
  term1Analysis: z.string().describe("1. Dönem Değerlendirmesi: Öğrencinin ilk dönem not ortalaması, davranışları ve devamsızlıkları temelinde akademik ve sosyal durumunun analizi."),
  term2Analysis: z.string().describe("2. Dönem Değerlendirmesi: Öğrencinin ikinci dönem performansının, ilk dönemle karşılaştırmalı olarak akademik ve sosyal açıdan analizi."),
  socialAndBehavioralStatus: z.string().describe("Öğrencinin davranış puanı, devamsızlık durumu ve genel sosyal uyumu hakkında yıl geneli bir değerlendirme."),
  overallRiskAnalysis: z.string().describe("Öğrencinin beyan ettiği risk faktörleri ve öğrenci bilgi formu verilerinin, genel durumu üzerindeki olası etkilerinin bütüncül bir analizi."),
  strengths: z.string().describe("Tüm veriler ışığında öğrencinin öne çıkan güçlü yönleri, potansiyeli ve olumlu özelliklerinin madde madde listesi."),
  recommendations: z.string().describe("Öğretmene yönelik, bu öğrenciye özel, somut ve eyleme geçirilebilir pedagojik tavsiyelerin madde madde listesi."),
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

  return await studentReportFlow(input);
}
