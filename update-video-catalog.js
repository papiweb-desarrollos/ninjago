#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 ACTUALIZADOR AUTOMÁTICO DE CATÁLOGO DE VIDEOS');
console.log('===============================================\n');

const constantsPath = path.join(__dirname, 'constants.tsx');
const videosDir = path.join(__dirname, 'public', 'videos');

// Tamaño mínimo para considerar un video como válido (1MB)
const MIN_VIDEO_SIZE = 1024 * 1024;

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
          status: 'LFS_POINTER',
          isAvailable: false
        };
      }
    }
    
    return {
      size: stats.size,
      actualSize: stats.size,
      isGitLFS: false,
      displaySize: `${sizeInMB}MB`,
      status: stats.size >= MIN_VIDEO_SIZE ? 'AVAILABLE' : 'TOO_SMALL',
      isAvailable: stats.size >= MIN_VIDEO_SIZE
    };
  } catch (error) {
    return {
      size: 0,
      actualSize: 0,
      isGitLFS: false,
      displaySize: 'NO ENCONTRADO',
      status: 'MISSING',
      isAvailable: false
    };
  }
}

function getAvailableVideos() {
  try {
    const files = fs.readdirSync(videosDir);
    const availableVideos = [];
    
    files.forEach(file => {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(videosDir, file);
        const fileInfo = getFileInfo(filePath);
        
        if (fileInfo.isAvailable) {
          availableVideos.push({
            fileName: file,
            size: fileInfo.size,
            sizeInMB: (fileInfo.size / (1024 * 1024)).toFixed(2)
          });
        }
      }
    });
    
    return availableVideos;
  } catch (error) {
    console.error('❌ Error leyendo directorio de videos:', error.message);
    return [];
  }
}

function generateVideoId(fileName, index) {
  // Generar ID basado en el nombre del archivo
  if (fileName.includes('Generated File')) {
    const timeMatch = fileName.match(/(\d+)_(\d+)([AP]M)/);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minute = timeMatch[2];
      const period = timeMatch[3].toLowerCase();
      return `gen_${hour}_${minute}_${period}`;
    }
  }
  
  // Para otros archivos, crear ID simple con índice
  let baseId = fileName.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 15);
    
  return `${baseId}_${index + 1}`;
}

function generateVideoTitle(fileName) {
  if (fileName.includes('Generated File')) {
    const timeMatch = fileName.match(/(\d+_\d+[AP]M)/);
    if (timeMatch) {
      const time = timeMatch[1].replace('_', ':');
      return `Video Generado ${time}`;
    }
  }
  
  // Para otros archivos, usar el nombre limpio
  return fileName.replace('.mp4', '').replace(/[_]/g, ' ');
}

function updateConstants() {
  try {
    let content = fs.readFileSync(constantsPath, 'utf8');
    const availableVideos = getAvailableVideos();
    
    console.log(`📹 Videos disponibles encontrados: ${availableVideos.length}`);
    
    // Generar nuevo catálogo
    let newCatalog = 'export const VIDEO_CATALOG: VideoInfo[] = [\n';
    
    availableVideos.forEach((video, index) => {
      const id = generateVideoId(video.fileName, index);
      const title = generateVideoTitle(video.fileName);
      const description = `Video disponible (${video.sizeInMB}MB)`;
      
      newCatalog += `  {\n`;
      newCatalog += `    id: "${id}",\n`;
      newCatalog += `    title: "${title}",\n`;
      newCatalog += `    fileName: "${video.fileName}",\n`;
      newCatalog += `    path: getAssetPath("/videos/${video.fileName}"),\n`;
      newCatalog += `    description: "${description}"\n`;
      newCatalog += `  }`;
      
      if (index < availableVideos.length - 1) {
        newCatalog += ',';
      }
      newCatalog += '\n';
      
      console.log(`✅ [${id}] ${title} (${video.sizeInMB}MB)`);
    });
    
    newCatalog += '];';
    
    // Reemplazar el catálogo existente
    const catalogRegex = /export const VIDEO_CATALOG: VideoInfo\[\] = \[[\s\S]*?\];/;
    const newContent = content.replace(catalogRegex, newCatalog);
    
    // Crear backup del archivo original
    const backupPath = constantsPath + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(backupPath, content);
    
    // Escribir el nuevo contenido
    fs.writeFileSync(constantsPath, newContent);
    
    console.log(`\n✅ Catálogo actualizado exitosamente`);
    console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
    console.log(`🎬 Videos en el nuevo catálogo: ${availableVideos.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error actualizando constants.tsx:', error.message);
    return false;
  }
}

function createVideoStatusFile() {
  const availableVideos = getAvailableVideos();
  const unavailableVideos = [];
  
  try {
    const files = fs.readdirSync(videosDir);
    files.forEach(file => {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(videosDir, file);
        const fileInfo = getFileInfo(filePath);
        
        if (!fileInfo.isAvailable) {
          let reason = 'Archivo muy pequeño';
          if (fileInfo.status === 'MISSING') {
            reason = 'Archivo no encontrado';
          }
          
          unavailableVideos.push({
            fileName: file,
            size: fileInfo.size,
            displaySize: fileInfo.displaySize,
            reason: reason
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error verificando videos no disponibles:', error.message);
  }
  
  const statusReport = `# ESTADO DE VIDEOS - ${new Date().toISOString()}

## 📹 Videos Disponibles (${availableVideos.length})
${availableVideos.map(v => `- ✅ ${v.fileName} (${v.sizeInMB}MB)`).join('\n')}

${unavailableVideos.length > 0 ? `## ❌ Videos No Disponibles (${unavailableVideos.length})
${unavailableVideos.map(v => `- ❌ ${v.fileName} (${v.displaySize}) - ${v.reason}`).join('\n')}` : ''}

## 📊 Resumen:
- Total de archivos .mp4: ${availableVideos.length + unavailableVideos.length}
- Videos funcionales: ${availableVideos.length}
- Videos con problemas: ${unavailableVideos.length}
- Porcentaje disponible: ${((availableVideos.length / Math.max(1, availableVideos.length + unavailableVideos.length)) * 100).toFixed(1)}%
- Tamaño total disponible: ${(availableVideos.reduce((total, v) => total + parseFloat(v.sizeInMB), 0)).toFixed(1)}MB

## ✅ Estado del Proyecto:
${availableVideos.length > 0 ? 
  `El proyecto tiene ${availableVideos.length} videos funcionales listos para usar.` : 
  'No hay videos disponibles actualmente.'
}
`;

  fs.writeFileSync('VIDEO_STATUS.md', statusReport);
  console.log(`\n📄 Reporte de estado creado: VIDEO_STATUS.md`);
}

// Ejecutar actualización
console.log('🔍 Analizando videos disponibles...\n');

const success = updateConstants();
if (success) {
  createVideoStatusFile();
  console.log('\n🎉 Actualización completada exitosamente!');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa VIDEO_STATUS.md para ver el estado completo');
  console.log('   2. Prueba el catálogo actualizado en tu aplicación');
  console.log('   3. El proyecto ahora usa solo videos locales (sin Git LFS)');
} else {
  console.log('\n❌ Error durante la actualización');
  process.exit(1);
}
