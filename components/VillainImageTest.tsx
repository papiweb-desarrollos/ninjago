import React from 'react';
import { getAssetPath } from '../constants';

const VILLAIN_IMAGES = [
  'lord-vortech-as-a-ninjago-villain-v0-3mpyxo2gwx5f1.webp',
  'Ninja_Hero_Frak_29.webp',
  'what-is-the-oni-form-of-garmadon.webp',
  'LAND_16_9 (1).jpg',
  'images (1)jj.jpg',
  'FangtomS1.webp'
];

const VillainImageTest: React.FC = () => {
  const [imageStates, setImageStates] = React.useState<{[key: string]: 'loading' | 'loaded' | 'error'}>({});

  const handleImageLoad = (imageName: string) => {
    setImageStates(prev => ({ ...prev, [imageName]: 'loaded' }));
  };

  const handleImageError = (imageName: string) => {
    setImageStates(prev => ({ ...prev, [imageName]: 'error' }));
  };

  React.useEffect(() => {
    // Inicializar todos los estados como "loading"
    const initialStates: {[key: string]: 'loading' | 'loaded' | 'error'} = {};
    VILLAIN_IMAGES.forEach(img => {
      initialStates[img] = 'loading';
    });
    setImageStates(initialStates);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">
        Test de Imágenes de Villanos - Ninjago
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {VILLAIN_IMAGES.map((imageName, index) => {
          const fullPath = getAssetPath(`/pictures/villains/${imageName}`);
          const state = imageStates[imageName] || 'loading';
          
          return (
            <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white text-sm font-medium mb-4 break-all">
                {imageName}
              </h3>
              
              <div className="relative w-48 h-48 mx-auto mb-4">
                <img
                  src={fullPath}
                  alt={`Villano ${index + 1}`}
                  className="w-full h-full object-cover rounded-full border-4 border-red-500 shadow-lg"
                  onLoad={() => handleImageLoad(imageName)}
                  onError={() => handleImageError(imageName)}
                />
                
                {/* Overlay de estado */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {state === 'loading' && (
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      Cargando...
                    </div>
                  )}
                  {state === 'error' && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                      Error
                    </div>
                  )}
                  {state === 'loaded' && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-xs opacity-75">
                      ✓ OK
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 text-xs mb-2">
                  Ruta: {fullPath}
                </p>
                <div className={`inline-block px-2 py-1 rounded text-xs ${
                  state === 'loaded' ? 'bg-green-600 text-white' :
                  state === 'error' ? 'bg-red-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {state === 'loaded' ? '✅ Cargada' :
                   state === 'error' ? '❌ Error' :
                   '⏳ Cargando'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-gray-800 rounded-lg p-4 inline-block">
          <h2 className="text-white text-lg font-bold mb-2">Resumen</h2>
          <p className="text-gray-300">
            Cargadas: {Object.values(imageStates).filter(s => s === 'loaded').length} / {VILLAIN_IMAGES.length}
          </p>
          <p className="text-gray-300">
            Errores: {Object.values(imageStates).filter(s => s === 'error').length}
          </p>
          <p className="text-gray-300">
            Cargando: {Object.values(imageStates).filter(s => s === 'loading').length}
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button 
          onClick={() => window.history.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Volver al juego
        </button>
      </div>
    </div>
  );
};

export default VillainImageTest;
