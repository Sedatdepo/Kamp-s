"use client";

import React from 'react';
import { Exam, Question as ExamQuestion, MatchingPair } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExamPaperProps {
  exam: Exam;
  showAnswerKey?: boolean;
}

const ShuffledMatchingAnswers = ({ pairs, qId }: { pairs: MatchingPair[], qId: string | number }) => {
    const shuffledAnswers = React.useMemo(() => 
        pairs.map(p => p.answer).sort(() => Math.random() - 0.5), 
        [pairs]
    );

    return (
        <ol type="a" className="list-lower-alpha pl-5">
            {shuffledAnswers.map((answer, i) => <li key={`${qId}-ans-${i}`}>{answer}</li>)}
        </ol>
    )
}

export const ExamPaper = ({ exam, showAnswerKey = false }: ExamPaperProps) => {
  const { examInfo, questions } = exam;

  const renderQuestion = (q: ExamQuestion, index: number) => {
    return (
      <div key={q.id || index} className="mb-6 break-inside-avoid">
        <p className="font-bold mb-2">Soru {index + 1}. ({q.points || 0} Puan) {q.text}</p>
        {q.image && (
          <div className="my-2 flex justify-center">
            <img src={q.image} alt={`Soru ${index + 1} görseli`} className="max-w-full max-h-60 rounded-md border" />
          </div>
        )}
        
        {q.type === 'multiple-choice' && q.options && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {q.options.map((opt: string, i: number) => (
              <div key={i} className={cn("flex items-center", showAnswerKey && q.correctAnswer === opt && "font-bold text-green-700")}>
                <span className="mr-2">{String.fromCharCode(65 + i)})</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}

        {q.type === 'open-ended' && (
            <div className="mt-4 border-b-2 border-dotted h-20"></div>
        )}

        {q.type === 'matching' && q.matchingPairs && (
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                    <ol className="list-decimal pl-5 space-y-2">
                        {q.matchingPairs.map(pair => <li key={pair.id}>{pair.question} (.....)</li>)}
                    </ol>
                </div>
                <div>
                    <ShuffledMatchingAnswers pairs={q.matchingPairs} qId={q.id} />
                </div>
            </div>
        )}

      </div>
    );
  };
  
  return (
    <div className={cn(
        "bg-white p-16 shadow-lg w-[21cm] min-h-[29.7cm] mx-auto font-serif text-black",
        examInfo.theme === 'modern' && "font-sans",
    )}>
      {/* Sınav Başlığı */}
      <header className="text-center mb-10 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold tracking-wider">{examInfo.title}</h1>
        <p className="text-sm">2025-2026 Eğitim Öğretim Yılı • {examInfo.group ? `${examInfo.group} Grubu` : ''}</p>
      </header>

      {/* Öğrenci Bilgileri */}
      <section className="mb-10 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div className="border-b border-dotted border-black pb-1">Adı Soyadı:</div>
        <div className="border-b border-dotted border-black pb-1">Sınıfı / No:</div>
        <div className="border-b border-dotted border-black pb-1">Tarih:</div>
        <div className="border-b border-dotted border-black pb-1">Puan:</div>
      </section>

      {/* Sorular */}
      <section className="columns-2 gap-8">
        {questions.map((q, index) => renderQuestion(q, index))}
      </section>

      {/* Cevap Anahtarı (isteğe bağlı) */}
      {showAnswerKey && (
        <div className="mt-10 pt-6 border-t-2 border-dashed border-black break-before-page">
          <h2 className="text-xl font-bold text-center mb-6">CEVAP ANAHTARI</h2>
          <ol className="columns-4 gap-4 text-sm font-mono">
            {questions.map((q, index) => {
               let correctAnswerDisplay = '';
               if (q.type === 'multiple-choice' && q.options) {
                  const correctIndex = q.options.findIndex(opt => opt === q.correctAnswer);
                  if (correctIndex !== -1) correctAnswerDisplay = String.fromCharCode(65 + correctIndex);
               } else if (q.type === 'true-false') {
                   correctAnswerDisplay = q.correctAnswer ? 'Doğru' : 'Yanlış';
               } else if (q.type === 'matching' && q.matchingPairs) {
                   correctAnswerDisplay = 'Eşleştirme';
               } else {
                   correctAnswerDisplay = 'Açık Uçlu';
               }
               return (
                  <li key={`ans-${q.id}`} className="mb-2">
                    <strong>{index + 1}.</strong> {correctAnswerDisplay}
                  </li>
               )
            })}
          </ol>
        </div>
      )}
    </div>
  );
};
