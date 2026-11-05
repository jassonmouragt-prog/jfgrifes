# JF Grifes Multimarcas

Site público responsivo com catálogo administrável. A vitrine usa HTML, CSS e JavaScript; as funções em `api/` fazem autenticação e persistem produtos e fotos no Vercel Blob.

## Desenvolvimento

Instale as dependências com `npm install` e rode `npm run dev`. Para testar apenas a vitrine com os quatro produtos de exemplo, um servidor estático também funciona; o painel exige as funções da Vercel.

## Categorias

Cada categoria tem sua própria página: `camisetas.html`, `bermudas.html`, `calcados.html` e `acessorios.html`. Elas usam `category.css` e leem o nome da categoria em `data-category` do `<body>`, que `script.js` usa para filtrar o catálogo. Ao criar uma nova categoria, lembre-se de também atualizar a lista de categorias válidas em `server/catalog.js` e `admin.js`, além de criar a página e o card correspondentes.

## Painel

Abra `/admin` e entre com o e-mail e a senha configurados nas variáveis de ambiente. O painel permite cadastrar, editar, excluir, destacar, definir categoria e quantidade em estoque, importar e exportar produtos. Fotos enviadas são compactadas para WebP e ficam no Vercel Blob. As alterações salvas aparecem na vitrine pública em outros dispositivos.

O servidor usa `ADMIN_EMAIL`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` e `BLOB_READ_WRITE_TOKEN`. Consulte `.env.example`. A senha deve ser transformada com `scrypt` antes de configurar `ADMIN_PASSWORD_HASH`; não coloque a senha em arquivos versionados. O Vercel Blob precisa ser um store **público** conectado ao projeto, pois as imagens dos produtos são exibidas no site público.

Os quatro produtos iniciais são exemplos visuais e não têm preço nem quantidade em estoque confirmados. No formulário, a quantidade é obrigatória para produtos novos; `0` marca o item como esgotado e retira o botão de consulta da vitrine. Na primeira alteração, o catálogo passa a ser salvo no Blob.

## WhatsApp

Em `script.js`, substitua `STORE_WHATSAPP = ''` pelo número real no formato `5584999999999`. Até configurá-lo, os botões exibem um aviso em vez de abrir um contato incorreto.

## Imagens

Os banners, as imagens de categoria e os três looks foram recriados em alta resolução. A imagem `store-hd.webp` foi reconstruída a partir do recorte do mockup; representa a composição do local, mas não substitui uma foto original. As fotos dos quatro produtos iniciais ainda são recortes pequenos e devem ser substituídas por fotos reais.

O símbolo vetorial do WhatsApp em `assets/whatsapp.svg` vem do projeto Simple Icons.
