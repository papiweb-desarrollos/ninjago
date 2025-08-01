#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎬 VERIFICADOR DE RUTAS DE VIDEOS - NINJAGO GAME');
console.log('==================================================\n');

// Leer el archivo constants.tsx para extraer información de videos
const constantsPath = path.join(__dirname, 'constants.tsx');
const videosDir = path.join(__dirname, 'public', 'videos');

function readVideoDirectoryFiles() {
  try {
    const files = fs.readdirSync(videosDir);
    return files.filter(file => file.endsWith('.mp4'));
  } catch (error) {
    console.error('❌ Error leyendo directorio de videos:', error.message);
    return [];
  }
}

function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    // Verificar si es un archivo Git LFS
    if (stats.size < 1000) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('git-lfs.github.com')) {
        const sizeMatch = content.match(/size (\d+)/);
        const actualSize = sizeMatch ? parseInt(sizeMatch[1]) : 0;
        const actualSizeInMB = (actualSize / (1024 * 1024)).toFixed(2);
        return {
          size: stats.size,
          actualSize: actualSize,
          isGitLFS: true,
          displaySize: `${actualSizeInMB}MB (Git LFS)`,
          status: actualSize > 0 ? 'LFS_TRACKED' : 'MISSING'
        };
      }
    }
    
    return {
      size: stats.size,
      actualSize: stats.size,
      isGitLFS: false,
      displaySize: `${sizeInMB}MB`,
      status: stats.size > 1000000 ? 'AVAILABLE' : 'SMALL_FILE'
    };
  } catch (error) {
    return {
      size: 0,
      actualSize: 0,
      isGitLFS: false,
      displaySize: 'NO ENCONTRADO',
      status: 'MISSING'
    };
  }
}

function extractVideoInfoFromConstants() {
  try {
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    // Extraer el array VIDEO_CATALOG usando regex
    const catalogMatch = content.match(/export const VIDEO_CATALOG: VideoInfo\[\] = \[([\s\S]*?)\];/);
    if (!catalogMatch) {
      console.error('❌ No se pudo encontrar VIDEO_CATALOG en constants.tsx');
      return [];
    }
    
    const catalogContent = catalogMatch[1];
    
    // Extraer cada video usando regex
    const videoRegex = /\{\s*id:\s*["']([^"']+)["'],\s*title:\s*["']([^"']+)["'],\s*fileName:\s*["']([^"']+)["'],\s*path:\s*getAssetPath\(["']([^"']+)["']\),\s*description:\s*["']([^"']+)["']\s*\}/g;
    
    const videos = [];
    let match;
    
    while ((match = videoRegex.exec(catalogContent)) !== null) {
      videos.push({
        id: match[1],
        title: match[2],
        fileName: match[3],
        path: match[4].replace('/videos/', ''),
        description: match[5]
      });
    }
    
    return videos;
  } catch (error) {
    console.error('❌ Error leyendo constants.tsx:', error.message);
    return [];
  }
}

function generateReport() {
  const videosFromConstants = extractVideoInfoFromConstants();
  const filesInDirectory = readVideoDirectoryFiles();
  
  console.log('📊 RESUMEN GENERAL:');
  console.log(`   • Videos configurados en constants.tsx: ${videosFromConstants.length}`);
  console.log(`   • Archivos .mp4 en directorio: ${filesInDirectory.length}`);
  console.log('');
  
  console.log('🔍 ANÁLISIS DETALLADO DE VIDEOS CONFIGURADOS:');
  console.log('================================================');
  
  let availableCount = 0;
  let lfsCount = 0;
  let missingCount = 0;
  let smallFileCount = 0;
  
  videosFromConstants.forEach((video, index) => {
    const filePath = path.join(videosDir, video.fileName);
    const fileInfo = getFileInfo(filePath);
    
    let statusIcon = '';
    let statusText = '';
    
    switch (fileInfo.status) {
      case 'AVAILABLE':
        statusIcon = '✅';
        statusText = 'DISPONIBLE';
        availableCount++;
        break;
      case 'LFS_TRACKED':
        statusIcon = '📦';
        statusText = 'Git LFS';
        lfsCount++;
        break;
      case 'SMALL_FILE':
        statusIcon = '⚠️';
        statusText = 'ARCHIVO PEQUEÑO';
        smallFileCount++;
        break;
      case 'MISSING':
        statusIcon = '❌';
        statusText = 'NO ENCONTRADO';
        missingCount++;
        break;
    }
    
    console.log(`${index + 1}. ${statusIcon} [${video.id}] ${video.title}`);
    console.log(`   📁 Archivo: ${video.fileName}`);
    console.log(`   📏 Tamaño: ${fileInfo.displaySize}`);
    console.log(`   🔗 Ruta: /videos/${video.path}`);
    console.log(`   📝 Estado: ${statusText}`);
    console.log('');
  });
  
  console.log('📈 ESTADÍSTICAS:');
  console.log('================');
  console.log(`✅ Videos disponibles: ${availableCount}`);
  console.log(`📦 Videos en Git LFS: ${lfsCount}`);
  console.log(`⚠️  Archivos pequeños: ${smallFileCount}`);
  console.log(`❌ Videos faltantes: ${missingCount}`);
  console.log('');
  
  console.log('📁 ARCHIVOS EN DIRECTORIO NO CONFIGURADOS:');
  console.log('==========================================');
  
  const configuredFiles = videosFromConstants.map(v => v.fileName);
  const unconfiguredFiles = filesInDirectory.filter(file => !configuredFiles.includes(file));
  
  if (unconfiguredFiles.length === 0) {
    console.log('✅ Todos los archivos están configurados en constants.tsx');
  } else {
    unconfiguredFiles.forEach((file, index) => {
      const filePath = path.join(videosDir, file);
      const fileInfo = getFileInfo(filePath);
      console.log(`${index + 1}. 📄 ${file} (${fileInfo.displaySize})`);
    });
  }
  
  console.log('');
  console.log('🔧 RECOMENDACIONES:');
  console.log('==================');
  
  if (lfsCount > 0) {
    console.log('📦 Hay videos almacenados en Git LFS. Para acceder a ellos:');
    console.log('   - Ejecuta: git lfs pull');
    console.log('   - Verifica que Git LFS esté instalado y configurado');
  }
  
  if (missingCount > 0) {
    console.log('❌ Hay videos configurados pero no encontrados en el directorio.');
    console.log('   - Verifica que los nombres de archivo coincidan exactamente');
    console.log('   - Asegúrate de que los videos estén en public/videos/');
  }
  
  if (smallFileCount > 0) {
    console.log('⚠️  Hay archivos muy pequeños que podrían estar corruptos o ser marcadores.');
    console.log('   - Verifica el contenido de estos archivos');
    console.log('   - Podrían ser punteros de Git LFS sin descargar');
  }
  
  if (unconfiguredFiles.length > 0) {
    console.log('📁 Hay archivos en el directorio que no están configurados en constants.tsx');
    console.log('   - Considera agregar estos videos al VIDEO_CATALOG si son válidos');
  }
}

// Ejecutar el reporte
generateReport();
