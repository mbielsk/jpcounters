# Counters JP

Quiz do nauki japońskich liczników (klasyfikatorów), inspirowany [kana.pro](https://kana.pro/).
Zamiast hiragany/katakany ćwiczysz czytanie liczników.

Dostępne grupy:
- **Osoby** (人)
- **Minuty** (分)
- **Godziny** (時)
- **Dni** (日)

## Jak działa
1. Zaznacz grupy, które chcesz ćwiczyć.
2. Wybierz tryb odpowiedzi: rōmaji, hiragana lub dowolnie.
3. Pojawia się liczba z licznikiem (np. `3人`) — wpisz czytanie.
4. Enter sprawdza odpowiedź, kolejny Enter przechodzi dalej.

Wybór grup zapisuje się lokalnie (localStorage).

## Uruchomienie lokalnie
To czysty statyczny projekt — wystarczy otworzyć `index.html` w przeglądarce.
Ewentualnie odpal prosty serwer:

```bash
python3 -m http.server
```

i wejdź na http://localhost:8000

## Publikacja na GitHub Pages
1. Wypchnij pliki do repozytorium na GitHub.
2. Wejdź w **Settings → Pages**.
3. W sekcji *Build and deployment* wybierz **Source: Deploy from a branch**.
4. Ustaw branch na `main` i katalog `/ (root)`, zapisz.
5. Po chwili strona będzie dostępna pod `https://<user>.github.io/<repo>/`.

## Pliki
- `index.html` — struktura strony
- `style.css` — style
- `data.js` — dane liczników (liczby, kanji, czytania, rōmaji)
- `app.js` — logika quizu

## Dodawanie własnych liczników
Dopisz nową grupę w `data.js` według wzorca (np. `things` dla 個, `flat` dla 枚).
Każdy wariant czytania to osobny wpis z tym samym `num`.
