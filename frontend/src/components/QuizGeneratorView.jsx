import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  RotateCw,
  Trophy,
  FileText,
  AlertCircle,
  Loader2,
  Bookmark,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../context/DocumentContext';
import { toolApi } from '../services/api';

export default function QuizGeneratorView() {
  const { activeDocument, showToast } = useDocument();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: selectedOptionIndex }
  const [error, setError] = useState(null);
  const [quizCount, setQuizCount] = useState(5);

  const handleGenerateQuiz = async () => {
    if (!activeDocument) return;
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    try {
      const res = await toolApi.quiz(activeDocument._id, quizCount);
      if (res.data.success && res.data.questions) {
        setQuestions(res.data.questions);
        showToast(`Generated ${res.data.questions.length} quiz questions!`, 'success');
      } else {
        setError('Could not generate questions for this document');
      }
    } catch (err) {
      console.error('Quiz error:', err);
      setError(err.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optionIdx, correctIdx) => {
    if (selectedAnswers[qId] !== undefined) return; // already answered

    const updated = { ...selectedAnswers, [qId]: optionIdx };
    setSelectedAnswers(updated);

    // Check if finished
    if (Object.keys(updated).length === questions.length) {
      const correctCount = questions.reduce(
        (acc, q) => (updated[q.id] === q.correctAnswer ? acc + 1 : acc),
        0
      );
      if (correctCount >= Math.ceil(questions.length * 0.7)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const score = questions.reduce(
    (acc, q) => (selectedAnswers[q.id] === q.correctAnswer ? acc + 1 : acc),
    0
  );
  const answeredCount = Object.keys(selectedAnswers).length;
  const isFinished = answeredCount === questions.length && questions.length > 0;

  if (!activeDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-12 h-12 text-slate-600 mb-2" />
        <h3 className="text-base font-bold text-white">No Document Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select an uploaded PDF to generate a quiz.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              AI Knowledge Assessment
            </span>
            <span className="text-xs text-slate-400">{activeDocument.pageCount || 1} Pages</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1.5 truncate max-w-xl">
            Quiz: {activeDocument.originalName}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={quizCount}
            onChange={(e) => setQuizCount(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none"
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={8}>8 Questions</option>
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{questions.length > 0 ? 'Generate New Quiz' : 'Generate Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Score Bar */}
      {questions.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Quiz Progress</div>
              <div className="text-sm font-bold text-white">
                {answeredCount} of {questions.length} answered
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Current Score</div>
            <div className="text-sm font-bold text-emerald-400">
              {score} / {questions.length} ({Math.round((score / questions.length) * 100 || 0)}%)
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-sm font-medium text-slate-300">Extracting key concepts & generating MCQs...</p>
          <p className="text-xs text-slate-500">Creating questions, verifying correct options, and referencing page sources</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State before generating */}
      {!loading && questions.length === 0 && !error && (
        <div className="py-16 text-center space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto ring-1 ring-indigo-500/30">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Test Your Knowledge</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click "Generate Quiz" to test your comprehension of "{activeDocument.originalName}".
            Our AI generates multiple choice questions with cited explanations.
          </p>
          <button
            onClick={handleGenerateQuiz}
            className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Quiz Now</span>
          </button>
        </div>
      )}

      {/* Questions list */}
      {!loading && questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const hasAnswered = selectedAnswers[q.id] !== undefined;
            const chosenOption = selectedAnswers[q.id];
            const isCorrect = chosenOption === q.correctAnswer;

            return (
              <div
                key={q.id || qIndex}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
              >
                {/* Question title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {q.sourcePage && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-medium text-brand-300 border border-slate-700 shrink-0">
                      Page {q.sourcePage}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = chosenOption === optIndex;
                    const isTargetCorrect = optIndex === q.correctAnswer;

                    let btnStyle = 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/50 text-slate-300';

                    if (hasAnswered) {
                      if (isTargetCorrect) {
                        btnStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200';
                      } else {
                        btnStyle = 'bg-slate-950/30 border-slate-800/40 text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleSelectOption(q.id, optIndex, q.correctAnswer)}
                        disabled={hasAnswered}
                        className={`p-3 rounded-xl border text-xs text-left flex items-start gap-2.5 transition-all ${btnStyle}`}
                      >
                        <span className="font-mono text-[11px] font-bold shrink-0 opacity-70">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {hasAnswered && isTargetCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {hasAnswered && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{isCorrect ? 'Correct! ' : 'Incorrect. '}</span>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Finished Banner */}
          {isFinished && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-brand-950/50 border border-indigo-500/40 text-center space-y-3">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-lg font-bold text-white">Quiz Completed!</h4>
              <p className="text-xs text-slate-300">
                You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%).
              </p>
              <button
                onClick={handleGenerateQuiz}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                Retake or Generate New Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
