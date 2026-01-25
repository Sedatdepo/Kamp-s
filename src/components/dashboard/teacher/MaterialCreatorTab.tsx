'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, PlusCircle, Trash2 } from 'lucide-react';
import { TeacherProfile } from '@/lib/types';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario } from '@/ai/flows/generate-assignment-scenario-flow';
import { exportMaterialToRtf } from '@/lib/word-export';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

    const templates = SCENARIO_TEMPLATES[lesson as keyof typeof SCENARIO_TEMPLATES];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    const scenarioText = randomTemplate.template.replace("${outcome}", outcome);
    const roleName = randomTemplate.role;

    const finalScenario = `${scenarioText} Bu çalışmada aşağıdaki süreç basamaklarını takip etmeniz beklenmektedir.`;

    if (isProject) {
      processSteps.push("Elde edilen verileri ve sonuçları içeren kapsamlı bir proje raporu hazırlayınız.");
      processSteps.push("Çalışmanızı sunmak için bir poster veya dijital sunum materyali oluşturunuz.");
    } else {
      processSteps.push("Çalışma sonucunda elde ettiğiniz bulguları sınıfta paylaşmak üzere özetleyiniz.");
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

  const handleTaskChange = (field: string, value: string) => {
    if (!generatedTask) return;
    setGeneratedTask((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index: number, value: string) => {
    if (!generatedTask) return;
    const newSteps = [...generatedTask.steps];
    newSteps[index] = value;
    handleTaskChange('steps', newSteps);
  };

  const addStep = () => {
    if (!generatedTask) return;
    handleTaskChange('steps', [...generatedTask.steps, '']);
  };

  const removeStep = (index: number) => {
    if (!generatedTask) return;
    handleTaskChange('steps', generatedTask.steps.filter((_: any, i: number) => i !== index));
  };

  const handleEvalChange = (index: number, value: string) => {
    if (!generatedTask) return;
    const newEval = [...generatedTask.evaluation];
    newEval[index] = value;
    handleTaskChange('evaluation', newEval);
  };

  const addEval = () => {
    if (!generatedTask) return;
    handleTaskChange('evaluation', [...generatedTask.evaluation, 'Yeni Kriter (%10)']);
  };

  const removeEval = (index: number) => {
    if (!generatedTask) return;
    handleTaskChange('evaluation', generatedTask.evaluation.filter((_: any, i: number) => i !== index));
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
              <GraduationCap className="w-5 h-5" />
              Ders ve Konu Seçimi
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
                {KAZANIMLAR[selectedLesson].map((gradeData: any, idx: number) => (<option key={idx} value={idx}>{gradeData.unite}</option>))}
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
                      <Input
                        className="text-xl md:text-2xl font-bold font-serif tracking-wide bg-transparent border-0 border-b-2 border-transparent focus-visible:ring-0 focus-visible:border-white rounded-none -ml-3 h-auto p-1"
                        value={generatedTask.title}
                        onChange={(e) => handleTaskChange('title', e.target.value)}
                      />
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

              <div className="p-8 space-y-8 print:p-0">
                
                <div className={`p-4 rounded-lg border-l-4 ${selectedLesson === 'Fizik' ? 'bg-blue-50 border-blue-600' : 'bg-rose-50 border-rose-600'}`}>
                  <h4 className={`text-sm font-bold uppercase mb-1 ${selectedLesson === 'Fizik' ? 'text-blue-900' : 'text-rose-900'}`}>Hedeflenen Kazanım / Çıktı</h4>
                  <p className={`${selectedLesson === 'Fizik' ? 'text-blue-800' : 'text-rose-800'} font-medium italic`}>"{generatedTask.outcome}"</p>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3 border-b pb-2">
                    <Brain className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                    Görev Açıklaması
                  </h4>
                  <Textarea
                    className="text-slate-700 leading-relaxed text-lg"
                    value={generatedTask.description || generatedTask.scenario}
                    onChange={(e) => handleTaskChange(generatedTask.description ? 'description' : 'scenario', e.target.value)}
                    rows={5}
                  />
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-4 border-b pb-2">
                    <List className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                    Süreç Adımları ve Yönerge
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="space-y-3">
                      {generatedTask.steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold shadow-sm bg-white ${selectedLesson === 'Fizik' ? 'border-blue-200 text-blue-700' : 'border-rose-200 text-rose-700'}`}>{idx + 1}</div>
                          <Input
                            value={step}
                            onChange={(e) => handleStepChange(idx, e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeStep(idx)}>
                            <Trash2 className="h-4 w-4 text-red-500"/>
                          </Button>
                        </div>
                      ))}
                       <Button variant="outline" size="sm" onClick={addStep} className="mt-2 w-full border-dashed">
                            <PlusCircle className="mr-2 h-4 w-4" /> Adım Ekle
                        </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-4 border-b pb-2">Değerlendirme Kriterleri</h4>
                  <div className="space-y-2">
                    {generatedTask.evaluation.map((criteria: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={criteria}
                          onChange={(e) => handleEvalChange(idx, e.target.value)}
                          className="flex-1"
                          placeholder="Kriter Adı (% Puan)"
                        />
                         <Button variant="ghost" size="icon" onClick={() => removeEval(idx)}>
                            <Trash2 className="h-4 w-4 text-red-500"/>
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addEval} className="mt-2 w-full border-dashed">
                        <PlusCircle className="mr-2 h-4 w-4" /> Kriter Ekle
                    </Button>
                  </div>
                </div>

              </div>
              <div className="bg-slate-50 p-4 border-t flex justify-between items-center text-sm text-slate-500">
                <div>* MEB Ortaöğretim Performans ve Proje Yönetmeliği'ne uygundur.</div>
                <div className="flex gap-2">
                  <Button onClick={() => exportMaterialToRtf({ task: generatedTask, teacherProfile })} className={`flex items-center gap-2 text-white rounded-lg font-medium transition-colors shadow-sm ${selectedLesson === 'Fizik' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    <FileDown className="w-4 h-4" />
                    Word Olarak İndir
                  </Button>
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
