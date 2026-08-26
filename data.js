// Dane liczników (klasyfikatorów) japońskich.
// Każdy element ma: num (liczba), kanji (zapis liczby), reading (hiragana),
// romaji (tablica akceptowanych zapisów romaji, pierwszy jest "głównym").
// Kolejne warianty czytania to osobne elementy z tym samym "num".

const COUNTER_GROUPS = {
  people: {
    id: "people",
    label: "Osoby",
    counter: "人",
    reading: "nin / ~ri",
    color: "#e57373",
    items: [
      { num: 1, kanji: "一", reading: "ひとり", romaji: ["hitori"] },
      { num: 2, kanji: "二", reading: "ふたり", romaji: ["futari"] },
      { num: 3, kanji: "三", reading: "さんにん", romaji: ["sannin"] },
      { num: 4, kanji: "四", reading: "よにん", romaji: ["yonin"] },
      { num: 5, kanji: "五", reading: "ごにん", romaji: ["gonin"] },
      { num: 6, kanji: "六", reading: "ろくにん", romaji: ["rokunin"] },
      { num: 7, kanji: "七", reading: "しちにん", romaji: ["shichinin"] },
      { num: 7, kanji: "七", reading: "ななにん", romaji: ["nananin"] },
      { num: 8, kanji: "八", reading: "はちにん", romaji: ["hachinin"] },
      { num: 9, kanji: "九", reading: "きゅうにん", romaji: ["kyuunin", "kyunin"] },
      { num: 10, kanji: "十", reading: "じゅうにん", romaji: ["juunin", "junin"] },
      { num: "?", kanji: "何", reading: "なんにん", romaji: ["nannin"] }
    ]
  },

  minutes: {
    id: "minutes",
    label: "Minuty",
    counter: "分",
    reading: "fun / pun",
    color: "#64b5f6",
    items: [
      { num: 1, kanji: "一", reading: "いっぷん", romaji: ["ippun"] },
      { num: 2, kanji: "二", reading: "にふん", romaji: ["nifun"] },
      { num: 3, kanji: "三", reading: "さんぷん", romaji: ["sanpun"] },
      { num: 4, kanji: "四", reading: "よんぷん", romaji: ["yonpun"] },
      { num: 5, kanji: "五", reading: "ごふん", romaji: ["gofun"] },
      { num: 6, kanji: "六", reading: "ろっぷん", romaji: ["roppun"] },
      { num: 7, kanji: "七", reading: "ななふん", romaji: ["nanafun"] },
      { num: 8, kanji: "八", reading: "はっぷん", romaji: ["happun"] },
      { num: 8, kanji: "八", reading: "はちふん", romaji: ["hachifun"] },
      { num: 9, kanji: "九", reading: "きゅうふん", romaji: ["kyuufun", "kyufun"] },
      { num: 10, kanji: "十", reading: "じゅっぷん", romaji: ["juppun"] },
      { num: 10, kanji: "十", reading: "じっぷん", romaji: ["jippun"] },
      { num: "?", kanji: "何", reading: "なんぷん", romaji: ["nanpun"] }
    ]
  },

  hours: {
    id: "hours",
    label: "Godziny",
    counter: "時",
    reading: "ji",
    color: "#81c784",
    items: [
      { num: 1, kanji: "一", reading: "いちじ", romaji: ["ichiji"] },
      { num: 2, kanji: "二", reading: "にじ", romaji: ["niji"] },
      { num: 3, kanji: "三", reading: "さんじ", romaji: ["sanji"] },
      { num: 4, kanji: "四", reading: "よじ", romaji: ["yoji"] },
      { num: 5, kanji: "五", reading: "ごじ", romaji: ["goji"] },
      { num: 6, kanji: "六", reading: "ろくじ", romaji: ["rokuji"] },
      { num: 7, kanji: "七", reading: "しちじ", romaji: ["shichiji"] },
      { num: 8, kanji: "八", reading: "はちじ", romaji: ["hachiji"] },
      { num: 9, kanji: "九", reading: "くじ", romaji: ["kuji"] },
      { num: 10, kanji: "十", reading: "じゅうじ", romaji: ["juuji", "juji"] },
      { num: 11, kanji: "十一", reading: "じゅういちじ", romaji: ["juuichiji", "juichiji"] },
      { num: 12, kanji: "十二", reading: "じゅうにじ", romaji: ["juuniji", "juniji"] },
      { num: "?", kanji: "何", reading: "なんじ", romaji: ["nanji"] }
    ]
  },

  days: {
    id: "days",
    label: "Dni",
    counter: "日",
    reading: "nichi / ~ka",
    color: "#ba68c8",
    items: [
      { num: 1, kanji: "一", reading: "ついたち", romaji: ["tsuitachi"] },
      { num: 2, kanji: "二", reading: "ふつか", romaji: ["futsuka"] },
      { num: 3, kanji: "三", reading: "みっか", romaji: ["mikka"] },
      { num: 4, kanji: "四", reading: "よっか", romaji: ["yokka"] },
      { num: 5, kanji: "五", reading: "いつか", romaji: ["itsuka"] },
      { num: 6, kanji: "六", reading: "むいか", romaji: ["muika"] },
      { num: 7, kanji: "七", reading: "なのか", romaji: ["nanoka"] },
      { num: 8, kanji: "八", reading: "ようか", romaji: ["youka", "yoka"] },
      { num: 9, kanji: "九", reading: "ここのか", romaji: ["kokonoka"] },
      { num: 10, kanji: "十", reading: "とおか", romaji: ["tooka", "toka"] },
      { num: 14, kanji: "十四", reading: "じゅうよっか", romaji: ["juuyokka", "juyokka"] },
      { num: 20, kanji: "二十", reading: "はつか", romaji: ["hatsuka"] },
      { num: 24, kanji: "二十四", reading: "にじゅうよっか", romaji: ["nijuuyokka", "nijuyokka"] },
      { num: "?", kanji: "何", reading: "なんにち", romaji: ["nannichi"] }
    ]
  }
};
