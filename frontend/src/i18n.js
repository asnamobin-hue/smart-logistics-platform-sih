import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import hi from './locales/hi.json'
import as from './locales/as.json'
import extra from './locales/extra.json'

const resources = {
  en: { translation: { ...en, extra } },
  hi: { translation: { ...hi, extra: extra.hi } },
  as: { translation: { ...as, extra: extra.as } }
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('ner_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

// A large part of the prototype UI predates i18next and contains literal JSX
// strings. This small compatibility layer translates exact static labels too,
// so changing the language translates the existing screens without changing
// their layout or behaviour.
const translateStaticText = () => {
  const lang = i18n.resolvedLanguage || i18n.language || 'en'
  if (lang === 'en') return
  const map = extra[lang] || {}
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    if (!node.parentElement || ['SCRIPT', 'STYLE', 'OPTION'].includes(node.parentElement.tagName)) continue
    const raw = node.nodeValue
    const trimmed = raw.trim()
    if (!trimmed || !map[trimmed]) continue
    node.nodeValue = raw.replace(trimmed, map[trimmed])
  }
}

i18n.on('languageChanged', () => {
  requestAnimationFrame(translateStaticText)
  setTimeout(translateStaticText, 250)
})
if (typeof document !== 'undefined') {
  const observer = new MutationObserver(() => translateStaticText())
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('load', translateStaticText)
}

export default i18n
