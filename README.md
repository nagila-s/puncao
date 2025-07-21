# Punção

Punção é um editor de desenho em Braille feito com **React**, **TypeScript** e **Tailwind CSS**. A aplicação permite criar e editar figuras em Braille utilizando ferramentas de desenho, seleção e texto. O projeto foi originalmente gerado pela plataforma Lovable, mas todo o código está neste repositório.

## Principais funcionalidades

- Grade de células Braille configurável.
- Ferramentas de desenho (lápis, borracha, linha, retângulo, círculo, triângulo e preenchimento).
- Inserção de texto em Braille ou em letras convencionais.
- Seleção de células com copiar, recortar e colar.
- Desfazer e refazer alterações.
- Zoom e ajuste de resolução da grade.
- Sobreposição de textos que podem ser movidos ou editados.
- Modal de ajuda com atalhos de teclado.

## Instalação

É necessário ter **Node.js** e **npm** instalados. Depois de clonar o repositório, instale as dependências e rode o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Para gerar uma versão de produção:

```bash
npm run build
```

Para executar a análise de código com ESLint:

```bash
npm run lint
```

*(Pode ser necessário instalar as dependências de desenvolvimento para que o lint funcione corretamente.)*

## Estrutura do projeto

O código-fonte está em `src/` e é organizado em componentes, páginas, hooks e utilitários. O arquivo `index.html` é o ponto de entrada, e o Vite é usado para empacotar a aplicação.

## Status atual

A aplicação compila sem erros aparentes e a estrutura do código está organizada. Contudo, não foi possível rodar as verificações de lint no ambiente atual por falta de dependências, conforme mostrado na saída do comando abaixo:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from /workspace/puncao/eslint.config.js
```

Fora isso, não foram encontrados bugs óbvios na revisão do código. As funcionalidades de desenho, seleção e texto parecem implementadas de forma consistente.

## Licença

Consulte o repositório para detalhes sobre licenciamento e contribuições.
