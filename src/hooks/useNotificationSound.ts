import { useCallback, useRef } from 'react';

type SoundType = 'alert' | 'success' | 'warning' | 'urgent';

// Audio frequencies for different notification types
const SOUND_CONFIGS: Record<SoundType, { frequencies: number[]; durations: number[]; type: OscillatorType }> = {
  alert: {
    frequencies: [880, 988, 1047],
    durations: [100, 100, 150],
    type: 'sine'
  },
  success: {
    frequencies: [523, 659, 784],
    durations: [100, 100, 200],
    type: 'sine'
  },
  warning: {
    frequencies: [440, 349, 440],
    durations: [150, 150, 200],
    type: 'triangle'
  },
  urgent: {
    frequencies: [880, 660, 880, 660, 880],
    durations: [100, 100, 100, 100, 200],
    type: 'square'
  }
};

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType, startTime: number, volume: number = 0.3) => {
    const audioContext = getAudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration / 1000 * 0.7);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration / 1000);
  }, [getAudioContext]);

  const playSound = useCallback((soundType: SoundType = 'alert') => {
    // Check if sound is enabled
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved === 'false') return;

    try {
      const audioContext = getAudioContext();
      
      // Resume audio context if suspended (required for autoplay policies)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const config = SOUND_CONFIGS[soundType];
      let currentTime = audioContext.currentTime;

      config.frequencies.forEach((freq, index) => {
        playTone(freq, config.durations[index], config.type, currentTime);
        currentTime += config.durations[index] / 1000;
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [getAudioContext, playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem('notificationSoundEnabled', String(enabled));
  }, []);

  const isEnabled = useCallback(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== 'false';
  }, []);

  // Test sound
  const testSound = useCallback((soundType: SoundType = 'alert') => {
    playSound(soundType);
  }, [playSound]);

  return {
    playSound,
    testSound,
    setEnabled,
    isEnabled,
  };
}
