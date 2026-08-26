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
2. Wybierz tryb odpowiedzi (rōmaji / hiragana / dowolnie) i liczbę pytań na fazę.
3. Quiz przechodzi przez 3 fazy, każda z wybraną liczbą pytań:
   - **Faza 1** — widzisz czytanie (np. `happun`), wybierasz właściwą liczbę spośród 3 kafli.
   - **Faza 2** — widzisz kanji (np. `8分`), wybierasz właściwe czytanie spośród 3 kafli.
   - **Faza 3** — wpisujesz czytanie z pamięci (przycisk „Nie wiem" pokazuje odpowiedź i liczy błąd).
4. Po każdej fazie pojawia się podsumowanie z wynikiem i listą do powtórki.

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
