import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { esES } from './es-ES'
import { es419 } from './es-419'

void i18n.use(initReactI18next).init({
  resources: { 'es-ES': { translation: esES }, 'es-419': { translation: es419 } },
  lng: 'es-419',
  fallbackLng: 'es-419',
  interpolation: { escapeValue: false },
})

export default i18n
