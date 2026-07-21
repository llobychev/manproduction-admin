# Parser Radar autonomous signals

Date: 2026-07-21
Status: UI foundation merged target; production signal collection remains disabled by default

## Scope

Parser Radar now has a dedicated `🎯 Лиды` tab for the new autonomous Telegram Lead Parser.

The tab reads:

```http
GET /admin/v1/parser-signals?limit=200
```

It renders:

- normalized message text;
- Parser Session confidence;
- source chat title, username, or chat id;
- author name or username when available;
- intent;
- keyword and semantic matches;
- current review status;
- Telegram message link when available;
- backend persistence gate status.

Review actions use:

```http
PATCH /admin/v1/parser-signals/:id/status
```

Supported actions:

- reviewed;
- in progress;
- converted;
- irrelevant.

## Compatibility

- Existing MenClub and Work tabs continue to use `intent_signals`.
- Parser Sessions and Runtime tabs are unchanged in purpose.
- The new tab does not enable collection or persistence.

## Safety

End-to-end autonomous signal persistence still requires both runtime flags:

```bash
PARSER_SIGNAL_PERSISTENCE_ENABLED=1
TELEGRAM_COLLECTOR_SIGNAL_PERSISTENCE_ENABLED=1
```

Until controlled runtime evidence exists, both flags should remain disabled.

## Manual review

1. Open `parser-radar.html` through the Telegram admin app.
2. Confirm existing MenClub and Work signals still load.
3. Open `🎯 Лиды`.
4. Confirm empty state is safe when persistence is disabled.
5. After controlled test data exists, verify confidence, matches, source, author, and Telegram link.
6. Change signal status and confirm it persists after refresh.
7. Confirm Sessions and Runtime tabs still render.