export class NativeSounds {
  private static audioCtx: AudioContext | null = null;

  private static init() {
    if (typeof window !== 'undefined' && !this.audioCtx) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContext();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Web Audio API not supported", e);
      }
    }
  }

  private static playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.audioCtx) return;

    try {
      // Resume if suspended (browsers block audio until user interaction)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to play tone", e);
    }
  }

  /**
   * Light click for navigation and tabs
   */
  static playClick() {
    // A very short, low volume "tick" sound
    this.playTone(800, 'sine', 0.05, 0.03);
  }

  /**
   * Success sound for completing an action
   */
  static playSuccess() {
    this.init();
    if (!this.audioCtx) return;
    
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      // Play two ascending notes rapidly
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.3);
     
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) { /* ignore */ }
  }

  /**
   * Warning / Error sound
   */
  static playError() {
    // Low pitched buzz
    this.playTone(150, 'sawtooth', 0.3, 0.08);
  }
}
