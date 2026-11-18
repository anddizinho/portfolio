# Portfólio de André Calazans

A página principal de https://flayks.com/ tem como correspondente a rota local `/`.
O template Next.js vem de JCodesMore/ai-website-cloner-template.

A abertura usa tipografia condensada, composição em camadas e deslocamento na
rolagem. A galeria mantém os projetos na página, com navegação lateral pelas
seções em telas largas. O conteúdo do perfil e as capas tipográficas são próprios
desta adaptação.

## Rodar localmente

Com Node.js 24 e npm, execute `npm ci` e `npm run dev`. Abra a URL local exibida.
Para validar a versão de produção, execute `npm run check`.

## Editar o portfólio

Edite `src/app/portfolio-content.ts` para trocar textos e reorganizar projetos.
Para usar uma imagem, coloque-a em `public/sites/portfolio` e inclua no quadro da
galeria `image: { src: "/sites/portfolio/arquivo.webp", alt: "Descrição da imagem" }`.
Sem imagem, o quadro usa o título e a nota cadastrados. As capas atuais são
provisórias. Os modelos, créditos e mídias reais ainda precisam ser reunidos.
Esta versão usa conteúdo no repositório. Um painel de edição pode ser conectado
quando o acervo do portfólio estiver definido.

## Mídias e links opcionais

Em `src/app/portfolio-content.ts`, configure `profile.logoVideo` para a assinatura animada. A capa do primeiro quadro de cada case abastece também a abertura do portfólio.
Preencha `profile.instagram`, `profile.behance` e `profile.booking` para ativar os destinos.

O mapa do contato é uma ilustração esquemática original da Liberdade.
