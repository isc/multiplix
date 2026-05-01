// AudioContext partagé entre useSound (bips Web Audio) et useTTS (lecture
// MP3 décodée via decodeAudioData). Avoir une seule instance par page évite
// les conflits iOS et permet à `getAudioContext` d'être idempotent.
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}
