import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Star, 
  Plus, 
  Trash2, 
  UserPlus, 
  Award, 
  BookOpen, 
  Heart, 
  Zap, 
  Smile,
  List,
  X,
  Settings,
  Crown,
  Target,
  Shuffle,
  Edit2, 
  Check,
  Volume2,
  VolumeX,
  Timer,
  Download,
  Play,
  Pause,
  RotateCcw,
  BarChart3, // Podyum ikonu
  UserX,     // Yoklama ikonu
  UserCheck  // Yoklama ikonu
} from 'lucide-react';

// --- Başlangıç Verileri ---

const INITIAL_BEHAVIORS = [
  { id: 1, label: 'Derse Katılım', points: 5, iconType: 'zap' },
  { id: 2, label: 'Ödev Tamamlama', points: 10, iconType: 'book' },
  { id: 3, label: 'Arkadaşına Yardım', points: 8, iconType: 'heart' },
  { id: 4, label: 'Örnek Davranış', points: 15, iconType: 'star' },
  { id: 5, label: 'Düzenli Defter', points: 5, iconType: 'smile' },
];

const INITIAL_BADGES = [
  { id: 'b1', name: 'Kitap Kurdu', icon: '📚', description: 'Okuma sevgisi yüksek!', cost: 50 },
  { id: 'b2', name: 'Matematik Dehası', icon: '🧮', description: 'Problem çözme ustası.', cost: 60 },
  { id: 'b3', name: 'Sorumluluk Lideri', icon: '👑', description: 'Görevlerini eksiksiz yapar.', cost: 80 },
  { id: 'b4', name: 'Yardım Meleği', icon: '😇', description: 'Herkese yardıma koşar.', cost: 40 },
  { id: 'b5', name: 'Temizlik Elçisi', icon: '♻️', description: 'Çevresini temiz tutar.', cost: 30 },
  { id: 'b6', name: 'Sanatçı Ruhu', icon: '🎨', description: 'Yaratıcılıkta sınır tanımaz.', cost: 45 },
  { id: 'b7', name: 'Sporcu', icon: '⚽', description: 'Enerjisi hiç bitmez!', cost: 45 },
  { id: 'b8', name: 'Genç Bilim İnsanı', icon: '🧬', description: 'Meraklı ve araştırmacı.', cost: 70 },
  { id: 'b9', name: 'Kodlama Ustası', icon: '💻', description: 'Geleceğin yazılımcısı.', cost: 75 },
  { id: 'b10', name: 'Müzik Dehası', icon: '🎵', description: 'Ritim duygusu harika.', cost: 45 },
];

// İkon Eşleştirme Yardımcısı
const getIcon = (type: any, size = 18) => {
  const icons: any = {
    zap: <Zap size={size} />,
    book: <BookOpen size={size} />,
    heart: <Heart size={size} />,
    star: <Star size={size} />,
    smile: <Smile size={size} />,
    default: <Star size={size} />
  };
  return icons[type] || icons.default;
};

// Basit Ses Motoru (Web Audio API)
const playAudio = (type: any) => {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'levelup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

export function SinifKahramanlariTab() {
  // State Tanımları
  const [students, setStudents] = useState<any[]>([]);
  const [behaviors, setBehaviors] = useState(INITIAL_BEHAVIORS);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<any>(null);
  
  // Sınıf Hedefi State
  const [classTarget, setClassTarget] = useState(500);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTargetValue, setNewTargetValue] = useState(500);

  // Ses State
  const [isMuted, setIsMuted] = useState(false);

  // Timer (Sayaç) State
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); 
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomBadgeOpen, setIsCustomBadgeOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false); // Podyum Modalı
  
  // Rastgele Seçici State
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [randomWinner, setRandomWinner] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const [notification, setNotification] = useState<string | null>(null);

  // Form State'leri
  const [newBehavior, setNewBehavior] = useState({ label: '', points: 5 });
  const [customBadge, setCustomBadge] = useState({ name: '', description: '', icon: '🏆' });
  const [editingBehaviorId, setEditingBehaviorId] = useState<any>(null);
  const [editForm, setEditForm] = useState({ label: '', points: 0 });

  // --- Veri Yükleme ve Kaydetme ---

  useEffect(() => {
    const savedData = localStorage.getItem('classHeroesData_v5');
    const savedBehaviors = localStorage.getItem('classHeroesBehaviors_v5');
    const savedTarget = localStorage.getItem('classHeroesTarget_v5');
    const savedMute = localStorage.getItem('classHeroesMute_v5');
    
    if (savedData) setStudents(JSON.parse(savedData));
    if (savedBehaviors) setBehaviors(JSON.parse(savedBehaviors));
    if (savedTarget) setClassTarget(parseInt(savedTarget));
    if (savedMute) setIsMuted(JSON.parse(savedMute));
  }, []);

  useEffect(() => {
    localStorage.setItem('classHeroesData_v5', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('classHeroesBehaviors_v5', JSON.stringify(behaviors));
  }, [behaviors]);

  useEffect(() => {
    localStorage.setItem('classHeroesTarget_v5', classTarget.toString());
  }, [classTarget]);

  useEffect(() => {
    localStorage.setItem('classHeroesMute_v5', JSON.stringify(isMuted));
  }, [isMuted]);

  // --- Zamanlayıcı (Timer) ---
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      if(!isMuted) playAudio('levelup'); 
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerSeconds, isMuted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Yardımcı Fonksiyonlar ---

  const triggerSound = (type: string) => {
    if (!isMuted) playAudio(type);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getProgress = (points: number) => {
    return (points % 50) / 50 * 100;
  };

  const totalClassPoints = students.reduce((acc, curr) => acc + curr.points, 0);
  const classProgress = Math.min((totalClassPoints / classTarget) * 100, 100);

  // --- Dışa Aktarma ---
  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Ad Soyad,Durum,Seviye,Puan,Rozet Sayisi\n"
      + students.map(s => `${s.id},${s.name},${s.isAbsent ? 'Yok' : 'Var'},${s.level},${s.points},${s.badges.length + (s.customBadges?.length || 0)}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sinif_kahramanlari_rapor.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Rapor indirildi!");
  };

  // --- Öğrenci İşlemleri ---

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent = {
      id: Date.now(),
      name: newStudentName,
      points: 0,
      level: 1,
      isAbsent: false, // Yeni özellik: Yoklama durumu
      badges: [],
      customBadges: [],
      history: []
    };

    setStudents([...students, newStudent]);
    setNewStudentName('');
    triggerSound('click');
    showNotification(`${newStudentName} sınıfa eklendi!`);
  };

  const handleDeleteStudent = (id: any) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      setStudents(students.filter(s => s.id !== id));
      if (selectedStudentId === id) closeModal();
    }
  };

  // Yoklama Durumunu Değiştir
  const toggleStudentAbsence = (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudents(students.map(s => {
      if (s.id === id) {
        return { ...s, isAbsent: !s.isAbsent };
      }
      return s;
    }));
  };

  const handleGivePoints = (studentId: any, behavior: any) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        if (student.isAbsent) return student; // Yok yazılan puan alamaz

        const newPoints = student.points + behavior.points;
        const newLevel = Math.floor(newPoints / 50) + 1;
        
        if (newLevel > student.level) {
          triggerSound('levelup');
          showNotification(`🎉 ${student.name} Seviye Atladı! (Seviye ${newLevel})`);
        } else {
          triggerSound('success');
          showNotification(`${student.name}: +${behavior.points} Puan (${behavior.label})`);
        }

        return {
          ...student,
          points: newPoints,
          level: newLevel,
          history: [...student.history, { date: new Date().toLocaleDateString(), action: behavior.label, points: behavior.points }]
        };
      }
      return student;
    }));
  };

  const handleAwardBadge = (studentId: any, badge: any) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        if (student.badges.includes(badge.id)) {
          showNotification('Bu öğrenci zaten bu rozete sahip.');
          return student;
        }
        triggerSound('levelup');
        showNotification(`🏅 ${student.name}, "${badge.name}" rozetini kazandı!`);
        return {
          ...student,
          badges: [...student.badges, badge.id]
        };
      }
      return student;
    }));
  };

  const handleGiveCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBadge.name || !customBadge.description) return;

    setStudents(students.map(student => {
      if (student.id === selectedStudentId) {
        triggerSound('levelup');
        showNotification(`💎 ${student.name} öğrencisine özel rozet verildi!`);
        return {
          ...student,
          customBadges: [...(student.customBadges || []), { ...customBadge, id: Date.now() }]
        };
      }
      return student;
    }));
    setCustomBadge({ name: '', description: '', icon: '🏆' });
    setIsCustomBadgeOpen(false);
  };

  // --- Yönetim Fonksiyonları ---

  const handleAddBehavior = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBehavior.label) return;
    const newB = { id: Date.now(), label: newBehavior.label, points: parseInt(String(newBehavior.points)), iconType: 'star' };
    setBehaviors([...behaviors, newB]);
    setNewBehavior({ label: '', points: 5 });
    showNotification('Yeni davranış kriteri eklendi.');
  };

  const handleStartEdit = (behavior: any) => {
    setEditingBehaviorId(behavior.id);
    setEditForm({ label: behavior.label, points: behavior.points });
  };

  const handleSaveEdit = () => {
    if (!editForm.label.trim()) return;
    setBehaviors(behaviors.map(b => b.id === editingBehaviorId ? { ...b, label: editForm.label, points: parseInt(String(editForm.points)) } : b));
    setEditingBehaviorId(null);
    showNotification('Kriter güncellendi.');
  };

  const handleDeleteBehavior = (id: any) => {
    if (window.confirm('Bu kriteri silmek istediğinize emin misiniz?')) {
      setBehaviors(behaviors.filter(b => b.id !== id));
    }
  };

  const handleUpdateTarget = () => {
    setClassTarget(parseInt(String(newTargetValue)));
    setIsEditingTarget(false);
    showNotification('Sınıf hedefi güncellendi!');
  };

  const openRandomPicker = () => {
    // Sadece "Burada" olan öğrencileri havuza ekle
    const presentStudents = students.filter(s => !s.isAbsent);

    if (presentStudents.length === 0) {
      showNotification('Sınıfta hiç öğrenci yok (ya da hepsi yok yazılmış).');
      return;
    }
    setIsRandomPickerOpen(true);
    setRandomWinner(null);
    setIsSpinning(false);
  };

  const spinWheel = () => {
    // Sadece "Burada" olan öğrencileri kullan
    const presentStudents = students.filter(s => !s.isAbsent);
    
    setIsSpinning(true);
    let counter = 0;
    triggerSound('click');
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * presentStudents.length);
      setRandomWinner(presentStudents[randomIndex]);
      counter++;
      if (counter > 20) {
        clearInterval(interval);
        setIsSpinning(false);
        triggerSound('levelup');
      }
    }, 100);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCustomBadgeOpen(false);
    setSelectedStudentId(null);
  };

  const openStudentModal = (student: any) => {
    if (student.isAbsent) {
      showNotification(`${student.name} bugün yok yazılmış. İşlem yapılamaz.`);
      return;
    }
    setSelectedStudentId(student.id);
    setIsModalOpen(true);
  };

  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Liderlik Tablosu Sıralaması
  const getTopStudents = () => {
    return [...students].sort((a, b) => b.points - a.points).slice(0, 3);
  };
  const topStudents = getTopStudents();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* Üst Bar */}
      <header className="bg-indigo-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-300" size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Sınıf Kahramanları</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            
            {/* Podyum Butonu */}
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-2 bg-indigo-700 hover:bg-yellow-500 hover:text-indigo-900 rounded-full transition-colors"
              title="Liderlik Kürsüsü"
            >
              <BarChart3 size={20} />
            </button>

            {/* Zamanlayıcı Butonu */}
            <button 
              onClick={() => setIsTimerOpen(!isTimerOpen)}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 ${timerRunning ? 'bg-orange-500 animate-pulse' : 'bg-indigo-700 hover:bg-indigo-800'}`}
              title="Zamanlayıcı"
            >
              <Timer size={20} />
              {timerRunning && <span className="text-sm font-bold font-mono">{formatTime(timerSeconds)}</span>}
            </button>

            {/* Ses Butonu */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-indigo-700 hover:bg-indigo-800 rounded-full transition-colors"
              title={isMuted ? "Sesi Aç" : "Sessize Al"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

             <button 
              onClick={openRandomPicker}
              className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm text-sm"
            >
              <Shuffle size={18} /> <span className="hidden sm:inline">Şanslı Seçim</span>
            </button>
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-indigo-700 hover:bg-indigo-800 rounded-full transition-colors"
              title="Ayarlar"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ZAMANLAYICI WIDGET */}
      {isTimerOpen && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-white shadow-2xl rounded-2xl p-4 border border-indigo-100 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 w-64">
           <div className="flex justify-between w-full items-center border-b border-slate-100 pb-2">
             <h3 className="font-bold text-indigo-800 flex items-center gap-2"><Timer size={18}/> Sayaç</h3>
             <button onClick={() => setIsTimerOpen(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
           </div>
           <div className="text-5xl font-mono font-bold text-slate-800 my-2">
             {formatTime(timerSeconds)}
           </div>
           <div className="flex gap-2 w-full">
             <button 
              onClick={() => setTimerRunning(!timerRunning)}
              className={`flex-1 py-2 rounded-lg font-bold text-white flex justify-center items-center gap-2 ${timerRunning ? 'bg-orange-500' : 'bg-green-600'}`}
             >
               {timerRunning ? <><Pause size={18}/> Durdur</> : <><Play size={18}/> Başlat</>}
             </button>
             <button 
              onClick={() => {setTimerRunning(false); setTimerSeconds(300);}}
              className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
              title="Sıfırla (5dk)"
             >
               <RotateCcw size={18}/>
             </button>
           </div>
           <div className="flex gap-1 justify-center w-full">
             {[1, 5, 10, 15].map(min => (
               <button 
                key={min} 
                onClick={() => {setTimerRunning(false); setTimerSeconds(min * 60);}}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 border border-indigo-100"
               >
                 {min}dk
               </button>
             ))}
           </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Bildirim Alanı */}
        {notification && (
          <div className="fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce z-50 flex items-center gap-2 pointer-events-none">
            <Star size={20} fill="white" />
            {notification}
          </div>
        )}

        {/* SINIF HEDEFİ BARI */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <Target className="text-yellow-300" size={24} />
                <h2 className="text-xl font-bold">Sınıf Ortak Hedefi</h2>
                {isEditingTarget ? (
                  <div className="flex items-center gap-2 ml-4">
                    <input 
                      type="number" 
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(parseInt(e.target.value))}
                      className="w-20 px-2 py-1 text-slate-800 rounded text-sm"
                    />
                    <button onClick={handleUpdateTarget} className="bg-green-500 px-2 py-1 rounded text-xs font-bold hover:bg-green-600">Kaydet</button>
                  </div>
                ) : (
                  <button onClick={() => {setIsEditingTarget(true); setNewTargetValue(classTarget)}} className="opacity-50 hover:opacity-100 ml-2">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-yellow-300">{totalClassPoints}</span>
                <span className="text-indigo-200"> / {classTarget} Puan</span>
              </div>
            </div>
            <div className="w-full h-6 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{ width: `${classProgress}%` }}
              >
                {classProgress >= 100 && <Crown size={14} className="text-white animate-pulse" />}
              </div>
            </div>
          </div>
          <Target size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
        </div>

        {/* Öğrenci Ekleme */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
              <UserPlus size={24} />
            </div>
            <h2 className="font-semibold text-lg text-slate-700">Yeni Öğrenci Ekle</h2>
          </div>
          <form onSubmit={handleAddStudent} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Ad Soyad giriniz..."
              className="border border-slate-300 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Ekle
            </button>
          </form>
        </div>

        {/* Öğrenci Listesi */}
        {students.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <UserPlus size={40} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Henüz hiç öğrenci yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
              <div 
                key={student.id} 
                className={`
                  rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all cursor-pointer group relative
                  ${student.isAbsent ? 'bg-slate-100 border-slate-200 opacity-60 grayscale' : 'bg-white border-slate-200'}
                `}
                onClick={() => openStudentModal(student)}
              >
                {/* Yoklama Butonu */}
                <button
                  onClick={(e) => toggleStudentAbsence(student.id, e)}
                  className={`absolute top-2 left-2 p-1.5 rounded-lg z-10 transition-colors ${student.isAbsent ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  title={student.isAbsent ? "Yok Yazıldı (Burada İşaretle)" : "Burada (Yok Yaz)"}
                >
                  {student.isAbsent ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>

                <div className="p-5 flex flex-col items-center text-center border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 mb-3 overflow-hidden border-4 border-white shadow-sm relative">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.name}&backgroundColor=e0e7ff`} alt="avatar" className="w-full h-full object-cover"/>
                    {student.isAbsent && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs uppercase">Yok</div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{student.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">Seviye {student.level}</span>
                    <span className="text-xs font-semibold text-slate-500">{student.points} Puan</span>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${getProgress(student.points)}%` }}></div>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-1 flex gap-1 flex-wrap min-h-[40px]">
                  {student.badges.slice(0, 2).map((bid: any) => {
                    const b = INITIAL_BADGES.find(x => x.id === bid);
                    return b ? <span key={bid} className="text-lg">{b.icon}</span> : null;
                  })}
                  {student.customBadges?.slice(0, 1).map((c: any) => <span key={c.id} className="text-lg">{c.icon}</span>)}
                  {(student.badges.length + (student.customBadges?.length || 0)) > 3 && (
                    <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
                      +{(student.badges.length + (student.customBadges?.length || 0)) - 3}
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODALLER --- */}

      {/* LİDERLİK KÜRSÜSÜ MODALI (PODIUM) */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <button onClick={() => setIsLeaderboardOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X size={24} /></button>
            
            <div className="bg-indigo-900 p-6 text-center shrink-0">
               <h2 className="text-3xl font-black text-yellow-400 tracking-wider flex items-center justify-center gap-3">
                 <Crown size={32} /> LİDERLİK KÜRSÜSÜ
               </h2>
               <p className="text-indigo-200 text-sm mt-1">Zirvedeki Kahramanlar</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
               {students.length < 3 ? (
                 <div className="text-center py-10 text-slate-400">
                   <p>Kürsü için en az 3 öğrenciye ihtiyaç var!</p>
                 </div>
               ) : (
                 <div className="flex flex-col items-center">
                   {/* Podyum Görseli */}
                   <div className="flex items-end justify-center gap-4 mb-8 w-full max-w-md h-64 mt-4">
                      {/* 2. Sıra (Gümüş) */}
                      <div className="flex flex-col items-center w-1/3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                         <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden shadow-lg mb-2 relative">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topStudents[1]?.name}&backgroundColor=e0e7ff`} className="w-full h-full object-cover"/>
                            <div className="absolute bottom-0 w-full bg-slate-400 text-white text-[10px] font-bold text-center">2.</div>
                         </div>
                         <div className="font-bold text-slate-700 text-sm text-center leading-tight mb-1">{topStudents[1]?.name}</div>
                         <div className="text-xs text-slate-500 font-mono mb-1">{topStudents[1]?.points}p</div>
                         <div className="w-full h-24 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-lg shadow-inner flex items-end justify-center pb-2">
                           <span className="text-4xl font-black text-slate-400/30">2</span>
                         </div>
                      </div>

                      {/* 1. Sıra (Altın) */}
                      <div className="flex flex-col items-center w-1/3 animate-in fade-in slide-in-from-bottom-12 duration-700">
                         <Crown size={32} className="text-yellow-400 mb-1 animate-bounce" />
                         <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl mb-2 relative">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topStudents[0]?.name}&backgroundColor=e0e7ff`} className="w-full h-full object-cover"/>
                             <div className="absolute bottom-0 w-full bg-yellow-500 text-white text-xs font-bold text-center">1.</div>
                         </div>
                         <div className="font-bold text-slate-800 text-base text-center leading-tight mb-1">{topStudents[0]?.name}</div>
                         <div className="text-sm text-yellow-600 font-bold font-mono mb-1">{topStudents[0]?.points} Puan</div>
                         <div className="w-full h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg shadow-inner flex items-end justify-center pb-2">
                            <span className="text-5xl font-black text-yellow-600/30">1</span>
                         </div>
                      </div>

                      {/* 3. Sıra (Bronz) */}
                      <div className="flex flex-col items-center w-1/3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                         <div className="w-16 h-16 rounded-full border-4 border-orange-300 overflow-hidden shadow-lg mb-2 relative">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topStudents[2]?.name}&backgroundColor=e0e7ff`} className="w-full h-full object-cover"/>
                            <div className="absolute bottom-0 w-full bg-orange-400 text-white text-[10px] font-bold text-center">3.</div>
                         </div>
                         <div className="font-bold text-slate-700 text-sm text-center leading-tight mb-1">{topStudents[2]?.name}</div>
                         <div className="text-xs text-slate-500 font-mono mb-1">{topStudents[2]?.points}p</div>
                         <div className="w-full h-16 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg shadow-inner flex items-end justify-center pb-2">
                           <span className="text-4xl font-black text-orange-500/30">3</span>
                         </div>
                      </div>
                   </div>

                   {/* Diğer Liste */}
                   <div className="w-full mt-4 bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Sıralama (İlk 10)</h3>
                      {students.sort((a,b) => b.points - a.points).slice(3, 10).map((s, idx) => (
                        <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono w-6 text-center">{idx + 4}.</span>
                            <span className="font-medium text-slate-700">{s.name}</span>
                          </div>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{s.points}p</span>
                        </div>
                      ))}
                      {students.length <= 3 && <p className="text-center text-slate-400 text-sm italic">Sadece ilk 3 öğrenci kürsüde!</p>}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
      
      {/* Ayarlar Modalı */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
             <div className="bg-indigo-800 p-4 text-white flex justify-between items-center sticky top-0 z-10">
               <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Ayarlar</h2>
               <button onClick={() => setIsSettingsOpen(false)}><X size={20}/></button>
             </div>
             
             <div className="p-6 space-y-6">
                
                {/* Dışa Aktar Bölümü */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2"><Download size={18}/> Verileri Yedekle</h3>
                  <p className="text-sm text-green-700 mb-3">Tüm sınıf listesini, puanları ve rozetleri Excel'de açabileceğiniz bir dosya (CSV) olarak indirin.</p>
                  <button onClick={handleExportData} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2 w-full justify-center">
                    <Download size={16}/> Raporu İndir
                  </button>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase">Yeni Kriter Ekle</h3>
                  <form onSubmit={handleAddBehavior} className="flex gap-2">
                    <input type="text" placeholder="Davranış adı" className="border border-slate-300 rounded px-3 py-2 flex-1 text-sm" value={newBehavior.label} onChange={e => setNewBehavior({...newBehavior, label: e.target.value})} />
                    <input type="number" placeholder="Puan" className="border border-slate-300 rounded px-3 py-2 w-20 text-sm" value={newBehavior.points} onChange={e => setNewBehavior({...newBehavior, points: parseInt(e.target.value)})} />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Plus size={18} /></button>
                  </form>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {behaviors.map(b => (
                    <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      {editingBehaviorId === b.id ? (
                        <div className="flex items-center gap-2 w-full">
                           <input type="text" className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm" value={editForm.label} onChange={(e) => setEditForm({...editForm, label: e.target.value})} />
                           <input type="number" className="w-14 border border-indigo-300 rounded px-2 py-1 text-sm" value={editForm.points} onChange={(e) => setEditForm({...editForm, points: parseInt(String(editForm.points))})} />
                           <button onClick={handleSaveEdit} className="text-green-600 p-1"><Check size={18}/></button>
                           <button onClick={() => setEditingBehaviorId(null)} className="text-slate-400 p-1"><X size={18}/></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3"><span className="text-slate-400">{getIcon(b.iconType)}</span><span className="font-medium text-slate-700">{b.label}</span></div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">+{b.points}p</span>
                            <button onClick={() => handleStartEdit(b)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteBehavior(b.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <button onClick={() => {if(window.confirm('TÜM VERİLER SİLİNECEK!')) {setStudents([]); setIsSettingsOpen(false);}}} className="w-full py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 size={16} /> Tüm Sınıfı Sıfırla
                    </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Rastgele Seçici Modalı */}
      {isRandomPickerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8 relative">
            <button onClick={() => setIsRandomPickerOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center justify-center gap-2"><Shuffle /> Şanslı Öğrenci Kim?</h2>
            <div className="h-48 flex items-center justify-center mb-6">
              {randomWinner ? (
                <div className={`transition-all duration-300 ${isSpinning ? 'scale-90 opacity-50 blur-sm' : 'scale-110 opacity-100'}`}>
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-500 mx-auto mb-4 overflow-hidden shadow-lg">
                     <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${randomWinner.name}&backgroundColor=e0e7ff`} alt="avatar" className="w-full h-full object-cover"/>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{randomWinner.name}</div>
                  {!isSpinning && <div className="text-sm text-green-600 font-bold animate-bounce mt-2">🎉 SEÇİLDİ! 🎉</div>}
                </div>
              ) : (
                <div className="text-slate-300"><div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-200 mx-auto mb-4 flex items-center justify-center"><span className="text-4xl">?</span></div><p>Kura çekmek için butona bas!</p></div>
              )}
            </div>
            <button onClick={spinWheel} disabled={isSpinning} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${isSpinning ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}>
              {isSpinning ? 'Seçiliyor...' : 'KURAYI BAŞLAT'}
            </button>
          </div>
        </div>
      )}

      {/* Öğrenci Detay Modalı */}
      {isModalOpen && activeStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-start relative overflow-hidden shrink-0">
              <div className="flex items-center gap-4 z-10">
                <div className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/30 backdrop-blur-md overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${activeStudent.name}&backgroundColor=transparent`} alt="avatar" className="w-full h-full"/>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{activeStudent.name}</h2>
                  <div className="flex items-center gap-3 text-indigo-100 text-sm mt-1">
                    <span className="bg-white/20 px-2 py-0.5 rounded">Seviye {activeStudent.level}</span>
                    <span>Toplam Puan: {activeStudent.points}</span>
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white z-10 p-1 hover:bg-white/10 rounded-lg"><X size={24} /></button>
              <Trophy size={140} className="absolute -right-6 -bottom-6 text-white/10 rotate-12" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap size={16} /> Davranış Değerlendir</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {behaviors.map(behavior => (
                        <button key={behavior.id} onClick={() => handleGivePoints(activeStudent.id, behavior)} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm transition-all group text-left">
                          <div className="flex items-center gap-3"><span className="text-slate-400 group-hover:text-indigo-600 transition-colors">{getIcon(behavior.iconType)}</span><span className="font-medium text-slate-700">{behavior.label}</span></div>
                          <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-sm">+{behavior.points}p</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><List size={16} /> Son Hareketler</h3>
                    <div className="bg-white rounded-lg border border-slate-200 p-2 max-h-40 overflow-y-auto text-sm">
                      {activeStudent.history.length > 0 ? (
                        [...activeStudent.history].reverse().slice(0, 5).map((log: any, i: any) => (
                          <div key={i} className="flex justify-between py-2 px-2 border-b border-slate-50 last:border-0"><span className="text-slate-600">{log.action}</span><span className="text-green-600 font-bold">+{log.points}</span></div>
                        ))
                      ) : <p className="text-slate-400 text-center py-4">Henüz kayıt yok.</p>}
                    </div>
                  </section>
                </div>
                <div className="space-y-6">
                  <section>
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Award size={16} /> Rozet Koleksiyonu</h3>
                      {!isCustomBadgeOpen && (
                        <button onClick={() => setIsCustomBadgeOpen(true)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 font-medium flex items-center gap-1"><Plus size={12}/> Özel Rozet Ver</button>
                      )}
                    </div>
                    {isCustomBadgeOpen && (
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-indigo-800 mb-2 text-sm">Özel Rozet Oluştur</h4>
                        <div className="flex gap-2 mb-2">
                           <select className="p-2 border border-indigo-200 rounded text-xl" value={customBadge.icon} onChange={e => setCustomBadge({...customBadge, icon: e.target.value})}>
                             <option value="🏆">🏆</option><option value="🌟">🌟</option><option value="🚀">🚀</option><option value="🎨">🎨</option><option value="🎸">🎸</option><option value="🔬">🔬</option><option value="🎭">🎭</option>
                           </select>
                           <input type="text" placeholder="Rozet Adı" className="flex-1 p-2 border border-indigo-200 rounded text-sm" value={customBadge.name} onChange={e => setCustomBadge({...customBadge, name: e.target.value})}/>
                        </div>
                        <input type="text" placeholder="Neden veriliyor?" className="w-full p-2 border border-indigo-200 rounded text-sm mb-2" value={customBadge.description} onChange={e => setCustomBadge({...customBadge, description: e.target.value})}/>
                        <div className="flex justify-end gap-2"><button onClick={() => setIsCustomBadgeOpen(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2">İptal</button><button onClick={handleGiveCustomBadge} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Rozeti Ver</button></div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                      {activeStudent.customBadges && activeStudent.customBadges.map((cBadge: any) => (
                         <div key={cBadge.id} className="p-3 rounded-xl border bg-yellow-50 border-yellow-200 shadow-sm flex flex-col items-center text-center relative">
                            <span className="text-3xl mb-1 filter drop-shadow-sm">{cBadge.icon}</span><span className="font-bold text-sm text-slate-800">{cBadge.name}</span>
                            <div className="absolute top-2 right-2 text-yellow-600"><Crown size={14} fill="currentColor" /></div>
                         </div>
                      ))}
                      {INITIAL_BADGES.map(badge => {
                        const isOwned = activeStudent.badges.includes(badge.id);
                        return (
                          <div key={badge.id} onClick={() => !isOwned && handleAwardBadge(activeStudent.id, badge)} className={`p-3 rounded-xl border relative flex flex-col items-center text-center transition-all ${isOwned ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-indigo-300 cursor-pointer border-dashed'}`}>
                            <span className="text-3xl mb-1 filter drop-shadow-sm">{badge.icon}</span><span className={`font-bold text-sm ${isOwned ? 'text-slate-800' : 'text-slate-500'}`}>{badge.name}</span>
                            {isOwned && <div className="absolute top-2 right-2 text-yellow-500"><Award size={14} fill="currentColor" /></div>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
              <button onClick={closeModal} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
