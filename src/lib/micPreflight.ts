// Demande la permission micro maintenant, en consommant un geste utilisateur
// valide (requis par iOS pour getUserMedia). Stoppe immédiatement le stream :
// on ne veut pas garder le micro ouvert, on pré-arme juste la permission pour
// qu'elle soit déjà accordée quand SpeechRecognition.start() sera appelé.
//
// À awaiter avant d'entrer en séance, sinon la première question (et son
// timer) démarrerait pendant que l'utilisateur décide.
export async function preflightMicPermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // Refus, contexte non sécurisé, etc. : on retombera sur le prompt natif
    // de SpeechRecognition.start() en séance.
  }
}
