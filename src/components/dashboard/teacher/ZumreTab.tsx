
'use client'; 

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, Save, FileDown, Users2, PlusCircle, Trash2, GripVertical, 
  BookOpen, Settings, Zap, ListChecks, ChevronDown, ChevronRight, 
  Archive, FolderOpen, History, FileText, Mic, MicOff, Loader2, 
  BookmarkPlus, Share2, X, Check, FileEdit, MoreVertical, PenTool, 
  LayoutTemplate, Wand2, Printer, FileClock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/use-database';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, limit, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SENARYOLAR } from '@/lib/zumre-senaryolari';

// --- TİP TANIMLAMALARI ---
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// --- MOCK DATA VE SABİTLER ---

// Akıllı Asistan İçin Kelime Bazlı Öneriler
const AI_SUGGESTIONS: Record<string, string> = {
    "sınav": "Sınavların yönetmeliklere uygun olarak, geçerlilik ve güvenilirliği yüksek, kazanımları kapsayan sorulardan oluşmasına özen gösterilecektir.",
    "kelebek": "Sınav güvenliğini artırmak amacıyla, imkanlar dahilinde sınav oturum düzeninin 'kelebek sistemi' şeklinde planlanmasına karar verildi.",
    "başarı": "Öğrenci başarısını artırmak amacıyla, eksik kazanımların tespit edilerek destekleme çalışmalarının yapılmasına ve veli işbirliğinin güçlendirilmesine karar verildi.",
    "kitap": "Ders kitaplarının ve eğitim materyallerinin müfredatla uyumlu olduğu, etkinliklerin zenginleştirilerek uygulanması gerektiği belirtildi.",
    "proje": "Proje ödevlerinin öğrencilerin ilgi, yetenek ve imkanlarına uygun olarak dağıtılmasına; değerlendirme kriterlerinin (rubrik) önceden öğrencilere duyurulmasına karar verildi.",
    "gezi": "Eğitimi destekleyici nitelikte, görgü ve bilgiyi artırıcı okul gezilerinin planlanarak okul idaresine sunulmasına karar verildi.",
    "disiplin": "Sınıf içi disiplini bozan davranışlara karşı, okul rehberlik servisi ile işbirliği yapılarak önleyici rehberlik çalışmalarına ağırlık verilmesi kararlaştırıldı.",
    "default": "Konuyla ilgili görüş ve öneriler dinlendi. Yapılan değerlendirmeler sonucunda, eğitim-öğretim kalitesini artıracak tedbirlerin alınması konusunda görüş birliğine varıldı."
};

// Farklı dönemler için hazır şablonlar
const SABLONLAR: Record<string, string[]> = {
  "Sene Başı": [
    "Açılış ve yoklama.",
    "Bir önceki zümre kararlarının incelenmesi.",
    "Müfredat programının incelenmesi.",
    "Yıllık planların ve ders planlarının hazırlanması.",
    "Ölçme ve değerlendirme kriterlerinin belirlenmesi.",
    "Proje ödevlerinin konularının ve değerlendirme ölçeklerinin belirlenmesi.",
    "Öğrenci başarısını artırıcı önlemler.",
    "İş sağlığı ve güvenliği tedbirleri.",
    "Dilek ve temenniler.",
    "Kapanış."
  ],
  "2. Dönem Başı": [
    "Açılış ve yoklama.",
    "1. Dönem başarı durumunun değerlendirilmesi.",
    "Uygulanan yıllık planın değerlendirilmesi ve varsa aksaklıkların giderilmesi.",
    "Ölçme ve değerlendirme çalışmalarının gözden geçirilmesi.",
    "Başarısız öğrencilere yönelik tedbirlerin görüşülmesi.",
    "Dilek ve temenniler.",
    "Kapanış."
  ],
  "Sene Sonu": [
    "Açılış ve yoklama.",
    "Yıl sonu başarı durumunun ve müfredatın tamamlanma durumunun görüşülmesi.",
    "Yıllık planın uygulanma durumunun değerlendirilmesi.",
    "Gelecek eğitim-öğretim yılı için ihtiyaçların belirlenmesi.",
    "Dilek ve temenniler.",
    "Kapanış."
  ]
};

const GUNDEM_MADDELERI_DEFAULT = SABLONLAR["Sene Başı"];

// Akıllı Karar Eşleştirme Havuzu
const KARAR_HAVUZU: Record<string, string> = {
  "Açılış ve yoklama.": "Eğitim öğretim yılının hayırlı olması temennisiyle toplantı açıldı. Yapılan yoklamada zümre öğretmenlerinin hazır olduğu görüldü.",
  "Bir önceki zümre kararlarının incelenmesi.": "Bir önceki toplantıda alınan kararlar gözden geçirildi ve kararların büyük oranda uygulandığı tespit edildi.",
  "Müfredat programının incelenmesi.": "Talim Terbiye Kurulu Başkanlığı'nın yayınladığı güncel öğretim programı incelendi ve konuların bu programa göre işlenmesine karar verildi.",
  "Yıllık planların ve ders planlarının hazırlanması.": "Ünitelendirilmiş yıllık planların çalışma takvimine uygun olarak hazırlandığı, ders planlarının ise düzenli olarak yapılacağı belirtildi.",
  "Ölçme ve değerlendirme kriterlerinin belirlenmesi.": "Her dönem 2 yazılı sınav yapılmasına, sınavların yönetmelik doğrultusunda ortak ve açık uçlu sorulardan oluşmasına karar verildi.",
  "Ölçme ve değerlendirme çalışmalarının gözden geçirilmesi.": "Sınav analizlerinin yapılarak kazanım eksiklerinin tespit edilmesine karar verildi.",
  "Proje ödevlerinin konularının ve değerlendirme ölçeklerinin belirlenmesi.": "Proje konularının öğrencilerin ilgi ve yeteneklerine göre Kasım ayı sonuna kadar dağıtılmasına, değerlendirme ölçeklerinin öğrencilere duyurulmasına karar verildi.",
  "Öğrenci başarısını artırıcı önlemler.": "Başarısı düşük öğrenciler için destekleme kurslarına yönlendirme yapılmasına, veli işbirliğine gidilmesine ve koçluk sisteminin uygulanmasına karar verildi.",
  "Başarısız öğrencilere yönelik tedbirlerin görüşülmesi.": "Devamsızlık yapan veya başarısı düşük öğrencilerle birebir görüşmeler yapılmasına ve rehberlik servisine yönlendirilmesine karar verildi.",
  "1. Dönem başarı durumunun değerlendirilmesi.": "1. Dönem not ortalamaları incelendi, genel başarının iyi olduğu ancak bazı öğrencilerin desteklenmesi gerektiği görüldü.",
  "Yıl sonu başarı durumunun ve müfredatın tamamlanma durumunun görüşülmesi.": "Müfredatın yıllık plana uygun olarak tamamlandığı, kazanımların verildiği tespit edildi.",
  "İş sağlığı ve güvenliği tedbirleri.": "Dersliklerde ve laboratuvarlarda gerekli iş sağlığı ve güvenliği tedbirlerinin alındığı, öğrencilerin bilgilendirildiği belirtildi.",
  "Dilek ve temenniler.": "Başarılı, sağlıklı ve verimli bir eğitim-öğretim süreci geçirilmesi dileğiyle toplantının sonlandırılmasına karar verildi.",
  "Kapanış.": "Toplantı tutanağı imza altına alındı."
};


// --- MAIN APPLICATION ---
export default function ZumreTab() {
  const { appUser, db } = useAuth();
  const { db: localDb, setDb, loading } = useDatabase();
  const { zumreDocuments: savedDocs } = localDb;
  
  // Form State
  const [formData, setFormData] = useState({
    academicYear: '2025-2026',
    donem: '1. Dönem Başı (Eylül)',
    schoolType: 'Anadolu Lisesi',
    ders: 'Matematik',
    tarih: new Date().toISOString().split('T')[0],
    saat: '15:30',
    yer: 'Öğretmenler Odası',
    baskan: '',
    mudurYardimcisi: '',
    okulMuduru: '',
    katilimcilar: '', 
    imzalar: [] as any[], 
    gundemMaddeleri: GUNDEM_MADDELERI_DEFAULT.map(m => ({ madde: m })),
    gorusmeler: GUNDEM_MADDELERI_DEFAULT.map(() => ({ detay: '' })),
    kararlar: ''
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isListening, setIsListening] = useState<number | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number | null>(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  
  // Handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateName: string) => {
    const newGundem = SABLONLAR[templateName] || [];
    setFormData(prev => ({
        ...prev,
        gundemMaddeleri: newGundem.map(m => ({ madde: m })),
        gorusmeler: newGundem.map(() => ({ detay: '' })),
        kararlar: ''
    }));
  };

  const handleGundemChange = (index: number, value: string) => {
    const newGundem = [...formData.gundemMaddeleri];
    newGundem[index].madde = value;
    setFormData(prev => ({ ...prev, gundemMaddeleri: newGundem }));
  };

  const handleGorusmeChange = (index: number, value: string) => {
    const newGorusme = [...formData.gorusmeler];
    newGorusme[index].detay = value;
    setFormData(prev => ({ ...prev, gorusmeler: newGorusme }));
  };

  const addGundem = () => {
    setFormData(prev => ({
      ...prev,
      gundemMaddeleri: [...prev.gundemMaddeleri, { madde: '' }],
      gorusmeler: [...prev.gorusmeler, { detay: '' }]
    }));
    setExpandedIndex(formData.gundemMaddeleri.length);
  };

  const removeGundem = (index: number) => {
    const newGundem = formData.gundemMaddeleri.filter((_, i) => i !== index);
    const newGorusme = formData.gorusmeler.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      gundemMaddeleri: newGundem,
      gorusmeler: newGorusme
    }));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const fetchPreviousDecisions = async (index: number) => {
    if (!savedDocs || savedDocs.length === 0) {
        alert("Arşivde kayıtlı geçmiş bir toplantı bulunamadı.");
        return;
    }
    
    const confirmFetch = confirm("Arşivdeki en son toplantının kararlarını bu maddeye aktarmak istiyor musunuz?");
    if (!confirmFetch) return;

    try {
        const lastDoc = savedDocs[0]; // Assuming savedDocs is sorted by date descending
        const lastDecisions = lastDoc.data.kararlar || "";
        
        let formattedText = "Bir önceki toplantı arşivde bulunamadı veya karar girilmemiş.";
        
        if (lastDecisions) {
            const decisionsList = lastDecisions.split('\n')
                .filter((d: string) => d.trim().length > 5)
                .map((d: string) => d.replace(/^\d+[\.\)\-]\s*/, '').trim());
            
            if (decisionsList.length > 0) {
                 const summary = decisionsList.slice(0, 3).join('; ') + (decisionsList.length > 3 ? '...' : '');
                 formattedText = `Bir önceki toplantıda alınan "${summary}" kararları gözden geçirilmiş; alınan kararların büyük oranda uygulandığı, eksik kalan hususların ise telafi edildiği görülmüştür.`;
            }
        }
        
        handleGorusmeChange(index, formattedText);
    } catch (error) {
        console.error("Hata:", error);
        alert("Geçmiş kararlar getirilirken bir hata oluştu.");
    }
  };


  const enhanceText = (index: number) => {
      const currentText = formData.gorusmeler[index].detay.toLowerCase();
      let newText = currentText;
      let matched = false;

      for (const [key, value] of Object.entries(AI_SUGGESTIONS)) {
          if (currentText.includes(key)) {
              newText = value;
              matched = true;
              break;
          }
      }

      if (!matched && currentText.trim().length > 0) {
          newText = `${formData.gorusmeler[index].detay} hususu detaylıca görüşülmüş olup, ilgili tedbirlerin titizlikle uygulanmasına karar verilmiştir.`;
      } else if (!matched) {
          newText = AI_SUGGESTIONS["default"];
      }

      handleGorusmeChange(index, newText);
  };

  const saveToArchive = () => {
    const docName = `${formData.academicYear} ${formData.ders} - ${formData.donem}`;
    const currentSignatures: any[] = [];
    if (formData.baskan) currentSignatures.push({ ad: formData.baskan, unvan: "Zümre Başkanı" });
    if (formData.katilimcilar) formData.katilimcilar.split(',').forEach(t => t.trim() !== formData.baskan && t.trim() !== "" && currentSignatures.push({ ad: t.trim(), unvan: "Öğretmen" }));
    if (formData.mudurYardimcisi) currentSignatures.push({ ad: formData.mudurYardimcisi, unvan: "Müdür Yardımcısı" });
    if (formData.okulMuduru) currentSignatures.push({ ad: formData.okulMuduru, unvan: "Okul Müdürü" });

    const dataToSave = { ...formData, imzalar: currentSignatures };
    const newDoc = { id: `zumre_${Date.now()}`, name: docName, date: new Date().toISOString(), data: dataToSave };

    setDb((prevDb: any) => ({
      ...prevDb,
      zumreDocuments: [...(prevDb.zumreDocuments || []), newDoc]
    }));
    alert('Tutanak başarıyla arşivlendi!');
  };

  const loadFromArchive = (docData: any) => {
    setFormData(docData.data);
    setIsArchiveOpen(false);
  };

  const deleteFromArchive = (docId: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    setDb((prevDb: any) => ({
        ...prevDb,
        zumreDocuments: prevDb.zumreDocuments.filter((d: any) => d.id !== docId)
    }));
  };

  const generateDocContent = () => {
      const signatures: any[] = [];
      if(formData.baskan) signatures.push({ad: formData.baskan, unvan: "Zümre Başkanı"});
      if(formData.katilimcilar) formData.katilimcilar.split(',').forEach(t => {
          const name = t.trim();
          if(name && name !== formData.baskan) signatures.push({ad: name, unvan: "Öğretmen"});
      });
      if(formData.mudurYardimcisi) signatures.push({ad: formData.mudurYardimcisi, unvan: "Müdür Yardımcısı"});
      if(formData.okulMuduru) signatures.push({ad: formData.okulMuduru, unvan: "Okul Müdürü"});

      let signatureHtml = '<table style="width:100%; border:none; margin-top:50px; page-break-inside: avoid;"><tr>';
      signatures.forEach((sig, index) => {
          if (index > 0 && index % 3 === 0) signatureHtml += '</tr><tr>';
          signatureHtml += `
              <td style="width:33%; text-align:center; padding:20px 5px; vertical-align:top;">
                  <strong>${sig.ad}</strong><br/>
                  ${sig.unvan}<br/><br/><br/>
                  (İmza)
              </td>
          `;
      });
      signatureHtml += '</tr></table>';

      return `
        <h3 style="text-align:center">T.C.<br/>MİLLİ EĞİTİM BAKANLIĞI<br/>... OKULU MÜDÜRLÜĞÜ</h3>
        <br/>
        <h2 style="text-align:center">${formData.academicYear} EĞİTİM-ÖĞRETİM YILI<br/>${formData.ders.toUpperCase()} DERSİ ${formData.donem.toUpperCase()}<br/>ZÜMRE ÖĞRETMENLER KURULU TOPLANTI TUTANAĞIDIR</h2>
        <br/>
        
        <table class="header-table" style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold; width: 30%;">Dersin Adı</td><td style="border: 1px solid #000; padding: 5px;">${formData.ders}</td></tr>
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold;">Toplantı Tarihi ve Saati</td><td style="border: 1px solid #000; padding: 5px;">${formData.tarih} / ${formData.saat}</td></tr>
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold;">Toplantı Yeri</td><td style="border: 1px solid #000; padding: 5px;">${formData.yer}</td></tr>
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold;">Toplantı No</td><td style="border: 1px solid #000; padding: 5px;">1</td></tr>
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold;">Zümre Başkanı</td><td style="border: 1px solid #000; padding: 5px;">${formData.baskan}</td></tr>
            <tr><td style="border: 1px solid #000; padding: 5px; font-weight:bold;">Katılımcılar</td><td style="border: 1px solid #000; padding: 5px;">${formData.katilimcilar}</td></tr>
        </table>

        <div style="font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px;">GÜNDEM MADDELERİ:</div>
        <ol>
            ${formData.gundemMaddeleri.map(g => `<li>${g.madde}</li>`).join('')}
        </ol>

        <div style="font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px;">GÜNDEM MADDELERİNİN GÖRÜŞÜLMESİ:</div>
        ${formData.gundemMaddeleri.map((g, i) => `
            <p><strong>${i+1}. MADDENİN GÖRÜŞÜLMESİ:</strong></p>
            <p style="text-align: justify;">${formData.gorusmeler[i]?.detay || 'Bu madde üzerinde karşılıklı görüş alışverişinde bulunuldu.'}</p>
        `).join('')}

        <div style="font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px;">ALINAN KARARLAR:</div>
        ${formData.kararlar.split('\n').map(k => `<p>${k}</p>`).join('')}

        <br/><br/>
        ${signatureHtml}
        
        <br/><br/>
        <div style="text-align:center;">
            UYGUNDUR<br/>
            .../.../....<br/>
            <br/><br/>
            ${formData.okulMuduru}<br/>
            Okul Müdürü
        </div>
      `;
  };

  const handleWordExport = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Zümre Tutanağı</title>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; }
        </style>
      </head>
      <body>
        ${generateDocContent()}
      </body></html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Zumre_Tutanagi_${formData.ders}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
      const printContent = generateDocContent();
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
          printWindow.document.write(`
            <html>
                <head>
                    <title>Yazdır - Zümre Tutanağı</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; padding: 40px; }
                        @media print { 
                            body { padding: 0; } 
                            button { display: none; }
                        }
                        .print-btn {
                            position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: sans-serif;
                        }
                    </style>
                </head>
                <body>
                    <button class="print-btn" onclick="window.print()">Yazdır</button>
                    ${printContent}
                </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const toggleListening = (index: number) => {
    if (isListening === index) {
      setIsListening(null);
      return;
    }
    
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
      alert("Tarayıcınız sesle yazmayı desteklemiyor.");
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(index);
    recognition.onend = () => setIsListening(null);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const current = formData.gorusmeler[index].detay;
      handleGorusmeChange(index, current ? current + " " + transcript : transcript);
    };
    
    recognition.start();
  };

  const fillAutoDecisions = () => {
      const uretilenKararlar = formData.gundemMaddeleri.map((gundem, index) => {
          let kararMetni = KARAR_HAVUZU[gundem.madde];
          if (!kararMetni) {
              kararMetni = `"${gundem.madde}" maddesi görüşüldü, gerekli planlamaların ve çalışmaların yapılmasına karar verildi.`;
          }
          return `${index + 1}. ${kararMetni}`;
      });
      setFormData(prev => ({...prev, kararlar: uretilenKararlar.join('\n')}));
  };

  const openScenarioModal = (index: number) => {
      setActiveScenarioIndex(index);
      setIsScenarioModalOpen(true);
  };

  const useScenario = (text: string) => {
      if (activeScenarioIndex !== null) {
          handleGorusmeChange(activeScenarioIndex, text);
          setIsScenarioModalOpen(false);
      }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-4 md:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
                <Users2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Zümre Toplantı Tutanağı</h1>
              <p className="text-xs text-slate-500 font-medium">Akıllı Doküman Oluşturucu</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
             <Button variant="outline" size="sm" onClick={() => setIsArchiveOpen(true)}>
               <FolderOpen className="mr-2 h-4 w-4" /> Arşiv ({savedDocs?.length || 0})
             </Button>
             <Button variant="secondary" size="sm" onClick={saveToArchive}>
               <Save className="mr-2 h-4 w-4" /> Kaydet
             </Button>
             <Button variant="secondary" size="sm" onClick={() => setIsPreviewOpen(true)}>
               <Printer className="mr-2 h-4 w-4" /> Önizle & Yazdır
             </Button>
             <Button size="sm" onClick={handleWordExport}>
               <FileDown className="mr-2 h-4 w-4" /> İndir (Word)
             </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* TOPLANTI BİLGİLERİ KARTI */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-slate-800">Toplantı Künyesi</h2>
                </div>
                {/* Şablon Seçimi */}
                <div className="flex gap-2">
                    {Object.keys(SABLONLAR).map(sablon => (
                        <button 
                            key={sablon}
                            onClick={() => handleTemplateChange(sablon)}
                            className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                        >
                            {sablon}
                        </button>
                    ))}
                </div>
            </div>
            
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label>Eğitim Yılı</Label>
                        <Input value={formData.academicYear} onChange={(e: any) => handleInputChange('academicYear', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Dönem</Label>
                        <div className="relative">
                            <select 
                                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                value={formData.donem}
                                onChange={(e) => handleInputChange('donem', e.target.value)}
                            >
                                <option>1. Dönem Başı (Eylül)</option>
                                <option>1. Dönem Ara (Kasım)</option>
                                <option>2. Dönem Başı (Şubat)</option>
                                <option>2. Dönem Ara (Nisan)</option>
                                <option>Yıl Sonu (Haziran)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Ders</Label>
                        <Input value={formData.ders} onChange={(e: any) => handleInputChange('ders', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tarih</Label>
                        <Input type="date" value={formData.tarih} onChange={(e: any) => handleInputChange('tarih', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Saat</Label>
                        <Input type="time" value={formData.saat} onChange={(e: any) => handleInputChange('saat', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Yer</Label>
                        <Input value={formData.yer} onChange={(e: any) => handleInputChange('yer', e.target.value)} />
                    </div>
                    
                    {/* YENİ: İMZA ALANLARI */}
                    <div className="col-span-full border-t border-slate-100 my-2"></div>
                    
                    <div className="space-y-2">
                        <Label>Zümre Başkanı</Label>
                        <Input value={formData.baskan} onChange={(e: any) => handleInputChange('baskan', e.target.value)} placeholder="Ad Soyad" />
                    </div>
                    <div className="space-y-2 md:col-span-3 lg:col-span-3">
                        <Label>Diğer Öğretmenler (Katılımcılar)</Label>
                        <Input value={formData.katilimcilar} onChange={(e: any) => handleInputChange('katilimcilar', e.target.value)} placeholder="Ahmet Yılmaz, Ayşe Demir..." />
                        <p className="text-xs text-slate-400">İsimleri virgülle ayırınız. İmza sirküleri bu alana göre oluşturulacaktır.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Müdür Yardımcısı</Label>
                        <Input value={formData.mudurYardimcisi} onChange={(e: any) => handleInputChange('mudurYardimcisi', e.target.value)} placeholder="(Varsa) Ad Soyad" />
                    </div>
                    <div className="space-y-2">
                        <Label>Okul Müdürü</Label>
                        <Input value={formData.okulMuduru} onChange={(e: any) => handleInputChange('okulMuduru', e.target.value)} placeholder="Ad Soyad" />
                    </div>
                </div>
            </Card>
        </section>

        {/* GÜNDEM VE GÖRÜŞMELER */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-slate-800">Gündem ve Görüşmeler</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={addGundem} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <PlusCircle className="mr-2 h-4 w-4" /> Yeni Madde
                </Button>
            </div>

            <div className="space-y-4">
                {formData.gundemMaddeleri.map((item, index) => (
                    <div 
                        key={index} 
                        className={`transition-all duration-300 border rounded-xl overflow-hidden ${expandedIndex === index ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                    >
                        {/* Header Row */}
                        <div 
                            className="flex items-center p-3 cursor-pointer select-none"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm mr-3 shrink-0">
                                {index + 1}
                            </div>
                            <div className="flex-1 font-medium text-slate-800 truncate pr-4">
                                {item.madde || <span className="text-slate-400 italic">Madde içeriği giriniz...</span>}
                            </div>
                            
                            <div className="flex items-center gap-1 text-slate-400">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={(e: any) => {e.stopPropagation(); removeGundem(index);}}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                {expandedIndex === index ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedIndex === index && (
                            <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                                <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Gündem Maddesi</Label>
                                        <Input 
                                            value={item.madde} 
                                            onChange={(e: any) => handleGundemChange(index, e.target.value)}
                                            className="font-medium"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Görüşme Detayları & Alınan Karar</Label>
                                            <div className="flex gap-2">
                                                {(item.madde.toLowerCase().includes('önceki') || item.madde.toLowerCase().includes('eski')) && (
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="h-7 text-xs bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                                                        onClick={() => fetchPreviousDecisions(index)}
                                                        title="Arşivden bir önceki toplantının kararlarını otomatik getir"
                                                    >
                                                        <FileClock className="mr-1 h-3 w-3" /> Önceki Kararları Getir
                                                    </Button>
                                                )}

                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-7 text-xs bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                                                    onClick={() => enhanceText(index)}
                                                    title="Yazılan kısa notu resmi dile çevir"
                                                >
                                                    <Wand2 className="mr-1 h-3 w-3" /> Resmi Dile Çevir
                                                </Button>

                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-7 text-xs bg-white"
                                                    onClick={() => openScenarioModal(index)}
                                                >
                                                    <Zap className="mr-1 h-3 w-3 text-amber-500" /> Hazır Senaryo
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className={`h-7 text-xs ${isListening === index ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-600 bg-white border border-slate-200'}`}
                                                    onClick={() => toggleListening(index)}
                                                >
                                                    {isListening === index ? <MicOff className="mr-1 h-3 w-3" /> : <Mic className="mr-1 h-3 w-3" />}
                                                    {isListening === index ? 'Dinleniyor...' : 'Sesle Yaz'}
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea 
                                            value={formData.gorusmeler[index].detay}
                                            onChange={(e: any) => handleGorusmeChange(index, e.target.value)}
                                            className="min-h-[120px] shadow-inner bg-white"
                                            placeholder="Bu maddede görüşülen konuları kısaca yazın (örn: 'sınavlar zor olsun'), ardından 'Resmi Dile Çevir' butonuna basın..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>

        {/* KARARLAR */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-slate-800">Genel Kararlar</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={fillAutoDecisions}>
                    <ListChecks className="mr-2 h-4 w-4 text-emerald-600" /> Kararları Otomatik Oluştur
                </Button>
            </div>
            
            <Card className="p-0 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-3 text-xs text-slate-500 px-4">
                    Yukarıdaki butona basarak gündem maddelerine uygun kararları otomatik oluşturabilir veya manuel düzenleyebilirsiniz.
                </div>
                <Textarea 
                    value={formData.kararlar}
                    onChange={(e: any) => handleInputChange('kararlar', e.target.value)}
                    className="min-h-[200px] border-0 rounded-none focus:ring-0 resize-y p-4 text-base leading-relaxed"
                    placeholder="- Kararlar buraya gelecek..."
                />
            </Card>
        </section>

      </main>

      {/* --- MODALS --- */}
      
      {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                       <h3 className="text-lg font-bold text-slate-800 flex items-center">
                           <Printer className="mr-2 h-5 w-5 text-indigo-600" /> Yazdırma Önizleme
                       </h3>
                       <div className="flex gap-2">
                           <Button onClick={handlePrint}>Yazdır</Button>
                           <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="h-5 w-5" /></button>
                       </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                      <div 
                        className="bg-white shadow-lg mx-auto p-[2cm] max-w-[21cm] min-h-[29.7cm] text-sm"
                        dangerouslySetInnerHTML={{ __html: generateDocContent() }}
                        style={{ fontFamily: "'Times New Roman', serif" }}
                      />
                  </div>
              </div>
          </div>
      )}

      {isArchiveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <History className="text-indigo-600" /> Kayıtlı Tutanaklar
                      </h3>
                      <button onClick={() => setIsArchiveOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="h-5 w-5" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                      {(savedDocs || []).length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                              <Archive className="h-16 w-16 mx-auto mb-4 opacity-20" />
                              <p>Henüz kaydedilmiş bir evrak bulunmuyor.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {savedDocs.map((doc: any) => (
                                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group relative" onClick={() => loadFromArchive(doc)}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FileText className="h-5 w-5" /></div>
                                          <button onClick={(e) => {e.stopPropagation(); deleteFromArchive(doc.id);}} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                                      </div>
                                      <h4 className="font-semibold text-slate-800 mb-1 truncate pr-6">{doc.name}</h4>
                                      <p className="text-xs text-slate-500">{doc.createdAt ? new Date(doc.createdAt?.seconds * 1000).toLocaleDateString('tr-TR') : 'Tarih yok'}</p>
                                      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                                          <span className="text-xs font-medium text-indigo-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              Düzenlemek için tıkla <ChevronRight className="h-3 w-3 ml-1" />
                                          </span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isScenarioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                       <h3 className="text-lg font-bold text-slate-800">Hazır Senaryo Seç</h3>
                       <p className="text-sm text-slate-500 mt-1">
                          "{activeScenarioIndex !== null && formData.gundemMaddeleri[activeScenarioIndex]?.madde}"
                       </p>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                      {activeScenarioIndex !== null && (SENARYOLAR[formData.gundemMaddeleri[activeScenarioIndex].madde] || []).length > 0 ? (
                          (SENARYOLAR[formData.gundemMaddeleri[activeScenarioIndex].madde]).map((text, idx) => (
                              <div key={idx} className="p-4 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors" onClick={() => useScenario(text)}>
                                  <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-8 text-slate-500">
                              <p>Bu madde için henüz hazır senaryo bulunmamaktadır.</p>
                              <p className="text-xs mt-2">Kendi cümlenizi yazabilir veya sesle dikte edebilirsiniz.</p>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end">
                      <Button variant="ghost" onClick={() => setIsScenarioModalOpen(false)}>İptal</Button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
