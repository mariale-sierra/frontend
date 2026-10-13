/**
 * In-app copy of the legal documents the user accepts at registration.
 * Mirrors backend/docs/legal/Havit-Politicas-Legales-BORRADOR.docx — that
 * file is what the lawyer reviews; when it changes, change this too and bump
 * CURRENT_TERMS_VERSION in the backend (src/auth/terms-version.ts) so users
 * are asked to accept again.
 *
 * Spanish only on purpose: a legal text has one authoritative language.
 * Text in [BRACKETS] is still to be filled in by the company / lawyer.
 */
export const LEGAL_VERSION = '2026-10-v1';

export type LegalDocKey = 'terms' | 'privacy' | 'community';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Política de Privacidad',
    sections: [
      {
        heading: 'Quiénes somos',
        paragraphs: [
          'Responsable del tratamiento: [NOMBRE LEGAL DE LA EMPRESA], con domicilio en [DIRECCIÓN] ("Havit"). Contacto de privacidad: [CORREO DE PRIVACIDAD].',
        ],
      },
      {
        heading: '1. A quién va dirigido Havit',
        paragraphs: [
          'Havit es solo para personas de 16 años o más. No recopilamos a sabiendas datos de menores de 16 años. Al registrarte confirmas que cumples este requisito. Si descubrimos que una cuenta pertenece a una persona menor de 16 años, la eliminaremos junto con sus datos.',
        ],
      },
      {
        heading: '2. Qué datos recopilamos',
        bullets: [
          'Cuenta: correo electrónico, nombre de usuario y contraseña (almacenada solo cifrada con hash, nunca en texto legible).',
          'Perfil: nombre visible, biografía, foto de perfil, idioma, preferencias de práctica deportiva y si tu perfil es privado.',
          'Actividad física: retos, rutinas, registros de entrenamientos, ejercicios, series, métricas y tu racha de actividad.',
          'Contenido que publicas: fotos de progreso, descripciones, comentarios, reacciones y mensajes en chats y espacios.',
          'Relaciones sociales: a quién sigues, quién te sigue, invitaciones y solicitudes.',
          'Seguridad y moderación: reportes que hagas o recibas, sanciones y resultados de revisión de contenido.',
          'Datos técnicos: zona horaria del dispositivo y registros técnicos del servidor (fecha, ruta, estado de la respuesta y dirección IP).',
          'Consentimiento: fecha y versión de estos textos que aceptaste y fecha de tu confirmación de edad.',
        ],
        paragraphs: [
          'No pedimos tu ubicación ni tus contactos. La cámara o la galería solo se usan cuando eliges subir una foto.',
        ],
      },
      {
        heading: '3. Para qué usamos tus datos',
        bullets: [
          'Prestar el servicio (cuenta, progreso, feed, retos y chats).',
          'Mantener la seguridad y la comunidad: moderar contenido, atender reportes y prevenir abuso.',
          'Cumplir obligaciones legales y requerimientos de autoridades competentes.',
          'Mejorar y mantener la aplicación.',
          'Tus datos de actividad física y fotos de progreso se tratan con tu consentimiento, que puedes retirar eliminando el contenido o tu cuenta.',
        ],
        paragraphs: ['No vendemos tus datos personales ni los usamos para publicidad de terceros.'],
      },
      {
        heading: '4. Quién puede ver tu contenido',
        paragraphs: [
          'Cada publicación tiene una visibilidad: pública, solo seguidores o privada. Las publicaciones privadas solo las ve su autor. El contenido de un reto privado solo lo ven sus miembros. Tu correo electrónico nunca se muestra a otros usuarios. Otras personas pueden hacer capturas o guardar contenido que compartas.',
        ],
      },
      {
        heading: '5. Con quién compartimos datos',
        bullets: [
          'Microsoft Azure (base de datos y alojamiento) - [REGIÓN].',
          'Cloudflare R2 (almacenamiento de fotos) - [REGIÓN].',
          'OpenAI (moderación automática de texto e imágenes): lo que publicas puede enviarse para detectar contenido prohibido.',
          'Autoridades, cuando la ley lo exija.',
        ],
      },
      {
        heading: '6. Cuánto tiempo conservamos tus datos',
        bullets: [
          'Mientras tu cuenta esté activa.',
          'Si solicitas eliminar tu cuenta, tienes 30 días para arrepentirte. Pasado ese plazo eliminamos definitivamente tus publicaciones, fotos, comentarios, mensajes, registros de entrenamiento, métricas, seguidores y notificaciones, y anonimizamos tu cuenta. Durante esos 30 días tu perfil deja de ser visible.',
          'Conservamos de forma anonimizada los registros de moderación y un registro de auditoría de la eliminación.',
          'Las copias de seguridad pueden conservar datos hasta [N] días antes de sobrescribirse.',
        ],
      },
      {
        heading: '7. Tus derechos',
        paragraphs: [
          'Puedes acceder a tus datos, corregirlos, solicitar su eliminación, oponerte o limitar ciertos tratamientos, retirar tu consentimiento y pedir una copia. Puedes eliminar tu cuenta desde Perfil → Configuración → Eliminar cuenta, o escribiendo a [CORREO DE PRIVACIDAD]. Responderemos en un máximo de [30] días.',
        ],
      },
      {
        heading: '8. Seguridad',
        paragraphs: [
          'Aplicamos medidas razonables: contraseñas con hash, conexión cifrada con la base de datos, cabeceras de seguridad, límites de solicitudes y control de acceso por usuario. Ningún sistema es completamente seguro; si ocurre una brecha que te afecte, te lo notificaremos conforme a la ley.',
        ],
      },
      {
        heading: '9. Cambios',
        paragraphs: [
          'Si hacemos cambios importantes te avisaremos y, cuando la ley lo requiera, te pediremos aceptar de nuevo.',
        ],
      },
    ],
  },
  terms: {
    title: 'Términos y Condiciones',
    sections: [
      {
        heading: '1. Aceptación y edad mínima',
        paragraphs: [
          'Al crear una cuenta aceptas estos Términos, la Política de Privacidad y las Normas de la Comunidad. Debes tener 16 años o más.',
        ],
      },
      {
        heading: '2. Tu cuenta',
        bullets: [
          'Eres responsable de la actividad de tu cuenta y de mantener tu contraseña en secreto.',
          'La información que das debe ser veraz. Una persona, una cuenta; no puedes hacerte pasar por otra persona.',
          'Avísanos si sospechas un uso no autorizado.',
        ],
      },
      {
        heading: '3. Salud y seguridad física',
        paragraphs: [
          'Havit es una herramienta de motivación y registro; no ofrece consejo médico ni profesional. Consulta a un profesional de la salud antes de empezar cualquier programa de ejercicio. Haces los retos y rutinas bajo tu propio riesgo.',
        ],
      },
      {
        heading: '4. Tu contenido',
        paragraphs: [
          'Conservas la propiedad de lo que publicas. Nos otorgas una licencia limitada, no exclusiva y revocable para almacenar, mostrar y distribuir ese contenido dentro de Havit según la visibilidad que elijas. La licencia termina cuando eliminas el contenido o la cuenta. Sube solo fotos propias; no publiques fotos de otras personas sin su permiso.',
        ],
      },
      {
        heading: '5. Conducta y moderación',
        paragraphs: [
          'Debes cumplir las Normas de la Comunidad. Podemos revisar contenido de forma automática y manual, ocultarlo o eliminarlo, advertir, suspender o cerrar cuentas que incumplan las normas o la ley. Puedes pedir la revisión de una decisión escribiendo a [CORREO DE SOPORTE].',
        ],
      },
      {
        heading: '6. Retos y espacios',
        paragraphs: [
          'Quien crea un reto o espacio puede administrarlo dentro de las reglas de la plataforma. Los administradores de Havit pueden intervenir para proteger a la comunidad.',
        ],
      },
      {
        heading: '7. Disponibilidad y cambios',
        paragraphs: [
          'Podemos modificar, suspender o descontinuar funciones. El servicio se ofrece "tal cual", sin garantía de disponibilidad ininterrumpida.',
        ],
      },
      {
        heading: '8. Eliminación de cuenta',
        paragraphs: ['Puedes eliminar tu cuenta en cualquier momento según la Política de Privacidad.'],
      },
      {
        heading: '9. Limitación de responsabilidad y ley aplicable',
        paragraphs: [
          'En la máxima medida permitida por la ley, Havit no responde por daños indirectos ni por el contenido publicado por usuarios. Estos Términos se rigen por las leyes de [PAÍS]. Contacto: [CORREO DE SOPORTE].',
        ],
      },
    ],
  },
  community: {
    title: 'Normas de la Comunidad',
    sections: [
      {
        heading: 'Esperamos que...',
        bullets: [
          'Trates a las demás personas con respeto, también en los desacuerdos.',
          'Compartas tu progreso con honestidad: sin trampas en retos ni datos inventados.',
          'Apoyes, no presiones: cada cuerpo y cada ritmo son válidos.',
        ],
      },
      {
        heading: 'No está permitido',
        bullets: [
          'Acoso, intimidación, amenazas, insultos o discriminación por raza, género, orientación sexual, discapacidad, religión, origen, edad o apariencia del cuerpo.',
          'Contenido sexual explícito o desnudez. Las fotos de entrenamiento con ropa deportiva normal sí están permitidas.',
          'Fomentar trastornos alimentarios o conductas dañinas: dietas extremas, humillación por el peso, autolesiones o suicidio.',
          'Publicar fotos o datos de otras personas sin su consentimiento, o información privada ajena.',
          'Cualquier contenido que involucre a menores de forma inapropiada. Lo reportamos a las autoridades.',
          'Promoción de sustancias peligrosas, esteroides u otras drogas, o venta de productos o servicios sin autorización.',
          'Spam, estafas, suplantación de identidad, cuentas falsas o manipular el sistema de retos.',
          'Violencia o contenido que glorifique el daño a personas o animales.',
          'Intentar vulnerar la seguridad de la aplicación o acceder a cuentas ajenas.',
        ],
      },
      {
        heading: 'Cómo reportar',
        paragraphs: [
          'Usa el botón "Reportar" en cualquier publicación o comentario. Un equipo revisa los reportes; el contenido infractor se oculta o elimina. La persona reportada no ve quién la reportó. Reportar de mala fe puede ser sancionado.',
        ],
      },
      {
        heading: 'Consecuencias',
        bullets: [
          'Infracción leve: contenido ocultado y advertencia.',
          'Infracciones repetidas: suspensión temporal.',
          'Infracciones graves (acoso severo, contenido ilegal, riesgo para menores o para la vida de alguien): cierre inmediato de la cuenta y, si corresponde, aviso a las autoridades.',
        ],
      },
      {
        heading: 'Si estás en riesgo',
        paragraphs: [
          'Si tú o alguien que conoces está en peligro o pensando en hacerse daño, contacta a los servicios de emergencia o a una línea de ayuda de tu país: [LISTA DE LÍNEAS DE AYUDA LOCALES].',
        ],
      },
      {
        heading: 'Apelaciones',
        paragraphs: [
          'Si crees que nos equivocamos, escríbenos a [CORREO DE SOPORTE] indicando tu usuario y el contenido. Revisaremos tu caso con una persona distinta a quien tomó la decisión original.',
        ],
      },
    ],
  },
};
