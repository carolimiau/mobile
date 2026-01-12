import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

class TTSService {
  private isSpeaking = false;
  private backgroundMusic: Audio.Sound | null = null;
  private currentNarration: string | null = null;

  async speak(text: string, options?: Speech.SpeechOptions) {
    try {
      // Si ya está hablando, detener primero
      if (this.isSpeaking) {
        console.log('🔄 TTS ya está hablando, deteniendo...');
        await this.forceStop();
        // Esperar un poco para asegurar que se detuvo
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.isSpeaking = true;
      this.currentNarration = text;
      
      console.log('🎤 Iniciando TTS...');
      
      // Iniciar música de fondo suave (No bloquear el habla si la música tarda)
      this.startBackgroundMusic().catch(err => console.log('⚠️ Error música async:', err));
      
      return Speech.speak(text, {
        language: 'es-MX', // Español de México
        pitch: 1.0, // Pitch natural
        rate: 0.95, // Velocidad casi natural pero comprensible
        onDone: () => {
          console.log('✅ TTS completado');
          this.isSpeaking = false;
          this.currentNarration = null;
          this.stopBackgroundMusic();
          options?.onDone?.();
        },
        onStopped: () => {
          console.log('⏹️ TTS detenido');
          this.isSpeaking = false;
          this.currentNarration = null;
          this.stopBackgroundMusic();
          options?.onStopped?.();
        },
        onError: (error) => {
          console.error('❌ Error en TTS:', error);
          this.isSpeaking = false;
          this.currentNarration = null;
          this.stopBackgroundMusic();
          options?.onError?.(error);
        },
        ...options,
      });
    } catch (error) {
      console.error('❌ Error al iniciar TTS:', error);
      this.isSpeaking = false;
      this.currentNarration = null;
      await this.stopBackgroundMusic();
      throw error;
    }
  }

  async startBackgroundMusic() {
    try {
      // Si ya hay música, no reiniciar
      if (this.backgroundMusic) {
        console.log('🎵 Música de fondo ya está activa');
        return;
      }

      console.log('🎵 Iniciando música de fondo...');
      
      // URLs de música ambient/lounge más confiables
      const musicUrl = 'https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample.mp3';
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 0.20, // Volumen más alto (20%) - más audible
          rate: 0.85, // Más lenta para crear ambiente relajado
          shouldCorrectPitch: true,
          isMuted: false,
        }
      );
      
      this.backgroundMusic = sound;
      console.log('✅ Música de fondo iniciada');
    } catch (error) {
      console.log('⚠️ No se pudo reproducir música de fondo:', error);
      // Continuar sin música si hay error (no es crítico)
      this.backgroundMusic = null;
    }
  }

  async stopBackgroundMusic() {
    try {
      if (this.backgroundMusic) {
        console.log('🔇 Deteniendo música de fondo...');
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.unloadAsync();
        this.backgroundMusic = null;
      }
    } catch (error) {
      console.log('⚠️ Error al detener música de fondo:', error);
      this.backgroundMusic = null;
    }
  }

  async stop() {
    if (this.isSpeaking) {
      console.log('⏹️ Deteniendo TTS...');
      Speech.stop();
      this.isSpeaking = false;
      this.currentNarration = null;
      await this.stopBackgroundMusic();
    }
  }

  // Forzar detención sin verificar estado
  private async forceStop() {
    try {
      Speech.stop();
      this.isSpeaking = false;
      this.currentNarration = null;
      await this.stopBackgroundMusic();
    } catch (error) {
      console.error('⚠️ Error al forzar detención:', error);
    }
  }

  pause() {
    if (this.isSpeaking) {
      console.log('⏸️ Pausando TTS...');
      Speech.pause();
    }
  }

  resume() {
    if (this.isSpeaking) {
      console.log('▶️ Reanudando TTS...');
      Speech.resume();
    }
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  getCurrentNarration(): string | null {
    return this.currentNarration;
  }

  generateVehicleNarration(vehicle: any): string {
    const parts = [
      `${vehicle.brand} ${vehicle.model} del año ${vehicle.year}.`,
    ];

    if (vehicle.kilometers) {
      parts.push(`Con ${this.formatKilometersForSpeech(vehicle.kilometers)} kilómetros recorridos.`);
    }

    parts.push(`Cuenta con transmisión ${vehicle.transmission} y motor ${vehicle.fuelType}.`);

    if (vehicle.price) {
      parts.push(`Y lo mejor, su precio es de ${this.formatPriceForSpeech(vehicle.price)}.`);
    }

    if (vehicle.description) {
      parts.push(vehicle.description);
    }

    if (vehicle.observations) {
      parts.push(`Ten en cuenta: ${vehicle.observations}`);
    }

    parts.push('¡Una excelente oportunidad que no puedes dejar pasar!');

    return parts.join(' ');
  }

  private formatKilometers(km: number): string {
    return km.toLocaleString('es-CL');
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('es-CL');
  }

  // Funciones para formatear números para TTS
  private formatKilometersForSpeech(km: number): string {
    if (km < 1000) {
      return `${km}`;
    } else if (km < 10000) {
      const thousands = Math.floor(km / 1000);
      const hundreds = km % 1000;
      if (hundreds === 0) {
        return `${thousands} mil`;
      }
      return `${thousands} mil ${hundreds}`;
    } else if (km < 100000) {
      const thousands = Math.round(km / 1000);
      return `${thousands} mil`;
    } else {
      const thousands = Math.round(km / 1000);
      return `${thousands} mil`;
    }
  }

  private formatPriceForSpeech(price: number): string {
    // Redondear a millones o miles para hacerlo más natural
    if (price >= 1000000) {
      const millions = price / 1000000;
      if (millions === Math.floor(millions)) {
        return `${Math.floor(millions)} ${millions === 1 ? 'millón' : 'millones'} de pesos`;
      }
      const roundedMillions = Math.round(millions * 10) / 10;
      const millionsText = roundedMillions.toString().replace('.', ' punto ');
      return `${millionsText} millones de pesos`;
    } else if (price >= 100000) {
      const thousands = Math.round(price / 1000);
      return `${thousands} mil pesos`;
    } else if (price >= 1000) {
      const thousands = Math.floor(price / 1000);
      const hundreds = Math.round((price % 1000) / 100) * 100;
      if (hundreds === 0) {
        return `${thousands} mil pesos`;
      }
      return `${thousands} mil ${hundreds} pesos`;
    } else {
      return `${price} pesos`;
    }
  }
}

export default new TTSService();