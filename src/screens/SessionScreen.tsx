import { useState, useRef, useCallback, useEffect } from 'react';
import type { SessionQuestion, SessionResult, MultiFact } from '../types';
import NumPad from '../components/NumPad';
import DotGrid from '../components/DotGrid';
import FeedbackOverlay from '../components/FeedbackOverlay';
import Mascot from '../components/Mascot';
import { RESPONSE_TIME } from '../types';
import { useSound } from '../hooks/useSound';
import './SessionScreen.css';

interface SessionScreenProps {
  questions: SessionQuestion[];
  mascotLevel: number;
  onComplete: (result: SessionResult) => void;
  onAnswer: (
    fact: MultiFact,
    correct: boolean,
    timeMs: number,
    answered: number | null,
  ) => void;
}

interface QuestionResult {
  correct: boolean;
}

export default function SessionScreen({
  questions: initialQuestions,
  mascotLevel,
  onComplete,
  onAnswer,
}: SessionScreenProps) {
  const [questions, setQuestions] = useState<SessionQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState<'grid' | 'commute'>('grid');
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    fast: boolean;
    slow: boolean;
    correctAnswer: number;
    fact: { a: number; b: number };
  } | null>(null);
  const [numpadDisabled, setNumpadDisabled] = useState(false);
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'sad'>('idle');

  const { playCorrect, playIncorrect } = useSound();
  const mascotMoodTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStartTime = useRef(Date.now());
  const correctCount = useRef(0);
  const totalTimeMs = useRef(0);
  const factsPromoted = useRef(0);
  const factsDemoted = useRef(0);
  const newFactsIntroduced = useRef(0);

  const currentQuestion = questions[currentIndex] as SessionQuestion | undefined;

  // Clean up mascot mood timeout on unmount
  useEffect(() => {
    return () => {
      if (mascotMoodTimeout.current) clearTimeout(mascotMoodTimeout.current);
    };
  }, []);

  // Start timing when the question changes
  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.isIntroduction) {
      setShowIntro(true);
      setIntroStep('grid');
      // Count new introductions
      newFactsIntroduced.current++;
    } else {
      setShowIntro(false);
    }

    questionStartTime.current = Date.now();
    setNumpadDisabled(false);
  }, [currentIndex, currentQuestion]);

  const moveToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Session complete
      const totalQuestions = results.length + (feedback ? 1 : 0);
      const avgTime =
        totalQuestions > 0 ? totalTimeMs.current / totalQuestions : 0;

      onComplete({
        date: new Date().toISOString().slice(0, 10),
        questionsCount: questions.length,
        correctCount: correctCount.current,
        averageTimeMs: Math.round(avgTime),
        newFactsIntroduced: newFactsIntroduced.current,
        factsPromoted: factsPromoted.current,
        factsDemoted: factsDemoted.current,
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, questions, results.length, feedback, onComplete]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (!currentQuestion || numpadDisabled) return;
      setNumpadDisabled(true);

      const timeMs = Date.now() - questionStartTime.current;
      const correct = value === currentQuestion.fact.product;
      const fast = correct && timeMs < RESPONSE_TIME.FAST;
      const slow = correct && timeMs >= RESPONSE_TIME.SLOW;

      totalTimeMs.current += timeMs;
      if (correct) correctCount.current++;

      // Track promotions/demotions
      if (correct && timeMs < RESPONSE_TIME.SLOW) {
        factsPromoted.current++;
      }
      if (!correct) {
        factsDemoted.current++;
      }

      if (correct) playCorrect();
      else playIncorrect();

      // React mascot mood
      if (mascotMoodTimeout.current) clearTimeout(mascotMoodTimeout.current);
      setMascotMood(correct ? 'happy' : 'sad');
      mascotMoodTimeout.current = setTimeout(() => setMascotMood('idle'), 1500);

      // Notify parent (App) to update Leitner state
      onAnswer(currentQuestion.fact, correct, timeMs, value);

      // If incorrect, insert a retry 2-3 questions later
      if (!correct) {
        const retryPosition = Math.min(
          currentIndex + 3,
          questions.length,
        );
        const retryQuestion: SessionQuestion = {
          ...currentQuestion,
          isRetry: true,
          isIntroduction: false,
        };
        setQuestions((prev) => {
          const next = [...prev];
          next.splice(retryPosition, 0, retryQuestion);
          return next;
        });
      }

      setResults((prev) => [...prev, { correct }]);

      // Show feedback
      setFeedback({
        correct,
        fast,
        slow,
        correctAnswer: currentQuestion.fact.product,
        fact: {
          a: currentQuestion.displayA,
          b: currentQuestion.displayB,
        },
      });
    },
    [currentQuestion, numpadDisabled, currentIndex, questions.length, onAnswer, playCorrect, playIncorrect],
  );

  const handleFeedbackDismiss = useCallback(() => {
    setFeedback(null);
    moveToNext();
  }, [moveToNext]);

  const handleIntroNext = useCallback(() => {
    if (introStep === 'grid') {
      // Skip commutativity step for square numbers (a === b) — it's nonsensical
      if (currentQuestion && currentQuestion.fact.a === currentQuestion.fact.b) {
        setShowIntro(false);
        questionStartTime.current = Date.now();
      } else {
        setIntroStep('commute');
      }
    } else {
      setShowIntro(false);
      questionStartTime.current = Date.now();
    }
  }, [introStep, currentQuestion]);

  if (!currentQuestion) {
    return null;
  }

  // Progress dots: show at most 15 dots to keep it manageable
  const maxDots = Math.min(questions.length, 15);
  const progressDots = Array.from({ length: maxDots }, (_, i) => {
    if (i < results.length) {
      return results[i].correct ? 'correct' : 'incorrect';
    }
    if (i === results.length) return 'current';
    return 'pending';
  });

  return (
    <div className="session-screen">
      {/* Progress bar with mascot */}
      <div className="session-header">
        {!showIntro && (
          <div className="session-mascot">
            <Mascot level={mascotLevel} mood={mascotMood} size="small" />
          </div>
        )}
        <div className="session-progress">
          {progressDots.map((status, i) => (
            <div key={i} className={`session-progress-dot ${status}`}>
              {status === 'correct'
                ? '\u2713'
                : status === 'incorrect'
                  ? '\u2717'
                  : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Introduction phase */}
      {showIntro && (
        <div className="session-intro">
          <div className="session-intro-title">Nouveau !</div>

          {introStep === 'grid' ? (
            <>
              <DotGrid
                a={currentQuestion.fact.a}
                b={currentQuestion.fact.b}
                animated
                size="normal"
              />
              <div className="session-intro-explanation">
                <strong>
                  {currentQuestion.fact.a} {'\u00D7'}{' '}
                  {currentQuestion.fact.b}
                </strong>
                , c'est{' '}
                {Array.from({ length: currentQuestion.fact.a })
                  .map(() => currentQuestion.fact.b.toString())
                  .join(' + ')}{' '}
                = <strong>{currentQuestion.fact.product}</strong>
              </div>
              <button
                className="session-intro-btn"
                onClick={handleIntroNext}
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              <DotGrid
                a={currentQuestion.fact.a}
                b={currentQuestion.fact.b}
                animated={false}
                showRotation
                size="normal"
              />
              <div className="session-intro-commutativity">
                {currentQuestion.fact.b} {'\u00D7'}{' '}
                {currentQuestion.fact.a}, c'est pareil !
                <br />
                C'est aussi{' '}
                <strong>{currentQuestion.fact.product}</strong>
              </div>
              <button
                className="session-intro-btn"
                onClick={handleIntroNext}
              >
                J'ai compris !
              </button>
            </>
          )}
        </div>
      )}

      {/* Question phase */}
      {!showIntro && (
        <div className="session-question">
          <div className="session-question-text">
            {currentQuestion.displayA}
            <span className="operator">{'\u00D7'}</span>
            {currentQuestion.displayB}
            <span className="equals">=</span>
          </div>
          <div className="session-numpad-area">
            <NumPad onSubmit={handleAnswer} disabled={numpadDisabled} />
          </div>
        </div>
      )}

      {/* Feedback overlay */}
      {feedback && (
        <FeedbackOverlay
          correct={feedback.correct}
          fast={feedback.fast}
          slow={feedback.slow}
          correctAnswer={feedback.correctAnswer}
          fact={feedback.fact}
          onDismiss={handleFeedbackDismiss}
        />
      )}
    </div>
  );
}
