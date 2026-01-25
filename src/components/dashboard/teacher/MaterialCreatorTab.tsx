'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, FileDown } from 'lucide-react';
import { TeacherProfile } from '@/lib/types';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario } from '@/ai/flows/generate-assignment-scenario-flow';
import { exportMaterialToRtf } from '@/lib/word-export';


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

const App = ({ teacherProfile }: { teacherProfile: TeacherProfile | null }) => {
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
  const [generatedTask, setGeneratedTask] = useState<any>(null);

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

  const generateFromTemplate = () => {
    setIsGenerating(true);
    setGeneratedTask(null);
    
    setTimeout(() => {
      if (currentTopic) {
        const task = createFromTemplate(selectedLesson, currentGradeData.unite, currentTopic, selectedType);
        setGeneratedTask(task);
      }
      setIsGenerating(false);
    }, 500);
  };
  
  const generateWithAi = async () => {
    if (!currentTopic) return;
    setIsGenerating(true);
    setGeneratedTask(null);

    try {
        const response = await generateAssignmentScenario({
            lesson: selectedLesson,
            grade: currentGradeData.unite,
            topic: currentTopic.konu,
            outcome: currentTopic.kazanimlar[0]
        });
        
        const task = {
            title: response.taskTitle,
            description: response.taskDescription,
            outcome: currentTopic.kazanimlar[0],
            steps: currentTopic.kazanimlar.slice(1),
            evaluation: selectedType === "project" ? [
              "Süreç Yönetimi (%30)", "İçerik Doğruluğu (%30)", "Özgünlük ve Yaratıcılık (%20)", "Raporlama ve Sunum (%20)"
            ] : [
              "Yönerge Takibi (%40)", "Konu Hakimiyeti (%40)", "Zamanında Teslim (%20)"
            ]
        };
        setGeneratedTask(task);

    } catch (error) {
        console.error("AI Generation Error:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const createFromTemplate = (lesson: string, gradeName: string, topicData: any, type: string) => {
    const isProject = type === "project";
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
      processSteps = isProject ? [
        "Konuyla ilgili edebi eserlerin/metinlerin taranması.",
        "Seçilen metinlerin incelenmesi.",
        "Çalışmanın özgün bir metin haline getirilmesi."
      ] : [
        "İlgili metinlerin okunması/dinlenmesi.",
        "Metin üzerinde analiz yapılması.",
        "Çalışmanın özetlenmesi."
      ];
    }

    const templates = SCENARIO_TEMPLATES[lesson as keyof typeof SCENARIO_TEMPLATES];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const scenarioText = randomTemplate.template.replace("${outcome}", outcome);
    const roleName = randomTemplate.role;
    const finalScenario = `${scenarioText} Bu çalışmada aşağıdaki süreç basamaklarını takip etmeniz beklenmektedir.`;

    if (isProject) {
      processSteps.push("Elde edilen verileri içeren bir proje raporu hazırlayınız.", "Çalışmanızı sunmak için bir materyal oluşturunuz.");
    } else {
      processSteps.push("Çalışma sonucunda elde ettiğiniz bulguları sınıfta paylaşınız.");
    }

    return {
      title: "Görev Senaryosu",
      description: finalScenario,
      outcome: outcome,
      role: roleName,
      steps: processSteps,
      evaluation: isProject ? [
        "Süreç Yönetimi (%30)", "İçerik Doğruluğu (%30)", "Özgünlük ve Yaratıcılık (%20)", "Raporlama ve Sunum (%20)"
      ] : [
        "Yönerge Takibi (%40)", "Konu Hakimiyeti (%40)", "Zamanında Teslim (%20)"
      ]
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${selectedLesson === 'Fizik' ? 'bg-blue-700' : 'bg-rose-700'}`}>
              <Brain className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">MEB Ödev Asistanı</h1>
              <p className="text-slate-500 text-sm">Türkiye Yüzyılı Maarif Modeli - {selectedLesson} (2025-2026)</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-6 border-b pb-2 text-slate-800">
              <GraduationCap className="w-5 h-5" /> Ders ve Konu Seçimi
            </h2>
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Ders</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(KAZANIMLAR).map(lesson => (
                  <button key={lesson} onClick={() => setSelectedLesson(lesson)} className={`py-2 rounded-lg font-medium transition-colors border ${ selectedLesson === lesson ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' }`} >{lesson}</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Sınıf Seviyesi</label>
              <select value={selectedGradeIndex} onChange={(e) => setSelectedGradeIndex(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium" >
                {KAZANIMLAR[selectedLesson].map((gradeData, idx) => (<option key={idx} value={idx}>{gradeData.unite}</option>))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Konu / Kazanım</label>
              <select value={selectedTopicIndex} onChange={(e) => setSelectedTopicIndex(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500" >
                {currentGradeData?.konular.map((t: any, idx: number) => (
                  <option key={idx} value={idx}> {t.konu.length > 60 ? t.konu.substring(0, 60) + "..." : t.konu} </option>
                ))}
              </select>
            </div>
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-yellow-800 mb-2 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {selectedLesson === "Fizik" ? "Süreç Bileşenleri" : "Kazanım Detayı"}
              </h4>
              <ul className="text-xs text-yellow-900 space-y-1 pl-1">
                {currentTopic?.kazanimlar.slice(0, 3).map((c: string, i: number) => ( <li key={i} className="leading-tight opacity-90">• {c}</li> ))}
                {currentTopic?.kazanimlar.length > 3 && <li>...</li>}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={generateFromTemplate} disabled={isGenerating} variant="outline">Şablondan Senaryo</Button>
                <Button onClick={generateWithAi} disabled={isGenerating} className="bg-slate-800 hover:bg-slate-900">
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                    AI ile Görev Üret
                </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {generatedTask ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`bg-slate-900 text-white p-8 border-b-4 relative overflow-hidden ${selectedLesson === 'Fizik' ? 'border-blue-500' : 'border-rose-500'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold font-serif tracking-wide">{generatedTask.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-slate-300 text-sm font-medium">
                        <span className="bg-white/10 px-2 py-1 rounded">2025-2026</span>
                        <span className="bg-white/10 px-2 py-1 rounded">Ders: {selectedLesson}</span>
                        {generatedTask.role && <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">{generatedTask.role}</span>}
                      </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => exportMaterialToRtf({ task: generatedTask, teacherProfile })}>
                        <FileDown className="text-white"/>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div className={`p-4 rounded-lg border-l-4 ${selectedLesson === 'Fizik' ? 'bg-blue-50 border-blue-600' : 'bg-rose-50 border-rose-600'}`}>
                  <h4 className={`text-sm font-bold uppercase mb-1 ${selectedLesson === 'Fizik' ? 'text-blue-900' : 'text-rose-900'}`}>Hedeflenen Kazanım / Çıktı</h4>
                  <p className={`${selectedLesson === 'Fizik' ? 'text-blue-800' : 'text-rose-800'} font-medium italic`}>"{generatedTask.outcome}"</p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3 border-b pb-2">
                    <Brain className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} /> Görev Açıklaması
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: generatedTask.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-4 border-b pb-2">
                    <List className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} /> Süreç Adımları ve Yönerge
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <ul className="space-y-4">
                      {generatedTask.steps.map((step: string, idx: number) => (
                        <li key={idx} className="flex gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold shadow-sm bg-white ${selectedLesson === 'Fizik' ? 'border-blue-200 text-blue-700' : 'border-rose-200 text-rose-700'}`}>{idx + 1}</div>
                          <p className="text-slate-800 font-medium mt-1">{step}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
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
