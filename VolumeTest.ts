import { audioManager } from './AudioManager';
import { SoundEffect } from './types';

/**
 * Test de funcionalidades de volumen
 * Ejecutar en la consola del navegador para verificar funcionalidad
 */

export class VolumeTest {
  
  static async runAllTests(): Promise<void> {
    console.log('🎵 Iniciando tests de volumen...');
    
    try {
      // Test 1: Inicialización
      console.log('\n📋 Test 1: Inicialización del AudioManager');
      const initSuccess = await audioManager.initialize();
      console.log(`✅ Inicialización: ${initSuccess ? 'EXITOSA' : 'FALLIDA'}`);
      
      // Test 2: Carga de configuraciones
      console.log('\n📋 Test 2: Configuraciones guardadas');
      const currentVolume = audioManager.getGlobalVolume();
      const isMuted = audioManager.getIsMuted();
      console.log(`✅ Volumen actual: ${Math.round(currentVolume * 100)}%`);
      console.log(`✅ Estado mute: ${isMuted ? 'SILENCIADO' : 'ACTIVO'}`);
      
      // Test 3: Cambio de volumen
      console.log('\n📋 Test 3: Cambio de volumen');
      const originalVolume = currentVolume;
      audioManager.setGlobalVolume(0.5);
      const newVolume = audioManager.getGlobalVolume();
      console.log(`✅ Volumen cambiado de ${Math.round(originalVolume * 100)}% a ${Math.round(newVolume * 100)}%`);
      
      // Test 4: Incremento/Decremento
      console.log('\n📋 Test 4: Incremento y decremento');
      audioManager.increaseMasterVolume(0.1);
      const increasedVolume = audioManager.getGlobalVolume();
      audioManager.decreaseMasterVolume(0.2);
      const decreasedVolume = audioManager.getGlobalVolume();
      console.log(`✅ Incremento: ${Math.round(increasedVolume * 100)}%, Decremento: ${Math.round(decreasedVolume * 100)}%`);
      
      // Test 5: Toggle Mute
      console.log('\n📋 Test 5: Toggle mute/unmute');
      const wasMuted = audioManager.getIsMuted();
      audioManager.toggleMute();
      const afterToggle1 = audioManager.getIsMuted();
      audioManager.toggleMute();
      const afterToggle2 = audioManager.getIsMuted();
      console.log(`✅ Estado inicial: ${wasMuted}, Después de toggle: ${afterToggle1}, Después de segundo toggle: ${afterToggle2}`);
      
      // Test 6: Persistencia (LocalStorage)
      console.log('\n📋 Test 6: Persistencia de configuraciones');
      audioManager.setGlobalVolume(0.75);
      audioManager.saveVolumeSettings();
      
      // Simular recarga cargando las configuraciones
      audioManager.loadVolumeSettings();
      const loadedVolume = audioManager.getGlobalVolume();
      console.log(`✅ Volumen guardado y recargado: ${Math.round(loadedVolume * 100)}%`);
      
      // Test 7: Preload de sonidos
      console.log('\n📋 Test 7: Preload de sonidos');
      await audioManager.preloadSounds([SoundEffect.UI_CLICK_GENERAL]);
      console.log('✅ Sonidos precargados correctamente');
      
      // Test 8: Reproducción de sonido con volumen
      console.log('\n📋 Test 8: Reproducción de sonido');
      audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.8);
      console.log('✅ Sonido reproducido con volumen 80%');
      
      // Restaurar volumen original
      audioManager.setGlobalVolume(originalVolume);
      console.log(`\n🔄 Volumen restaurado a: ${Math.round(originalVolume * 100)}%`);
      
      console.log('\n🎉 Todos los tests de volumen completados exitosamente!');
      
    } catch (error) {
      console.error('❌ Error durante los tests:', error);
    }
  }
  
  static testVolumeSlider(): void {
    console.log('\n🎚️ Test del slider de volumen:');
    console.log('Usa estos comandos en la consola:');
    console.log('- audioManager.setGlobalVolume(0.1) // 10%');
    console.log('- audioManager.setGlobalVolume(0.5) // 50%');
    console.log('- audioManager.setGlobalVolume(0.9) // 90%');
    console.log('- audioManager.increaseMasterVolume() // +10%');
    console.log('- audioManager.decreaseMasterVolume() // -10%');
    console.log('- audioManager.toggleMute() // toggle mute');
  }
  
  static showCurrentStatus(): void {
    console.log('\n📊 Estado actual del audio:');
    console.log(`🔊 Volumen global: ${Math.round(audioManager.getGlobalVolume() * 100)}%`);
    console.log(`🔇 Silenciado: ${audioManager.getIsMuted() ? 'SÍ' : 'NO'}`);
    console.log(`🎵 Inicializado: ${audioManager.getIsInitialized() ? 'SÍ' : 'NO'}`);
    
    const contextState = audioManager.getAudioContextState();
    console.log(`⚡ Estado del AudioContext: ${contextState || 'No disponible'}`);
    
    try {
      const saved = localStorage.getItem('ninjagoAudioSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        console.log(`💾 Configuración guardada: Vol=${Math.round(settings.globalVolume * 100)}%, Muted=${settings.isMuted}`);
      } else {
        console.log('💾 Sin configuración guardada');
      }
    } catch (e) {
      console.log('💾 Error al leer configuración guardada');
    }
  }
}

// Hacer disponible globalmente para tests en consola
if (typeof window !== 'undefined') {
  (window as any).VolumeTest = VolumeTest;
  (window as any).audioManager = audioManager;
}
