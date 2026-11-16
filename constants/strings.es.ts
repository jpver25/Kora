/** UI copy — Spanish (Chile) */
export const strings = {
  appName: 'Kora',
  tagline: 'Sabe qué estás comprando.',
  slogan: '¡Kora cuida tu corazón!',

  tabs: {
    home: 'Inicio',
    explore: 'Explorar',
    scan: 'Escanear',
    history: 'Historial',
    profile: 'Perfil',
  },

  onboarding: {
    skip: 'Omitir',
    next: 'Continuar',
    start: 'Empezar a escanear',
    swipe: 'Desliza para continuar',
    slides: [
      {
        title: 'Análisis de productos',
        body: 'Kora escanea tus productos y descifra sus etiquetas.',
      },
      {
        title: 'Código o empaque',
        body: 'Escanea el código de barras o apunta al frente del envase: Kora combina OCR e IA visual con catálogos reales.',
      },
      {
        title: 'Mejores alternativas',
        body: 'Recibe un puntaje claro y opciones más sanas cuando un producto no conviene.',
      },
    ],
  },

  home: {
    greeting: 'Hola',
    headline: 'Escanea y elige mejor',
    subhead: 'Apunta la cámara a un alimento o cosmético y Kora te explica qué hay dentro.',
    ctaScan: 'Escanear ahora',
    recent: 'Recientes',
    emptyRecent: 'Aún no hay escaneos. Prueba con un producto del súper.',
    tipTitle: 'Tip del día',
    tipBody: 'Prioriza productos con pocos aditivos y mejor Nutri-Score cuando exista.',
  },

  explore: {
    title: 'Explorar',
    subtitle: 'Descubre categorías y tipologías que Kora puede evaluar.',
    food: 'Alimentos',
    beauty: 'Cosméticos',
    coming: 'Catálogo enriquecido con Supabase próximamente.',
    categories: [
      { id: 'bebidas', title: 'Bebidas', hint: 'Jugos, leches, bebidas' },
      { id: 'snacks', title: 'Snacks', hint: 'Galletas, cereales, snacks' },
      { id: 'lacteos', title: 'Lácteos', hint: 'Yogures, quesos, postres' },
      { id: 'cuidado', title: 'Cuidado personal', hint: 'Cremas, shampoos, makeup' },
    ],
  },

  scan: {
    title: 'Escanear',
    permissionTitle: 'Necesitamos la cámara',
    permissionBody: 'Kora usa la cámara para leer códigos de barras y reconocer envases.',
    permissionCta: 'Permitir cámara',
    modes: {
      auto: 'Auto',
      barcode: 'Código',
      visual: 'Visual',
    },
    hintAuto: 'Apunta al código o al frente del producto',
    hintBarcode: 'Centra el código de barras en el marco',
    hintVisual: 'Centra el frente del envase y captura',
    lookingUp: 'Buscando producto…',
    analyzingVisual: 'Analizando empaque…',
    torch: 'Linterna',
    capture: 'Capturar envase',
    manual: 'Ingresar código',
    manualPlaceholder: 'Ej: 7801234567890',
    manualSubmit: 'Buscar',
    visualSoon: 'Reconocimiento visual',
    visualSoonBody:
      'Configura OpenAI o la Edge Function para OCR/embeddings. Sin proveedor no inventamos productos.',
    visual: {
      missingImage: 'Necesitamos una foto del empaque.',
      needsProvider:
        'Falta un proveedor de visión (EXPO_PUBLIC_OPENAI_API_KEY o Edge Function visual-identify). No inventamos coincidencias.',
      autoOpen: 'Producto identificado con alta confianza.',
      candidates: 'Encontramos {n} posibles coincidencias. Elige una.',
      lowConfidence: 'Confianza baja: revisa las opciones o prueba con mejor luz.',
      noMatch:
        'No encontramos el producto en catálogos reales. Prueba otro ángulo o el código de barras.',
      pickTitle: '¿Cuál es tu producto?',
      confidence: 'Confianza',
      providerNone: 'Sin proveedor de visión',
      providerReady: 'Visión lista',
    },
  },

  product: {
    score: 'Puntaje Kora',
    ingredients: 'Ingredientes',
    additives: 'Aditivos',
    nutriments: 'Nutrición',
    alternatives: 'Mejores alternativas',
    alternativesSoon: 'Sugerencias personalizadas cuando el catálogo esté conectado.',
    notFoundTitle: 'Producto no encontrado',
    notFoundBody: 'No está en Open Food Facts ni en el catálogo Kora todavía.',
    retry: 'Escanear otro',
    source: 'Fuente de datos',
    barcode: 'Código',
    brand: 'Marca',
    categories: 'Categorías',
    unknown: 'Sin datos',
    bands: {
      excellent: 'Excelente',
      good: 'Bueno',
      mediocre: 'Mediocre',
      bad: 'Malo',
      unknown: 'Sin puntaje',
    },
  },

  history: {
    title: 'Historial',
    empty: 'Tu historial aparecerá aquí después de escanear.',
    clear: 'Borrar historial',
    cleared: 'Historial borrado',
  },

  profile: {
    title: 'Perfil',
    subtitle: 'Preferencias y cuenta',
    guest: 'Invitado',
    guestHint: 'Inicia sesión cuando configuremos Supabase Auth.',
    language: 'Idioma',
    languageValue: 'Español (Chile)',
    about: 'Acerca de Kora',
    aboutBody: 'Escáner inteligente de alimentos y cosméticos para Chile.',
    version: 'Versión',
    resetOnboarding: 'Volver a ver onboarding',
    supabaseMissing: 'Supabase no configurado',
    supabaseHint: 'Agrega EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env',
  },

  common: {
    loading: 'Cargando…',
    error: 'Algo salió mal',
    tryAgain: 'Reintentar',
    cancel: 'Cancelar',
    ok: 'Listo',
    back: 'Volver',
  },
} as const;
