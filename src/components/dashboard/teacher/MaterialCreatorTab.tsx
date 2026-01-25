'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, LayoutTemplate, Loader2, FileDown } from 'lucide-react';
import { generateAssignmentScenario } from '@/ai/flows/generate-assignment-scenario-flow';
import { TeacherProfile } from '@/lib/types';
import { exportMaterialToRtf } from '@/lib/word-export';


// --- MÜFREDAT VERİ TABANI (KULLANICI VERİSİ) ---
const KAZANIMLAR: { [key: string]: any[] } = {
  "Fizik": [
    {
      unite: "9. Sınıf",
      konular: [
        {
          konu: "Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Fizik biliminin diğer disiplinlerle arasındaki ilişkileri belirler.",
            "Fizik bilimini belirlediği ilişkilerden yararlanarak tanımlar."
          ]
        },
        {
          konu: "Fizik biliminin alt dallarını sınıflandırabilme",
          kazanimlar: [
            "Fizik biliminin alt dallarının niteliklerini belirler.",
            "Fizik biliminin alt dallarını niteliklerine göre gruplandırır.",
            "Fizik biliminin alt dallarını çalışma alanlarıyla ilişkilendirerek etiketler."
          ]
        },
        {
          konu: "Fizik bilimine katkıda bulunmuş bilim insanlarının deneyimlerini yansıtabilme",
          kazanimlar: [
            "Fizik bilimine katkıda bulunmuş bilim insanlarının bilime bakış açılarını, çalışma biçimlerini ve çalışmalarının bilime etkilerini inceler.",
            "Fizik bilimine katkıda bulunmuş bilim insanlarının bilime bakış açıları, çalışma biçimleri ve çalışmalarının bilime etkileri hakkında deneyimlerine dayalı çıkarım yapar.",
            "Fizik bilimine katkıda bulunmuş bilim insanlarının bilime bakış açıları, çalışma biçimleri ve çalışmalarının bilime etkileri hakkında ulaşılan çıkarımları değerlendirir."
          ]
        },
        {
          konu: "Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili kariyer olanaklarını sorgulayabilme",
          kazanimlar: [
            "Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili çalışmalara ve mesleklere yönelik merak ettiği konuları belirler.",
            "Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili çalışmalara ve mesleklere yönelik sorular sorar.",
            "Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili çalışmalar ve meslekler hakkında bilgi toplar.",
            "Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili çalışmalara ve mesleklere yönelik topladığı bilgilerin doğru olup olmadığını değerlendirir.",
            "Fizik biliminin çalışma alanlarından yararlanan meslekler hakkında çıkarım yapar."
          ]
        },
        {
          konu: "SI birim sisteminde birimleri verilen temel ve türetilmiş nicelikleri sınıflandırabilme",
          kazanimlar: [
            "Birimleri SI birim sisteminde verilen temel ve türetilmiş niceliklerin niteliklerini tanımlar.",
            "Birimleri SI birim sisteminde verilen temel ve türetilmiş nicelikleri niteliklerine göre gruplandırır.",
            "Birimleri SI birim sisteminde verilen nicelikleri temel ve türetilmiş nicelikler olarak adlandırır."
          ]
        },
        {
          konu: "Skaler ve vektörel nicelikleri karşılaştırabilme",
          kazanimlar: [
            "Skaler ve vektörel niceliklerin özelliklerini belirler.",
            "Skaler ve vektörel niceliklerin benzerliklerini listeler.",
            "Skaler ve vektörel niceliklerin farklılıklarını listeler."
          ]
        },
        {
          konu: "Aynı doğrultu üzerinde yer alan farklı vektörlerin yön ve büyüklüklerine yönelik bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Aynı doğrultu üzerinde yer alan farklı vektörlerin yön ve büyüklüklerini tanımlar.",
            "Aynı doğrultu üzerinde yer alan farklı vektörlerin yön ve büyüklükleri ile ilgili verileri toplayarak kaydeder.",
            "Verileri yorumlayarak eşit vektör, zıt vektör ve reel sayıyla çarpılmış vektörlere ilişkin değerlendirmeler yapar."
          ]
        },
        {
          konu: "Vektörlerin toplanmasında kullanılan uç uca ekleme ve paralel kenar yöntemi ile bileşenlerine ayırma işlemine ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Vektörlerin toplanmasında kullanılan uç uca ekleme ve paralel kenar yöntemi ile bileşenlerine ayırma işlemini inceleyerek toplama yöntemlerinde kullanılan örüntüleri bulur.",
            "Vektörlerin toplanmasında kullanılan uç uca ekleme ve paralel kenar yöntemi ile bileşenlerine ayırma işlemine ilişkin genelleme yapar."
          ]
        },
        {
          konu: "Doğadaki temel kuvvetleri karşılaştırabilme",
          kazanimlar: [
            "Doğadaki temel kuvvetlere ilişkin özellikleri belirler.",
            "Doğadaki temel kuvvetlere ilişkin benzerlikleri listeler.",
            "Doğadaki temel kuvvetlere ilişkin farklılıkları listeler."
          ]
        },
        {
          konu: "Hareketin temel kavramlarının tanımlarına yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Hareketin temel kavramlarına yönelik örnekleri gözlemleyerek görseller arasındaki benzerlikleri bulur.",
            "Hareketin temel kavramlarına ilişkin genellemeler yapar."
          ]
        },
        {
          konu: "Hareket türlerini sınıflandırabilme",
          kazanimlar: [
            "Hareket türlerinin niteliklerini belirler.",
            "Hareket türlerini ortak özelliklerine göre gruplandırır.",
            "Hareket türlerine göre oluşturduğu grupları adlandırır."
          ]
        },
        {
          konu: "Basınca yönelik çıkarımlarda bulunabilme",
          kazanimlar: [
            "Basınca etki eden etmenleri tanımlar.",
            "Basınç ile ilgili topladığı verileri kaydeder.",
            "Basınç ile ilgili topladığı verilerden ulaştığı matematiksel modeli kullanarak basınca ilişkin çıkarımlar yapar."
          ]
        },
        {
          konu: "Durgun sıvılarda basınca yönelik çıkarımlarda bulunabilme",
          kazanimlar: [
            "Durgun sıvılarda basınca etki eden etmenleri tanımlar.",
            "Durgun sıvılarda basınç ile ilgili topladığı verileri kaydeder.",
            "Durgun sıvılarda basınç ile ilgili topladığı verilerden ulaştığı matematiksel modeli kullanarak durgun sıvılarda basınca ilişkin çıkarımlar yapar."
          ]
        },
        {
          konu: "Sıvılarda basıncın kullanıldığı günlük hayat örneklerine ilişkin sorgulama yapabilme",
          kazanimlar: [
            "Günlük hayatta sıvılarda basıncın kullanılmasına ilişkin merak ettiği konuyu belirler.",
            "Günlük hayatta sıvılarda basıncın kullanılmasına ilişkin merak ettiği konu ile ilgili sorular sorar.",
            "Günlük hayatta sıvılarda basıncın kullanılmasına ilişkin merak ettiği konu hakkında bilgi toplar.",
            "Günlük hayatta sıvılarda basıncın kullanılmasına ilişkin merak ettiği konu ile ilgili topladığı bilgilerin doğru olup olmadığını değerlendirir.",
            "Günlük hayatta sıvılarda basıncın kullanılmasına ilişkin merak ettiği konu ile ilgili topladığı bilgiler üzerinden çıkarımda bulunur."
          ]
        },
        {
          konu: "Açık hava basıncına ilişkin çıkarım yapabilme",
          kazanimlar: [
            "Sıvı basıncına ilişkin bilgilerinden yararlanarak açık hava basıncına yönelik hipotez kurar.",
            "Sıvı basıncıyla açık hava basıncı arasındaki ilişkileri listeler.",
            "Sıvı basıncıyla açık hava basıncını karşılaştırır.",
            "Açık hava basıncına ilişkin önermeler sunar.",
            "Açık hava basıncına ilişkin bilgilerini farklı durumlarda değerlendirir."
          ]
        },
        {
          konu: "Kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik deney yapabilme",
          kazanimlar: [
            "Kaldırma kuvveti ile kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik bir deney tasarlar.",
            "Kaldırma kuvveti ile ilgili deney düzeneğinden veri toplayarak kaldırma kuvvetinin bağlı olduğu değişkenleri analiz eder."
          ]
        },
        {
          konu: "Kaldırma kuvveti ile sıvılardaki basınca neden olan kuvvet arasındaki ilişkiye yönelik çıkarım yapabilme",
          kazanimlar: [
            "Kaldırma kuvveti ile yer değiştiren sıvının ağırlığı arasındaki ilişkiye dair hipotez kurar.",
            "Kaldırma kuvveti ile ilgili yaptığı deneyden elde ettiği verileri kullanarak matematiksel modeli bulur.",
            "Kaldırma kuvveti ve sıvı basıncına ait matematiksel modelleri karşılaştırır.",
            "Kaldırma kuvveti ve sıvılardaki basınca neden olan kuvvet arasındaki ilişkiye dair önermede bulunur.",
            "Kaldırma kuvveti ve sıvılardaki basınca neden olan kuvvet arasındaki ilişkiye dair değerlendirme yapar."
          ]
        },
        {
          konu: "Akışkanın geçtiği borunun kesit alanı ile akışkanın sürati ve boru çeperlerine yaptığı basınç arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Akışkanların sürati ile basıncı arasındaki ilişkiyi gözlemleyerek aralarındaki ilişkiyi tespit eder.",
            "Akışkanın sürati ile basıncı arasındaki ilişkiyi günlük hayat örnekleri üzerinden geneller."
          ]
        },
        {
          konu: "İç enerjinin ısı ve sıcaklık ile arasındaki ilişki hakkında tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Isı, sıcaklık ve iç enerji ile ilgili görselleri inceler.",
            "İç enerjinin ısı ve sıcaklık ile ilişkisini bulur.",
            "İç enerjinin ısı ve sıcaklık ile arasındaki ilişkiyi geneller."
          ]
        },
        {
          konu: "Isı, öz ısı, ısı sığası ve sıcaklık farkı arasındaki matematiksel modele ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Isı, öz ısı, ısı sığası ve sıcaklık farkı arasındaki ilişkiyi deney yoluyla keşfederek matematiksel modeline ulaşır.",
            "Isı, öz ısı, ısı sığası ve sıcaklık farkı arasındaki matematiksel modeli farklı durumlar için hesaplamalar yaparak geneller."
          ]
        },
        {
          konu: "Hâl değiştirme sıcaklığında bulunan saf bir maddenin hâl değiştirmesi için alınan veya verilen ısı miktarının bağlı olduğu değişkenler hakkında bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Hâl değişimini etkileyen nitelikleri tespit eder.",
            "Hâl değişimini etkileyen niteliklerle ilgili veri toplayıp kaydeder.",
            "Saf maddelerde hâl değişimini etkileyen nitelikler ile ilgili topladığı verileri yorumlayarak matematiksel model aracılığıyla değerlendirir."
          ]
        },
        {
          konu: "Isıl denge durumu hakkında bilimsel gözlem yapabilme",
          kazanimlar: [
            "Isıl dengede olma durumu ile ilgili nitelikleri tanımlar.",
            "Farklı sıcaklıktaki maddelerin ısıl dengeye ulaşma sürecine ilişkin veri toplayarak kaydeder.",
            "Isıl dengeye ulaşma süreci ile ilgili elde ettiği verileri açıklar."
          ]
        },
        {
          konu: "Isı aktarım yollarını sınıflayabilme",
          kazanimlar: [
            "Isı aktarım yollarının niteliklerini belirler.",
            "Niteliklerine göre ısı aktarım yollarını benzerlik ve farklılıklarına göre ayrıştırır.",
            "Isı aktarım yollarını benzerliklerine göre gruplandırır.",
            "Gruplandırdığı ısı aktarım yollarını adlandırır."
          ]
        },
        {
          konu: "Günlük hayattaki deneyimlerinden yola çıkarak katı maddelerdeki ısı iletim hızını etkileyen etmenlere yönelik yansıtma yapabilme",
          kazanimlar: [
            "Katı maddelerde ısı iletim hızı ile ilgili deneyimlerini gözden geçirir.",
            "Katı maddelerde ısı iletim hızını etkileyen etmenlere ilişkin çıkarım yapar.",
            "Katı maddelerde ısı iletim hızını etkileyen etmenlere ilişkin çıkarımlarını değerlendirir."
          ]
        }
      ]
    },
    {
      unite: "10. Sınıf",
      konular: [
        {
          konu: "Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Yatay doğrultuda sabit hızlı hareket eden cisimlerin konum, yer değiştirme, hız ve zaman değişkenlerini deney yaparak gözlemler.",
            "Yatay doğrultuda sabit hızlı hareket eden cisimlerin hareket grafiklerinden yararlanarak ortalama hız, ortalama sürat ve yer değiştirmenin matematiksel modelini bulur.",
            "Yatay doğrultuda sabit hızlı hareket eden cisimlerin hız, sürat, yer değiştirme ve alınan yol değişkenlerine ilişkin matematiksel modelleri geneller."
          ]
        },
        {
          konu: "İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "İvme ve hız değişimi arasındaki ilişkiyi keşfeder.",
            "İvme ve hız değişimi arasındaki ilişkiyi geneller."
          ]
        },
        {
          konu: "Yatay doğrultuda sabit ivmeyle hareket eden cisimlerin hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme",
          kazanimlar: [
            "Yatay doğrultuda sabit ivmeli hareket grafiklerini inceler.",
            "Yatay doğrultuda sabit ivmeli hareket grafiklerini birbirine dönüştürerek matematiksel modellere ulaşır.",
            "Yatay doğrultuda sabit ivmeyle hareket eden cisimlerin hareketine ilişkin grafikleri ve matematiksel modeller arasındaki ilişkiyi kendi cümleleriyle yeniden ifade eder."
          ]
        },
        {
          konu: "Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Serbest düşme hareketi yapan cisimleri gözlemleyerek ivme ve hız değişimleri arasındaki ilişkiyi bulur.",
            "Serbest düşme hareketi yapan cisimlerin ivmesi hakkında genelleme yapar."
          ]
        },
        {
          konu: "Serbest düşme hareketi ile ilgili kanıt kullanabilme",
          kazanimlar: [
            "Serbest düşme hareketi ile ilgili verileri toplayarak kaydeder.",
            "Serbest düşme hareketi ile ilgili veri setleri oluşturur.",
            "Serbest düşme hareketini verilere dayalı olarak açıklar."
          ]
        },
        {
          konu: "İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "İki boyutta sabit ivmeli hareketin bileşenleri ile sabit hızlı ve sabit ivmeli hareket arasındaki ilişkiyi bulur.",
            "İki boyutta sabit ivmeli hareketine yönelik genelleme yapar."
          ]
        },
        {
          konu: "Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Kuvvet, yer değiştirme ve iş arasındaki ilişkiyi matematiksel olarak modeller.",
            "Kuvvet, yer değiştirme ve iş arasındaki ilişki hakkında genelleme yapar."
          ]
        },
        {
          konu: "İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme",
          kazanimlar: [
            "İş, enerji ve güç kavramları hakkında mevcut bilgisi dâhilinde hipotez kurar.",
            "İş, enerji ve güç kavramlarına yönelik ilişkileri listeler.",
            "İş, enerji ve güç kavramlarını karşılaştırır.",
            "İş ve güç kavramları arasındaki ilişkiye yönelik önermelerde bulunur.",
            "Önermelerini matematiksel modele dönüştürerek değerlendirir."
          ]
        },
        {
          konu: "Enerji biçimlerini karşılaştırabilme",
          kazanimlar: [
            "Enerji biçimlerine ilişkin özellikleri belirler.",
            "Enerji biçimlerine ilişkin benzerlikleri listeler.",
            "Enerji biçimlerine ilişkin farklılıkları listeler."
          ]
        },
        {
          konu: "Mekanik enerjiyi çözümleyebilme",
          kazanimlar: [
            "Mekanik enerjiye ilişkin bileşenleri belirler.",
            "Mekanik enerjiyle ilgili bileşenler arasındaki matematiksel ilişkiyi belirler."
          ]
        },
        {
          konu: "Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme",
          kazanimlar: [
            "Yenilenebilen ve yenilenemeyen enerji kaynaklarına ilişkin özellikleri belirler.",
            "Yenilenebilen ve yenilenemeyen enerji kaynaklarının avantajlarını listeler.",
            "Yenilenebilen ve yenilenemeyen enerji kaynaklarının dezavantajlarını listeler."
          ]
        },
        {
          konu: "Basit elektrik devresinde potansiyel fark, elektrik akımı ve direnç kavramlarının tanımına ilişkin analojik akıl yürütebilme",
          kazanimlar: [
            "Basit elektrik devresi ile su tesisatının bileşenlerini gözlemler.",
            "Basit elektrik devresi ile su tesisatının bileşenleri arasındaki benzerlikleri ve farklılıkları tespit eder.",
            "Benzerliklere dayalı olarak basit elektrik devresindeki potansiyel fark, elektrik akımı ve direncin tanımı hakkında çıkarım yapar."
          ]
        },
        {
          konu: "Elektrik yükünün hareketi üzerinden elektrik akımı kavramını çözümleyebilme",
          kazanimlar: [
            "Bir iletkende elektrik akımı oluşması ile ilgili değişkenleri belirler.",
            "Elektrik akımını oluşturan değişkenler arasındaki ilişkiyi belirler."
          ]
        },
        {
          konu: "Ohm Yasası ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Elektrik akımı, direnç ve potansiyel fark arasındaki ilişkiyi deney yoluyla keşfederek Ohm Yasası'nın matematiksel modeline ulaşır.",
            "Ohm Yasası'nın matematiksel modeli üzerinden genelleme yapar."
          ]
        },
        {
          konu: "Dirençlerin bağlanma türüne göre eşdeğer direncin büyüklüğüne ilişkin bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Dirençlerin seri, paralel ve birleşik bağlanma türlerini tanımlar.",
            "Dirençlerin seri, paralel ve birleşik bağlanması ile eşdeğer direncin büyüklüğü arasındaki ilişkiyi belirlemek üzere veri toplayarak kaydeder.",
            "Elde ettiği verileri yorumlayarak ulaştığı çıkarımları matematiksel modellemeleri kullanarak test eder."
          ]
        },
        {
          konu: "Üreteçlerin bağlanma türüne göre devreye sağladıkları potansiyel farka ilişkin bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Üreteçlerin seri ve paralel bağlanma türlerini tanımlar.",
            "Üreteçlerin seri ve paralel bağlanması durumunda devrenin potansiyel fark, ana kol akımı ve üreteçlerin tükenme süreleri arasındaki ilişkiyi belirlemek üzere veri toplayarak kaydeder.",
            "Elde ettiği verileri yorumlayarak değerlendirir."
          ]
        },
        {
          konu: "Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemlerle ilgili bilgi toplayabilme",
          kazanimlar: [
            "Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemlere ilişkin bilgiye ulaşmak için kullanacağı araçları belirler.",
            "Belirlediği aracı kullanarak elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemler ile ilgili bilgileri bulur.",
            "Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemler hakkında ulaşılan bilgileri doğrular.",
            "Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemler hakkındaki ulaştığı bilgileri kaydeder."
          ]
        },
        {
          konu: "Topraklama olayının önemini sorgulayabilme",
          kazanimlar: [
            "Topraklama olayını tanımlar.",
            "Topraklama olayıyla ilgili sorular sorar.",
            "Topraklama olayı hakkında bilgi toplar.",
            "Topraklama olayı ile ilgili topladığı bilgilerin doğru olup olmadığını değerlendirir.",
            "Topraklama olayının önemi hakkında çıkarım yapar."
          ]
        },
        {
          konu: "Dalgaların temel kavramlarına ilişkin operasyonel tanımlama yapabilme",
          kazanimlar: [
            "Dalgaların temel kavramlarına ilişkin nitelikleri tanımlar.",
            "Dalgaların temel kavramlarına ilişkin niteliklerin ölçümünü yapar.",
            "Dalgaların temel kavramlarını niteliklerine bağlı olarak tanımlar."
          ]
        },
        {
          konu: "Dalgaları özelliklerine göre sınıflandırabilme",
          kazanimlar: [
            "Dalgaların özelliklerini belirler.",
            "Dalgaları titreşim doğrultusu ve taşıdığı enerjiye göre gruplandırır.",
            "Dalgaları enine, boyuna, hem enine hem boyuna, mekanik ve elektromanyetik olarak adlandırır."
          ]
        },
        {
          konu: "Dalgaların yayılma süratini etkileyen etmenlere ilişkin bilimsel gözleme dayalı tahmin yapabilme",
          kazanimlar: [
            "Dalgaların yayılma süratine etki eden etmenleri tahmin eder.",
            "Dalgaların farklı ortamlardaki yayılma süratini karşılaştırır.",
            "Dalgaların farklı ortamlardaki yayılma süratlerine ilişkin sonuç çıkarır.",
            "Elektromanyetik dalgaların yayılma sürati ile ilgili tahminlerde bulunur.",
            "Elektromanyetik dalgaların yayılma sürati ile ilgili tahminlerinin geçerliliğini sorgular."
          ]
        },
        {
          konu: "Periyodik hareketlere ilişkin deneyimlerini yansıtabilme",
          kazanimlar: [
            "Periyodik hareketlere ilişkin deneyimlerini gözden geçirir.",
            "Periyodik hareketlere ilişkin deneyimlerinden çıkarım yapar.",
            "Periyodik hareketlere ilişkin deneyimlerinden ulaştığı çıkarımı değerlendirir."
          ]
        },
        {
          konu: "Su dalgalarında yansıma ve kırılma ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Su dalgalarında yansıma ve kırılma olaylarına ilişkin gözlemler yapar.",
            "Su dalgalarında yansıma ve kırılma olayları sırasındaki açılar arasında ilişki kurar.",
            "Su dalgalarında yansıma ve kırılma olaylarına ilişkin genellemeler yapar."
          ]
        },
        {
          konu: "Rezonans ve depreme ilişkin kavramlar üzerinden depremi sorgulayabilme",
          kazanimlar: [
            "Rezonans ve depremle ilişkili olan kavramları tanımlar.",
            "Rezonans ve depremle ilişkili olan kavramlar ile ilgili sorular sorar.",
            "Rezonans ve depremle ilişkili olan kavramlar hakkında bilgi toplar.",
            "Rezonans ve depremle ilişkili olan kavramlar ile ilgili toplanan bilgilerin doğru olup olmadığını değerlendirir.",
            "Rezonans ve depreme ilişkin kavramlar üzerinden depreme yönelik çıkarımlar yapar."
          ]
        },
        {
          konu: "Depremle ilgili bilimsel model oluşturabilme",
          kazanimlar: [
            "Depremle ilgili bir model önerir.",
            "Depremle ilgili önerilen modeli geliştirir."
          ]
        }
      ]
    },
    {
      unite: "11. Sınıf",
      konular: [
        {
          konu: "Newton Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Bileşke kuvvet ile cisimlerin hareketi arasındaki ilişkileri keşfeder.",
            "Newton Hareket Yasaları'na yönelik genellemeler yapar."
          ]
        },
        {
          konu: "Newton Hareket Yasaları'nı serbest cisim diyagramını kullanarak yorumlayabilme",
          kazanimlar: [
            "Bir cisme etki eden kuvvetleri belirler.",
            "Bir cisme etki eden kuvvetleri serbest cisim diyagramı üzerinde gösterir.",
            "Serbest cisim diyagramını kullanarak Newton Hareket Yasaları'nı yeniden ifade eder."
          ]
        },
        {
          konu: "Statik ve kinetik sürtünme kuvvetlerini karşılaştırabilme",
          kazanimlar: [
            "Statik ve kinetik sürtünme kuvvetlerine ilişkin özellikleri belirler.",
            "Statik ve kinetik sürtünme kuvvetlerine ilişkin benzerlikleri listeler.",
            "Statik ve kinetik sürtünme kuvvetlerine ilişkin farklılıkları listeler."
          ]
        },
        {
          konu: "Sürtünme kuvvetinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Sürtünme kuvvetinin bağlı olduğu değişkenler arasındaki ilişkiyi keşfederek matematiksel modeline ulaşır.",
            "Farklı veri setleri ile hesaplamalar yaparak sürtünme kuvvetinin matematiksel modelini geneller."
          ]
        },
        {
          konu: "Limit hızı etkileyen değişkenler ile ilgili bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Limit hız ve limit hızı etkileyen değişkenleri tanımlar.",
            "Limit hız ve limit hızı etkileyen değişkenlerle ilgili verileri toplayarak kaydeder.",
            "Limit hız ve limit hızı etkileyen değişkenlerle ilgili verileri yorumlayarak değerlendirir."
          ]
        },
        {
          konu: "Çembersel hareket yapan cisimlerin yörüngeleri ve hız vektörleri hakkında analojik akıl yürütebilme",
          kazanimlar: [
            "Çembersel hareket yapan farklı cisimlerin hareketlerini gözlemler.",
            "Çembersel hareket yapan farklı cisimlerin hareketlerinin özelliklerini tespit eder.",
            "Çembersel hareket yapan farklı cisimlerin hareketlerinin benzerliklerinden yola çıkarak yörüngeleri ve hız vektörü hakkında çıkarım yapar."
          ]
        },
        {
          konu: "Çembersel hareketin değişkenleri arasındaki ilişkilerin matematiksel olarak modellenmesine ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Çembersel hareketin değişkenlerini keşfederek aralarındaki ilişkileri matematiksel olarak modeller.",
            "Farklı veri setleri ile hesaplamalar yaparak çembersel hareketin değişkenleri arasındaki ilişkilere yönelik matematiksel modelleri geneller."
          ]
        },
        {
          konu: "Elektrik yükleri arasındaki elektriksel kuvvetin matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Elektrik yükleri arasındaki elektriksel kuvvetin bağlı olduğu değişkenler arasındaki keşfettiği ilişkiyi matematiksel olarak modeller.",
            "Elektrik yükleri arasındaki elektriksel kuvvetin matematiksel modeli üzerinden genellemeler yapar."
          ]
        },
        {
          konu: "Elektriksel alanın matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Elektrik yüklerinin oluşturduğu elektriksel alana ilişkin keşfettiği etmenler arasındaki ilişkiyi matematiksel olarak modeller.",
            "Elektrik yüklerinin oluşturduğu elektriksel alanın matematiksel modeli üzerinden genellemeler yapar."
          ]
        },
        {
          konu: "Faraday kafesi ve Faraday kafesinin kullanım alanları ile ilgili bilgi toplayabilme",
          kazanimlar: [
            "Faraday kafesi ve Faraday kafesinin kullanım alanları ile ilgili bilgiye ulaşmak için kullanacağı kaynakları belirler.",
            "Belirlediği kaynağı kullanarak Faraday kafesi ve Faraday kafesinin kullanım alanları ile ilgili bilgileri bulur.",
            "Faraday kafesi ve Faraday kafesinin kullanım alanları hakkında ulaşılan bilgileri doğrular.",
            "Faraday kafesi ve Faraday kafesinin kullanım alanları hakkında ulaşılan bilgileri kaydeder."
          ]
        },
        {
          konu: "Mıknatısların birbiriyle etkileşimine yönelik bilimsel gözlem yapabilme",
          kazanimlar: [
            "Mıknatısların birbiriyle etkileşimiyle ilgili nitelikleri tanımlar.",
            "Mıknatısların birbiriyle etkileşimiyle ilgili verileri toplayarak kaydeder.",
            "Mıknatısların birbiriyle etkileşimiyle ilgili verileri manyetik alan çizgileriyle açıklar."
          ]
        },
        {
          konu: "Üzerinden akım geçen düz bir iletken telin oluşturduğu manyetik alana ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Üzerinden akım geçen düz bir iletken telin oluşturduğu manyetik alana ilişkin matematiksel modeli bulur.",
            "Üzerinden akım geçen düz bir iletken telin oluşturduğu manyetik alana ilişkin matematiksel modeli geneller."
          ]
        },
        {
          konu: "Akım makarasının merkez ekseninde oluşan manyetik alanın matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Akım makarasının merkez ekseninde oluşan manyetik alana ilişkin keşfettiği ilişkiyi matematiksel olarak modeller.",
            "Akım makarasının merkez ekseninde oluşan manyetik alanın matematiksel modeli üzerinden genelleme yapar."
          ]
        },
        {
          konu: "Elektromıknatısların kullanım alanlarına ilişkin bilgi toplayabilme",
          kazanimlar: [
            "Elektromıknatısların kullanım alanlarıyla ilgili bilgiye ulaşmak için kullanacağı kaynakları belirler.",
            "Belirlediği kaynağı kullanarak elektromıknatısların kullanım alanlarıyla ilgili bilgileri bulur.",
            "Elektromıknatısların kullanım alanlarıyla ilgili ulaştığı bilgilerin doğru olup olmadığını belirler.",
            "Elektromıknatısların günlük hayattaki kullanım alanlarıyla ilgili ulaştığı bilgileri kaydeder."
          ]
        },
        {
          konu: "Manyetik alanda akım geçen düz bir tele etki eden kuvvete ilişkin matematiksel modele yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Manyetik alanda akım geçen düz bir tele etki eden kuvvetin etmenleri arasındaki keşfettiği ilişkiyi matematiksel olarak modeller.",
            "Manyetik alanda akım geçen düz bir tele etki eden kuvvete ilişkin matematiksel model üzerinden genelleme yapar."
          ]
        },
        {
          konu: "Manyetik alanda akım geçen düz bir tele etki eden kuvvet ile ilgili deneyimini elektrik motorlarının çalışma prensibine yansıtabilme",
          kazanimlar: [
            "Manyetik alanda akım geçen düz bir tele etki eden kuvvet ile ilgili deneyimini gözden geçirir.",
            "Deneyimine dayalı olarak manyetik alanda akım geçen dikdörtgen telin bir eksen etrafında dönmesi hakkında çıkarım yapar.",
            "Yaptığı çıkarımları elektrik motorlarının çalışma prensibi açısından değerlendirir."
          ]
        },
        {
          konu: "Manyetik akıya etki eden etmenleri çözümleyebilme",
          kazanimlar: [
            "Manyetik akıya etki eden etmenleri belirler.",
            "Manyetik akıya etki eden etmenler arasındaki ilişkiyi belirler."
          ]
        },
        {
          konu: "İndüksiyon geriliminin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "İndüksiyon geriliminin oluşmasında keşfettiği etmenler arasındaki ilişkiyi matematiksel olarak modeller.",
            "İndüksiyon geriliminin matematiksel modeli üzerinden genellemeler yapar."
          ]
        },
        {
          konu: "İndüklenme sonucu oluşan alternatif (değişken akım) hakkında bilimsel çıkarım yapabilme",
          kazanimlar: [
            "İndüklenme sonucu oluşan alternatif akımı etkileyen etmenleri belirler.",
            "İndüklenme sonucu oluşan alternatif akımı etkileyen etmenler arasındaki ilişkiyi belirlemek üzere veri toplayarak kaydeder.",
            "İndüklenme sonucu oluşan alternatif akımı topladığı verilerden yola çıkarak yorumlayıp değerlendirir."
          ]
        },
        {
          konu: "Transformatörün yapısı ve kullanım alanlarına yönelik bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Transformatörün niteliklerini deney yaparak tanımlar.",
            "Transformatörlerin kullanım alanlarına yönelik topladığı verileri kaydeder.",
            "Elde ettiği verilerden yola çıkarak transformatörün kullanım alanlarındaki rolünü yorumlar ve değerlendirir."
          ]
        },
        {
          konu: "Yarı iletkenlerin kullanım alanları ve önemi ile ilgili sorgulama yapabilme",
          kazanimlar: [
            "Yarı iletkenleri tanımlar.",
            "Yarı iletkenler hakkında sorular sorar.",
            "Yarı iletkenler hakkında bilgi toplar.",
            "Yarı iletkenlerle ilgili toplanan bilgilerin doğru olup olmadığını değerlendirir.",
            "Yarı iletkenlerle ilgili toplanan bilgiler üzerinden yarı iletkenlerin kullanım alanları ve önemine yönelik çıkarım yapar."
          ]
        },
        {
          konu: "Süper iletkenlerin kullanım alanları ve önemi ile ilgili sorgulama yapabilme",
          kazanimlar: [
            "Süper iletkenleri tanımlar.",
            "Süper iletkenler hakkında sorular sorar.",
            "Süper iletkenler hakkında bilgi toplar.",
            "Süper iletkenlerle ilgili toplanan bilgilerin doğru olup olmadığını değerlendirir.",
            "Süper iletkenlerle ilgili toplanan bilgiler üzerinden süper iletkenlerin kullanım alanları ve önemine yönelik çıkarım yapar."
          ]
        },
        {
          konu: "Işık şiddeti, ışık akısı ve aydınlanma kavramlarına ilişkin bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Işık şiddeti, ışık akısı ve aydınlanma kavramlarının tanımlarını yapar.",
            "Işık şiddeti, ışık akısı ve aydınlanma kavramları ile ilgili veri setlerini inceler.",
            "Veri setlerini kullanarak ışık şiddeti, ışık akısı ve aydınlanma kavramlarını yorumlayarak değerlendirir."
          ]
        },
        {
          konu: "Düzlem aynaları kullanarak bilimsel model oluşturabilme",
          kazanimlar: [
            "Düzlem aynaları kullanarak bir model önerir.",
            "Düzlem aynaları kullanarak önerdiği modeli yeni durumlara uyarlayarak geliştirir."
          ]
        },
        {
          konu: "Küresel aynaların özelliklerine ilişkin karşılaştırma yapabilme",
          kazanimlar: [
            "Küresel aynaların fiziksel özelliklerini ve ışınların küresel aynalarda yansıdıktan sonra izlediği yolu belirler.",
            "Çukur ve tümsek aynaların benzer özelliklerini listeler.",
            "Çukur ve tümsek aynaların farklı özelliklerini listeler."
          ]
        },
        {
          konu: "Küresel aynalarda görüntü oluşumu ile ilgili deney yapabilme",
          kazanimlar: [
            "Küresel aynalarda görüntü oluşumu ile ilgili bir deney tasarlar.",
            "Küresel aynalarda görüntü oluşumu ile ilgili tasarladığı deney düzeneğinden veri toplayarak analiz eder."
          ]
        },
        {
          konu: "Işığın saydam ortamlardaki davranışını kullanarak deney yapabilme",
          kazanimlar: [
            "Işığın saydam ortamlardaki davranışı ile ilgili deney tasarlar.",
            "Işığın saydam ortamlardaki davranışı ile ilgili tasarladığı deney düzeneğinden veri toplayarak analiz eder."
          ]
        },
        {
          konu: "Saydam ortamlarda görünür derinliğin, gerçek derinlik ve ortamların ışığı kırma indislerine bağlı olarak değiştiğine ilişkin bilimsel gözlem yapabilme",
          kazanimlar: [
            "Görünür derinliği etkileyen gerçek derinlik ve ortamların ışığı kırma indisini tanımlar.",
            "Görünür derinliğin gerçek derinlik ve ortamların ışığı kırma indisine bağlı olarak değiştiğini gözlemleyerek kaydeder.",
            "Gözlemlerine dayalı olarak görünür derinliğin gerçek derinlik ve ortamların ışığı kırma indisine bağlı olarak değişimini açıklar."
          ]
        },
        {
          konu: "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanlarına ilişkin bilgi toplayabilme",
          kazanimlar: [
            "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanları ile ilgili bilgiye ulaşmak için kullanacağı kaynakları belirler.",
            "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanları ile ilgili bilgiye ulaşmak için belirlediği araçları kullanarak bilgi toplar.",
            "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanları hakkında toplanan bilgiyi doğrular.",
            "Fiber optik malzemelerin yapısı, çalışma prensibi ve kullanım alanları hakkında ulaşılan bilgileri kaydeder."
          ]
        },
        {
          konu: "Prizmalar ve prizmalar ile kurulan birleşik sistemlerde ışığın izlediği yola ilişkin tümdengelimsel akıl yürütebilme",
          kazanimlar: [
            "Kırılma yasalarının prizmalar için kullanılabilir olduğuna dair hipotez kurarak test eder.",
            "Geçerli hipotezleri kullanarak prizmalar ile oluşturulmuş birleşik sistemlerde tek renkli ışığın izleyeceği yolu açıklar."
          ]
        },
        {
          konu: "Merceklerin özelliklerine ilişkin karşılaştırma yapabilme",
          kazanimlar: [
            "Merceklerin fiziksel özelliklerini ve ışınların merceklerde kırıldıktan sonra izlediği yola ilişkin özellikleri belirler.",
            "Yakınsak ve ıraksak merceklerin benzer özelliklerini listeler.",
            "Yakınsak ve ıraksak merceklerin farklı özelliklerini listeler."
          ]
        },
        {
          konu: "Merceklerde görüntü oluşumu ile ilgili deney yapabilme",
          kazanimlar: [
            "Yakınsak ve ıraksak merceklerde görüntü oluşumu ile ilgili deney tasarlar.",
            "Yakınsak ve ıraksak merceklerde görüntü oluşumu ile ilgili tasarladığı deney düzeneğinden veri toplayarak analiz eder."
          ]
        }
      ]
    },
    {
      unite: "12. Sınıf",
      konular: [
        {
          konu: "Torkun matematiksel modeline yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Torkun kuvvet, dönme noktasına uzaklık ve kuvvetin uygulama açısı ile ilişkisini matematiksel olarak modeller.",
            "Torkun matematiksel modelini geneller."
          ]
        },
        {
          konu: "Denge, kütle merkezi ve ağırlık merkezi ile ilgili kanıt kullanabilme",
          kazanimlar: [
            "Denge, kütle merkezi ve ağırlık merkezi ile ilgili verileri toplayarak kaydeder.",
            "Denge, kütle merkezi ve ağırlık merkezi ile ilgili veri setleri oluşturur.",
            "Denge, kütle merkezi ve ağırlık merkezi kavramlarını veriye dayalı olarak açıklar."
          ]
        },
        {
          konu: "İtme (impuls) ve momentum değişimi arasındaki ilişkiye yönelik bilimsel çıkarım yapabilme",
          kazanimlar: [
            "İtme ve momentum değişimi arasındaki ilişkiye yönelik bileşenleri tanımlar.",
            "İtme ve momentum değişimi arasındaki ilişkiye yönelik verileri toplayarak kaydeder.",
            "İtme ve momentum değişimi arasındaki ilişkiye yönelik verileri yorumlar."
          ]
        },
        {
          konu: "Momentumun korunumunu veriye dayalı tahmin edebilme",
          kazanimlar: [
            "Momentumun korunumuna ilişkin verileri toplar.",
            "Veriler üzerinden momentumun korunumuna ilişkin hesaplamalar yapar.",
            "Momentumun farklı uygulamalardaki korunumuna ilişkin yargıda bulunur."
          ]
        },
        {
          konu: "Eylemsizlik momentine yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Eylemsizlik momentinin etkilerini birden fazla durumda gözlemler.",
            "Eylemsizlik momentinin bağlı olduğu değişkenler ile ilişkisini bulur.",
            "Eylemsizlik momentinin bağlı olduğu değişkenler ile ilişkisini geneller."
          ]
        },
        {
          konu: "Açısal momentumun korunumuna yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Açısal momentumun bağlı olduğu değişkenleri gözlemler.",
            "Açısal momentum ile bağlı olduğu değişkenler arasındaki ilişkiyi bulur.",
            "Açısal momentumun korunumunu bağlı olduğu değişkenler üzerinden geneller."
          ]
        },
        {
          konu: "Yay sabitini tanımlamak için deney yapabilme",
          kazanimlar: [
            "Farklı yaylardaki kuvvet ve uzanım değişkenlerine göre yay sabitinin büyüklüğünü bulabileceği bir deney tasarlar.",
            "Farklı yaylar için kuvvet ve uzanım grafiklerini oluşturarak analiz eder."
          ]
        },
        {
          konu: "Yay sabitinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Yay sabitine ilişkin kuvvet ile uzanım değişkenleri arasındaki örüntüyü matematiksel olarak modeller.",
            "Yay sabitine ilişkin oluşturulan matematiksel model üzerinden genelleme yapar."
          ]
        },
        {
          konu: "Yayın Esneklik potansiyel enerjisinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Kuvvet-uzanım grafiğinden yararlanarak yayın esneklik potansiyel enerjisinin matematiksel modeline ulaşır.",
            "Farklı veri setleri ile hesaplamalar yaparak yayın esneklik potansiyel enerjisinin matematiksel modelini geneller."
          ]
        },
        {
          konu: "Sürtünme kuvvetinin yaptığı işe yönelik tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Sürtünme kuvvetinin yaptığı iş ile ilgili gözlem yapar.",
            "Sürtünme kuvvetinin yaptığı işi matematiksel olarak modeller.",
            "Sürtünme kuvvetinin yaptığı işi matematiksel modelden yararlanarak geneller."
          ]
        },
        {
          konu: "Enerjinin dönüşümü ve korunumuna ilişkin bilimsel çıkarım yapabilme",
          kazanimlar: [
            "Enerjinin dönüşümü ve korunumuna ilişkin özellikleri tanımlar.",
            "Enerjinin dönüşümü ve korunumuna ilişkin veri toplayarak kaydeder.",
            "Enerjinin korunumunu matematiksel modelleri kullanarak yorumlar ve değerlendirir."
          ]
        },
        {
          konu: "Mekanik sistemlerin verimi ile ilgili tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Mekanik sistemlerin verimi ile ilgili değişkenleri sistemden alınan enerji, sisteme verilen enerji olarak belirler.",
            "Mekanik sistemlerin verimi ile ilgili değişkenlerin arasındaki ilişkiyi belirler.",
            "Mekanik sistemlerin verimi ile ilgili hesaplamalar yaparak değişkenler arasındaki ilişkiyi geneller."
          ]
        },
        {
          konu: "Doğrusal su dalgalarında kırınım olayına ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Doğrusal su dalgalarında kırınım olayını gözlemler.",
            "Doğrusal su dalgalarında kırınım olayını frekans, dalga boyu ve yarık genişliği değişkenleri ile ilişkilendirir.",
            "Doğrusal su dalgalarında gerçekleşen kırınım olayına ilişkin genelleme yapar."
          ]
        },
        {
          konu: "Işıkta kırınım ile ilgili deney yapabilme",
          kazanimlar: [
            "Işığın kırınımı ile ilgili deney tasarlar.",
            "Işığın kırınımı ile ilgili deney düzeneğinden veri toplayarak analiz eder."
          ]
        },
        {
          konu: "Dairesel su dalgalarında girişim olayına ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Dairesel su dalgalarında girişim olayını gözlemler.",
            "Dairesel su dalgalarında girişim olayını frekans, dalga boyu ve kaynaklar arası mesafe değişkenleri ile ilişkilendirir.",
            "Dairesel su dalgalarında gerçekleşen girişim olayına ilişkin genelleme yapar."
          ]
        },
        {
          konu: "Işıkta girişim ile ilgili deney yapabilme",
          kazanimlar: [
            "Işığın girişimi ile ilgili deney tasarlar.",
            "Işığın girişimi ile ilgili deney düzeneğinden veri toplayarak analiz eder."
          ]
        },
        {
          konu: "Elektromanyetik dalgaları sınıflandırabilme",
          kazanimlar: [
            "Elektromanyetik dalgaların niteliklerini belirler.",
            "Elektromanyetik dalgaları niteliklerine göre gruplandırır.",
            "Elektromanyetik dalgaları adlandırır."
          ]
        },
        {
          konu: "Işık renklerinin dalga boyları hakkında tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Işık renkleri ve dalga boyları arasındaki ilişkiyi bulur.",
            "Tüm ışık renklerinin ana ışık renkleri ile ilişkisine yönelik genelleme yapar."
          ]
        },
        {
          konu: "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardaki dalga türlerini sorgulayabilme",
          kazanimlar: [
            "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardan merak ettiği cihazı belirler.",
            "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardan merak ettiği cihaz hakkında sorular sorar.",
            "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardan merak ettiği cihaz ile ilgili bilgi toplar.",
            "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardan merak ettiği cihaz ile ilgili topladığı bilgilerin doğru olup olmadığını değerlendirir.",
            "Mekanik veya elektromanyetik dalgaların kullanıldığı cihazlardan merak ettiği cihaz ile ilgili topladığı bilgiler üzerinden çıkarım yapar."
          ]
        },
        {
          konu: "Planck sabitinin modern fiziğin doğuşundaki etkisini çözümleyebilme",
          kazanimlar: [
            "Planck sabitinin modern fiziğin ortaya çıkışındaki etkisini siyah cisim ışıması olgusu üzerinden belirler.",
            "Planck sabiti ile fotoelektrik etkinin ilişkisini belirler."
          ]
        },
        {
          konu: "Fotoelektrik etkinin bağlı olduğu koşullar ve foton kavramına ilişkin tümevarımsal akıl yürütebilme",
          kazanimlar: [
            "Fotoelektrik etkinin bağlı olduğu değişkenleri gözlemler.",
            "Fotoelektrik etkinin matematiksel modeline ulaşır.",
            "Fotoelektrik etki ve foton kavramı arasındaki ilişkiyi geneller."
          ]
        },
        {
          konu: "Fotoelektrik etkinin uygulamaları ile ilgili sorgulama yapabilme",
          kazanimlar: [
            "Fotoelektrik etkiyi tanımlar.",
            "Fotoelektrik etki hakkında sorular sorar.",
            "Fotoelektrik etkinin uygulamaları hakkında bilgi toplar.",
            "Fotoelektrik etkinin uygulamaları ile ilgili toplanan bilgilerin doğru olup olmadığını değerlendirir.",
            "Fotoelektrik etkinin uygulamaları ile ilgili toplanan bilgiler üzerinde çıkarım yapar."
          ]
        },
        {
          konu: "Standart modelin bileşenlerini çözümleyebilme",
          kazanimlar: [
            "Standart modelde yer alan temel parçacıkları belirler.",
            "Temel parçacıklar ve temel kuvvetler arasındaki ilişkileri belirler."
          ]
        },
        {
          konu: "Modern Atom Teorisi ile ilgili bilgileri yapılandırabilme",
          kazanimlar: [
            "Atomun yapısındaki temel parçacıkları inceleyerek aralarındaki ilişkileri ortaya koyar.",
            "Temel parçacıklarla ilgili bilgilerini kullanarak atomun yapısını ortaya koyar."
          ]
        },
        {
          konu: "Nükleer enerjiyi sorgulayabilme",
          kazanimlar: [
            "Nükleer enerjiye ilişkin merak ettiği konuyu tanımlar.",
            "Nükleer enerjiye ilişkin sorular sorar.",
            "Nükleer enerji hakkında bilgi toplar.",
            "Nükleer enerjiye ilişkin bilgilerin doğruluğunu değerlendirir.",
            "Nükleer enerjiye ilişkin toplanan bilgiler üzerinden çıkarımlar yapar."
          ]
        }
      ]
    }
  ],
  "Edebiyat": [
    {
      unite: "Hazırlık Sınıfı",
      konular: [
        { konu: "Edebiyat ve Sanat", kazanimlar: ["TDE1.1. Metinlerde dinlemeyi/izlemeyi yönetebilme"] },
        { konu: "Şiir", kazanimlar: ["TDE2.2. Metinlerde anlam oluşturabilme"] },
        { konu: "Şiir Tahlili", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Anı (Hatıra)", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Söyleşi (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Konuşma Atölyesi", kazanimlar: ["TDE3.1. Konuşma sürecini yönetebilme"] },
        { konu: "Yazma Atölyesi", kazanimlar: ["TDE4.1. Yazma sürecini yönetebilme"] },
        { konu: "Tiyatro", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Tiyatro Tahlili", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Gezi Yazısı", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Şiir (Dinleme)", kazanimlar: ["TDE1.1. Dinlemeyi yönetebilme"] },
        { konu: "Hikâye", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Deneme", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Belgesel (İzleme)", kazanimlar: ["TDE1.3. Çözümleyebilme"] },
        { konu: "Roman", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Fıkra (Köşe Yazısı)", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Mektup (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] }
      ]
    },
    {
      unite: "9. Sınıf",
      konular: [
        { konu: "Şiir", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Şiir Tahlili", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Deneme", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Mülakat (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Hikâye", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Hikâye (Yapı)", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Anı (Hatıra)", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Gezi Yazısı", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Belgesel (İzleme)", kazanimlar: ["TDE1.3. Çözümleyebilme"] },
        { konu: "Roman", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Roman Tahlili", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Eleştiri", kazanimlar: ["TDE2.4. Değerlendirme"] },
        { konu: "Otobiyografi (İzleme)", kazanimlar: ["TDE1.3. Çözümleyebilme"] }
      ]
    },
    {
      unite: "10. Sınıf",
      konular: [
        { konu: "Koşuk", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Türkü", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Masal (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Gazel", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Gazel Tahlili", kazanimlar: ["TDE2.4. Değerlendirme"] },
        { konu: "Saf Şiir", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Söyleşi (Dinleme)", kazanimlar: ["TDE1.3. Çözümleyebilme"] },
        { konu: "Destan", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Halk Hikâyesi", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Mesnevi", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Fabl (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Dede Korkut Hikâyeleri", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Tanzimat Şiiri", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Servetifünun ve Fecriati", kazanimlar: ["TDE2.4. Değerlendirme"] },
        { konu: "Millî Edebiyat Hikâyesi (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] }
      ]
    },
    {
      unite: "11. Sınıf",
      konular: [
        { konu: "Karagöz", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Karagöz Tahlili", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Mektup", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "İletişim (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Türk Dünyası Hikâyesi", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Orhun Abideleri", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Ara Metinler", kazanimlar: ["TDE2.4. Değerlendirme"] },
        { konu: "Âşık Atışması (Dinleme)", kazanimlar: ["TDE1.3. Çözümleyebilme"] },
        { konu: "Roman", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Biyografi", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Radyo Tiyatrosu (Dinleme)", kazanimlar: ["TDE1.1. Dinlemeyi yönetebilme"] },
        { konu: "Tiyatro", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Küçürek Hikâye", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Belgesel (İzleme)", kazanimlar: ["TDE1.4. Görüşlerini yansıtabilme"] }
      ]
    },
    {
      unite: "12. Sınıf",
      konular: [
        { konu: "Günlük", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Şiir", kazanimlar: ["TDE2.1. Okumayı yönetebilme"] },
        { konu: "Kişisel Gelişim (Dinleme)", kazanimlar: ["TDE1.4. Yansıtabilme"] },
        { konu: "Roman", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Makale", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Haber Metni (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] },
        { konu: "Gezi Yazısı", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Hikâye", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Teknoloji ve Çevre (Dinleme)", kazanimlar: ["TDE1.4. Yansıtabilme"] },
        { konu: "Makale (Meslek)", kazanimlar: ["TDE2.2. Anlam oluşturabilme"] },
        { konu: "Hikâye (Gelecek)", kazanimlar: ["TDE2.3. Çözümleyebilme"] },
        { konu: "Mülakat (Dinleme)", kazanimlar: ["TDE1.2. Anlam oluşturabilme"] }
      ]
    }
  ]
};

// --- YENİ EKLENEN SENARYO ŞABLONLARI ---
const SCENARIO_TEMPLATES = {
  Fizik: [
    {
      role: "Ar-Ge Mühendisi",
      template: "Yüksek teknoloji üreten bir firmada **Ar-Ge Mühendisi** olarak çalışıyorsunuz. Şirket yönetimi, yeni geliştirilecek bir ürün prototipi için **${outcome}** prensiplerinin hayati önem taşıdığını belirtti. Sizden bu konuyu derinlemesine incelemeniz ve ekibe rehberlik etmeniz bekleniyor."
    },
    {
      role: "Bilim Merkezi Tasarımcısı",
      template: "Şehrinize yeni açılacak interaktif bilim merkezinde **Tasarımcı** olarak görevlisiniz. Ziyaretçilerin **${outcome}** kavramını deneyimleyerek öğrenebileceği yaratıcı bir istasyon tasarlamanız gerekiyor."
    },
    {
      role: "Bilim Dergisi Editörü",
      template: "Popüler bir bilim dergisinde **Editör**sünüz. Önümüzdeki ayın kapak konusu **${outcome}**. Okuyucularınıza bu karmaşık konuyu basit, anlaşılır ve ilgi çekici bir dille aktaracak bir dosya hazırlamalısınız."
    },
    {
      role: "Laboratuvar Direktörü",
      template: "Ulusal bir araştırma enstitüsünde **Laboratuvar Direktörü**sünüz. Genç araştırmacılardan oluşan ekibinize **${outcome}** konusunda bir eğitim vermeniz ve örnek bir çalışma yürütmeniz gerekiyor."
    },
    {
      role: "Eğitim Teknoloğu",
      template: "Bir eğitim teknolojileri firmasında **Eğitim Teknoloğu** olarak çalışıyorsunuz. Lise öğrencileri için **${outcome}** kazanımını dijital ortamda simüle edecek bir öğrenme modülü kurgulamanız istendi."
    }
  ],
  Edebiyat: [
    {
      role: "Kültür Sanat Muhabiri",
      template: "Ulusal bir gazetede **Kültür Sanat Muhabiri** olarak çalışıyorsunuz. Editörünüz, **${outcome}** temasını işleyen eserleri ve metinleri inceleyerek okuyucular için kapsamlı bir pazar eki hazırlamanızı istedi."
    },
    {
      role: "Müze Küratörü",
      template: "Türkiye'nin önde gelen edebiyat müzesinde **Küratör**sünüz. **${outcome}** konusunu merkeze alan, ziyaretçileri edebi bir yolculuğa çıkaracak yeni bir sergi taslağı hazırlamanız bekleniyor."
    },
    {
      role: "Yayınevi Editörü",
      template: "Köklü bir yayınevinde **Editör** olarak görev yapıyorsunuz. Yayınevi yönetimi, **${outcome}** üzerine odaklanan özel bir antoloji serisi başlatmaya karar verdi. Bu serinin ilk taslağını oluşturmak sizin göreviniz."
    },
    {
      role: "Senarist",
      template: "Bir yapım şirketi için **Senarist** olarak çalışıyorsunuz. Yeni projenizde karakterlerin iç dünyasını ve çatışmalarını yansıtmak için **${outcome}** konusundaki edebi tekniklerden faydalanmanız gerekiyor."
    },
    {
      role: "Festival Koordinatörü",
      template: "Uluslararası bir edebiyat festivalinde **Koordinatör**sünüz. Katılımcı yazarların ve okurların **${outcome}** kavramını tartışabileceği bir panel veya atölye çalışması organize etmelisiniz."
    }
  ]
};

const App = () => {
  const taskTypes = [
    { id: "performance", name: "Performans Görevi", desc: "Ünite içi kazanımlara yönelik kısa süreli çalışma." },
    { id: "project", name: "Proje Ödevi", desc: "Daha kapsamlı, araştırma ve ürün odaklı uzun süreli çalışma." }
  ];

  // State
  const [selectedLesson, setSelectedLesson] = useState("Fizik");
  const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [selectedType, setSelectedType] = useState("performance");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState(null);

  // Veri yardımcıları
  const currentGradeData = KAZANIMLAR[selectedLesson][selectedGradeIndex];
  const currentTopic = currentGradeData?.konular[selectedTopicIndex];

  // Ders değişince indexleri sıfırla
  useEffect(() => {
    setSelectedGradeIndex(0);
    setSelectedTopicIndex(0);
  }, [selectedLesson]);

  // Sınıf değişince konu indexini sıfırla
  useEffect(() => {
    setSelectedTopicIndex(0);
  }, [selectedGradeIndex]);

  const generateAssignment = () => {
    setIsGenerating(true);
    setGeneratedTask(null);
    
    setTimeout(() => {
      if (currentTopic) {
        const task = createFlexibleTask(selectedLesson, currentGradeData.unite, currentTopic, selectedType);
        setGeneratedTask(task);
      }
      setIsGenerating(false);
    }, 1500);
  };

  // --- ÖDEV ÜRETİM MOTORU (GÜNCELLENMİŞ) ---
  const createFlexibleTask = (lesson, gradeName, topicData, type) => {
    const isProject = type === "project";
    
    // Konu Başlığı ve Öğrenme Çıktısı Ayrıştırma
    let title = "";
    let outcome = "";
    let processSteps = [];

    if (lesson === "Fizik") {
      title = topicData.konu.length > 50 ? topicData.konu.substring(0, 50) + "..." : topicData.konu;
      outcome = topicData.konu;
      processSteps = [...topicData.kazanimlar];
    } else {
      title = topicData.konu;
      outcome = topicData.kazanimlar[0];
      if (isProject) {
         processSteps = [
           "Konuyla ilgili edebi eserlerin veya metinlerin taranması.",
           "Seçilen metinlerin yapı, tema ve dil özellikleri açısından incelenmesi.",
           "İnceleme sonuçlarının tasnif edilmesi ve yorumlanması.",
           "Çalışmanın özgün bir metin veya sunum haline getirilmesi."
         ];
      } else {
         processSteps = [
           "İlgili kazanımı içeren metinlerin okunması/dinlenmesi.",
           "Metin üzerinde gerekli analizlerin yapılması.",
           "Çalışma kağıdının veya sözlü sunumun hazırlanması."
         ];
      }
    }

    // --- YENİ SENARYO SEÇİM MANTIĞI ---
    const templates = SCENARIO_TEMPLATES[lesson];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Şablondaki ${outcome} değişkenini gerçek veriyle değiştir
    const scenarioText = randomTemplate.template.replace("${outcome}", outcome);
    const roleName = randomTemplate.role;

    // Senaryoyu birleştir
    const finalScenario = `${scenarioText} Bu çalışmada aşağıdaki süreç basamaklarını takip etmeniz beklenmektedir.`;

    // Proje ise ek raporlama adımları
    if (isProject) {
      processSteps.push("Elde edilen verileri ve sonuçları içeren kapsamlı bir proje raporu hazırlayınız.");
      processSteps.push("Çalışmanızı sunmak için bir poster veya dijital sunum materyali oluşturunuz.");
    } else {
      processSteps.push("Çalışma sonucunda elde ettiğiniz bulguları sınıfta paylaşmak üzere özetleyiniz.");
    }

    return {
      title: `${lesson} - ${gradeName} - ${title}`,
      outcome: outcome,
      role: roleName, // Artık rolü de ayrıca döndürüyoruz
      scenario: finalScenario,
      steps: processSteps,
      evaluation: isProject ? [
        "Süreç Yönetimi (%30)",
        "İçerik Doğruluğu (%30)",
        "Özgünlük ve Yaratıcılık (%20)",
        "Raporlama ve Sunum (%20)"
      ] : [
        "Yönerge Takibi (%40)",
        "Konu Hakimiyeti (%40)",
        "Zamanında Teslim (%20)"
      ]
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Başlık */}
        <div className="lg:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${selectedLesson === 'Fizik' ? 'bg-blue-700' : 'bg-rose-700'}`}>
              {selectedLesson === 'Fizik' ? <Brain className="text-white w-8 h-8" /> : <Library className="text-white w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">MEB Ödev Asistanı</h1>
              <p className="text-slate-500 text-sm">Türkiye Yüzyılı Maarif Modeli - {selectedLesson} (2025-2026)</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full font-bold mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>Veri Tabanı Güncellendi</span>
            </div>
            <span className="text-xs text-slate-400">Kaynak: Kullanıcı Tanımlı Müfredat</span>
          </div>
        </div>

        {/* SOL PANEL: Seçimler */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-6 border-b pb-2 text-slate-800">
              <GraduationCap className="w-5 h-5" />
              Ders ve Konu Seçimi
            </h2>

            {/* Ders Seçimi */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Ders</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(KAZANIMLAR).map(lesson => (
                  <button
                    key={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`py-2 rounded-lg font-medium transition-colors border ${
                      selectedLesson === lesson 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lesson}
                  </button>
                ))}
              </div>
            </div>

            {/* Sınıf Seviyesi */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Sınıf Seviyesi</label>
              <select 
                value={selectedGradeIndex}
                onChange={(e) => setSelectedGradeIndex(parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                {KAZANIMLAR[selectedLesson].map((gradeData, idx) => (
                  <option key={idx} value={idx}>{gradeData.unite}</option>
                ))}
              </select>
            </div>

            {/* Konu/Kazanım */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Konu / Kazanım</label>
              <select 
                value={selectedTopicIndex}
                onChange={(e) => setSelectedTopicIndex(parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {currentGradeData?.konular.map((t, idx) => (
                  <option key={idx} value={idx}>
                    {t.konu.length > 60 ? t.konu.substring(0, 60) + "..." : t.konu}
                  </option>
                ))}
              </select>
            </div>

            {/* Ödev Tipi */}
             <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Ödev Türü</label>
              <div className="space-y-2">
                {taskTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedType === t.id
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Seçili Konu Önizleme */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-yellow-800 mb-2 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {selectedLesson === "Fizik" ? "Süreç Bileşenleri" : "Kazanım Detayı"}
              </h4>
              <ul className="text-xs text-yellow-900 space-y-1 pl-1">
                {currentTopic?.kazanimlar.slice(0, 3).map((c, i) => (
                  <li key={i} className="leading-tight opacity-90">• {c}</li>
                ))}
                {currentTopic?.kazanimlar.length > 3 && <li>...</li>}
              </ul>
            </div>

            <button
              onClick={generateAssignment}
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95 ${
                isGenerating ? 'bg-slate-400 cursor-wait' : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {isGenerating ? 'Senaryo Yazılıyor...' : 'Ödevi Oluştur'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Ödevi Oluştur
                </>
              )}
            </button>
          </div>
        </div>

        {/* SAĞ PANEL: Çıktı */}
        <div className="lg:col-span-8">
          {generatedTask ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Belge Başlığı */}
              <div className={`bg-slate-900 text-white p-8 border-b-4 relative overflow-hidden ${selectedLesson === 'Fizik' ? 'border-blue-500' : 'border-rose-500'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold font-serif tracking-wide">{generatedTask.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-slate-300 text-sm font-medium">
                        <span className="bg-white/10 px-2 py-1 rounded">2025-2026</span>
                        <span className="bg-white/10 px-2 py-1 rounded">Ders: {selectedLesson}</span>
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">
                          {generatedTask.role}
                        </span>
                      </div>
                    </div>
                    <FileText className="w-10 h-10 text-white/20" />
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 print:p-0">
                
                {/* Öğrenme Çıktısı */}
                <div className={`p-4 rounded-lg border-l-4 ${selectedLesson === 'Fizik' ? 'bg-blue-50 border-blue-600' : 'bg-rose-50 border-rose-600'}`}>
                  <h4 className={`text-sm font-bold uppercase mb-1 ${selectedLesson === 'Fizik' ? 'text-blue-900' : 'text-rose-900'}`}>Hedeflenen Kazanım / Çıktı</h4>
                  <p className={`${selectedLesson === 'Fizik' ? 'text-blue-800' : 'text-rose-800'} font-medium italic`}>"{generatedTask.outcome}"</p>
                </div>

                {/* Senaryo */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3 border-b pb-2">
                    <Brain className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                    Görev Senaryosu
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-lg">
                    {generatedTask.scenario}
                  </p>
                </div>

                {/* Süreç Adımları (Esas Kısım) */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-4 border-b pb-2">
                    <List className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                    Süreç Adımları ve Yönerge
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <ul className="space-y-4">
                      {generatedTask.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold shadow-sm bg-white ${selectedLesson === 'Fizik' ? 'border-blue-200 text-blue-700' : 'border-rose-200 text-rose-700'}`}>
                            {idx + 1}
                          </div>
                          <p className="text-slate-800 font-medium mt-1">{step}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Değerlendirme */}
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-4 border-b pb-2">Değerlendirme Kriterleri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedTask.evaluation.map((criteria, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-slate-700 font-medium">{criteria.split('(%')[0]}</span>
                        <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-sm border border-slate-200">
                          %{criteria.split('(%')[1].replace(')', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Alt Bar */}
              <div className="bg-slate-50 p-4 border-t flex justify-between items-center text-sm text-slate-500">
                <div>* MEB Ortaöğretim Performans ve Proje Yönetmeliği'ne uygundur.</div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors">
                    <Printer className="w-4 h-4" />
                    Yazdır
                  </button>
                  <button className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm ${selectedLesson === 'Fizik' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    <Save className="w-4 h-4" />
                    PDF Kaydet
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-8">
              <div className="bg-slate-50 p-8 rounded-full mb-6 border border-slate-100">
                <Cpu className="w-16 h-16 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">Ödev Hazırlamaya Başlayın</h3>
              <p className="text-center max-w-md text-slate-500 mb-6">
                Sol menüden <strong>{selectedLesson}</strong> dersi için sınıf ve konu seçimi yapın. Sistem, seçtiğiniz kazanımı analiz edip size özel bir senaryo hazırlayacaktır.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default App;
