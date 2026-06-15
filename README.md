# 🛍 Decap CMS + GitHub Pages — Demo Shop

Безкоштовний продуктовий каталог без бекенду. Контент зберігається прямо в GitHub репозиторії, адмін-панель працює в браузері.

🔗 **Live demo:** [vadimkharovyuk.github.io/GitHub_Pages_Decap_CMS](https://vadimkharovyuk.github.io/GitHub_Pages_Decap_CMS/)

---

## ⚙️ Стек технологій

| Технологія | Роль |
|---|---|
| **Decap CMS** | Адмін-панель для керування товарами |
| **GitHub Repository** | Зберігання товарів (JSON) та фото |
| **GitHub Pages** | Безкоштовний хостинг статичного сайту |
| **Cloudflare Workers** | OAuth проксі для авторизації через GitHub |
| **GitHub API** | Завантаження товарів на фронтенд |

---

## 🚀 Як це працює

1. Заходиш на `/admin` → логінишся через GitHub
2. Заповнюєш форму товару (назва, ціна, категорія, опис, фото)
3. Decap CMS робить коміт у репозиторій — товар зберігається як `.json` файл
4. Фото зберігається у папці `public/uploads/`
5. Фронтенд завантажує товари через GitHub API і відображає на сторінці

---

## 📁 Структура проекту

```
GitHub_Pages_Decap_CMS/
├── admin/
│   ├── index.html        # Адмін-панель Decap CMS
│   └── config.yml        # Конфігурація CMS (колекції, поля)
├── products/             # JSON файли товарів (генеруються CMS)
├── public/
│   └── uploads/          # Фото товарів (завантажуються через CMS)
├── index.html            # Головна сторінка
├── products.html         # Каталог товарів з фільтром по категоріях
└── README.md
```

---

## 🛠 Налаштування з нуля

### 1. Клонуй репозиторій
```bash
git clone https://github.com/VadimKharovyuk/GitHub_Pages_Decap_CMS.git
cd GitHub_Pages_Decap_CMS
```

### 2. Увімкни GitHub Pages
`Settings → Pages → Source → Deploy from branch → master → / (root)`

### 3. Створи GitHub OAuth App
`GitHub → Settings → Developer settings → OAuth Apps → New OAuth App`
```
Homepage URL:           https://YOUR_NAME.github.io/GitHub_Pages_Decap_CMS
Callback URL:           https://YOUR_WORKER.workers.dev/callback
```

### 4. Задеплой Cloudflare Worker
- Створи новий Worker на [dash.cloudflare.com](https://dash.cloudflare.com)
- Встав код з файлу `worker.js` (або використай код нижче)
- Додай змінні: `CLIENT_ID` (Text) та `CLIENT_SECRET` (Secret)

### 5. Оновити `admin/config.yml`
```yaml
backend:
  name: github
  repo: YOUR_NAME/GitHub_Pages_Decap_CMS
  branch: master
  base_url: https://YOUR_WORKER.workers.dev

media_folder: public/uploads
public_folder: /GitHub_Pages_Decap_CMS/public/uploads
```

### 6. Відкрий адмін-панель
```
https://YOUR_NAME.github.io/GitHub_Pages_Decap_CMS/admin/
```

---

## 🐛 Часті помилки та рішення

**`client_id=undefined` в URL попапу**
Змінні `CLIENT_ID` / `CLIENT_SECRET` не додані у Cloudflare Worker.
→ `Workers & Pages → твій worker → Settings → Variables and Secrets → Add`

---

**`Branch not found`**
У `config.yml` вказана гілка `main`, але репозиторій використовує `master` (або навпаки).
→ Перевір назву гілки в репо та встав правильну у `config.yml` → `branch: master`

---

**Попап відкривається і одразу закривається — залишаєшся на тій же сторінці**
Браузер блокує попапи для сайту.
→ Натисни іконку заблокованого попапу в адресному рядку → "Завжди дозволяти для цього сайту"

---

**`404 Not Found` на `/auth` або `/callback`**
Worker підключений до Git репо замість inline-редактора — змінні не читаються.
→ Створи новий Worker через "Start with Hello World", встав код вручну, додай змінні у Settings

---

**Фото не відображається на сайті**
`public_folder` у `config.yml` не враховує підпапку GitHub Pages.
→ Встав правильний шлях:
```yaml
public_folder: /GitHub_Pages_Decap_CMS/public/uploads
```
Після цього відкрий товар в адмін-панелі та натисни Save — шлях до фото оновиться в JSON.

---

**`API_ERROR: Branch not found` при завантаженні фото**
Папки `products/` або `public/uploads/` не існують у репозиторії.
→ Створи їх через GitHub UI: `Add file → Create new file → products/.gitkeep` та `public/uploads/.gitkeep`

---

## 🔐 Cloudflare Worker — код OAuth проксі

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirect = `https://github.com/login/oauth/authorize?client_id=${env.CLIENT_ID}&scope=repo,user`;
      return Response.redirect(redirect, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, code }),
      });
      const data = await response.json();
      const token = data.access_token;
      const html = `<html><body><script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify({ token: "${token}" }),
              e.origin
            );
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })();
      </script></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("OK");
  },
};
```

---

## 📦 Формат товару (JSON)

```json
{
  "name": "Назва товару",
  "price": 99,
  "category": "Категорія",
  "description": "Опис товару",
  "photo": "/GitHub_Pages_Decap_CMS/public/uploads/photo.jpg"
}
```

---

## ✅ Переваги підходу

- **Безкоштовно** — GitHub Pages + Cloudflare Workers (free tier)
- **Без бекенду** — весь контент у Git репозиторії
- **Версіонування** — кожна зміна товару = коміт в історії
- **Простий деплой** — push в master = оновлення сайту

## ❌ Обмеження підходу

- **Не підходить для великих каталогів** — кожен товар = окремий файл, GitHub API має ліміт 60 запитів/год для неавторизованих користувачів
- **Немає пошуку** — фільтрація лише на фронтенді, весь каталог завантажується щоразу
- **Повільне оновлення** — після збереження товару GitHub Pages може оновлюватись до 2-3 хвилин
- **Немає ролей користувачів** — будь-хто з доступом до репо може редагувати контент
- **Фото зберігаються в Git** — великі зображення роздувають репозиторій, не підходить для медіатеки
- **OAuth складніше ніж на Netlify** — потрібен зовнішній Worker, є нюанси з попапами та кешем браузера

---

## 👨‍💻 Автор

**Vadim Kharovyuk** — Java Backend розробник, засновник WebsCraft

- 🌐 [webscraft.org](https://webscraft.org/) — технічний блог про Java, Spring Boot, AI
- 🤖 [askyourdocs.org](https://askyourdocs.org/en/) — B2B SaaS RAG система для корпоративних документів
- 👤 [Про автора](https://webscraft.org/blog/java-backend-rozrobnik-vadim-harovyuk)