// Dane kanji do trybu nauki. Lista będzie rosła.
// Struktura pojedynczego kanji:
//   kanji    – znak
//   meanings – lista znaczeń (po polsku); w fazie 1 losowane jest jedno
//   onyomi   – czytania chińskie (rōmaji)
//   kunyomi  – czytania japońskie (rōmaji)
//   examples – złożenia do fazy 3: { word, reading }

const KANJI_LIST = [
  {
    kanji: "一",
    meanings: ["jeden"],
    onyomi: ["ichi", "itsu"],
    kunyomi: ["hito"],
    examples: [
      { word: "一", reading: "ichi" },
      { word: "一つ", reading: "hitotsu" },
      { word: "一月", reading: "ichigatsu" }
    ]
  },
  {
    kanji: "二",
    meanings: ["dwa"],
    onyomi: ["ni"],
    kunyomi: ["futa"],
    examples: [
      { word: "二", reading: "ni" },
      { word: "二つ", reading: "futatsu" },
      { word: "二月", reading: "nigatsu" }
    ]
  },
  {
    kanji: "三",
    meanings: ["trzy"],
    onyomi: ["san"],
    kunyomi: ["mi"],
    examples: [
      { word: "三", reading: "san" },
      { word: "三つ", reading: "mittsu" },
      { word: "三月", reading: "sangatsu" }
    ]
  },
  {
    kanji: "四",
    meanings: ["cztery"],
    onyomi: ["shi"],
    kunyomi: ["yon", "yo"],
    examples: [
      { word: "四", reading: "yon" },
      { word: "四つ", reading: "yottsu" },
      { word: "四月", reading: "shigatsu" }
    ]
  },
  {
    kanji: "五",
    meanings: ["pięć"],
    onyomi: ["go"],
    kunyomi: ["itsu"],
    examples: [
      { word: "五", reading: "go" },
      { word: "五つ", reading: "itsutsu" },
      { word: "五月", reading: "gogatsu" }
    ]
  },
  {
    kanji: "六",
    meanings: ["sześć"],
    onyomi: ["roku"],
    kunyomi: ["mu"],
    examples: [
      { word: "六", reading: "roku" },
      { word: "六つ", reading: "muttsu" },
      { word: "六月", reading: "rokugatsu" }
    ]
  },
  {
    kanji: "七",
    meanings: ["siedem"],
    onyomi: ["shichi"],
    kunyomi: ["nana"],
    examples: [
      { word: "七", reading: "nana" },
      { word: "七つ", reading: "nanatsu" },
      { word: "七月", reading: "shichigatsu" }
    ]
  },
  {
    kanji: "八",
    meanings: ["osiem"],
    onyomi: ["hachi"],
    kunyomi: ["ya"],
    examples: [
      { word: "八", reading: "hachi" },
      { word: "八つ", reading: "yattsu" },
      { word: "八月", reading: "hachigatsu" }
    ]
  },
  {
    kanji: "九",
    meanings: ["dziewięć"],
    onyomi: ["kyuu", "ku"],
    kunyomi: ["kokono"],
    examples: [
      { word: "九", reading: "kyuu" },
      { word: "九つ", reading: "kokonotsu" },
      { word: "九月", reading: "kugatsu" }
    ]
  },
  {
    kanji: "十",
    meanings: ["dziesięć"],
    onyomi: ["juu"],
    kunyomi: ["too", "to"],
    examples: [
      { word: "十", reading: "juu" },
      { word: "十日", reading: "tooka" },
      { word: "十月", reading: "juugatsu" }
    ]
  },
  {
    kanji: "日",
    meanings: ["dzień", "słońce"],
    onyomi: ["nichi", "jitsu"],
    kunyomi: ["hi", "ka"],
    examples: [
      { word: "日", reading: "hi" },
      { word: "日本", reading: "nihon" },
      { word: "三日", reading: "mikka" }
    ]
  },
  {
    kanji: "月",
    meanings: ["miesiąc", "księżyc"],
    onyomi: ["getsu", "gatsu"],
    kunyomi: ["tsuki"],
    examples: [
      { word: "月", reading: "tsuki" },
      { word: "一月", reading: "ichigatsu" },
      { word: "月曜日", reading: "getsuyoubi" }
    ]
  },
  {
    kanji: "木",
    meanings: ["drzewo", "drewno"],
    onyomi: ["moku", "boku"],
    kunyomi: ["ki", "ko"],
    examples: [
      { word: "木", reading: "ki" },
      { word: "木曜日", reading: "mokuyoubi" },
      { word: "木々", reading: "kigi" }
    ]
  },
  {
    kanji: "本",
    meanings: ["książka", "źródło"],
    onyomi: ["hon"],
    kunyomi: ["moto"],
    examples: [
      { word: "本", reading: "hon" },
      { word: "日本", reading: "nihon" },
      { word: "一本", reading: "ippon" }
    ]
  },
  {
    kanji: "山",
    meanings: ["góra"],
    onyomi: ["san"],
    kunyomi: ["yama"],
    examples: [
      { word: "山", reading: "yama" },
      { word: "富士山", reading: "fujisan" },
      { word: "山下", reading: "yamashita" }
    ]
  },
  {
    kanji: "川",
    meanings: ["rzeka"],
    onyomi: ["sen"],
    kunyomi: ["kawa", "gawa"],
    examples: [
      { word: "川", reading: "kawa" },
      { word: "川口", reading: "kawaguchi" },
      { word: "小川", reading: "ogawa" }
    ]
  },
  {
    kanji: "田",
    meanings: ["pole ryżowe"],
    onyomi: ["den"],
    kunyomi: ["ta", "da"],
    examples: [
      { word: "田", reading: "ta" },
      { word: "田中", reading: "tanaka" },
      { word: "山田", reading: "yamada" }
    ]
  },
  {
    kanji: "人",
    meanings: ["człowiek"],
    onyomi: ["jin", "nin"],
    kunyomi: ["hito"],
    examples: [
      { word: "人", reading: "hito" },
      { word: "日本人", reading: "nihonjin" },
      { word: "三人", reading: "sannin" }
    ]
  },
  {
    kanji: "口",
    meanings: ["usta"],
    onyomi: ["kou", "ku"],
    kunyomi: ["kuchi", "guchi"],
    examples: [
      { word: "口", reading: "kuchi" },
      { word: "人口", reading: "jinkou" },
      { word: "川口", reading: "kawaguchi" }
    ]
  },
  {
    kanji: "車",
    meanings: ["samochód", "wóz"],
    onyomi: ["sha"],
    kunyomi: ["kuruma"],
    examples: [
      { word: "車", reading: "kuruma" },
      { word: "電車", reading: "densha" },
      { word: "自転車", reading: "jitensha" }
    ]
  },
  {
    kanji: "門",
    meanings: ["brama"],
    onyomi: ["mon"],
    kunyomi: ["kado"],
    examples: [
      { word: "門", reading: "mon" },
      { word: "専門", reading: "senmon" },
      { word: "門前", reading: "monzen" }
    ]
  },
  {
    kanji: "水",
    meanings: ["woda"],
    onyomi: ["sui"],
    kunyomi: ["mizu"],
    examples: [
      { word: "水", reading: "mizu" },
      { word: "水曜日", reading: "suiyoubi" },
      { word: "水道", reading: "suidou" }
    ]
  },
  {
    kanji: "土",
    meanings: ["ziemia", "gleba"],
    onyomi: ["do", "to"],
    kunyomi: ["tsuchi"],
    examples: [
      { word: "土", reading: "tsuchi" },
      { word: "土曜日", reading: "doyoubi" },
      { word: "土地", reading: "tochi" }
    ]
  },
  {
    kanji: "火",
    meanings: ["ogień"],
    onyomi: ["ka"],
    kunyomi: ["hi", "bi"],
    examples: [
      { word: "火", reading: "hi" },
      { word: "火曜日", reading: "kayoubi" },
      { word: "花火", reading: "hanabi" }
    ]
  },
  {
    kanji: "金",
    meanings: ["złoto", "metal", "pieniądze"],
    onyomi: ["kin", "kon"],
    kunyomi: ["kane", "kana"],
    examples: [
      { word: "金", reading: "kane" },
      { word: "金曜日", reading: "kinyoubi" },
      { word: "金魚", reading: "kingyo" }
    ]
  },
  {
    kanji: "好",
    meanings: ["lubić", "ulubiony"],
    onyomi: ["kou"],
    kunyomi: ["su", "kono"],
    defaultOff: true,
    examples: [
      { word: "好き", reading: "suki" },
      { word: "大好き", reading: "daisuki" },
      { word: "好物", reading: "koubutsu" }
    ]
  },
  {
    kanji: "犬",
    meanings: ["pies"],
    onyomi: ["ken"],
    kunyomi: ["inu"],
    defaultOff: true,
    examples: [
      { word: "犬", reading: "inu" },
      { word: "子犬", reading: "koinu" },
      { word: "番犬", reading: "banken" }
    ]
  },
  {
    kanji: "亀",
    meanings: ["żółw"],
    onyomi: ["ki"],
    kunyomi: ["kame"],
    defaultOff: true,
    examples: [
      { word: "亀", reading: "kame" },
      { word: "海亀", reading: "umigame" },
      { word: "子亀", reading: "kogame" }
    ]
  },
  {
    kanji: "猫",
    meanings: ["kot"],
    onyomi: ["byou"],
    kunyomi: ["neko"],
    defaultOff: true,
    examples: [
      { word: "猫", reading: "neko" },
      { word: "子猫", reading: "koneko" },
      { word: "黒猫", reading: "kuroneko" }
    ]
  },
  {
    kanji: "魚",
    meanings: ["ryba"],
    onyomi: ["gyo"],
    kunyomi: ["sakana", "uo"],
    defaultOff: true,
    examples: [
      { word: "魚", reading: "sakana" },
      { word: "金魚", reading: "kingyo" },
      { word: "魚屋", reading: "sakanaya" }
    ]
  },
  {
    kanji: "鮭",
    meanings: ["łosoś"],
    onyomi: ["kei"],
    kunyomi: ["sake", "shake"],
    defaultOff: true,
    examples: [
      { word: "鮭", reading: "sake" },
      { word: "塩鮭", reading: "shiozake" },
      { word: "紅鮭", reading: "benizake" }
    ]
  },
  {
    kanji: "鮪",
    meanings: ["tuńczyk"],
    onyomi: ["yuu"],
    kunyomi: ["maguro", "shibi"],
    defaultOff: true,
    examples: [
      { word: "鮪", reading: "maguro" },
      { word: "本鮪", reading: "honmaguro" }
    ]
  },
  {
    kanji: "鰻",
    meanings: ["węgorz"],
    onyomi: ["man"],
    kunyomi: ["unagi"],
    defaultOff: true,
    examples: [
      { word: "鰻", reading: "unagi" },
      { word: "鰻屋", reading: "unagiya" }
    ]
  },
  {
    kanji: "分",
    meanings: ["minuta", "część"],
    onyomi: ["bun", "fun"],
    kunyomi: ["wa"],
    examples: [
      { word: "分", reading: "fun" },
      { word: "一分", reading: "ippun" },
      { word: "半分", reading: "hanbun" }
    ]
  },
  {
    kanji: "時",
    meanings: ["godzina", "czas"],
    onyomi: ["ji"],
    kunyomi: ["toki", "doki"],
    examples: [
      { word: "時", reading: "toki" },
      { word: "一時", reading: "ichiji" },
      { word: "時間", reading: "jikan" }
    ]
  }
];
