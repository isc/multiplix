import { useState, useRef, useCallback, useEffect } from 'react';
import type { SessionQuestion, SessionResult, MultiFact, BoxLevel } from '../types';
import NumPad from '../components/NumPad';
import VoiceInput from '../components/VoiceInput';
import DotGrid from '../components/DotGrid';
import FeedbackOverlay from '../components/FeedbackOverlay';
import Mascot from '../components/Mascot';
import StrategyHint from '../components/StrategyHint';
import { RESPONSE_TIME } from '../types';
import { getFactKey } from '../lib/facts';
import { getStrategy, hasStrategy } from '../lib/strategies';
import { todayISO } from '../lib/utils';
import { useSound } from '../hooks/useSound';
import { useTTS } from '../hooks/useTTS';
import { useInputMode } from '../hooks/useInputMode';
import './SessionScreen.css';

// Voice mode: lower UI-feedback thresholds since oral recall is faster than typing.
// Leitner promotion still uses RESPONSE_TIME.SLOW (5000 ms) — see audit §5.
const VOICE_FEEDBACK_FAST = 2000;
const VOICE_FEEDBACK_SLOW = 3000;

interface SessionScreenProps {
  questions: SessionQuestion[];
  onComplete: (result: SessionResult) => void;
  onAnswer: (
    fact: MultiFact,
    correct: boolean,
    timeMs: number,
    answered: number | null,
    isBonusReview: boolean,
  ) => void;
}

interface QuestionResult {
  correct: boolean;
}

type IntroStep = 'grid' | 'commute' | 'strategy';

export default function SessionScreen({
  questions: initialQuestions,
  onComplete,
  onAnswer,
}: SessionScreenProps) {
  const [questions, setQuestions] = useState<SessionQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState<IntroStep>('grid');
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    fast: boolean;
    slow: boolean;
    correctAnswer: number;
    fact: { a: number; b: number };
    factBox: BoxLevel;
  } | null>(null);
  const [numpadDisabled, setNumpadDisabled] = useState(false);
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy'>('idle');

  const { isMuted, playCorrect, playIncorrect } = useSound();
  const { speak, stop: stopSpeech, isSpeaking } = useTTS(isMuted);
  const { inputMode } = useInputMode();

  const speakQuestion = useCallback(
    (q: SessionQuestion) => speak(`q-${q.displayA}-${q.displayB}`),
    [speak],
  );
  const mascotMoodTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStartTime = useRef(0);
  const correctCount = useRef(0);
  const totalTimeMs = useRef(0);
  const promotedFacts = useRef(new Set<string>());
  const demotedFacts = useRef(new Set<string>());
  const introducedFacts = useRef(new Set<string>());

  const currentQuestion = questions[currentIndex] as SessionQuestion | undefined;

  // Adjust UI state when the question changes (render-time)
  const [prevIndex, setPrevIndex] = useState(-1);
  if (currentIndex !== prevIndex && currentQuestion) {
    setPrevIndex(currentIndex);
    if (currentQuestion.isIntroduction) {
      setShowIntro(true);
      setIntroStep('grid');
    } else {
      setShowIntro(false);
    }
    setNumpadDisabled(false);
  }

  // Clean up mascot mood timeout on unmount
  useEffect(() => {
    return () => {
      if (mascotMoodTimeout.current) clearTimeout(mascotMoodTimeout.current);
    };
  }, []);

  // Side effects when the question changes (TTS, timer, tracking)
  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.isIntroduction) {
      introducedFacts.current.add(getFactKey(currentQuestion.fact.a, currentQuestion.fact.b));
      const { a, b } = currentQuestion.fact;
      speak(`intro-${a}-${b}`);
    } else {
      speakQuestion(currentQuestion);
    }

    questionStartTime.current = Date.now();
  }, [currentIndex, currentQuestion, speak, speakQuestion]);

  // In voice mode, start the response timer when the TTS finishes so we
  // don't count the question playback against the user's response time.
  useEffect(() => {
    if (inputMode !== 'voice') return;
    if (showIntro) return;
    if (!isSpeaking) {
      questionStartTime.current = Date.now();
    }
  }, [isSpeaking, inputMode, showIntro, currentIndex]);

  const moveToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Session complete
      const totalQuestions = results.length + (feedback ? 1 : 0);
      const avgTime =
        totalQuestions > 0 ? totalTimeMs.current / totalQuestions : 0;

      onComplete({
        date: todayISO(),
        questionsCount: questions.length,
        correctCount: correctCount.current,
        averageTimeMs: Math.round(avgTime),
        newFactsIntroduced: introducedFacts.current.size,
        factsPromoted: promotedFacts.current.size,
        factsDemoted: demotedFacts.current.size,
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, questions, results.length, feedback, onComplete]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (!currentQuestion || numpadDisabled) return;
      setNumpadDisabled(true);
      stopSpeech();

      const timeMs = Date.now() - questionStartTime.current;
      const correct = value === currentQuestion.fact.product;
      const fastThreshold = inputMode === 'voice' ? VOICE_FEEDBACK_FAST : RESPONSE_TIME.FAST;
      const slowThreshold = inputMode === 'voice' ? VOICE_FEEDBACK_SLOW : RESPONSE_TIME.SLOW;
      const fast = correct && timeMs < fastThreshold;
      const slow = correct && timeMs >= slowThreshold;

      totalTimeMs.current += timeMs;
      if (correct) correctCount.current++;

      // Track distinct promoted/demoted facts (skip for bonus review)
      if (!currentQuestion.isBonusReview) {
        const factKey = getFactKey(currentQuestion.fact.a, currentQuestion.fact.b);
        if (correct && timeMs < RESPONSE_TIME.SLOW) {
          promotedFacts.current.add(factKey);
        }
        if (!correct) {
          demotedFacts.current.add(factKey);
        }
      }

      if (correct) playCorrect();
      else playIncorrect();

      // React mascot mood — jamais de moue/déception : seulement content ou neutre
      if (mascotMoodTimeout.current) clearTimeout(mascotMoodTimeout.current);
      if (correct) {
        setMascotMood('happy');
        mascotMoodTimeout.current = setTimeout(() => setMascotMood('idle'), 1500);
      } else {
        setMascotMood('idle');
      }

      // Notify parent (App) to update Leitner state
      onAnswer(currentQuestion.fact, correct, timeMs, value, currentQuestion.isBonusReview);

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
        factBox: currentQuestion.fact.box,
      });

      // Speak the strategy hint when it's shown on the incorrect overlay
      // (gated by box ≤ 2 in FeedbackOverlay — kept in sync here).
      if (
        !correct &&
        currentQuestion.fact.box <= 2 &&
        hasStrategy(currentQuestion.fact.a, currentQuestion.fact.b)
      ) {
        speak(`strategy-${currentQuestion.fact.a}-${currentQuestion.fact.b}`);
      }
    },
    [currentQuestion, numpadDisabled, currentIndex, questions.length, onAnswer, playCorrect, playIncorrect, stopSpeech, speak, inputMode],
  );

  const handleFeedbackDismiss = useCallback(() => {
    setFeedback(null);
    moveToNext();
  }, [moveToNext]);

  const handleIntroNext = useCallback(() => {
    if (!currentQuestion) return;
    const { a, b } = currentQuestion.fact;
    const isSquare = a === b;

    const goToStrategyOrFinish = () => {
      if (hasStrategy(a, b)) {
        setIntroStep('strategy');
        speak(`strategy-${a}-${b}`);
      } else {
        setShowIntro(false);
        questionStartTime.current = Date.now();
        speakQuestion(currentQuestion);
      }
    };

    if (introStep === 'grid') {
      // Skip commutativity step for square numbers (a === b) — it's nonsensical
      if (isSquare) {
        goToStrategyOrFinish();
      } else {
        setIntroStep('commute');
        speak(`comm-${a}-${b}`);
      }
    } else if (introStep === 'commute') {
      goToStrategyOrFinish();
    } else {
      // 'strategy' step → start the question
      setShowIntro(false);
      questionStartTime.current = Date.now();
      speakQuestion(currentQuestion);
    }
  }, [introStep, currentQuestion, speak, speakQuestion]);

  if (!currentQuestion) {
    return null;
  }

  const introStrategy =
    introStep === 'strategy'
      ? getStrategy(currentQuestion.fact.a, currentQuestion.fact.b)
      : null;

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
            <Mascot mood={mascotMood} size="small" />
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
          ) : introStep === 'commute' ? (
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
                Suivant
              </button>
            </>
          ) : (
            <>
              {introStrategy && <StrategyHint strategy={introStrategy} variant="intro" />}
              <div className="session-intro-explanation">
                Une petite astuce pour s'en souvenir !
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
            {inputMode === 'voice' ? (
              <VoiceInput
                onSubmit={handleAnswer}
                disabled={numpadDisabled}
                isSpeaking={isSpeaking}
                questionToken={`${currentQuestion.displayA}-${currentQuestion.displayB}-${currentIndex}`}
                expectedValue={currentQuestion.fact.product}
              />
            ) : (
              <NumPad onSubmit={handleAnswer} disabled={numpadDisabled} />
            )}
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
          factBox={feedback.factBox}
          onDismiss={handleFeedbackDismiss}
        />
      )}
    </div>
  );
}
