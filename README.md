# Скрипторий

Каталог userscript-ов и расширений для игр со стримов (первая игра — Легион на multidonate).

- Вход через Twitch
- Установка в один клик через Tampermonkey и автообновления (`/i/<игра>/<скрипт>.user.js`)
- Автопроверка кода на сервере, модерация новых авторов, сравнение версий кода
- Рейтинг, отзывы, жалобы (после 3 жалоб скрипт скрывается автоматически)

Стек: Next.js 16 + Supabase (база, вход, хранилище). Хостинг — Vercel, бесплатный тариф.

## Запуск на своём компьютере

```bash
npm install
cp .env.example .env.local   # значения уже правильные
npm run dev                  # http://localhost:3000
```

## Публикация на Vercel

1. Залей папку в репозиторий на GitHub.
2. На [vercel.com](https://vercel.com) → **Add New → Project** → выбери репозиторий.
3. В **Environment Variables** добавь две переменные из `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. **Deploy**. Получишь адрес вида `https://skriptoriy.vercel.app`.
5. В Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://skriptoriy.vercel.app`
   - **Redirect URLs**: добавь `https://skriptoriy.vercel.app/**` и `http://localhost:3000/**`

## Роли

| Роль | Что может |
|---|---|
| Автор | Публикует скрипты, каждая версия идёт на проверку |
| Проверенный автор | Публикует сразу, если автопроверка не нашла опасного |
| Модератор | Очередь проверки, жалобы, выдаёт статус «проверенный» |
| Администратор | Всё выше + назначает модераторов |

Первого администратора назначают в Supabase → SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users order by created_at limit 1);
```

## Как устроена безопасность

- Все права проверяются в базе (Row Level Security), а не в браузере: автор не может сам себе поставить «опубликовано», роль, рейтинг или счётчик установок.
- Автопроверка кода выполняется в базе при загрузке версии, подделать её нельзя.
- Игрокам всегда отдаётся последняя **одобренная** версия; сайт сам подставляет `@version`, `@updateURL` и `@downloadURL`.
- Описания рендерятся как Markdown без HTML.

## Структура

```
app/                 страницы
  page.tsx           главная
  g/[game]/          каталог игры
  s/[game]/[slug]/   карточка скрипта (+ edit, version)
  i/[game]/[file]/   установка: .user.js / .meta.js / .zip
  new/, me/          кабинет автора
  mod/               модерация
components/          общие компоненты
lib/                 Supabase-клиенты, типы базы, утилиты
```
