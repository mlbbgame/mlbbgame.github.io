# MLBB Game Telegram News Bot

This first version collects candidate news and sends **review drafts to a private Telegram chat**. It does not post directly to the public channel.

## Secrets and variables

In GitHub repository settings, open **Settings → Secrets and variables → Actions** and add these repository secrets:

- `TELEGRAM_BOT_TOKEN`: token created by the official Telegram @BotFather.
- `REVIEW_CHAT_ID`: your private Telegram chat ID with the bot, where drafts should be reviewed.

After the public channel is created, keep its ID in a separate secret named `TELEGRAM_CHANNEL_ID` for a future publishing feature. This version intentionally does not use it to publish.

Never put tokens in source files, commits, issues, screenshots, or chat messages.

## Telegram setup

1. Open https://t.me/BotFather and create a bot with `/newbot`.
2. Copy the token directly into the GitHub secret `TELEGRAM_BOT_TOKEN`; do not share it with anyone.
3. Open the new bot in Telegram and press **Start**.
4. Obtain your private chat ID using a trusted Telegram bot or the Telegram Bot API from your own device. Store it as `REVIEW_CHAT_ID`.
5. Run the workflow manually once from **Actions → MLBB News Review Bot → Run workflow**.
6. Confirm a draft arrives in your private chat.
7. Create the public channel separately. Add the bot as an administrator only when you are ready to configure the later publishing stage.

## Scheduling and deduplication

GitHub Actions checks feeds every 30 minutes. Schedules are best-effort and can be delayed. The workflow caches a JSON file of seen items to reduce duplicate drafts. Cache-based state is not a transactional database; occasional duplicate candidates remain possible if runs overlap or cache writes fail.

## Source filtering and limitations

The collector searches Google News RSS using domain-scoped queries for MOONTON, Mobile Legends, ONE Esports, Esports.gg, and AFK Gaming. It accepts an item only when the RSS source metadata points to an allowlisted publisher and the title appears MLBB-related. Search aggregators can return incomplete metadata, so some valid stories may be missed.

This first version sends a title, source label, date, and link for human verification. It does not use generative AI to invent summaries, and it does not auto-publish unverified news.

## Local check

Requires Python 3.11+:

```bash
python -m py_compile bot/news_bot.py
```

Run with environment variables `TELEGRAM_BOT_TOKEN` and `REVIEW_CHAT_ID` only after you have created a bot and chat. Do not test using a real token in public logs.
