import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, SessionQuestion, SessionResult, MultiFact, Badge, BoxLevel } from './types';
import { BOX_INTERVALS } from './types';
import { composeSession } from './lib/sessionComposer';
import { processAnswer, addDays } from './lib/leitner';
import { checkBadges, computeMascotLevel } from './lib/badges';
import { loadProfile, saveProfile, createNewProfile } from './lib/storage';
import { getFactKey } from './lib/facts';
import type { PlacementResult } from './screens/WelcomeScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import SessionScreen from './screens/SessionScreen';
import RecapScreen from './screens/RecapScreen';
import ProgressScreen from './screens/ProgressScreen';
import BadgesScreen from './screens/BadgesScreen';
import ParentDashboard from './screens/ParentDashboard';
import './App.css';

type Screen =
  | 'welcome'
  | 'home'
  | 'session'
  | 'recap'
  | 'progress'
  | 'badges'
  | 'parent';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Track session stats for badge checking
  const sessionConsecutiveCorrect = useRef(0);
  const sessionMaxConsecutiveCorrect = useRef(0);
  const sessionResponseTimes = useRef<number[]>([]);

  // Load profile from localStorage on mount
  useEffect(() => {
    const stored = loadProfile();
    if (stored) {
      setProfile(stored);
      setScreen('home');
    } else {
      setScreen('welcome');
    }
    setLoading(false);
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (profile) {
      saveProfile(profile);
    }
  }, [profile]);

  // Welcome: create new profile with optional placement test results
  const handleWelcomeComplete = useCallback((name: string, placementResults: PlacementResult[]) => {
    const newProfile = createNewProfile(name);
    const today = new Date().toISOString().slice(0, 10);

    // Apply placement test results to calibrate initial box levels
    if (placementResults.length > 0) {
      for (const result of placementResults) {
        const fact = newProfile.facts.find((f) => getFactKey(f.a, f.b) === result.factKey);
        if (!fact) continue;

        fact.introduced = true;
        fact.lastSeen = today;

        if (result.correct && result.timeMs < 3000) {
          // Fast and correct → box 3 (well known)
          fact.box = 3 as BoxLevel;
        } else if (result.correct && result.timeMs < 5000) {
          // Correct but slower → box 2
          fact.box = 2 as BoxLevel;
        } else {
          // Incorrect or very slow → box 1
          fact.box = 1 as BoxLevel;
        }

        fact.nextDue = addDays(today, BOX_INTERVALS[fact.box]);
        fact.history = [{
          date: today,
          correct: result.correct,
          responseTimeMs: result.timeMs,
          answeredWith: null,
        }];
      }
    }

    setProfile(newProfile);
    setScreen('home');
  }, []);

  // Start session
  const handleStartSession = useCallback(() => {
    if (!profile) return;

    const today = new Date().toISOString().slice(0, 10);
    const questions = composeSession(profile, today);

    // Reset session tracking
    sessionConsecutiveCorrect.current = 0;
    sessionMaxConsecutiveCorrect.current = 0;
    sessionResponseTimes.current = [];

    if (questions.length === 0) {
      // No questions due -- could happen if everything is mastered and not due
      setSessionQuestions([]);
      setScreen('home');
      return;
    }

    setSessionQuestions(questions);
    setScreen('session');
  }, [profile]);

  // Handle individual answer (update Leitner state in real-time)
  const handleAnswer = useCallback(
    (fact: MultiFact, correct: boolean, timeMs: number, answered: number | null) => {
      if (!profile) return;

      // Track session stats for badges
      sessionResponseTimes.current.push(timeMs);
      if (correct) {
        sessionConsecutiveCorrect.current++;
        sessionMaxConsecutiveCorrect.current = Math.max(
          sessionMaxConsecutiveCorrect.current,
          sessionConsecutiveCorrect.current,
        );
      } else {
        sessionConsecutiveCorrect.current = 0;
      }

      const today = new Date().toISOString().slice(0, 10);
      const updatedFact = processAnswer(fact, correct, timeMs, today);

      // Add the answered value to the latest attempt
      if (updatedFact.history.length > 0) {
        updatedFact.history[updatedFact.history.length - 1].answeredWith = answered;
      }

      // Mark as introduced if it was an introduction
      if (!updatedFact.introduced) {
        updatedFact.introduced = true;
      }

      setProfile((prev) => {
        if (!prev) return prev;
        const updatedFacts = prev.facts.map((f) =>
          f.a === fact.a && f.b === fact.b ? updatedFact : f,
        );
        return { ...prev, facts: updatedFacts };
      });
    },
    [profile],
  );

  // Session complete
  const handleSessionComplete = useCallback(
    (result: SessionResult) => {
      if (!profile) return;

      const today = new Date().toISOString().slice(0, 10);

      // Update streak
      let currentStreak = profile.currentStreak;
      let longestStreak = profile.longestStreak;

      if (profile.lastSessionDate) {
        const lastDate = new Date(profile.lastSessionDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          // Consecutive day
          currentStreak += 1;
        } else if (diffDays === 0) {
          // Same day, don't change streak
        } else {
          // Streak broken
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);

      const updatedProfile: UserProfile = {
        ...profile,
        totalSessions: profile.totalSessions + 1,
        currentStreak,
        longestStreak,
        lastSessionDate: today,
      };

      // Compute mascot level with the updated profile
      updatedProfile.mascotLevel = computeMascotLevel(updatedProfile);

      // Check for new badges with session stats
      const sessionStats = {
        consecutiveCorrect: sessionMaxConsecutiveCorrect.current,
        fastAnswers: sessionResponseTimes.current,
      };
      const earned = checkBadges(updatedProfile, sessionStats);
      const previousBadgeIds = new Set(profile.badges.map((b) => b.id));
      const brandNewBadges = earned.filter((b) => !previousBadgeIds.has(b.id));

      updatedProfile.badges = [
        ...profile.badges,
        ...brandNewBadges,
      ];

      setProfile(updatedProfile);
      setSessionResult(result);
      setNewBadges(brandNewBadges);
      setScreen('recap');
    },
    [profile],
  );

  // Recap done
  const handleRecapFinish = useCallback(() => {
    setSessionResult(null);
    setNewBadges([]);
    setScreen('home');
  }, []);

  // Export data
  const handleExport = useCallback(() => {
    if (!profile) return;
    const json = JSON.stringify(profile, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multiplix-${profile.name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  // Import data
  const handleImport = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as UserProfile;
      if (parsed.name && parsed.facts) {
        setProfile(parsed);
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="app-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === 'welcome' && (
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      )}

      {screen === 'home' && profile && (
        <HomeScreen
          profile={profile}
          onStart={handleStartSession}
          onShowProgress={() => setScreen('progress')}
          onShowBadges={() => setScreen('badges')}
          onShowParent={() => setScreen('parent')}
        />
      )}

      {screen === 'session' && profile && sessionQuestions.length > 0 && (
        <SessionScreen
          questions={sessionQuestions}
          onComplete={handleSessionComplete}
          onAnswer={handleAnswer}
        />
      )}

      {screen === 'recap' && profile && sessionResult && (
        <RecapScreen
          result={sessionResult}
          newBadges={newBadges}
          mascotLevel={profile.mascotLevel}
          onFinish={handleRecapFinish}
        />
      )}

      {screen === 'progress' && profile && (
        <ProgressScreen profile={profile} onBack={() => setScreen('home')} />
      )}

      {screen === 'badges' && profile && (
        <BadgesScreen
          earnedBadges={profile.badges}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'parent' && profile && (
        <ParentDashboard
          profile={profile}
          onBack={() => setScreen('home')}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
