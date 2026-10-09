# Gaviotas Conecta — Auditoría de seguridad, escalabilidad y estabilidad

Fecha: 8 de octubre de 2026 · Alcance: app web (React + Vite) en Vercel, base de datos y almacenamiento en Supabase (proyecto `zaxivsggncaimskheukn`).

**Estado:** apta para seguir en **pruebas con la JAC**. **No declarar lista para lanzamiento público** hasta cumplir la lista de verificación del final (copias de seguridad configuradas, CAPTCHA y prueba manual completa).

---

## 1. Arquitectura revisada

| Pieza | Detalle |
|---|---|
| Frontend | React 19, Vite 8, Tailwind 4, TypeScript 5.7; PWA instalable |
| Hosting | Vercel (proyecto `gaviotas-conecta`), Node 24.x en build, despliegue automático desde `main` |
| Datos | Supabase Postgres 17 con RLS en todas las tablas; acceso solo con la clave publicable |
| Archivos | Supabase Storage: `publico` (fotos visibles) y `certificados` (privado, enlaces firmados) |
| Autenticación | Supabase Auth: vecinos anónimos o con cuenta (correo confirmado); JAC con rol de administrador en la tabla `admins` |
| Servidor propio | No existe: no hay funciones de servidor ni API propia. Toda la autorización se hace en la base de datos (RLS, triggers y funciones) |

## 2. Hallazgos y estado

Severidad según evidencia encontrada. "Probado" = verificado con pruebas reales sobre la base de datos (dentro de transacciones revertidas) o en navegador.

| # | Severidad | Hallazgo (evidencia) | Estado |
|---|---|---|---|
| 1 | 🟠 Alta | Sin límites anti-abuso: un visitante creó 200 publicaciones seguidas y un registro de 3 MB | ✅ Corregido y probado: máx. 5 perdidos, 3 certificados, 2 oficios, 10 reseñas y 40 fotos por usuario cada 24 h; tamaño máximo por registro |
| 2 | 🟠 Alta | Al abrir la app se descargaba todo, con las fotos dentro de la base de datos | ✅ Corregido: fotos al almacenamiento (7 pruebas automáticas), límites por consulta. ⚠️ Falta paginación en pantalla (ver riesgos) |
| 3 | 🟠 Alta | Sin copias de seguridad (plan gratuito) y riesgo de pausa por inactividad | 🟡 Mitigado: respaldo diario en GitHub Actions, **requiere configurar un secreto** (sección 6) |
| 4 | 🟠 Alta | QR de certificados apuntaba a un dominio ajeno sin página de verificación | ✅ Corregido y probado: `/verificar/{id}` con identificador no adivinable y cédula enmascarada |
| 5 | 🟡 Media | Faltaban cabeceras HTTP de seguridad | ✅ Corregido: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy. Probado en navegador sin violaciones |
| 6 | 🟡 Media | Un oficio aprobado podía editarse sin nueva revisión | ✅ Corregido y probado: vuelve a "pendiente" (excepto "disponible hoy") |
| 7 | 🟡 Media | Reseñas anónimas ilimitadas (manipulación de reputación) | ✅ Corregido y probado: solo vecinos con cuenta, una por trabajador, 10 por día |
| 8 | — | Teléfono visible en perdidos y encontrados | ℹ️ **No es falla**: es intencional (botón "Llamar"). Se agregó aviso de que el número es público |
| 9 | 🟡 Media | 12 dependencias vulnerables (7 altas, casi todas de compilación) | ✅ Corregido: `pnpm audit` → 0 vulnerabilidades |
| 10 | 🟡 Media | Sin pruebas ni verificación antes de publicar | 🟡 Mitigado: pruebas automáticas + flujo de verificación en GitHub. Falta proteger la rama `main` (sección 6) |
| 11 | 🟡 Media | Protección contra contraseñas filtradas desactivada | ⏳ Configuración tuya (sección 6) |
| 12 | 🟡 Media | Contraseña temporal del administrador quedó escrita en el chat | ⏳ Cámbiala (sección 6) |
| 13 | ⚪ Baja | Previews de Vercel usan la base de datos real | ⏳ Residual: las previews están protegidas por Vercel (solo tú las ves) |
| 14 | ⚪ Baja | Dos administradores editando a la vez: gana el último | ⏳ Residual |
| 15 | ⚪ Baja | Código de la app de 1.4 MB | ⏳ Pendiente: dividir por pantallas |
| 16 | ⚪ Baja (funcional) | Las respuestas del chatbot editadas en el panel no se usan | ⏳ Pendiente, no es de seguridad |

**Sin evidencia de:** inyección SQL (todo pasa por la API parametrizada de Supabase), XSS (no hay `innerHTML` ni `dangerouslySetInnerHTML`; React escapa los textos), secretos expuestos (solo la clave publicable), acceso a datos ajenos (probado: un vecino ve 0 certificados y 0 cédulas ajenas; un visitante ve 0 administradores).

## 3. Archivos modificados

| Archivo | Motivo |
|---|---|
| `vercel.json` | Cabeceras de seguridad; `sw.js` sin caché |
| `package.json`, `pnpm-lock.yaml` | Dependencias actualizadas, `overrides` de seguridad, Vitest y script `test` |
| `src/store.ts` | Fotos al almacenamiento (público/privado), enlaces firmados, límites por consulta, mensajes de error claros |
| `src/VerifyScreen.tsx` (nuevo) | Página pública de verificación de certificados |
| `src/main.tsx` | Ruta `/verificar/{id}` |
| `src/CertificateAdmin.tsx` | El QR apunta a la verificación real |
| `src/OfficiosScreen.tsx` | Calificar requiere cuenta |
| `src/LostFoundScreen.tsx` | Aviso de teléfono público |
| `src/store.test.ts` (nuevo) | 7 pruebas automáticas del almacén de datos |
| `supabase/migrations/*.sql` (nuevo) | Copia versionada de todas las migraciones aplicadas |
| `supabase/tests/security.sql` (nuevo) | Pruebas de seguridad de la base de datos |
| `.github/workflows/ci.yml` (nuevo) | Auditoría, tipos, pruebas y compilación en cada cambio |
| `.github/workflows/respaldo.yml` (nuevo) | Respaldo diario de la base de datos |

Migraciones aplicadas en esta auditoría: `etapa1_limites_antiabuso`, `etapa2_verificar_certificado`, `etapa2_limite_subidas`. Ninguna borra datos.

## 4. Pruebas ejecutadas y resultados reales

| Prueba | Resultado |
|---|---|
| `pnpm audit` | 0 vulnerabilidades (antes 12) |
| `tsc --noEmit` | Sin errores |
| `pnpm test` (Vitest) | 7 de 7 pasan |
| `pnpm build` | Compila |
| Navegador headless con las cabeceras de producción (inicio, noticias, eventos, directorio, mapa, verificación) | 0 violaciones de CSP, 0 errores |
| Límite diario de publicaciones | La 6.ª publicación fue bloqueada |
| Registro gigante | Bloqueado por tamaño |
| Oficio aprobado editado | Vuelve a "pendiente"; cambiar "disponible hoy" lo mantiene aprobado |
| Reseña anónima / con cuenta | Bloqueada / aceptada (+1 contratación) |
| Almacenamiento | Subir en carpeta ajena: bloqueado. Otro vecino ve cédulas ajenas: 0. JAC: sí. Foto n.º 40 del día: bloqueada |
| Verificación de certificado | Aprobado: válido con cédula `••••••3456`. Pendiente o inexistente: no válido |
| `supabase/tests/security.sql` como un solo bloque | **No ejecutado**: Supabase pidió una aprobación que no se completó. Cada regla sí se probó por separado (filas anteriores) |
| Subida real de fotos contra Supabase | **No ejecutable desde el entorno de auditoría** (sin red hacia Supabase). Cubierto con pruebas simuladas y de permisos; falta la prueba manual (sección 8) |
| Pruebas de carga | **No ejecutadas**: deben hacerse en un proyecto de pruebas, no en producción |

Para repetir las pruebas de la base de datos: pegar `supabase/tests/security.sql` en Supabase → SQL Editor → Run. Debe terminar con `OK: 17 pruebas`.

## 5. Riesgos pendientes

- **Sin CAPTCHA:** un atacante con muchas IP podría crear sesiones anónimas (Supabase limita a 30 por hora por IP) y publicar dentro de los límites diarios. Configurar Cloudflare Turnstile (sección 6).
- **Fotos huérfanas:** al borrar una publicación, sus fotos quedan en el almacenamiento.
- **Sin paginación en pantalla:** la app trae hasta 300 perdidos, 500 oficios y 2.000 reseñas; con más volumen hará falta "cargar más".
- **Plan gratuito:** límites de base de datos, almacenamiento y transferencia, y pausa por inactividad. Confirmar las cifras vigentes en el panel de Supabase.
- **Sesión en `localStorage`** (estándar en apps sin servidor): un XSS podría robarla. Mitigado con CSP estricta para scripts.
- **CSP con `style-src 'unsafe-inline'`:** necesario por los estilos en línea de la app; los scripts sí están restringidos.

## 6. Configuraciones que debes hacer

**Supabase**
1. **Cambiar la contraseña del administrador**: Panel de la app → Ajustes.
2. **Leaked password protection**: Authentication → Providers → Email (o Attack Protection). Si tu plan no lo permite, queda como riesgo aceptado.
3. **CAPTCHA**: crear un sitio en Cloudflare Turnstile (gratis), activarlo en Authentication → Attack Protection y pasarme la *site key* para conectarlo en la app.

**GitHub**
4. **Secreto del respaldo**: Supabase → Project Settings → Database → Connection string (URI, *Session pooler*) → copiar con tu contraseña de base de datos → GitHub → Settings → Secrets and variables → Actions → `SUPABASE_DB_URL`. Probar en Actions → "Respaldo diario" → Run workflow.
5. **Proteger `main`**: Settings → Branches → Add rule → `main` → exigir que pase "Verificación" antes de fusionar.

**Vercel**
6. Nada obligatorio. Las previews ya están protegidas. Opcional: alertas de uso en Settings → Notifications.

## 7. Plan de escalabilidad por etapas

| Etapa | Usuarios aprox. | Acciones |
|---|---|---|
| Pruebas JAC | < 50 | Estado actual + configuraciones de la sección 6 |
| Lanzamiento barrio | 50–500 | CAPTCHA, prueba manual completa, respaldo verificado (restaurar en un proyecto de prueba), dividir el código por pantallas |
| Crecimiento | 500–3.000 | Paginación "cargar más", limpieza de fotos huérfanas, plan Pro de Supabase (copias automáticas, sin pausa), monitoreo de uso |
| Tiendas | — | Empaquetar con Capacitor o Expo; notificaciones push |

Las cifras son orientativas: no se hicieron pruebas de carga. Antes de cada salto, medir en un proyecto de pruebas.

## 8. Lista de verificación previa al lanzamiento

- [ ] Contraseña de administrador cambiada
- [ ] Datos reales del certificado en Ajustes (presidente, resolución, NIT, firma)
- [ ] Prueba manual en 2 celulares: crear cuenta, confirmar correo, recuperar contraseña
- [ ] Publicar perdido con fotos y verlo desde otro celular
- [ ] Solicitar certificado con fotos; la JAC lo ve, lo aprueba y descarga el PDF; el QR abre "Certificado auténtico"
- [ ] Inscribir un oficio, aprobarlo, calificarlo con otra cuenta
- [ ] Respaldo diario ejecutado al menos una vez con éxito
- [ ] `security.sql` ejecutado: `OK`
- [ ] Rama `main` protegida
- [ ] CAPTCHA activo

## 9. Cómo volver a una versión anterior

**App (Vercel), inmediato:** Vercel → proyecto `gaviotas-conecta` → Deployments → elegir el despliegue estable → ⋯ → **Promote to Production** (o **Instant Rollback**).

**Código (GitHub):** `git revert <commit>` y subir a `main`. Puntos estables: `492c596` (antes de la auditoría), `1a66eee` (etapa 1), `76950f8` (etapa 2).

**Base de datos:** las migraciones de esta auditoría solo agregan reglas. Para retirar una regla, crear una migración nueva que la elimine (por ejemplo `drop trigger lost_found_daily_limit on public.lost_found;`). Para datos, restaurar el último respaldo diario en un proyecto de prueba, comprobarlo y solo entonces en producción.

## 10. Mantenimiento continuo

- **Semanal:** revisar Actions (verificación y respaldo en verde) y Supabase → Advisors.
- **Mensual:** `pnpm update` + `pnpm audit`; revisar uso en Supabase y Vercel; revisar la lista de administradores.
- **Trimestral:** restaurar un respaldo en un proyecto de prueba; repetir `security.sql`; revisar estas políticas.
- **Ante un incidente:** 1) volver a la versión estable (sección 9); 2) si hay abuso, bajar los límites diarios o pausar el acceso anónimo en Supabase; 3) revisar Supabase → Logs; 4) documentar y corregir.
