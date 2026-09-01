// Dane słownictwa (Vocabulary) pogrupowane tematycznie.
// Każdy element: kana (hiragana), romaji, meaning (po polsku).

const VOCAB_GROUPS = {
  weekdays: {
    id: "weekdays",
    label: "Dni tygodnia",
    glyph: "曜",
    color: "#64b5f6",
    items: [
      { kana: "げつようび", romaji: "getsuyoubi", meaning: "poniedziałek" },
      { kana: "かようび",   romaji: "kayoubi",     meaning: "wtorek" },
      { kana: "すいようび", romaji: "suiyoubi",   meaning: "środa" },
      { kana: "もくようび", romaji: "mokuyoubi",  meaning: "czwartek" },
      { kana: "きんようび", romaji: "kinyoubi",   meaning: "piątek" },
      { kana: "どようび",   romaji: "doyoubi",     meaning: "sobota" },
      { kana: "にちようび", romaji: "nichiyoubi", meaning: "niedziela" }
    ]
  },

  frequency: {
    id: "frequency",
    label: "Częstotliwość",
    glyph: "毎",
    color: "#e57373",
    items: [
      { kana: "いつも",     romaji: "itsumo",   meaning: "zawsze" },
      { kana: "たいてい",   romaji: "taitei",   meaning: "zazwyczaj" },
      { kana: "よく",       romaji: "yoku",     meaning: "często" },
      { kana: "ときどき",   romaji: "tokidoki", meaning: "czasem" },
      { kana: "あまり",     romaji: "amari",    meaning: "niezbyt często" },
      { kana: "ぜんぜん",   romaji: "zenzen",   meaning: "nigdy (wcale)" },
      { kana: "まいにち",   romaji: "mainichi", meaning: "każdego dnia" }
    ]
  },

  meals: {
    id: "meals",
    label: "Posiłki",
    glyph: "食",
    color: "#ffb74d",
    items: [
      { kana: "あさごはん", romaji: "asagohan", meaning: "śniadanie" },
      { kana: "ひるごはん", romaji: "hirugohan", meaning: "obiad (lunch)" },
      { kana: "ばんごはん", romaji: "bangohan", meaning: "kolacja" },
      { kana: "ごはん",     romaji: "gohan",    meaning: "ryż / posiłek" }
    ]
  },

  seasons: {
    id: "seasons",
    label: "Pory roku",
    glyph: "季",
    color: "#81c784",
    items: [
      { kana: "はる", romaji: "haru",  meaning: "wiosna" },
      { kana: "なつ", romaji: "natsu", meaning: "lato" },
      { kana: "あき", romaji: "aki",   meaning: "jesień" },
      { kana: "ふゆ", romaji: "fuyu",  meaning: "zima" }
    ]
  },

  dayparts: {
    id: "dayparts",
    label: "Pory dnia",
    glyph: "朝",
    color: "#ba68c8",
    items: [
      { kana: "あさ",     romaji: "asa",     meaning: "rano / poranek" },
      { kana: "ひる",     romaji: "hiru",    meaning: "południe / dzień" },
      { kana: "ばん",     romaji: "ban",     meaning: "wieczór" },
      { kana: "よる",     romaji: "yoru",    meaning: "noc" },
      { kana: "ゆうがた", romaji: "yuugata", meaning: "wieczór (zmierzch)" },
      { kana: "ごぜん",   romaji: "gozen",   meaning: "przedpołudnie (AM)" },
      { kana: "ごご",     romaji: "gogo",    meaning: "popołudnie (PM)" }
    ]
  },

  time: {
    id: "time",
    label: "Czas (dni)",
    glyph: "日",
    color: "#4db6ac",
    items: [
      { kana: "きょう",     romaji: "kyou",     meaning: "dziś" },
      { kana: "あした",     romaji: "ashita",   meaning: "jutro" },
      { kana: "きのう",     romaji: "kinou",    meaning: "wczoraj" },
      { kana: "おととい",   romaji: "ototoi",   meaning: "przedwczoraj" },
      { kana: "あさって",   romaji: "asatte",   meaning: "pojutrze" },
      { kana: "こんしゅう", romaji: "konshuu",  meaning: "w tym tygodniu" },
      { kana: "せんしゅう", romaji: "senshuu",  meaning: "w zeszłym tygodniu" },
      { kana: "らいしゅう", romaji: "raishuu",  meaning: "za tydzień (przyszły)" },
      { kana: "こんげつ",   romaji: "kongetsu", meaning: "w tym miesiącu" },
      { kana: "らいげつ",   romaji: "raigetsu", meaning: "w przyszłym miesiącu" }
    ]
  }
};
