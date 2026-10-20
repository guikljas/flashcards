# Revis�o Ativa

PWA de flashcards para estudo escolar, com cria��o de cart�es por mat�ria, revis�o espa�ada, funcionamento offline e sincroniza��o entre computador e celular.

## Estado do projeto - 20/10/2026

- C�digo inicial enviado para o reposit�rio p�blico `guikljas/flashcards`.
- Projeto Supabase criado exclusivamente para este app.
- `supabase/schema.sql` j� foi executado com sucesso no SQL Editor.
- A tabela `public.flashcards`, o �ndice de revis�o e a RLS por usu�rio j� existem.
- Login por e-mail est� ativado no Supabase.
- Projeto est� sendo importado no Vercel; URL de produ��o ainda n�o foi registrada aqui.

> N�o reutilizar o Supabase do app RH. Este app deve continuar em projeto separado.

## Pr�ximo passo: finalizar o deploy no Vercel

No projeto importado no Vercel, mantenha:

| Campo | Valor |
| --- | --- |
| Framework | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Em **Settings  Environment Variables**, incluir para Production, Preview e Development:

| Nome | Origem no Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Settings  API  Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings  API  chave p�blica / anon (ou Publishable key) |

Nunca colocar `service_role`, senhas ou tokens no Vercel, no c�digo ou neste reposit�rio. Apesar de o reposit�rio ser p�blico, a chave anon � pr�pria para aplica��es cliente; a RLS do banco limita os dados ao usu�rio autenticado.

Ap�s adicionar as vari�veis, publicar e anotar a URL `https://...vercel.app`.

## Ajuste obrigat�rio ap�s obter a URL do Vercel

No Supabase, abrir **Authentication  URL Configuration** e configurar:

- **Site URL:** a URL de produ��o do Vercel, sem barra final;
- **Redirect URLs:** a mesma URL e `https://SEU-DOMINIO.vercel.app/**`.

Mantenha a confirma��o de e-mail ativa. O usu�rio cria uma conta dentro do app, confirma o e-mail e usa o mesmo login no celular e no computador; a sincroniza��o � autom�tica ap�s login.

## Teste de aceita��o

1. Abra o link Vercel em uma janela an�nima e confirme que a p�gina carrega.
2. Crie uma conta e confirme o e-mail recebido.
3. Crie um cart�o de teste, por exemplo: `Matem�tica` / `F�rmula de Bhaskara` / `x = (-b � V?) / 2a`.
4. Fa�a login em outro navegador ou celular e confirme que o cart�o aparece.
5. Classifique o cart�o como "Lembrei", atualize a p�gina e confira se a pr�xima revis�o foi preservada.
6. Instale o PWA: no Android, Chrome  menu  **Instalar aplicativo**; no iPhone, Safari  Compartilhar  **Adicionar � Tela de In�cio**.
7. Em Ajustes, permita notifica��es e confirme que o navegador aceita a permiss�o.

## Rodar localmente

```powershell
npm install
Copy-Item .env.example .env.local
# preencher as duas vari�veis do Supabase em .env.local
npm run dev
```

Sem vari�veis, o aplicativo opera com armazenamento local no navegador. Com as vari�veis e login, os cart�es s�o persistidos no Supabase e sincronizam entre dispositivos.

## Estrutura principal

```text
src/App.tsx          Interface, cart�es, revis�o e login
src/supabase.ts      Cliente e sincroniza��o local  Supabase
src/storage.ts       Fallback offline no localStorage
public/sw.js         Cache offline e base para Web Push
supabase/schema.sql  Banco, RLS e �ndice
```

## Limites atuais e evolu��o recomendada

- O PWA � instal�vel como aplicativo na tela inicial; um widget nativo real requer uma futura camada Android/iOS, por exemplo Capacitor.
- O lembrete local roda quando o PWA est� aberto. Para alertas mesmo fechado, implementar Web Push com VAPID, endpoint de assinatura por usu�rio e um agendador seguro no backend.
- A sincroniza��o atual usa resolu��o de conflito por altera��o mais recente. Para colabora��o ou hist�rico de edi��o, implementar versionamento por cart�o.

