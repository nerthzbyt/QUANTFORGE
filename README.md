# QuantForge·TSM

## AI-Driven Trading Profiles for World of Warcraft

**QuantForge·TSM** es una plataforma profesional de análisis y generación de perfiles de trading para TradeSkillMaster (TSM) en World of Warcraft. Utiliza algoritmos de inteligencia artificial, análisis de mercado en tiempo real y fórmulas matemáticas avanzadas para optimizar operaciones de subasta, compra y venta en la Casa de Subastas.

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Instalación y Configuración](#-instalación-y-configuración)
4. [Conexión con APIs](#-conexión-con-apis)
5. [Motor Matemático TSM](#-motor-matemático-tsm)
6. [Fuentes de Datos de Mercado](#-fuentes-de-datos-de-mercado)
7. [Perfiles y Estrategias](#-perfiles-y-estrategias)
8. [Interfaz de Usuario](#-interfaz-de-usuario)
9. [APIs y Endpoints](#-apis-y-endpoints)
10. [Solución de Problemas](#-solución-de-problemas)
11. [Contribuir](#-contribuir)
12. [Licencia](#-licencia)

---

## ✨ Características Principales

### 🔹 Análisis de Mercado en Tiempo Real
- **18+ fórmulas avanzadas** de análisis de tendencias, inventario, márgenes y riesgo
- **Detección automática** de regímenes de mercado (normal, volátil, estancado, premium, dump)
- **Índices compuestos**: liquidez, demanda, estabilidad, oportunidad y riesgo
- **Señales de acción**: buy_signal, sell_signal, arbitrage_signal, action_signal

### 🔹 Sin Hardcoding
- **Generador dinámico de presets**: los datos de mercado se generan algorítmicamente basados en parámetros de volatilidad, demanda y escenario
- **Configuración personalizada**: modo "Personalizado" para generar datos bajo demanda
- **Fórmulas evolutivas**: los coeficientes se ajustan automáticamente según el régimen detectado

### 🔹 Conexión API Completa
- **TSM REST v1**: integración completa con clave API para datos precisos
- **TSM Public Data CSV**: acceso sin clave a datos públicos de reinos
- **Battle.net OAuth2**: búsqueda de items, iconos y metadatos oficiales
- **Proxy CORS configurable**: soporte para proxies personalizados

### 🔹 Motor de IA Avanzado
- **Hill-climbing + Monte Carlo**: optimización de coeficientes mediante 5000+ iteraciones
- **5 estrategias predefinidas**: Balanced, Fast Liquidity, Premium, Adaptive Quant, Sniper Quant
- **Meta-bloques de información**: registro completo de features, coefficients y expected gold
- **Genealogía de perfiles**: sistema de versionado evolutivo (g1, g2, g3...)

---

## 🏗️ Arquitectura del Sistema

```
QuantForge·TSM
├── Frontend (React + TypeScript + Vite)
│   ├── App.tsx                 # Enrutador y estado global
│   ├── components/
│   │   ├── ApiPanel.tsx        # Configuración de APIs
│   │   ├── EnginePanel.tsx     # Visualización de fuentes TSM
│   │   ├── ProfilePanel.tsx    # Generación de perfiles
│   │   ├── AiPanel.tsx         # Análisis de IA y regímenes
│   │   └── InputsPanel.tsx     # Entrada de datos manuales
│   └── views/
│       ├── DocsView.tsx        # Documentación integrada
│       └── GithubView.tsx      # Información del proyecto
│
├── Librerías Core
│   ├── engine.ts               # Parser + evaluador de expresiones TSM
│   ├── tsmApi.ts               # Conectores API (TSM + Battle.net)
│   ├── profiles.ts             # Generador de perfiles completos
│   ├── ai.ts                   # Motor de IA y optimización
│   └── validate.ts             # Validación de datos de entrada
│
└── Build System
    ├── vite.config.js          # Configuración Vite
    ├── tsconfig.json           # Configuración TypeScript
    └── tailwindcss             # Estilos utilitarios
```

### Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | React | 18.2.0 |
| Lenguaje | TypeScript | 5.7.0 |
| Build Tool | Vite | 6.3.5 |
| Estilos | Tailwind CSS | 4.1.7 |
| Gráficos | Recharts | 2.10.0 |
| Animaciones | Framer Motion | 11.16.1 |
| Iconos | Lucide React | 0.294.0 |
| Router | React Router DOM | 6.8.0 |
| Backend (opcional) | Supabase | 2.98.0 |

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Pasos de Instalación

```bash
# 1. Clonar o navegar al directorio del proyecto
cd /workspace

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Construir para producción
npm run build

# 5. Verificar tipos TypeScript
npm run typecheck
```

### Estructura de Directorios

```
/workspace
├── src/
│   ├── components/      # Componentes React reutilizables
│   ├── views/           # Vistas principales de la aplicación
│   ├── lib/             # Librerías core (engine, API, profiles, ai)
│   ├── index.css        # Estilos globales
│   ├── main.tsx         # Punto de entrada
│   └── App.tsx          # Componente raíz
├── dist/                # Build de producción
├── index.html           # HTML principal
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración TypeScript
└── vite.config.js       # Configuración Vite
```

---

## 🔌 Conexión con APIs

### 1. TSM REST API (Recomendada)

**Obtención de clave API:**
1. Visita [tradeskillmaster.com](https://tradeskillmaster.com/)
2. Inicia sesión en tu cuenta
3. Ve a **Account → API Key**
4. Copia tu clave API

**Configuración en QuantForge:**
- Abre el panel **API Connection**
- Pega tu clave en el campo **TSM API Key**
- Selecciona tu región (US, EU, KR, TW, BR, AU, CN)
- Haz clic en **Connect**

**Endpoints utilizados:**
```
GET https://api.tradeskillmaster.com/api/v1/item/{itemId}/stats?region={region}&key={apiKey}
```

**Datos obtenidos:**
- `dbmarket`: Valor de mercado actual
- `dbminbuyout`: Mínimo buyout en subastas
- `dbrecent`: Precio de ventas recientes
- `dbhistorical`: Precio histórico
- `dbregionmarketavg`: Promedio regional de mercado
- `dbregionhistorical`: Histórico regional
- `dbregionsaleavg`: Promedio de venta regional
- `dbregionsalerate`: Tasa de venta regional (0-1)
- `dbregionsoldperday`: Unidades vendidas por día
- `vendorsell`: Precio de venta a vendedor NPC
- `vendorbuy`: Precio de compra a vendedor NPC
- `avgbuy`: Precio promedio de compra

### 2. TSM Public Data (Sin Clave)

**Funcionamiento:**
- Accede a archivos CSV públicos de reinos específicos
- No requiere autenticación
- Datos actualizados periódicamente por TSM

**Endpoint:**
```
GET https://public-data.tradeskillmaster.com/realms/{realmId}
GET https://public-data.tradeskillmaster.com/realms
```

**Limitaciones:**
- Datos menos frecuentes que la API REST
- Requiere conocer el `realmId` específico
- Formato CSV que requiere parsing

### 3. Battle.net Game Data API

**Obtención de credenciales:**
1. Visita [develop.battle.net](https://develop.battle.net/)
2. Crea una aplicación en tu cuenta de desarrollador
3. Obtén **Client ID** y **Client Secret**

**Configuración en QuantForge:**
- Panel **API Connection → Battle.net**
- Introduce Client ID y Client Secret
- El sistema maneja automáticamente el OAuth2

**Endpoints utilizados:**
```
POST https://{region}.battle.net/oauth/token
GET https://{region}.api.blizzard.com/data/wow/search/item?name={query}
GET https://{region}.api.blizzard.com/data/wow/media/item/{itemId}
```

**Datos obtenidos:**
- Búsqueda de items por nombre
- IDs de objeto para consultas TSM
- Iconos de items (URLs oficiales)
- Calidad, nivel y metadatos

### 4. Proxy CORS (Opcional)

**Problema:** Los navegadores bloquean peticiones cross-origin a APIs externas.

**Solución:** Configurar un proxy propio

**Opciones:**
1. **Cloudflare Worker** (gratuito)
2. **Vercel Edge Function**
3. **Servidor Node.js personalizado**

**Ejemplo de configuración:**
```javascript
// En el panel de conexión, introduce:
https://tu-proxy.workers.dev
```

**El proxy debe:**
- Recibir peticiones del frontend
- Reenviarlas a la API destino
- Retornar la respuesta con cabeceras CORS adecuadas

---

## ⚙️ Motor Matemático TSM

### Parser de Expresiones

El motor soporta:
- **Operadores básicos**: `+`, `-`, `*`, `/`, `()`
- **Números con sufijos**: `100c` (100), `5s` (500), `2g` (20000)
- **Funciones matemáticas**:
  - `avg(a,b,c...)`: Promedio
  - `min(a,b,c...)`: Mínimo
  - `max(a,b,c...)`: Máximo
  - `first(a,b,c...)`: Primer valor positivo
  - `round(x, step)`: Redondeo al múltiplo más cercano
  - `rounddown(x, step)`: Redondeo hacia abajo
  - `roundup(x, step)`: Redondeo hacia arriba
  - `abs(x)`: Valor absoluto
  - `sqrt(x)`: Raíz cuadrada
  - `pow(base, exp)`: Potencia
  - `clamp(x, min, max)`: Limitar valor en rango
  - `convert(x)`: Valor de conversión

- **Funciones condicionales**:
  - `ifgt(a, b, trueVal, falseVal)`: Si a > b
  - `iflt(a, b, trueVal, falseVal)`: Si a < b
  - `ifgte(a, b, trueVal, falseVal)`: Si a ≥ b
  - `iflte(a, b, trueVal, falseVal)`: Si a ≤ b
  - `ifeq(a, b, trueVal, falseVal)`: Si a = b

### Variables de Mercado

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `dbmarket` | Valor de mercado actual | 15000 |
| `dbminbuyout` | Mínimo buyout activo | 14500 |
| `dbrecent` | Precio de venta reciente | 15200 |
| `dbhistorical` | Precio histórico | 14800 |
| `dbregionmarketavg` | Promedio regional | 15500 |
| `dbregionsalerate` | Tasa de venta (0-1) | 0.08 |
| `dbregionsoldperday` | Ventas diarias | 2.5 |
| `crafting` | Coste de crafteo | 8000 |
| `matprice` | Precio de materiales | 7500 |
| `numinventory` | Inventario actual | 45 |

### Custom Sources

Las **custom sources** son fórmulas personalizadas que se definen una vez y pueden referenciar otras fuentes:

```typescript
// Ejemplo de definición
{
  "tsm_exchange_pack_fair": "first(dbminbuyout, dbmarket, dbrecent)",
  "tsm_exchange_pack_floor": "max(crafting, matprice, vendorsell)",
  "tsm_exchange_pack_sane": "min(ceiling, max(floor, fair))"
}
```

**Resolución memoizada:** El motor cachea resultados y detecta ciclos automáticamente.

---

## 📊 Fuentes de Datos de Mercado

### Baseline (Fuentes Base)

| Fuente | Fórmula | Descripción |
|--------|---------|-------------|
| `anchor` | `avg(dbmarket, dbrecent, ...)` | Ancla de valor promediada |
| `fair` | `first(dbminbuyout, dbmarket, ...)` | Precio justo base |
| `fair_smooth` | `avg(fair, anchor)` | Precio justo suavizado |
| `hard_floor` | `max(floor_vendor, destroy, floor_craft)` | Suelo absoluto |
| `base_floor` | `max(hard_floor, round(fair_smooth * 0.20))` | Suelo base |
| `soft_ceiling` | `round(fair_smooth * 2.50)` | Techo suave |
| `sane_price` | `min(ceiling, max(floor, fair_smooth))` | Precio razonable |

### Filtros Exactos v2

| Fuente | Descripción | Umbral |
|--------|-------------|--------|
| `spread_ratio` | Ratio de spread | < 0.35 |
| `volatility_guard` | Guarda de volatilidad | 0/1 |
| `region_divergence` | Divergencia regional | abs(market - regionAvg) |
| `region_guard` | Guarda regional | < 60% divergencia |
| `momentum` | Momentum de precio | -1/0/1 |
| `inventory_days` | Días de inventario | < 21 días |
| `quality_gate` | Puerta de calidad | min(volatility, region, inventory) |

### Índices Compuestos IA

| Índice | Rango | Interpretación |
|--------|-------|----------------|
| `liquidity_index` | 0-100 | Liquidez del item |
| `demand_index` | 0-100 | Demanda estimada |
| `stability_index` | 0-100 | Estabilidad de precio |
| `edge_index` | 0-100 | Margen de beneficio |

### Fuentes v3 - Tiempo Real (NUEVAS)

#### Análisis de Tendencia
- `trend_short`: Tendencia corto plazo (-1/0/1)
- `trend_region`: Comparativa regional (-1/0/1)
- `trend_momentum_pct`: Porcentaje de momentum

#### Rotación de Inventario
- `turnover_rate`: Tasa de rotación
- `days_to_sell`: Días estimados para vender
- `stock_pressure`: Presión de stock (0/1)

#### Márgenes y ROI
- `margin_absolute`: Margen absoluto (oro)
- `margin_pct`: Margen porcentual (%)
- `roi_craft`: ROI de crafteo (%)
- `roi_flip`: ROI de reventa (%)

#### Señales de Trading
- `arbitrage_signal`: Oportunidad de arbitraje (0/1)
- `buy_signal`: Señal de compra (0/1)
- `sell_signal`: Señal de venta (0/1)
- `action_signal`: Señal de acción compuesta (0/1)

#### Métricas de Riesgo
- `crash_risk`: Riesgo de caída (0/1)
- `saturation_index`: Índice de saturación (0-10)
- `competition_idx`: Índice de competencia (0/1)
- `opportunity_score`: Puntuación de oportunidad (0-1)
- `risk_score`: Puntuación de riesgo (0-1)

---

## 🎯 Perfiles y Estrategias

### Estrategias Disponibles

#### Baseline (Heredadas)

| ID | Nombre | Descripción | Perfil de Riesgo |
|----|--------|-------------|------------------|
| `balanced` | Balanced | Referencia estándar | Medio |
| `fast_liquidity` | Fast Liquidity | Rotación rápida, margen comprimido | Bajo |
| `premium` | Premium | Margen alto, ventas lentas | Alto |

#### IA (Evolutivas)

| ID | Nombre | Descripción | Optimización |
|----|--------|-------------|--------------|
| `evo_balanced` | Balanced Evo | Baseline dinámico adaptativo | Régimen-aware |
| `adaptive_quant` | Adaptive Quant | Coeficientes calibrados | Hill-climbing |
| `sniper_quant` | Sniper Quant | Compra agresiva a descuento | Sesgo sniper |

### Coeficientes de Estrategia

Cada estrategia IA define coeficientes que ajustan las fórmulas:

```typescript
interface Coeffs {
  floorPct: number;      // % sobre fair para floor
  ceilingMult: number;   // Multiplicador para ceiling
  minMult: number;       // Multiplicador para auction min
  normMult: number;      // Multiplicador para auction normal
  maxMult: number;       // Multiplicador para auction max
  shoppingPct: number;   // % para shopping max
  snipePct: number;      // % para sniper max
}
```

**Ejemplo (Balanced):**
```json
{
  "floorPct": 0.20,
  "ceilingMult": 2.50,
  "minMult": 0.75,
  "normMult": 1.00,
  "maxMult": 1.60,
  "shoppingPct": 0.75,
  "snipePct": 0.55
}
```

### Meta-Bloque de IA

Cada perfil generado incluye un bloque de metadatos:

```json
{
  "engine": "quantforge-ml",
  "version": "2.4.0",
  "model": "hill-climbing + monte-carlo",
  "seed": 42,
  "iterations": 5000,
  "risk_aversion": 0.15,
  "regime": {
    "label": "Normal",
    "confidence": 0.87,
    "reasons": ["liquidity > 0.05", "volatility < 0.35"]
  },
  "features": {
    "liquidity": 0.78,
    "demand": 0.65,
    "volatility": 0.22,
    "momentum": 0.05,
    "stability": 0.82,
    "margin_pct": 28.5
  },
  "expected_14d_gold": {
    "mean": 125000,
    "p10": 85000,
    "p90": 165000,
    "std": 22000
  }
}
```

### Genealogía de Perfiles

Los perfiles evolucionan con cada re-entrenamiento:

```
tsm_exchange_pack_g1:balanced
tsm_exchange_pack_g2:balanced
tsm_exchange_pack_g3:balanced
```

**Funciones de utilidad:**
- `evolveName(prefix, id, gen)`: Genera nombre evolutivo
- `lineage(prefix, id, gen, depth)`: Obtiene últimas generaciones

---

## 🖥️ Interfaz de Usuario

### Paneles Principales

#### 1. API Connection Panel
- Configuración de claves TSM y Battle.net
- Selección de región
- Estado de conexión en tiempo real
- Logs de actividad API

#### 2. Inputs Panel
- Entrada manual de datos de mercado
- Selector de presets dinámicos
- Campos editables con validación
- Botón de regeneración de datos

#### 3. Engine Panel
- Visualización de todas las fuentes calculadas
- Agrupación por categoría (anchors, floors, signals, etc.)
- Valores en tiempo real con formato de oro
- Toggle para mostrar/ocultar grupos

#### 4. AI Panel
- Análisis de régimen de mercado
- Features extraídas (liquidity, demand, volatility...)
- Comparativa de estrategias con simulación Monte Carlo
- Recomendación automática basada en score

#### 5. Profile Panel
- Generación de perfiles TSM exportables
- Vista previa de custom sources
- Descarga en formato JSON compatible con TSM
- Historial de perfiles generados

### Flujos de Trabajo

#### Flujo Básico (Principiantes)
1. Seleccionar un preset de mercado
2. Revisar valores calculados en Engine Panel
3. Exportar perfil recomendado

#### Flujo Intermedio
1. Conectar API TSM con clave
2. Buscar item con Battle.net
3. Cargar datos reales automáticamente
4. Ajustar manualmente si es necesario
5. Generar perfil personalizado

#### Flujo Avanzado
1. Configurar proxy CORS propio
2. Usar modo personalizado para generar datos
3. Analizar régimen con AI Panel
4. Comparar múltiples estrategias
5. Exportar perfil con meta-bloque completo

---

## 🌐 APIs y Endpoints

### Resumen de Endpoints Externos

| Proveedor | Endpoint | Autenticación | Uso |
|-----------|----------|---------------|-----|
| TSM REST | `/api/v1/item/{id}/stats` | API Key | Datos completos |
| TSM Public | `/realms/{realmId}` | Ninguna | Datos básicos |
| TSM Realms | `/realms` | Ninguna | Lista de reinos |
| Battle.net OAuth | `/{region}/oauth/token` | Client Credentials | Token acceso |
| Battle.net Search | `/{region}/data/wow/search/item` | Bearer Token | Búsqueda items |
| Battle.net Media | `/{region}/data/wow/media/item/{id}` | Bearer Token | Iconos |

### Clases y Funciones Principales

#### `MathEngine` (engine.ts)
```typescript
class MathEngine {
  constructor(vars: Record<string, number>, customs: Record<string, string>)
  resolve(id: string): number
  source(name: string): number
  evaluate(expr: string): number
}
```

#### `TSM API` (tsmApi.ts)
```typescript
async function fetchTsmStats(region: Region, itemId: number): Promise<PricePayload>
async function fetchPublicPrice(realmId: string, itemId: number): Promise<PricePayload>
async function searchItems(region: Region, query: string): Promise<WowItem[]>
async function battleNetToken(region: Region): Promise<string>
```

#### `Profile Builder` (profiles.ts)
```typescript
function buildProfile(id: string, ctx: BuildCtx): Record<string, unknown>
function coeffsFor(id: string, ctx: BuildCtx): Coeffs
function tunedSources(prefix: string, coeffs: Coeffs): Record<string, string>
```

#### `AI Engine` (ai.ts)
```typescript
function extractFeatures(env: Record<string, number>): Features
function detectRegime(feats: Features): Regime
function trainStrategies(feats: Features, seed: number): TrainResult
function optimizeCoefficients(feats: Features, base: Coeffs): Coeffs
```

---

## 🔧 Solución de Problemas

### Errores Comunes

#### 1. "CORS Error" o "El navegador bloqueó la petición"
**Causa:** La API no permite peticiones directas desde el navegador.

**Solución:**
- Configura un proxy CORS (ver sección 3.4)
- Usa una extensión de navegador para desarrollo (solo local)
- Ejecuta el build de producción en un servidor web

#### 2. "Falta la clave de la API de TSM"
**Causa:** No se ha introducido la clave API.

**Solución:**
- Obtén tu clave en tradeskillmaster.com
- Introdúcela en el panel API Connection
- Alternativamente, usa TSM Public Data (sin clave)

#### 3. "El objeto #ID no aparece en el CSV"
**Causa:** El item no tiene datos en ese reino específico.

**Solución:**
- Prueba otro reino conectado
- Usa la API REST con clave en lugar de Public Data
- Verifica que el itemId sea correcto

#### 4. "Battle.net rechazó las credenciales"
**Causa:** Client ID o Secret incorrectos/expirados.

**Solución:**
- Verifica las credenciales en develop.battle.net
- Asegúrate de que la aplicación tenga permisos
- Reintenta tras unos minutos (cache de tokens)

#### 5. "Límite de peticiones alcanzado (HTTP 429)"
**Causa:** Demasiadas peticiones en poco tiempo.

**Solución:**
- Espera 60 segundos y reintenta
- Reduce la frecuencia de actualización
- Usa datos cacheados cuando sea posible

### Logs y Debugging

El sistema incluye logging integrado:
- **Panel API Connection**: muestra logs en tiempo real
- **Consola del navegador**: errores detallados de TypeScript
- **ApiLogEntry**: estructura de logs con timestamp, nivel y mensaje

**Niveles de log:**
- `ok`: Operación exitosa
- `warn`: Advertencia (datos incompletos, fallback activado)
- `err`: Error crítico (fallo de conexión, parseo fallido)

---

## 🤝 Contribuir

### Cómo Contribuir

1. **Fork** el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un **Pull Request**

### Estándares de Código

- **TypeScript estricto**: todos los tipos deben estar definidos
- **ESLint/Prettier**: sigue la configuración del proyecto
- **Tests**: añade tests para nuevas funcionalidades
- **Documentación**: actualiza README.md y comentarios JSDoc

### Áreas de Mejora Sugeridas

- [ ] Integración con más APIs de datos de WoW
- [ ] Backtesting histórico de estrategias
- [ ] Exportación directa a addon de TSM
- [ ] Dashboard de seguimiento de portfolio
- [ ] Alertas en tiempo real de oportunidades
- [ ] Soporte para múltiples regiones simultáneas

---

## 📄 Licencia

**QuantForge·TSM** es software propietario desarrollado para uso personal y educativo.

**Restricciones:**
- No redistribuir sin permiso explícito
- No usar con fines comerciales sin licencia
- Los datos de mercado pertenecen a sus respectivos propietarios (TSM, Blizzard)

**Atribuciones:**
- TradeSkillMaster® es marca registrada de TradeSkillMaster
- World of Warcraft® es marca registrada de Blizzard Entertainment
- Battle.net® es marca registrada de Blizzard Entertainment

---

## 📞 Soporte y Contacto

- **Documentación oficial**: Véase este README
- **Issues**: Reporta bugs en la sección de Issues del repositorio
- **Discusiones**: Únete a las discusiones para preguntas generales

---

## 🙏 Agradecimientos

- **TradeSkillMaster Team** por su API pública y herramienta open-source
- **Blizzard Entertainment** por la API de Battle.net
- **Comunidad de WoW** por el feedback y testing continuo

---

**QuantForge·TSM** — *AI-Driven Trading Profiles for the Modern Goblin Trader*

*Última actualización: 2025*
