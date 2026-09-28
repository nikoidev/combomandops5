# Combo Mando PS5 · BDO Console

App web (PWA) para **crear, ordenar y practicar tus propios combos de Black Desert Console** con los botones del mando DualSense de PS5.

- 32 clases con sus habilidades e iconos, en **español latino** y **español de España** (y nombre en inglés para buscar).
- Mando DualSense interactivo: haz clic en los botones para armar cada paso (p. ej. `L2 + □`), asígnale la habilidad, marca "mantener" y añade notas.
- Reordena los pasos arrastrando o con las flechas; duplica y edita pasos y combos.
- **Graba con el mando real**: conecta el DualSense por USB/Bluetooth y cada combinación que pulses se añade como paso.
- **Modo práctica**: con el mando, la app valida lo que pulsas paso a paso (tiempo, fallos, mejor tiempo, racha). Modo *tarjetas* y modo *memoria* (oculta los botones) para estudiar sin mando.
- Guardado automático en el navegador, exportar/importar `.json` y compartir un combo con un enlace.
- Instalable en PC y móvil, funciona sin conexión.

## Uso

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests (Vitest)
npm run build      # build de producción en dist/
```

Sin mando puedes probar con el teclado: `J` □ · `I` △ · `L` ○ · `K` ✕ · `Q` L1 · `E` R1 · `Shift` L2 · `R` R2 · `WASD` stick izquierdo · flechas cruceta.

> La Gamepad API funciona en Chrome, Edge y Firefox. El navegador solo detecta el mando después de pulsar un botón.

## Datos e iconos

Los datos ya vienen incluidos en `src/data/` y los iconos en `public/icons/bdo/`. Para actualizarlos (nueva clase, cambios de nombres):

```bash
npm run fetch:data            # usa la caché de scripts/.cache
npm run fetch:data -- --fresh # vuelve a descargar todo
```

El script (`scripts/fetch-bdo-data.ts`) lee bdocodex.com en tres idiomas (`es` España, `sp` Latinoamérica, `us` inglés), agrupa los rangos de cada habilidad (I, II, III…) y descarga solo los iconos que faltan.

## Despliegue

Hay un workflow en `.github/workflows/deploy.yml` que publica en GitHub Pages al hacer push a `main`. Activa *Settings → Pages → Source: GitHub Actions* en el repositorio.

## Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · dnd-kit · i18next · vite-plugin-pwa · Vitest

## Créditos

Black Desert, sus nombres e iconos son © Pearl Abyss. Datos obtenidos de [bdocodex.com](https://bdocodex.com). Proyecto de fans sin ánimo de lucro, no afiliado a Pearl Abyss ni a Sony.
