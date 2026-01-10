"use client";

import React, { useState, useEffect, useMemo, useContext } from 'react';
// Güvenli ve temel ikon setini import ediyoruz
import { 
  ArrowLeft, 
  Bell, 
  FileText, 
  Home, 
  MessageSquare, 
  Shield, 
  Users, 
  Grid, 
  Settings, 
  Award, 
  Star 
} from 'lucide-react';

// --- MOCK UI COMPONENTS (Preview için basitleştirilmiş) ---
const Card = ({ className, children, onClick }: any) => (
  <div onClick={onClick} className={`rounded-xl border bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50 ${className || ''}`}>
    {children}
  </div>
);
const CardHeader = ({ className, children }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>{children}</div>
);
const CardTitle = ({ className, children }: any) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h3>
);
const CardDescription = ({ className, children }: any) => (
  <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className || ''}`}>{children}</p>
);
const Button = ({ variant, onClick, className, children }: any) => (
  <button onClick={onClick} className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:bg-zinc-100 ${className || ''}`}>
    {children}
  </button>
);
const Badge = ({ variant, className, children }: any) => (
  <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 ${className || ''}`}>
    {children}
  </div>
);
const Skeleton = ({ className }: any) => (
  <div className={`animate-pulse rounded-md bg-zinc-100 ${className || ''}`} />
);

// --- MOCK CONTEXT & HOOKS ---
const AuthContext = React.createContext<any>({ 
    appUser: { type: 'student', data: { classId: '10-A', behaviorScore: 100 }, uid: 'mock-user-id' }, 
    db: {} 
});

const useMemoFirebase = (fn: any, deps: any[]) => useMemo(fn, deps);

const useCollection = (query: any) => {
  return {
    data: [
      { id: '1', title: 'Hoş Geldin', description: 'Sisteme ilk kez giriş yaptın.', points: 10, earnedAt: { toDate: () => new Date('2023-09-10') } },
      { id: '2', title: 'Ödev Canavarı', description: '5 ödevi zamanında teslim ettin.', points: 50, earnedAt: { toDate: () => new Date('2023-10-15') } },
      { id: '3', title: 'Sınıf Başkanı', description: 'Seçimlerde en yüksek oyu aldın.', points: 100, earnedAt: { toDate: () => new Date('2023-11-01') } },
    ],
    isLoading: false
  };
};

const useNotification = () => ({
    notifications: { announcements: true, homeworks: false, election: false, surveys: true, messages: false, riskForm: false, infoForm: false },
    markAsSeen: () => {},
    hasUnansweredSurvey: true
});

const useDoc = (query: any) => ({ 
    data: { seatingPlan: true, dutyRoster: [{student: 'Ali'}], isElectionActive: true, isRiskFormActive: true, isInfoFormActive: true }, 
    isLoading: false 
});

const doc = (db: any, ...path: string[]) => ({});
const collection = (db: any, ...path: string[]) => ({});
const query = (ref: any, ...args: any[]) => ({});
const orderBy = (field: string, direction: string) => ({});
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

// --- INTERNAL COMPONENTS ---

function BadgesTab() {
  const authContext = useContext(AuthContext);
  const { appUser, db } = authContext || {};
  
  const badgesQuery = useMemoFirebase(
    () => {
      if (!db || !appUser?.uid) return null;
      return query(
        collection(db, 'artifacts', 'school-app', 'users', appUser.uid, 'badges'),
        orderBy('earnedAt', 'desc')
      );
    },
    [db, appUser]
  );

  const { data: badges, isLoading } = useCollection(badgesQuery);
  const totalPoints = badges?.reduce((acc: any, curr: any) => acc + (curr.points || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 dark:from-yellow-900/10 dark:to-orange-900/10 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between pb-6 pt-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Award className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              Rozet Koleksiyonum
            </CardTitle>
            <CardDescription className="text-base">
              Kazandığın başarı rozetleri ve toplam puanın.
            </CardDescription>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-4 rounded-xl border-2 border-orange-100 dark:border-orange-900 shadow-sm min-w-[120px]">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Toplam Puan</div>
            <div className="text-4xl font-black text-orange-600 dark:text-orange-500 flex items-center gap-1">
              {totalPoints}
              <Star className="h-6 w-6 fill-orange-600 text-orange-600" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges && badges.length > 0 ? (
          badges.map((badge: any) => (
            <Card key={badge.id} className="hover:shadow-lg transition-all duration-300 group border-l-4 border-l-yellow-400">
              <CardHeader className="flex flex-row gap-4 items-start pb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                    {badge.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {badge.description}
                  </CardDescription>
                  <div className="flex items-center justify-between pt-2 border-t mt-2 border-dashed">
                     <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">
                       {badge.points} Puan
                     </Badge>
                     <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                       <Award className="h-3 w-3" />
                       {badge.earnedAt?.toDate().toLocaleDateString('tr-TR')}
                     </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/20 rounded-xl border-dashed border-2">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Award className="h-12 w-12 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Henüz hiç rozet kazanmadın</h3>
            <p className="text-sm text-center max-w-sm">
              Ödevlerini zamanında yaparak, etkinliklere katılarak ve sınıf içi başarılarınla rozetler kazanabilirsin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock Tab Components
const Header = () => <div className="p-4 border-b bg-white mb-4 font-bold text-lg">Okul Yönetim Sistemi</div>;
const GradesTab = () => <div className="p-4">Notlar Sayfası</div>;
const RiskFormTab = () => <div className="p-4">Risk Formu Sayfası</div>;
const InfoFormTab = () => <div className="p-4">Bilgi Formu Sayfası</div>;
const StudentCommunicationTab = () => <div className="p-4">Duyurular Sayfası</div>;
const TeacherChatsTab = () => <div className="p-4">Öğretmen Sohbet Sayfası</div>;
const PerformanceHomeworkTab = () => <div className="p-4">Performans Ödevleri Sayfası</div>;
const RegularHomeworkTab = () => <div className="p-4">Normal Ödevler Sayfası</div>;
const ElectionVoteTab = () => <div className="p-4">Seçim Sayfası</div>;
const DutyRosterTab = () => <div className="p-4">Nöbet Listesi Sayfası</div>;
const SeatingPlanTab = () => <div className="p-4">Oturma Planı Sayfası</div>;
const StudentSurveyTab = () => <div className="p-4">Anket Sayfası</div>;
const AccountSettingsTab = () => <div className="p-4">Hesap Ayarları Sayfası</div>;
const ProjectTab = () => <div className="p-4">Proje Sayfası</div>;
const StudentClubTab = () => <div className="p-4">Kulüp Sayfası</div>;

const MenuCard = ({ icon, title, description, onClick, hasNotification, isLoading, isDisabled }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, hasNotification?: boolean, isLoading?: boolean, isDisabled?: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }
  
  return (
    <Card 
      onClick={!isDisabled ? onClick : undefined} 
      className={cn("cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group relative bg-white", isDisabled && "opacity-50 cursor-not-allowed")}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
          {icon}
        </div>
        <div>
          <CardTitle className="font-headline text-lg group-hover:text-indigo-600">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {hasNotification && (
          <Badge variant="destructive" className="absolute top-2 right-2 h-3 w-3 p-0 flex items-center justify-center text-xs bg-red-500"></Badge>
        )}
      </CardHeader>
    </Card>
  );
};


export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const authContext = useContext(AuthContext);
  const { appUser, db } = authContext || {};
  const { notifications, markAsSeen, hasUnansweredSurvey } = useNotification();
  
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, isLoading: classLoading } = useDoc(classQuery);

  useEffect(() => {
    const handleOpenSettings = () => setActiveTab('account');
    window.addEventListener('open-student-settings', handleOpenSettings);
    return () => window.removeEventListener('open-student-settings', handleOpenSettings);
  }, []);

  useEffect(() => {
    if (activeTab === 'announcements') markAsSeen('announcements');
    else if (activeTab === 'risks') markAsSeen('riskForm');
    else if (activeTab === 'info') markAsSeen('infoForm');
    else if (activeTab === 'homeworks' || activeTab === 'regular-homeworks') markAsSeen('homeworks');
    else if (activeTab === 'election') markAsSeen('election');
    else if (activeTab === 'surveys') markAsSeen('surveys');
    else if (activeTab === 'teacher-chats') markAsSeen('messages');
  }, [activeTab, markAsSeen]);
  
  const renderContent = () => {
      switch(activeTab) {
          case 'grades': return <GradesTab />;
          case 'badges': return <BadgesTab />;
          case 'project': return <ProjectTab />;
          case 'announcements': return <StudentCommunicationTab />;
          case 'teacher-chats': return <TeacherChatsTab />;
          case 'homeworks': return <PerformanceHomeworkTab />;
          case 'regular-homeworks': return <RegularHomeworkTab />;
          case 'risks': return <RiskFormTab />;
          case 'info': return <InfoFormTab />;
          case 'election': return <ElectionVoteTab />;
          case 'dutyRoster': return <DutyRosterTab />;
          case 'seatingPlan': return <SeatingPlanTab />;
          case 'surveys': return <StudentSurveyTab />;
          case 'account': return <AccountSettingsTab />;
          case 'club': return <StudentClubTab />;
          default: return null;
      }
  }

  if (activeTab !== 'home') {
    return (
        <div className="flex flex-col min-h-screen w-full bg-zinc-50/40">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
               <Button variant="ghost" onClick={() => setActiveTab('home')} className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri Dön
              </Button>
              {renderContent()}
          </main>
        </div>
    )
  }
  
  const behaviorScore = appUser?.type === 'student' ? (appUser.data.behaviorScore ?? 100) : 100;

  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-50/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="font-headline text-2xl">Öğrenci Paneli</CardTitle>
                            <CardDescription>Aşağıdaki menülerden istediğin işleme ulaşabilirsin.</CardDescription>
                        </div>
                        <Card className="p-4 bg-white text-center border shadow-sm">
                            <CardDescription className="flex items-center gap-2 justify-center"><Users className="w-4 h-4" /> Davranış Puanı</CardDescription>
                            <p className="text-4xl font-bold text-indigo-600 mt-1">{behaviorScore}</p>
                        </Card>
                    </CardHeader>
                </Card>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MenuCard icon={<FileText />} title="Notlarım" description="Ders notlarını ve ortalamanı gör." onClick={() => setActiveTab('grades')} />
                    
                    <MenuCard 
                        icon={<Award />} 
                        title="Rozetlerim" 
                        description="Kazandığın rozetleri ve puanını gör." 
                        onClick={() => setActiveTab('badges')} 
                    />
                    
                    <MenuCard icon={<Home />} title="Proje Ödevim" description="Proje seçimi yap veya atananı gör." onClick={() => setActiveTab('project')} />
                    <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                    <MenuCard icon={<FileText />} title="Performans Ödevlerim" description="Kütüphaneden atanan ödevleri gör." onClick={() => setActiveTab('homeworks')} hasNotification={notifications.homeworks} />
                    <MenuCard icon={<FileText />} title="Ödevler" description="Öğretmeninin verdiği diğer ödevler." onClick={() => setActiveTab('regular-homeworks')} hasNotification={notifications.homeworks} />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Grid />} 
                        title="Oturma Planım" 
                        description="Sınıftaki yerini gör." 
                        onClick={() => setActiveTab('seatingPlan')} 
                        isDisabled={!currentClass?.seatingPlan}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Users />} 
                        title="Nöbetçi Listesi" 
                        description="Sınıf nöbetçi listesini gör." 
                        onClick={() => setActiveTab('dutyRoster')} 
                        isDisabled={!currentClass?.dutyRoster || currentClass.dutyRoster.length === 0}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<FileText />} 
                        title="Seçim" 
                        description="Sınıf seçimleri için oy kullan." 
                        onClick={() => setActiveTab('election')} 
                        hasNotification={notifications.election} 
                        isDisabled={!currentClass?.isElectionActive}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<FileText />} 
                        title="Anketlerim" 
                        description="Aktif anketleri cevapla." 
                        onClick={() => setActiveTab('surveys')} 
                        hasNotification={notifications.surveys}
                        isDisabled={!hasUnansweredSurvey}
                    />

                    <MenuCard icon={<MessageSquare />} title="Sohbetlerim" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} hasNotification={notifications.messages} />
                    
                    <MenuCard icon={<Settings />} title="Hesap Ayarları" description="Şifreni oluştur veya değiştir." onClick={() => setActiveTab('account')} />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Award />} 
                        title="Kulüp" 
                        description="Kulüp tercihi yap veya atamanı gör." 
                        onClick={() => setActiveTab('club')} 
                        isDisabled={false} 
                    />

                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Shield />} 
                        title="Risk Formu" 
                        description="Kişisel risk faktörlerini işaretle." 
                        onClick={() => setActiveTab('risks')} 
                        hasNotification={notifications.riskForm} 
                        isDisabled={!currentClass?.isRiskFormActive}
                    />

                    <MenuCard 
                        isLoading={classLoading}
                        icon={<FileText />} 
                        title="Bilgi Formu" 
                        description="Kişisel ve ailevi bilgilerini doldur." 
                        onClick={() => setActiveTab('info')} 
                        hasNotification={notifications.infoForm} 
                        isDisabled={!currentClass?.isInfoFormActive}
                    />
                </div>
            </div>
        </main>
    </div>
  );
}

// Default export eklenerek modül hataları önlendi
export default StudentDashboard;