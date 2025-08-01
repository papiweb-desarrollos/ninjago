#!/usr/bin/env node

/**
 * Script de Verificación Completa de Rutas de Videos
 * Verifica que todas las rutas en el catálogo sean accesibles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para obtener las rutas de assets (simulando getAssetPath)
function getAssetPath(assetPath) {
  // En desarrollo, no hay basePath
  return assetPath;
}

console.log('🔍 VERIFICADOR COMPLETO DE RUTAS DE VIDEOS');
console.log('==========================================\n');

async function loadVideoConstants() {
  const constantsPath = path.join(__dirname, 'constants.tsx');
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  
  // Extraer VIDEO_CATALOG del archivo
  const catalogMatch = constantsContent.match(/export const VIDEO_CATALOG[\s\S]*?\];/);
  if (!catalogMatch) {
    throw new Error('No se pudo encontrar VIDEO_CATALOG en constants.tsx');
  }
  
  return catalogMatch[0];
}

async function verifyRoutes() {
  try {
    const videosDir = path.join(__dirname, 'public', 'videos');
    
    console.log(`📁 Directorio base: ${videosDir}`);
    console.log(`🔗 Función de rutas: getAssetPath()\n`);
    
    // Obtener lista física de archivos
    const physicalFiles = fs.readdirSync(videosDir)
      .filter(file => file.endsWith('.mp4'))
      .sort();
    
    console.log(`📹 Archivos físicos encontrados: ${physicalFiles.length}`);
    physicalFiles.forEach((file, index) => {
      const filePath = path.join(videosDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ${(index + 1).toString().padStart(2)}. ${file} (${sizeMB}MB)`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    // Obtener catálogo del código
    const catalogCode = await loadVideoConstants();
    
    // Extraer todas las rutas del catálogo
    const pathMatches = catalogCode.match(/path: getAssetPath\("([^"]+)"\)/g);
    if (!pathMatches) {
      throw new Error('No se pudieron extraer las rutas del catálogo');
    }
    
    const catalogPaths = pathMatches.map(match => {
      const pathMatch = match.match(/getAssetPath\("([^"]+)"\)/);
      return pathMatch ? pathMatch[1] : null;
    }).filter(Boolean);
    
    console.log(`\n📊 Rutas en el catálogo: ${catalogPaths.length}`);
    
    let validRoutes = 0;
    let invalidRoutes = 0;
    const problems = [];
    
    catalogPaths.forEach((assetPath, index) => {
      // Convertir ruta de asset a ruta física
      const relativePath = assetPath.replace(/^\/videos\//, '');
      const physicalPath = path.join(videosDir, relativePath);
      
      console.log(`\n${(index + 1).toString().padStart(2)}. Verificando ruta:`);
      console.log(`    Asset: ${assetPath}`);
      console.log(`    Física: ${physicalPath}`);
      
      if (fs.existsSync(physicalPath)) {
        const stats = fs.statSync(physicalPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`    ✅ VÁLIDA (${sizeMB}MB)`);
        validRoutes++;
      } else {
        console.log(`    ❌ NO ENCONTRADA`);
        invalidRoutes++;
        problems.push({
          assetPath,
          physicalPath,
          issue: 'Archivo no existe'
        });
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📈 RESUMEN DE VERIFICACIÓN:');
    console.log(`✅ Rutas válidas: ${validRoutes}`);
    console.log(`❌ Rutas inválidas: ${invalidRoutes}`);
    console.log(`📁 Archivos físicos: ${physicalFiles.length}`);
    console.log(`📊 Rutas en catálogo: ${catalogPaths.length}`);
    
    // Verificar si hay archivos físicos no catalogados
    const catalogFileNames = catalogPaths.map(p => path.basename(p.replace(/^\/videos\//, '')));
    const uncatalogedFiles = physicalFiles.filter(file => !catalogFileNames.includes(file));
    
    if (uncatalogedFiles.length > 0) {
      console.log(`\n⚠️  Archivos no catalogados: ${uncatalogedFiles.length}`);
      uncatalogedFiles.forEach(file => {
        console.log(`    📹 ${file}`);
      });
    }
    
    // Verificar coherencia
    if (validRoutes === catalogPaths.length && catalogPaths.length === physicalFiles.length) {
      console.log('\n🎉 ESTADO: PERFECTO');
      console.log('   Todas las rutas son válidas y todos los archivos están catalogados');
    } else if (invalidRoutes === 0) {
      console.log('\n✅ ESTADO: BUENO'); 
      console.log('   Todas las rutas son válidas, pero hay archivos no catalogados');
    } else {
      console.log('\n⚠️  ESTADO: PROBLEMAS DETECTADOS');
    }
    
    // Mostrar problemas específicos
    if (problems.length > 0) {
      console.log('\n🔧 PROBLEMAS ENCONTRADOS:');
      problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem.issue}`);
        console.log(`   Ruta: ${problem.assetPath}`);
        console.log(`   Esperado en: ${problem.physicalPath}`);
      });
    }
    
    console.log('\n💡 RECOMENDACIONES:');
    if (uncatalogedFiles.length > 0) {
      console.log('   - Ejecutar: node update-video-catalog.js');
    }
    if (invalidRoutes > 0) {
      console.log('   - Verificar archivos faltantes en /public/videos/');
    }
    if (validRoutes === catalogPaths.length && uncatalogedFiles.length === 0) {
      console.log('   - ¡Sistema perfecto! No se requieren acciones');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

verifyRoutes();
