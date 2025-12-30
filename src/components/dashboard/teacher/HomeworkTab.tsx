'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, collection, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Atom, FileText, Video, Mic, Paperclip, CheckCircle, GraduationCap, Filter, Send, ClipboardList, X, Plus, Trash2, Save, Edit, Pencil, CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// --- ÖĞRETMENİN MEVCUT ÖDEV YÖNETİMİ BİLEŞENİ ---

function HomeworkManager({ classId, teacherProfile }: { classId: string, teacherProfile: TeacherProfile | null }) {
  const [homeworkText, setHomeworkText] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const { db } = useAuth();
  
  const homeworksQuery = useMemo(() => (db ? query(collection(db, 'classes', classId, 'homeworks')) : null), [db, classId]);
  const { data: homeworks, loading } = useFirestore<Homework>(`homeworks-for-class-${classId}`, homeworksQuery);

  const handleAddHomework = async () => {
    if (!db) return;
    if (!homeworkText.trim()) {
      toast({ variant: 'destructive', title: 'Ödev metni boş olamaz.' });
      return;
    }
    if (!classId) return;

    const newHomework: Omit<Homework, 'id'> = {
      classId: classId,
      text: homeworkText,
      assignedDate: new Date().toISOString(),
      dueDate: dueDate?.toISOString(),
      seenBy: [],
      teacherName: teacherProfile?.name,
      lessonName: teacherProfile?.branch,
    };

    try {
      const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
      await addDoc(homeworksColRef, newHomework);
      setHomeworkText('');
      setDueDate(undefined);
      toast({ title: 'Ödev gönderildi!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Ödev gönderilemedi.' });
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!db || !classId) return;
    try {
      const homeworkRef = doc(db, 'classes', classId, 'homeworks', homeworkId);
      await deleteDoc(homeworkRef);
      toast({ title: 'Ödev silindi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Ödev silinemedi.' });
    }
  };

  const handleExport = () => {
    toast({title: 'Raporlama güncelleniyor...', description: 'Bu özellik yeni veri yapısına göre güncellenecektir.'})
  };
  
  return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Yeni Ödev Gönder
            </CardTitle>
            <CardDescription>Bu sınıftaki tüm öğrencilere gönderilecek bir ödev oluşturun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={homeworkText}
              onChange={(e) => setHomeworkText(e.target.value)}
              placeholder="Ödev açıklamasını buraya yazın..."
              rows={5}
            />
            <div className="flex flex-col sm:flex-row gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP", { locale: tr }) : <span>Teslim tarihi seçin</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleAddHomework} className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4"/>
                    Gönder
                </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline">Geçmiş Ödevler</CardTitle>
                    <CardDescription>Bu sınıfa daha önce gönderilmiş ödevler.</CardDescription>
                </div>
                 <Button variant="outline" onClick={handleExport} disabled={!homeworks || homeworks.length === 0}>
                    <FileText className="mr-2 h-4 w-4"/>
                    Raporu Dışa Aktar
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {homeworks && homeworks.length > 0 ? (
                homeworks.map((hw) => (
                  <div key={hw.id} className="border p-4 rounded-lg bg-muted/50 flex justify-between items-start">
                    <div>
                      <p className="text-sm">{hw.text}</p>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                         <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Veriliş: {format(new Date(hw.assignedDate), 'd MMMM yyyy', { locale: tr })}</span>
                         </div>
                         {hw.dueDate && (
                            <div className="flex items-center gap-2 font-medium text-red-600">
                                <CalendarIcon className="h-3 w-3" />
                                <span>Teslim: {format(new Date(hw.dueDate), 'd MMMM yyyy', { locale: tr })}</span>
                            </div>
                         )}
                         {(hw.teacherName || hw.lessonName) && (
                            <div className="flex items-center gap-2 font-medium text-slate-600">
                                <span className="font-semibold">{hw.teacherName || ''}</span>
                                {hw.teacherName && hw.lessonName && <span>-</span>}
                                <span>{hw.lessonName || ''}</span>
                            </div>
                         )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu ödevi silmek istediğinize emin misiniz? Öğrenci teslimatları da dahil tüm veriler silinecektir. Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteHomework(hw.id)} className="bg-destructive hover:bg-destructive/90">
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Henüz gönderilmiş bir ödev yok.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}


// --- KULLANICININ GÖNDERDİĞİ ŞABLON SİSTEMİ BİLEŞENLERİ ---

const initialRubricDefinitions = {
  research: {
    title: "Araştırma ve Yazma Rubriği",
    description: "Makale, Rapor, Hikaye, Deneme türü ödevler için standart değerlendirme.",
    items: [
      { label: "İçerik Doğruluğu ve Zenginliği", score: 40, desc: "Konu tam ve doğru anlatılmış mı? Bilgi eksikliği var mı?" },
      { label: "Dil ve Anlatım (İmla/Noktalama)", score: 20, desc: "Yazım kurallarına uyulmuş mu? Akıcı bir dil kullanılmış mı?" },
      { label: "Özgünlük ve Yorum", score: 20, desc: "Kopya içerik var mı? Öğrenci kendi yorumunu katmış mı?" },
      { label: "Düzen ve Kaynakça", score: 20, desc: "Sayfa düzeni temiz mi? Yararlanılan kaynaklar belirtilmiş mi?" }
    ]
  },
  multimedia: {
    title: "Multimedya ve Sunum Rubriği",
    description: "Video, Ses Kaydı, Animasyon türü ödevler için standart değerlendirme.",
    items: [
      { label: "İçerik ve Konuya Hakimiyet", score: 30, desc: "Videoda anlatılan bilgiler doğru ve konuyla ilgili mi?" },
      { label: "Yaratıcılık ve Kurgu", score: 30, desc: "Senaryo özgün mü? İlgi çekici bir kurgu var mı?" },
      { label: "İletişim ve Diksiyon", score: 20, desc: "Ses net anlaşılıyor mu? Akıcı bir anlatım var mı?" },
      { label: "Teknik Kalite (Görüntü/Ses)", score: 20, desc: "Görüntü net mi? Ses cızırtılı mı? Süreye uyulmuş mu?" }
    ]
  },
  visual: {
    title: "Görsel Tasarım Rubriği",
    description: "Poster, İnfografik, Dergi Kapağı türü ödevler için standart değerlendirme.",
    items: [
      { label: "Görsel Düzen ve Estetik", score: 30, desc: "Renk uyumu, yerleşim ve okunabilirlik iyi mi?" },
      { label: "Konuyu Görselleştirme", score: 30, desc: "Görseller konuyla alakalı mı? Mesajı doğru iletiyor mu?" },
      { label: "Yaratıcılık", score: 20, desc: "Sıradan görseller yerine özgün tasarımlar kullanılmış mı?" },
      { label: "Özen ve Emek", score: 20, desc: "Tasarım detaylarına dikkat edilmiş mi? Baştan savma mı?" }
    ]
  }
};

const getRubricType = (formats: string) => {
  if (formats.includes("Video") || formats.includes("MP4") || formats.includes("Ses") || formats.includes("MP3")) return 'multimedia';
  if (formats.includes("Canva") || formats.includes("JPG") || formats.includes("Poster") || formats.includes("Fotoğraf")) return 'visual';
  return 'research';
};

const assignmentsData = [
  // 9. Sınıf Edebiyat
  { id: 901, grade: 9, subject: "literature", title: "Sözün İnceliği: Şiir Tahlili", description: "Bir şiirin ahenk unsurlarını analiz etme.", instructions: "Temaya uygun bir şiir seç. Kafiye, redif ve söz sanatlarını gösteren renkli bir tablo hazırla.", formats: "PDF, Word", size: "5 MB" },
  { id: 902, grade: 9, subject: "literature", title: "Geçmişe Yolculuk: Dede Korkut Hikayesi", description: "Bir Dede Korkut hikayesini modern dile uyarlama.", instructions: "Seçtiğiniz bir Dede Korkut hikayesini günümüz Türkçesiyle yeniden yazın ve hikayeden bir sahneyi resmedin.", formats: "Word, JPG", size: "10 MB" },
  { id: 903, grade: 9, subject: "literature", title: "Sahnedeki Roman: Roman Uyarlaması", description: "Okunan bir romandan tiyatro sahnesi oluşturma.", instructions: "Okuduğunuz bir romandan en sevdiğiniz bölümü kısa bir tiyatro sahnesine dönüştürün. Diyalogları ve sahne direktiflerini yazın.", formats: "PDF", size: "2 MB" },

  // 9. Sınıf Fizik
  { id: 936, grade: 9, subject: "physics", title: "Mutfakta Isı Transferi", description: "FİZ.9.4.5. Isı aktarım yolları.", instructions: "Yemek yaparken tencerenin ısınması (iletim), suyun kaynaması (konveksiyon) ve fırının pişirmesi (ışıma) olaylarını mutfaktan fotoğraflarla anlat.", formats: "Görsel Sunum", size: "15 MB" },
  { id: 937, grade: 9, subject: "physics", title: "Evdeki Vektörler", description: "Fiziksel niceliklerin sınıflandırılması.", instructions: "Evinizde bulduğunuz 5 skaler ve 5 vektörel büyüklüğü fotoğraflayarak açıklayın. (Örn: Kapının koluna uygulanan kuvvet - vektörel).", formats: "Canva, PDF", size: "20 MB" },
  { id: 938, grade: 9, subject: "physics", title: "Enerji Dönüşüm Dedektifi", description: "Enerjinin korunumu ve enerji dönüşümleri.", instructions: "Bir oyuncak arabanın pille çalışmasından hareket etmesine kadar olan enerji dönüşüm zincirini (kimyasal -> elektrik -> kinetik) bir infografik ile anlatın.", formats: "Poster, JPG", size: "8 MB" },

  // 10. Sınıf Edebiyat
  { id: 1001, grade: 10, subject: "literature", title: "Divan'dan Sesleniş: Gazel Şerhi", description: "Seçilen bir gazelin günümüz diliyle yorumlanması.", instructions: "Fuzuli, Baki veya Nedim'den bir gazel seçerek beyit beyit günümüz Türkçesine çevirin ve ana temasını açıklayan bir kompozisyon yazın.", formats: "Word", size: "3 MB" },
  { id: 1002, grade: 10, subject: "literature", title: "Halkın Sesi: Mani Derlemesi", description: "Çevreden veya aile büyüklerinden mani derleme.", instructions: "Çevrenizden en az 10 farklı mani derleyerek bir video kaydı oluşturun. Manilerin temalarını (aşk, hasret, gurbet vb.) sınıflandırın.", formats: "Video, MP4", size: "50 MB" },

  // 10. Sınıf Fizik
  { id: 1036, grade: 10, subject: "physics", title: "Basıncın Gücü", description: "Katı, sıvı ve gaz basıncı deneyleri.", instructions: "Evde basit malzemelerle (şişe, su, balon) Pascal prensibini veya açık hava basıncının etkisini gösteren kısa bir deney videosu çekin.", formats: "Video Sunum", size: "40 MB" },
  { id: 1037, grade: 10, subject: "physics", title: "Optik Yanılsamalar", description: "Gölge, yansıma ve kırılma olayları.", instructions: "Kaşığın sudan kırık görünmesi veya gölge boyunun değişimi gibi optik yanılsamaları fotoğraflayıp nedenlerini kısaca açıklayan bir sunum hazırlayın.", formats: "Görsel Sunum", size: "15 MB" },

  // 11. Sınıf Edebiyat
  { id: 1101, grade: 11, subject: "literature", title: "Tanzimat'tan Portreler", description: "Tanzimat dönemi bir yazarını tanıtma.", instructions: "Namık Kemal, Şinasi veya Ziya Paşa gibi bir Tanzimat yazarının hayatını, eserlerini ve fikirlerini anlatan bir podcast bölümü hazırlayın.", formats: "Ses Kaydı, MP3", size: "20 MB" },
  { id: 1102, grade: 11, subject: "literature", title: "Modern Roman İncelemesi", description: "Servetifünun veya Milli Edebiyat döneminden bir romanı inceleme.", instructions: "Halit Ziya'nın 'Aşk-ı Memnu' veya Yakup Kadri'nin 'Yaban' romanının ana karakterlerini, çatışmalarını ve dönemin zihniyetini yansıtan yönlerini analiz eden bir makale yazın.", formats: "PDF, Word", size: "5 MB" },

  // 11. Sınıf Fizik
  { id: 1136, grade: 11, subject: "physics", title: "Vektörel Kuvvet Dengesi", description: "Bir cisme etki eden kuvvetlerin dengesi.", instructions: "Bir avize veya saksının asılı durduğu durumu analiz edin. İplerdeki gerilme kuvvetlerini vektörlerle göstererek serbest cisim diyagramını çizin ve açıklayın.", formats: "JPG, PDF", size: "5 MB" },
  { id: 1137, grade: 11, subject: "physics", title: "Alternatif Akımın İzinde", description: "Doğru akım ve alternatif akımın karşılaştırılması.", instructions: "Evimizdeki prizlerin neden alternatif akım kullandığını, pillerin ise neden doğru akım kaynağı olduğunu araştırıp avantaj ve dezavantajlarını listeleyen bir sunum hazırlayın.", formats: "Görsel Sunum", size: "10 MB" },

  // 12. Sınıf Edebiyat
  { id: 1201, grade: 12, subject: "literature", title: "Cumhuriyet Şiirinde Bir Ses", description: "Bir Cumhuriyet dönemi şairini ve şiir anlayışını tanıtma.", instructions: "Necip Fazıl, Nazım Hikmet, Orhan Veli veya Cemal Süreya gibi bir şairin şiir anlayışını ve en az iki şiirini yorumlayan bir video analiz hazırlayın.", formats: "Video Sunum", size: "60 MB" },
  { id: 1202, grade: 12, subject: "literature", title: "Postmodern Anlatı", description: "Postmodern bir romanda kullanılan anlatım teknikleri.", instructions: "Orhan Pamuk'un 'Benim Adım Kırmızı' veya 'Kara Kitap' romanındaki üstkurmaca, metinlerarasılık gibi postmodern teknikleri bularak örneklerle açıklayan bir inceleme yazısı yazın.", formats: "Word", size: "4 MB" },

  // 12. Sınıf Fizik
  { id: 1240, grade: 12, subject: "physics", title: "GPS ve Zaman Kayması", description: "Özel görelilik.", instructions: "Uydulardaki saatlerin dünyadaki saatlerden neden farklı çalıştığını ve Einstein'ın teorisinin GPS doğruluğu için önemini anlatan bir video hazırlayın.", formats: "Video Sunum", size: "25 MB" },
  { id: 1241, grade: 12, subject: "physics", title: "Büyük Patlama'nın Kanıtları", description: "Evrenin oluşumu ve genişlemesi.", instructions: "Hubble Yasası (kırmızıya kayma) ve Kozmik Mikrodalga Arka Plan Işıması'nın Büyük Patlama teorisini nasıl desteklediğini anlatan bir infografik tasarlayın.", formats: "Poster, JPG", size: "10 MB" }
];


const FilterBar = ({ gradeFilter, subjectFilter, setGradeFilter, setSubjectFilter }: { gradeFilter: string, subjectFilter: string, setGradeFilter: (val: string) => void, setSubjectFilter: (val: string) => void }) => (
  <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-2 text-gray-700 font-medium min-w-fit">
      <Filter size={18} />
      Filtrele:
    </div>
    
    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
      <div className="relative">
        <select 
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="appearance-none w-full md:w-48 bg-gray-50 border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
        >
          <option value="all">Tüm Sınıflar</option>
          <option value="9">9. Sınıf</option>
          <option value="10">10. Sınıf</option>
          <option value="11">11. Sınıf</option>
          <option value="12">12. Sınıf</option>
        </select>
      </div>

      <div className="relative">
        <select 
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="appearance-none w-full md:w-48 bg-gray-50 border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
        >
          <option value="all">Tüm Dersler</option>
          <option value="physics">Fizik</option>
          <option value="literature">Edebiyat</option>
        </select>
      </div>
    </div>
  </div>
);

const AssignmentCard = ({ item, onAssign, onShowRubric, onEdit }: { item: any, onAssign: (item: any) => void, onShowRubric: (item: any) => void, onEdit: (item: any) => void }) => {
  const isPhysics = item.subject === 'physics';
  
  const getFormatIcon = () => {
    if (item.formats.includes('Video')) return <Video size={14} />;
    if (item.formats.includes('Ses')) return <Mic size={14} />;
    return <FileText size={14} />;
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isPhysics ? 'hover:border-cyan-400' : 'hover:border-rose-400'}`}>
      <div className={`h-1.5 w-full ${isPhysics ? 'bg-cyan-600' : 'bg-rose-600'}`}></div>

      <div className="p-5 flex-grow flex flex-col relative">
        <button 
          onClick={() => onEdit(item)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors z-10"
          title="Ödevi Düzenle"
        >
          <Pencil size={16} />
        </button>

        <div className="flex justify-between items-start mb-3 pr-8">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            isPhysics ? 'bg-cyan-50 text-cyan-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {isPhysics ? <Atom size={12} /> : <BookOpen size={12} />}
            {isPhysics ? 'Fizik' : 'Edebiyat'}
          </div>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
            {item.grade}. Sınıf
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors pr-6">
          {item.title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {item.description}
        </p>

        <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-md mb-4 text-xs text-gray-600 italic relative">
           <span className="font-semibold block not-italic mb-1 text-gray-700">Öğrenci Yönergesi:</span>
           "{item.instructions}"
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5" title="Kabul Edilen Formatlar">
            {getFormatIcon()}
            {item.formats}
          </div>
          <div className="flex items-center gap-1.5" title="Maksimum Dosya Boyutu">
            <Paperclip size={14} />
            Max: {item.size}
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 grid grid-cols-2 gap-3">
        <button
          onClick={() => onShowRubric(item)}
          className="py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-xs"
        >
          <ClipboardList size={14} />
          Kriterler
        </button>
        <button 
          onClick={() => onAssign(item)}
          className={`py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${
            isPhysics 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200' 
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
          } shadow-sm hover:shadow-md text-xs`}
        >
          <Send size={14} />
          Sınıfa Ata
        </button>
      </div>
    </div>
  );
};

const EditAssignmentModal = ({ isOpen, onClose, assignment, onSave }: { isOpen: boolean, onClose: () => void, assignment: any, onSave: (data: any) => void }) => {
  const [formData, setFormData] = useState({ title: '', description: '', instructions: '' });

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions
      });
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Edit size={18} className="text-blue-600" />
            Ödevi Düzenle
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Ödev Başlığı</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Kısa Açıklama</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">Kart üzerinde görünecek özet bilgi.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Yönergesi</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-gray-50 font-medium"
              rows={4}
              value={formData.instructions}
              onChange={e => setFormData({...formData, instructions: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">Öğrencinin ne yapması gerektiğini detaylıca anlatın.</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
          >
            <Save size={16} /> Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

const AddRubricModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([{ label: '', score: '', desc: '' }]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { label: '', score: '', desc: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totalScore = items.reduce((sum, item) => sum + (parseInt(item.score) || 0), 0);

  const handleSaveClick = () => {
    if (!title || !description) return alert("Lütfen başlık ve açıklama giriniz.");
    if (items.some(i => !i.label || !i.score)) return alert("Lütfen tüm kriter alanlarını doldurunuz.");
    
    onSave({ title, description, items });
    onClose();
    setTitle('');
    setDescription('');
    setItems([{ label: '', score: '', desc: '' }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Yeni Değerlendirme Kriteri Ekle</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kriter Başlığı</label>
            <input 
              type="text" 
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Örn: Proje Değerlendirme Ölçeği"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea 
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Bu kriter seti hangi tür ödevlerde kullanılacak?"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Değerlendirme Maddeleri</label>
              <div className={`text-sm font-bold ${totalScore === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                Toplam Puan: {totalScore} / 100
              </div>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-start bg-gray-50 p-3 rounded-lg">
                <div className="flex-grow space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Madde Adı (Örn: Sunum)" 
                      className="flex-grow border rounded p-1 text-sm"
                      value={item.label}
                      onChange={e => handleItemChange(index, 'label', e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Puan" 
                      className="w-16 border rounded p-1 text-sm text-center"
                      value={item.score}
                      onChange={e => handleItemChange(index, 'score', e.target.value)}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Açıklama (Örn: Ses tonu ve hakimiyet)" 
                    className="w-full border rounded p-1 text-xs text-gray-600"
                    value={item.desc}
                    onChange={e => handleItemChange(index, 'desc', e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded self-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button 
              onClick={handleAddItem}
              className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Yeni Madde Ekle
            </button>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">İptal</button>
          <button 
            onClick={handleSaveClick}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Save size={16} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

const RubricModal = ({ isOpen, onClose, assignment, rubrics, onAddRubricClick }: { isOpen: boolean, onClose: () => void, assignment: any, rubrics: any, onAddRubricClick: () => void }) => {
  const [selectedRubricKey, setSelectedRubricKey] = React.useState('');

  React.useEffect(() => {
    if (isOpen && assignment) {
      const defaultKey = getRubricType(assignment.formats);
      setSelectedRubricKey(defaultKey);
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const currentRubric = rubrics[selectedRubricKey] || rubrics['research'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Değerlendirme Kriterleri</h2>
            <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          <div className="mb-6 flex gap-2 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kullanılacak Kriter Seti</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedRubricKey}
                onChange={(e) => setSelectedRubricKey(e.target.value)}
              >
                <optgroup label="Standart Kriterler">
                  <option value="research">Araştırma ve Yazma Rubriği</option>
                  <option value="multimedia">Multimedya ve Sunum Rubriği</option>
                  <option value="visual">Görsel Tasarım Rubriği</option>
                </optgroup>
                <optgroup label="Özel Kriterler">
                  {Object.keys(rubrics).filter(k => k.startsWith('custom')).map(key => (
                    <option key={key} value={key}>{rubrics[key].title}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <button 
              onClick={() => { onClose(); onAddRubricClick(); }}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200" 
              title="Yeni Kriter Seti Ekle"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
             <span className="font-semibold">Açıklama:</span> {currentRubric.description}
          </div>

          <div className="space-y-4">
            {currentRubric.items.map((item: any, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <h4 className="font-bold text-gray-800">{item.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">{item.desc}</p>
                </div>
                <div className="flex items-center justify-center min-w-[80px]">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-blue-600">{item.score}</span>
                    <span className="text-xs text-gray-400 uppercase font-semibold">Puan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end items-center border-t border-gray-100 pt-4">
             <div className="text-right">
                <span className="text-sm text-gray-500 mr-2">Toplam Puan:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {currentRubric.items.reduce((acc: number, curr: any) => acc + (parseInt(curr.score) || 0), 0)}
                </span>
             </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, assignment }: { isOpen: boolean, onClose: () => void, assignment: any }) => {
  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ödev Atandı!</h2>
          
          <div className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{assignment.title}</h3>
            <p className="text-sm text-gray-500">{assignment.grade}. Sınıf • {assignment.subject === 'physics' ? 'Fizik' : 'Edebiyat'}</p>
          </div>
          
          <p className="text-gray-500 text-sm mb-6">
            Ödev başarıyla öğrencilerin paneline gönderildi. Öğrencilere bildirim iletildi.
          </p>

          <button 
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Ödev Şablonları Ana Bileşeni (Entegrasyon için) ---
const HomeworkTemplates = ({ classId, teacherProfile }: { classId: string, teacherProfile: TeacherProfile | null }) => {
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  
  const [assignments, setAssignments] = useState(assignmentsData);
  const [rubrics, setRubrics] = useState(initialRubricDefinitions);

  const { db } = useAuth();
  const { toast } = useToast();

  const handleAssign = useCallback(async (assignment: any) => {
    if (!db || !classId) {
      toast({ variant: 'destructive', title: 'Atama Hatası', description: 'Sınıf bilgisi bulunamadı.' });
      return;
    }
    
    const newHomework: Omit<Homework, 'id'> = {
      classId: classId,
      text: `${assignment.title}: ${assignment.instructions}`,
      assignedDate: new Date().toISOString(),
      seenBy: [],
      teacherName: teacherProfile?.name,
      lessonName: assignment.subject === 'physics' ? 'Fizik' : 'Edebiyat',
    };

    try {
      const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
      await addDoc(homeworksColRef, newHomework);
      setSelectedAssignment(assignment);
      setModalOpen(true);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Atama Sırasında Hata', description: 'Ödev sınıfa atanamadı.' });
    }
  }, [db, classId, teacherProfile, toast]);

  const filteredAssignments = useMemo(() => assignments.filter(item => {
    const gradeMatch = gradeFilter === 'all' || item.grade.toString() === gradeFilter;
    const subjectMatch = subjectFilter === 'all' || item.subject === subjectFilter;
    return gradeMatch && subjectMatch;
  }), [assignments, gradeFilter, subjectFilter]);

  const handleShowRubric = (assignment: any) => {
    setSelectedAssignment(assignment);
    setRubricModalOpen(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setEditAssignmentModalOpen(true);
  };

  const handleSaveEditedAssignment = (updatedFields: any) => {
    setAssignments(prev => prev.map(a => 
      a.id === selectedAssignment.id ? { ...a, ...updatedFields } : a
    ));
    toast({ title: "Ödev Güncellendi", description: "Şablondaki değişiklikler kaydedildi." });
  };

  const handleSaveNewRubric = (newRubric: any) => {
    const key = `custom_${Date.now()}`;
    setRubrics(prev => ({
      ...prev,
      [key]: newRubric
    }));
    toast({ title: "Yeni Kriter Seti Kaydedildi", description: "Oluşturduğunuz yeni kriter setini artık ödevlerinizde kullanabilirsiniz." });
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Performans Ödevleri (2025-2026 Maarif Modeli)</h2>
                <p className="text-gray-500">
                Yüklediğiniz yıllık planlardaki güncel tema ve kazanımlara uygun, araştırma odaklı performans ödevlerini filtreleyin ve özelleştirin.
                </p>
            </div>
            <Button onClick={() => setAddRubricModalOpen(true)}>
                <Plus size={16} />
                Yeni Kriter Seti
            </Button>
        </div>

      <FilterBar 
        gradeFilter={gradeFilter}
        subjectFilter={subjectFilter}
        setGradeFilter={setGradeFilter}
        setSubjectFilter={setSubjectFilter}
      />

      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map(item => (
            <AssignmentCard 
              key={item.id} 
              item={item} 
              onAssign={handleAssign}
              onShowRubric={handleShowRubric}
              onEdit={handleEditAssignment}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
          <p className="text-gray-500">Seçili filtrelere uygun ödev yok. Lütfen filtreleri değiştirin.</p>
        </div>
      )}

      <SuccessModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        assignment={selectedAssignment} 
      />

      <RubricModal 
        isOpen={rubricModalOpen}
        onClose={() => setRubricModalOpen(false)}
        assignment={selectedAssignment}
        rubrics={rubrics}
        onAddRubricClick={() => setAddRubricModalOpen(true)}
      />

      <AddRubricModal 
        isOpen={addRubricModalOpen}
        onClose={() => setAddRubricModalOpen(false)}
        onSave={handleSaveNewRubric}
      />

      <EditAssignmentModal 
        isOpen={editAssignmentModalOpen}
        onClose={() => setEditAssignmentModalOpen(false)}
        assignment={selectedAssignment}
        onSave={handleSaveEditedAssignment}
      />
    </div>
  );
};


// --- ANA BİRLEŞTİRİCİ BİLEŞEN ---
interface HomeworkTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
}

export function HomeworkTab({ classId, teacherProfile, students }: HomeworkTabProps) {
  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manage">Ödev Yönetimi</TabsTrigger>
        <TabsTrigger value="templates">Hazır Şablonlar</TabsTrigger>
      </TabsList>
      <TabsContent value="manage" className="mt-6">
        <HomeworkManager classId={classId} teacherProfile={teacherProfile} />
      </TabsContent>
      <TabsContent value="templates" className="mt-6">
        <HomeworkTemplates classId={classId} teacherProfile={teacherProfile} />
      </TabsContent>
    </Tabs>
  );
}
