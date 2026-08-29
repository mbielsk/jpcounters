// Dane czasowników do trybu nauki.
// Struktura pojedynczego wpisu:
//   romaji   – bezokolicznik (forma słownikowa) w rōmaji
//   hiragana – bezokolicznik w hiraganie
//   meaning  – znaczenie po polsku (w fazie 1 wybór z 3 opcji)
//   stem     – rdzeń formy grzecznościowej (~masu); z niego generujemy:
//              stem+masu, stem+masen, stem+mashita, stem+masendeshita

const VERB_LIST = [
  { romaji: "neru",     hiragana: "ねる",     meaning: "spać",         stem: "ne" },
  { romaji: "okiru",    hiragana: "おきる",   meaning: "wstawać",      stem: "oki" },
  { romaji: "taberu",   hiragana: "たべる",   meaning: "jeść",         stem: "tabe" },
  { romaji: "miru",     hiragana: "みる",     meaning: "widzieć",      stem: "mi" },
  { romaji: "iku",      hiragana: "いく",     meaning: "iść",          stem: "iki" },
  { romaji: "nomu",     hiragana: "のむ",     meaning: "pić",          stem: "nomi" },
  { romaji: "hataraku", hiragana: "はたらく", meaning: "pracować",     stem: "hataraki" },
  { romaji: "shinu",    hiragana: "しぬ",     meaning: "umierać",      stem: "shini" },
  { romaji: "hanasu",   hiragana: "はなす",   meaning: "mówić",        stem: "hanashi" },
  { romaji: "hashiru",  hiragana: "はしる",   meaning: "biegać",       stem: "hashiri" },
  { romaji: "kaku",     hiragana: "かく",     meaning: "pisać",        stem: "kaki" },
  { romaji: "yomu",     hiragana: "よむ",     meaning: "czytać",       stem: "yomi" },
  { romaji: "asobu",    hiragana: "あそぶ",   meaning: "bawić się",    stem: "asobi" },
  { romaji: "kuru",     hiragana: "くる",     meaning: "przychodzić",  stem: "ki" },
  { romaji: "suru",     hiragana: "する",     meaning: "robić",        stem: "shi" },
  { romaji: "aru",      hiragana: "ある",     meaning: "być",          stem: "ari" }
];
