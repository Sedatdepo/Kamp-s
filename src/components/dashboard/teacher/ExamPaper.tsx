"use client";

import React from 'react';
import { Exam } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ExamPaperProps {
  exam: Exam;
  showAnswerKey?: boolean;
}

export const ExamPaper = ({ exam, showAnswerKey = false }: ExamPaperProps) => {
  const { examInfo, questions } = exam;

  const renderQuestion = (q: any, index: number) => {
    const isCorrect = (optionIndex: number) => showAnswerKey && q.correctAnswer === optionIndex;

    return (
      <div key={q.id || index} className="mb-8 break-inside-avoid">
        <p className="font-bold mb-3">{index + 1}. ({q.points || 0} Puan) {q.text}</p>
        {q.image && (
          <div className="my-2">
            <img src={q.image} alt={`Soru ${index + 1} görseli`} className="max-w-full rounded-md border" />
          </div>
        )}
        {q.type === 'multiple-choice' && q.options && (
          <div className="space-y-2">
            {q.options.map((opt: string, i: number) => (
              <div key={i} className={`flex items-center space-x-2 p-2 rounded-md ${isCorrect(i) ? 'bg-green-100 border border-green-300' : ''}`}>
                <span className="font-semibold">{String.fromCharCode(65 + i)})</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}
        {/* Diğer soru tipleri için render işlemleri buraya eklenebilir */}
      </div>
    );
  };

  const columnClass = "w-1/2 px-4";

  return (
    <div className="bg-white p-12 shadow-lg w-[21cm] min-h-[29.7cm] mx-auto font-serif text-black">
      {/* Sınav Başlığı */}
      <header className="text-center mb-10 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold tracking-wider">{examInfo.title}</h1>
        <p className="text-sm">2025-2026 Eğitim Öğretim Yılı • {examInfo.group ? `${examInfo.group} Grubu` : ''}</p>
      </header>

      {/* Öğrenci Bilgileri */}
      <section className="mb-10 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div className="border-b border-dotted border-black pb-1">Adı Soyadı:</div>
        <div className="border-b border-dotted border-black pb-1">Sınıfı / No:</div>
      </section>

      {/* Sorular */}
      <section className="columns-2 gap-8">
        {questions.map((q, index) => renderQuestion(q, index))}
      </section>

      {/* Cevap Anahtarı (isteğe bağlı) */}
      {showAnswerKey && (
        <div className="mt-10 pt-6 border-t-2 border-dashed border-black break-before-page">
          <h2 className="text-xl font-bold text-center mb-6">CEVAP ANAHTARI</h2>
          <ol className="columns-4 gap-4 text-sm">
            {questions.map((q, index) => (
              <li key={`ans-${q.id}`} className="mb-2 font-mono">
                <strong>{index + 1}.</strong> {String.fromCharCode(65 + (q.correctAnswer as number))}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

    