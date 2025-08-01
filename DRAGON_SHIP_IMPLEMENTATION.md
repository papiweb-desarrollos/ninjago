# 🐲 NAVE DRAGÓN - MODO CLASSIC SLICING

**Fecha:** 2025-08-01  
**Implementación:** Nave controlable con fuego destructivo  

## 🎮 **CONTROLES DE LA NAVE DRAGÓN**

### 🕹️ **Movimiento**
- **⬅️ Flecha Izquierda** o **A**: Mover hacia la izquierda (inclina -15°)
- **➡️ Flecha Derecha** o **D**: Mover hacia la derecha (inclina +15°)
- **⬆️ Flecha Arriba** o **W**: Mover hacia arriba
- **⬇️ Flecha Abajo** o **S**: Mover hacia abajo

### 🔥 **Disparo**
- **Barra Espaciadora**: Disparar proyectiles de fuego
- **Cadencia:** 300ms entre disparos
- **Máximo:** 5 proyectiles simultáneos

## 🎨 **DISEÑO VISUAL**

### 🐲 **Nave Dragón (`DragonShip.tsx`)**
```tsx
Dimensiones: 80×60 píxeles
- 🔴 Cuerpo principal: Degradado rojo-naranja-amarillo
- 👁️ Cabeza: Con ojos amarillos brillantes
- 🪶 Alas: Laterales con efecto de movimiento
- 🐍 Cola: Posterior con rotación dinámica
- ✨ Efectos: Brillo pulsante y chispas de fuego
```

### 🔥 **Proyectiles de Fuego (`DragonFire.tsx`)**
```tsx
Tamaño: 20 píxeles
- 🔥 Núcleo: Degradado amarillo-naranja-rojo
- ✨ Efectos: Pulso, ping y chispas animadas
- 💫 Desvanecimiento: Se atenúa con el tiempo
- ⚡ Impacto: Destruye objetos al contacto
```

## ⚙️ **CONFIGURACIÓN TÉCNICA**

### 📊 **Constantes (`constants.tsx`)**
```typescript
export const DRAGON_SHIP_WIDTH = 80;          // Ancho de la nave
export const DRAGON_SHIP_HEIGHT = 60;         // Alto de la nave
export const DRAGON_SHIP_SPEED = 8;           // Velocidad de movimiento
export const DRAGON_FIRE_SPEED = 12;          // Velocidad del fuego
export const DRAGON_FIRE_SIZE = 20;           // Tamaño del proyectil
export const DRAGON_FIRE_COOLDOWN_MS = 300;   // Tiempo entre disparos
export const MAX_DRAGON_FIRES = 5;            // Proyectiles máximos
```

### 🏗️ **Tipos (`types.ts`)**
```typescript
interface DragonShipState {
  id: string;
  x: number;        // Posición X
  y: number;        // Posición Y
  width: number;    // Ancho
  height: number;   // Alto
  rotation: number; // Rotación (-15°, 0°, +15°)
}

interface DragonFireState {
  id: string;
  x: number;        // Posición X
  y: number;        // Posición Y
  vx: number;       // Velocidad X
  vy: number;       // Velocidad Y (negativa = hacia arriba)
  size: number;     // Tamaño del proyectil
  createdAt: number;// Timestamp de creación
}
```

## 🎯 **MECÁNICAS DE JUEGO**

### ⚔️ **Sistema de Combate**
1. **Detección de Colisiones**: Distancia euclidiana entre proyectil y objeto
2. **Impacto en Objetos Buenos**: +puntos según configuración del objeto
3. **Impacto en Bombas**: -1 vida (penalización por disparar bombas)
4. **Destrucción**: Tanto el proyectil como el objeto se eliminan

### 🎮 **Integración con GameScreen**
- **Posición inicial**: Centro-inferior de la pantalla
- **Límites de movimiento**: Respeta bordes del canvas
- **Game Loop**: Actualización a ~60 FPS
- **Cleanup**: Proyectiles se eliminan después de 3 segundos

### 🔄 **Ciclo de Vida de Proyectiles**
```typescript
1. Creación → Posición de la nave
2. Movimiento → Velocidad hacia arriba
3. Colisión → Detectar impacto con objetos
4. Eliminación → 3 segundos o fuera de pantalla
```

## 💡 **FUNCIONALIDADES AVANZADAS**

### 🎨 **Efectos Visuales**
- **Rotación dinámica**: La nave se inclina al moverse lateralmente
- **Partículas de fuego**: Chispas animadas en los proyectiles
- **Desvanecimiento**: Los proyectiles se atenúan con el tiempo
- **Brillos**: Efectos de luz y sombra en tiempo real

### 🎵 **Feedback Visual**
- **Instrucciones en pantalla**: Controles visibles en esquina superior
- **Animaciones fluidas**: Transiciones suaves de 100ms
- **Z-index optimizado**: Layering correcto de elementos

### ⚡ **Optimización de Rendimiento**
- **Límite de proyectiles**: Máximo 5 simultáneos
- **Cleanup automático**: Eliminación de proyectiles antiguos
- **useCallback**: Funciones optimizadas para re-renderizado
- **Intervalos controlados**: Actualizaciones precisas a 60 FPS

## 🎊 **EXPERIENCIA DE USUARIO**

### 🎯 **Objetivo del Juego**
- **Movimiento libre**: Control total de la nave en 2D
- **Precisión de disparo**: Apuntar y eliminar objetos buenos
- **Evitar bombas**: No disparar a objetos peligrosos
- **Puntuación máxima**: Destruir tantos objetos como sea posible

### 🏆 **Estrategia de Juego**
1. **Posicionamiento**: Moverse para tener mejor ángulo de tiro
2. **Timing**: Disparar en el momento óptimo
3. **Conservación**: No desperdiciar disparos en bombas
4. **Supervivencia**: Evitar que las bombas toquen la nave

## 🚀 **ESTADO DE IMPLEMENTACIÓN**

### ✅ **Completado**
- [x] Nave dragón completamente funcional
- [x] Sistema de proyectiles de fuego
- [x] Controles responsivos (flechas + WASD)
- [x] Detección de colisiones
- [x] Efectos visuales avanzados
- [x] Integración con GameScreen
- [x] Optimización de rendimiento
- [x] Instrucciones en pantalla

### 🎮 **Listo para Jugar**
La nave dragón está **100% funcional** en el modo Classic Slicing. Los jugadores pueden:
- Controlar la nave con precisión
- Disparar proyectiles de fuego efectivos
- Ver efectos visuales espectaculares
- Disfrutar de una experiencia de juego fluida

**¡La implementación está completa y lista para la acción! 🔥🐲**
