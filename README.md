# TS Top Shoes

E-commerce com vitrine e painel administrativo para a TS Top Shoes, baseado nas informacoes publicas do perfil [@tstop_shoes](https://www.instagram.com/tstop_shoes/).

## Executar

```powershell
node server.mjs
```

No Windows, tambem e possivel iniciar com duplo clique em `iniciar-servidor.bat`.

Acesse:

- Loja: `http://127.0.0.1:4173/`
- Painel admin: `http://127.0.0.1:4173/admin.html`

## Painel administrativo

Acesso inicial:

- Usuario: `admin`
- Senha: `topshoes2026`

No painel e possivel carregar imagens de novos produtos, cadastrar marcas e categorias no proprio formulario, filtrar produtos e pedidos, abrir o detalhe completo de pedidos, gerenciar clientes, informar precos e manter os dados de atendimento da loja.

## Dados utilizados

Foram usados somente dados e imagens visiveis publicamente no Instagram fornecido: nome da loja, localizacao em Ijui-RS, entrega local, envio para todo Brasil, condicao divulgada de pagamento na entrega e modelos publicados. Como precos e numero oficial de WhatsApp nao estavam visiveis no perfil acessado, esses campos ficam para preenchimento no painel.

Este projeto armazena produtos, imagens carregadas, clientes, enderecos, configuracoes e pedidos no `localStorage` do navegador. O cliente cria conta ou entra na propria etapa de finalizacao e tambem pode acessar `Minha conta` para editar dados e enderecos. Para operacao real com multiplos usuarios e senhas protegidas, o proximo passo tecnico e conectar autenticacao e banco de dados em um backend.
