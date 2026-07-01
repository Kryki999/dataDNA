# Słownik produktu — KOR DataDNA

Jeden język dla zespołu i użytkowników. Nie używamy w UI terminów technicznych (`deal`, `pipeline`, `lead`).

## Trzy filary (Złoty Trójkąt)

| Pojęcie | Pytanie użytkownika | Zakładka | W systemie |
| -------- | ------------------- | -------- | ---------- |
| **Klient** | Z kim pracuję? | Baza klientów | `clients` |
| **Projekt** | Na jakim etapie jest ta współpraca? | Projekty (Kanban) | `pipeline_deals` |
| **Zadanie** | Co robię i kiedy? | Planner | `calendar_events` |

## Zasada nadrzędna

**Kanban = status (makro). Planner = akcja (mikro).**

- Na Kanbanie **nie** tworzymy kolumn typu „zadzwoń” ani „wyślij maila”.
- Konkretne działania z terminem trafiają do **Plannera**.
- Zmiana etapu na Kanbanie = przesunięcie karty + opcjonalna notatka na osi czasu.

## Klient

- Osoba lub firma — stały rekord w Bazie.
- Zawiera: kontakt, zdjęcie/okładkę, kolor karty, tagi, notatki.
- Klient **nie znika** — można go zarchiwizować (schować z aktywnej listy).
- Jeden klient może mieć **wiele projektów** równolegle.

## Projekt

- Pojedyncza współpraca lub szansa sprzedażowa z danym klientem.
- Żyje na **Kanbanie** jako karta w kolumnie etapu.
- Domyślny preset etapów (sprzedaż): Nowy → Kontakt → Demo → Negocjacje → Zrealizowano / Koniec.
- Po zamknięciu projekt **znika z tablicy**; historia zostaje u klienta i w Zyskach (jeśli wygrany).
- Realizacja po wygranej = **zadania w Plannerze**, nie druga tablica zadań.

## Zadanie

- Konkretna czynność: zadzwoń, wyślij plik, spotkanie.
- Może mieć termin (kalendarz) lub być w backlogu Plannera (bez daty).
- Może być powiązane z klientem i opcjonalnie z projektem.
- Nie wymaga projektu (np. wewnętrzne rzeczy firmy).

## Notatka

- Wpis na **osi czasu klienta** (feed).
- Może dotyczyć całego klienta lub konkretnego projektu.
- System dodaje notatki automatycznie przy: zmianie etapu, zamknięciu projektu, zaplanowaniu kroku, wykonaniu zadania.

## Gdzie co ląduje — skrót

| Sytuacja | Gdzie |
| -------- | ----- |
| Oddzwonić w poniedziałek 10:00 | Planner |
| Wysłać ofertę w tym tygodniu | Planner (backlog) |
| Projekt jest w negocjacjach | Kanban — przesuń kartę |
| Kim jest ten kontakt? | Baza klientów |
| Ile zarobiliśmy? | Zyski (moduł opcjonalny) |

## Moduły poza KOR

**KOR (zawsze):** Baza klientów, Projekty, Planner.

**Opcjonalne (per organizacja):** Profil publiczny, Zasięgi, Zyski, …
