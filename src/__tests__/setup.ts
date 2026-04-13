// Vitest setup file — runs once per test file before the tests.
//
// jsdom ships a lot of the DOM but not the Web Audio API. `useSound` instantiates
// `new AudioContext()` as soon as a question is answered, which would throw in
// jsdom. We stub it with a minimal no-op implementation so the real `useSound`
// hook can run unchanged inside the tests.

class FakeAudioParam {
  setValueAtTime(): void {}
  linearRampToValueAtTime(): void {}
}

class FakeGainNode {
  gain = new FakeAudioParam();
  connect(): void {}
}

class FakeOscillatorNode {
  type = 'sine';
  frequency = new FakeAudioParam();
  connect(): void {}
  start(): void {}
  stop(): void {}
}

class FakeAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  createOscillator(): OscillatorNode {
    return new FakeOscillatorNode() as unknown as OscillatorNode;
  }
  createGain(): GainNode {
    return new FakeGainNode() as unknown as GainNode;
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
}

// Install on both window and globalThis so any access path finds it.
(globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext =
  FakeAudioContext as unknown as typeof AudioContext;
(globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext =
  FakeAudioContext as unknown as typeof AudioContext;

// jsdom doesn't implement HTMLMediaElement.play/pause — stub them so useTTS can
// call `audio.play().catch(...)` without throwing.
// (Guarded so tests that opt into `node` environment don't crash.)
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function () {};
}
