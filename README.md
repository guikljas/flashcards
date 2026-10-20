# Revis�o Ativa

PWA de flashcards com revis�o espa�ada, uso offline e sincroniza��o opcional via Supabase.

## Rodar localmente

```powershell
npm install
npm run dev
```

## Sincronizar entre celular e computador

1. Crie um projeto no Supabase e execute `supabase/schema.sql` no **SQL Editor**.
2. Em **Authentication > Providers**, habilite Email. Para facilitar o teste, desative a confirma��o de e-mail somente no ambiente de desenvolvimento.
3. Copie `.env.example` para `.env.local` e preencha URL e chave `anon` (a chave p�blica).
4. No Vercel, crie as mesmas vari�veis em **Settings > Environment Variables** e fa�a um novo deploy.

Sem essas vari�veis, o aplicativo continua funcionando offline neste navegador. Com login, os cart�es s�o enviados ao Supabase e sincronizam nos demais dispositivos.

## Publicar no Vercel

Importe este reposit�rio no Vercel. Framework: **Vite**. Comando de build: `npm run build`; diret�rio de sa�da: `dist`.

## Limites de plataforma

O bot�o de instalar adiciona o app � tela inicial como um aplicativo. Widgets reais da tela inicial exigem uma vers�o nativa Android/iOS. As notifica��es locais aparecem enquanto o app est� aberto; notifica��es mesmo com ele fechado exigem configurar Web Push/VAPID e um agendador no backend.
