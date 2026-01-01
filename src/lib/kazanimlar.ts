// Bu dosya, derslere ve sınıf seviyelerine göre ayrılmış Milli Eğitim Bakanlığı kazanımlarını içerir.
// Zamanla diğer dersler de bu yapıya eklenebilir.

export const KAZANIMLAR: { [key: string]: any[] } = {
  "Fizik": [
    {
      unite: "9. Sınıf - Fizik Bilimine Giriş",
      konular: [
        {
          konu: "Fiziğin Doğası",
          kazanimlar: [
            "Fizik biliminin ne olduğunu, amacını ve Anabilim Dalı/bilim dallarıyla ilişkisini açıklar.",
            "Fiziğin alt alanlarını (Mekanik, Termodinamik, Elektromanyetizma, Optik, Katıhal Fiziği, Atom Fiziği, Nükleer Fizik, Yüksek Enerji ve Plazma Fiziği) ve bu alanların uygulama alanlarını belirtir.",
            "Fiziksel nicelikleri temel ve türetilmiş olarak sınıflandırır.",
            "Fiziksel nicelikleri skaler ve vektörel olarak sınıflandırır."
          ]
        }
      ]
    },
    {
      unite: "9. Sınıf - Madde ve Özellikleri",
      konular: [
        {
          konu: "Madde ve Özkütle",
          kazanimlar: [
            "Özkütleyi tanımlar ve formülünü kullanarak hesaplamalar yapar.",
            "Karışımların özkütlesi ile ilgili problemler çözer.",
            "Günlük hayatta özkütleden nasıl yararlanıldığına örnekler verir."
          ]
        },
        {
          konu: "Dayanıklılık ve Yüzey Gerilimi",
          kazanimlar: [
            "Dayanıklılığın kesit alanı/hacim oranıyla ilişkisini açıklar.",
            "Yüzey gerilimini ve kılcallık olayını örneklerle açıklar.",
            "Adezyon ve kohezyon kuvvetlerini tanımlar."
          ]
        }
      ]
    },
    {
      unite: "10. Sınıf - Elektrik ve Manyetizma",
      konular: [
        {
          konu: "Elektrik Akımı, Potansiyel Farkı ve Direnç",
          kazanimlar: [
            "Elektrik akımını, potansiyel farkını ve direnci tanımlar.",
            "Katı bir iletkenin direncinin bağlı olduğu değişkenleri analiz eder.",
            "Ohm Yasası'nı açıklar ve ilgili hesaplamaları yapar."
          ]
        },
        {
          konu: "Elektrik Devreleri",
          kazanimlar: [
            "Seri ve paralel bağlı ampullerden oluşan basit elektrik devreleri kurar.",
            "Üreteçlerin seri ve paralel bağlanma gerekçelerini açıklar."
          ]
        }
      ]
    },
    {
      unite: "11. Sınıf - Kuvvet ve Hareket",
      konular: [
        {
          konu: "Vektörler ve Kuvvet Dengesi",
          kazanimlar: [
            "Vektörlerin özelliklerini açıklar ve vektörel işlemleri yapar.",
            "Bir cisme etki eden kuvvetlerin bileşkesini bulur (serbest cisim diyagramı).",
            "Kesişen kuvvetlerin dengesi ile ilgili problemler çözer."
          ]
        },
        {
          konu: "Tork ve Denge",
          kazanimlar: [
            "Tork kavramını açıklar ve formülünü kullanarak hesaplamalar yapar.",
            "Bir cismin dengede kalma şartlarını analiz eder."
          ]
        }
      ]
    },
    {
      unite: "12. Sınıf - Çembersel Hareket",
      konular: [
        {
          konu: "Düzgün Çembersel Hareket",
          kazanimlar: [
            "Düzgün çembersel hareketi tanımlar (periyot, frekans, çizgisel hız, açısal hız).",
            "Merkezcil kuvvet ve merkezcil ivme kavramlarını açıklar.",
            "Yatay ve düşey düzlemde düzgün çembersel hareket yapan cisimlerle ilgili hesaplamalar yapar."
          ]
        }
      ]
    },
    {
        unite: "12. Sınıf - Modern Fizik",
        konular: [
          {
            konu: "Özel Görelilik",
            kazanimlar: [
              "Einstein'ın özel görelilik postülalarını açıklar.",
              "Zaman genişlemesi ve uzunluk kısalması kavramlarını yorumlar."
            ]
          },
          {
            konu: "Kuantum Fiziğine Giriş",
            kazanimlar: [
              "Siyah cisim ışıması olayını açıklar.",
              "Fotoelektrik olay ve Compton saçılması olaylarını açıklar ve ışığın tanecikli yapısını desteklediğini belirtir."
            ]
          }
        ]
      }
  ]
};
