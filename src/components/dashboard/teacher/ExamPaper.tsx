'use client';

import React from 'react';
import { Exam, ExamQuestion, ExamTheme } from '@/lib/types';
import { Plus, GripVertical, Trash2 } from 'lucide-react';

const getThemeStyles = (theme: ExamTheme) => {
    switch (theme) {
      case 'modern': return { container: 'font-sans', header: 'border-b-4 border-blue-600 pb-4 mb-6', title: 'text-3xl font-extrabold text-blue-800 uppercase', slotBorder: 'border border-blue-100 rounded-lg shadow-sm', slotNumber: 'bg-blue-600 text-white rounded-br-lg', groupCircle: 'border-4 border-blue-600 text-blue-600' };
      case 'minimal': return { container: 'font-sans', header: 'border-b border-gray-300 pb-2 mb-4', title: 'text-xl font-normal text-gray-800 uppercase', slotBorder: 'border-b border-gray-100', slotNumber: 'text-gray-400 font-normal', groupCircle: 'border border-gray-400 text-gray-600' };
      default: return { container: 'font-serif', header: 'border-b-2 border-black pb-4 mb-6', title: 'text-2xl font-bold text-black uppercase', slotBorder: 'border-b border-dashed border-gray-300', slotNumber: 'bg-gray-100 text-gray-500 rounded', groupCircle: 'border-2 border-black text-black' };
    }
};

const SliceItem = ({ slot, index, styles, lineHeight }: { slot: ExamQuestion, index: number, styles: any, lineHeight: number }) => {
    return (
      <div 
        className={`relative p-2 flex flex-col group ${styles.slotBorder} ${!slot.filled ? 'justify-center items-center text-gray-300' : ''} flex-grow-0 flex-shrink-0`}
        style={{ flexBasis: `${slot.span * 10}%` }} // Using percentage for basis
      >
        <span className={`absolute top-0 right-0 text-[10px] px-1.5 py-0.5 ${styles.slotNumber}`}>#{index + 1}</span>
        {!slot.filled ? (
          <div className="flex flex-col items-center gap-1"><Plus size={20} /><span className="text-xs">Boş Soru</span></div>
        ) : (
          <div className="text-sm w-full h-full overflow-hidden pl-4" style={{ lineHeight: lineHeight }}>
            <div className="flex gap-1 mb-1">
                <span className="font-bold">{index + 1}.</span>
                <div className="prose prose-sm max-w-none m-0 p-0" dangerouslySetInnerHTML={{ __html: slot.text }} />
            </div>
            {slot.image && <div className="w-full h-full my-2 block"><img src={slot.image} alt="Soru görseli" className="w-full h-full object-contain" /></div>}
            {slot.type === 'choice' && (<div className="mt-2 text-xs space-y-1">{slot.options?.map((opt, i) => opt && (<div key={i}><span className="font-bold">{['A','B','C','D','E'][i]})</span> {opt}</div>))}</div>)}
            {slot.type === 'truefalse' && <div className="mt-4 text-xs">( ) Doğru &nbsp;&nbsp;&nbsp; ( ) Yanlış</div>}
            {slot.type === 'open' && <div className="mt-4 space-y-4"><div className="border-b border-gray-300 border-dotted h-4"></div><div className="border-b border-gray-300 border-dotted h-4"></div></div>}
          </div>
        )}
      </div>
    );
};

interface ExamPaperProps {
    exam: Exam;
    showAnswerKey?: boolean;
}

export const ExamPaper = ({ exam, showAnswerKey = false }: ExamPaperProps) => {
    const styles = getThemeStyles(exam.examInfo.theme);
    const { fontSize, lineHeight, watermark } = exam.examInfo.settings;

    const generateAnswerKeyHTML = () => {
        const filled = exam.questions.filter(s => s.filled && s.type === 'choice');
        if (filled.length === 0) return '';
        let html = `<br><br><div style="border: 1px solid #000; padding: 10px; font-size: 10pt;"><strong>${exam.examInfo.group} GRUBU CEVAP ANAHTARI:</strong><br><table style="width: 100%; border-collapse: collapse; margin-top: 5px;"><tr>`;
        filled.forEach((q, i) => {
            const char = q.correctOption !== null ? ['A', 'B', 'C', 'D', 'E'][q.correctOption] : '-';
            html += `<td style="border: 1px solid #ccc; padding: 2px 5px; text-align: center;"><b>${i + 1}.</b> ${char}</td>`;
            if ((i + 1) % 10 === 0) html += `</tr><tr>`;
        });
        html += `</tr></table></div>`;
        return html;
    };
  
    return (
      <div 
        className={`bg-white w-[21cm] min-h-[29.7cm] shadow-lg p-[1.5cm] flex flex-col relative overflow-hidden ${styles.container}`}
        style={{ fontSize: `${fontSize}pt` }}
      >
        {watermark && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-gray-100 font-bold text-[80pt] pointer-events-none select-none z-0 whitespace-nowrap">{watermark}</div>}
  
        <div className={`flex items-start gap-4 shrink-0 relative z-10 ${styles.header}`}>
            {exam.examInfo.logo && <div className="w-[80px] h-[80px] flex items-center justify-center shrink-0"><img src={exam.examInfo.logo} alt="Logo" className="max-w-full max-h-full object-contain" /></div>}
            
            <div className="flex-1 text-center flex flex-col justify-center">
                <h1 className={styles.title}>{exam.examInfo.title}</h1>
                <div className="flex justify-between text-sm px-4 mt-2">
                    <div className="text-left space-y-1"><div>Adı Soyadı: ..............................</div><div>Sınıfı / No: ..............................</div></div>
                    <div className="text-left space-y-1"><div>Tarih: ...../...../20....</div><div>Notu: .....................</div></div>
                </div>
            </div>
  
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl bg-white ${styles.groupCircle}`}>{exam.examInfo.group}</div>
            </div>
        </div>
  
        <div className="flex gap-[1cm] flex-1 z-10">
          {[0, 5].map((startIdx, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col">
              {exam.questions.slice(startIdx, startIdx + 5).map((slot, i) => (
                <SliceItem 
                  key={slot.id} slot={slot} 
                  index={i + startIdx} styles={styles} lineHeight={lineHeight}
                />
              ))}
            </div>
          ))}
        </div>
  
        {showAnswerKey && (
            <div className="z-10" dangerouslySetInnerHTML={{ __html: generateAnswerKeyHTML() }} />
        )}
      </div>
    );
};
