# Inserção na grade e conversão de pontos — Explicação técnica

Este documento descreve como o Punção insere desenhos e texto na grade Braille e como faz a conversão entre **pontos** (1–6) e **letras/caracteres**.

---

## 1. Modelo de dados

### 1.1 Grade e célula

- **BrailleGrid**: `width` (colunas), `height` (linhas), `cells: BrailleCell[][]`.
- **BrailleCell**: para cada célula da grade:
  - `x`, `y`: posição na grade (índices).
  - `dots: number[]`: lista de pontos ativos, numerados de **1 a 6** (padrão Braille 3×2).
  - `letter?: string`: caractere correspondente (letra, pontuação ou `"#"` para sinal de número).
  - `origin?: 'manual' | 'automatic'`: se veio do lápis/borracha (`manual`) ou da ferramenta texto (`automatic`/texto).

Numeração dos pontos na célula (padrão Braille):

```
  1   4
  2   5
  3   6
```

(1–3 coluna esquerda, 4–6 coluna direita; 1–2 topo, 3–6 baixo.)

### 1.2 Unidades de desenho

- Célula na tela: **CELL_WIDTH = 20px**, **CELL_HEIGHT = 30px** (valores usados em `useDrawing`, `useSelection`, `BrailleGrid`, etc.).
- Coordenadas do mouse são convertidas para “unidades de grade” (divisão por `CELL_WIDTH`/`CELL_HEIGHT` e pelo `zoom` quando aplicável).

---

## 2. Inserção por desenho (lápis e borracha)

Fluxo: **mouse no canvas** → **célula (x, y)** + **ponto Braille (1–6)** → atualização de `cell.dots` e `cell.letter`.

### 2.1 Onde ocorre

- **BrailleGrid** (canvas) trata `mouseDown` / `mouseMove` / `mouseUp` / `mouseLeave` e chama o hook **useDrawing**.
- As coordenadas do mouse são transformadas para o sistema da grade (incluindo zoom) em `getMousePosition(event)` e repassadas em pixels lógicos (já divididos pelo zoom).

### 2.2 De posição (x, y) para célula e ponto Braille

No **useDrawing**:

1. **Célula**:
   - `cellX = floor(x / CELL_WIDTH)`
   - `cellY = floor(y / CELL_HEIGHT)`
   - Validação: `cellX`, `cellY` dentro de `[0, width)` e `[0, height)`.

2. **Posição relativa dentro da célula** (0–1):
   - `relativeX = (x - cellX * CELL_WIDTH) / CELL_WIDTH`
   - `relativeY = (y - cellY * CELL_HEIGHT) / CELL_HEIGHT`

3. **Ponto Braille (1–6)**:
   - Há seis posições fixas em percentual na célula (ex.: ponto 1 em (0.3, 0.2), ponto 2 em (0.3, 0.5), …).
   - Calcula-se a distância euclidiana de `(relativeX, relativeY)` a cada uma dessas posições.
   - Se a menor distância for menor que um **PROXIMITY_THRESHOLD** (0.25), retorna esse ponto (1–6); senão, retorna `null` (clique entre pontos, nada é pintado).

Assim, um clique/arraste “no pontinho” ativa aquele ponto da célula.

### 2.3 Pintar e apagar ponto

- **paintDot(cellX, cellY, dotIndex)**:
  - Clona a grade, pega `cell = newGrid.cells[cellY][cellX]`.
  - Faz `cell.dots = [...(cell.dots existentes), dotIndex]` (sem duplicar, ordenado).
  - **Conversão pontos → letra**: `cell.letter = findBestMatchingLetter(cell.dots)` (ver seção 4.2).
  - Chama `onGridChange(newGrid)`.

- **eraseDot(cellX, cellY, dotIndex)**:
  - Remove `dotIndex` de `cell.dots`.
  - Se sobrar algum ponto: `cell.letter = findBestMatchingLetter(cell.dots)`; senão a célula fica “vazia” e a letra é a correspondente a `[]` (espaço).

O desenho **só altera pontos**; a **letra é sempre derivada** dos pontos (nunca se grava dígito na grade ao desenhar).

### 2.4 Arraste (continuação do desenho)

- **startDrawing** registra o primeiro ponto (se houver).
- **continueDrawing** (no `mouseMove`): só pinta/apaga se o “ponto Braille atual” for **diferente** do último pintado (evita repetir o mesmo ponto no mesmo frame).
- **finishDrawing** / **cancelDrawing** (mouseUp / mouseLeave) limpam o estado de “estou desenhando” e do último ponto.

---

## 3. Inserção por texto (ferramenta texto)

Fluxo: **usuário digita na caixa de texto** → **string** → **writeTextToGrid** → atualização de `cell.letter` e `cell.dots` célula a célula.

### 3.1 Onde ocorre

- **DrawingArea** abre um input sobre a célula clicada quando a ferramenta é “texto”; ao confirmar (Enter/blur), chama `onInsertText(cellX, cellY, text)`.
- **BrailleEditor** chama `writeTextToGrid(grid, cellX, cellY, text)` e atualiza a grade e o histórico.

### 3.2 writeTextToGrid (textPlacement.ts)

- Percorre a string caractere a caractere; mantém `(x, y)` como posição atual na grade.
- **Quebra de linha** `\n`: volta `x = startX`, incrementa `y`.
- **Wrap**: se `x >= width`, passa para a próxima linha (`x = 0`, `y += 1`). Se `y >= height`, para.
- Para **cada caractere**:

  **Se for dígito (0–9):**
  - Escreve **duas** células:
    1. **Célula do sinal de número**: `cell.dots = brailleIndicators.NUMBER` (= `[3, 4, 5, 6]`), `cell.letter = "#"`.
    2. **Célula da letra**: `cell.letter = digitToLetter[ch]` (ex.: `"6"` → `"f"`), `cell.dots = letterToBraillePatternFunc(letter)`.
  - Avança duas colunas (ou próxima linha se precisar).
  - Na grade e em toda a app, número **nunca** fica como dígito: só como **# + letra**.

  **Se não for dígito:**
  - Uma célula: `cell.letter = ch`, `cell.dots = letterToBraillePatternFunc(ch)`.
  - Avança uma coluna.

- **Conversão letra → pontos** é feita por **letterToBraillePatternFunc** (ver seção 4.1).

Assim, a inserção por texto é a única que usa o mapeamento “caractere → pontos”; no desenho, o usuário mexe nos pontos e a letra é inferida.

---

## 4. Conversão entre pontos e letras

Centralizada em **brailleMappings.ts**.

### 4.1 Letra/caractere → pontos (usado na inserção por texto)

- **letterToBraillePattern**: objeto que mapeia um caractere (string de 1 letra) para um array de pontos `number[]` (valores 1–6).
  - Inclui letras (a–z, acentuadas), pontuação, símbolos, espaço, `#` (sinal de número) e dígitos `'0'`–`'9'` (mesmos pontos que j, a–i).
- **letterToBraillePatternFunc(letter)**:
  - Converte maiúscula em minúscula (via mapa ou toLowerCase) e retorna `letterToBraillePattern[letter] || []`.
  - Usado em **writeTextToGrid** para definir `cell.dots` a partir do caractere.

### 4.2 Pontos → letra (usado no desenho e no editor de célula)

Dois caminhos:

- **braillePatternToLetter(targetDots)**:
  - Procura em **letterToBraillePattern** uma entrada cujo array de pontos seja **igual** a `targetDots` (mesmo tamanho e mesmos valores).
  - Retorna essa letra ou `' '` se não houver correspondência exata.
  - Usado quando se quer “só padrão exato” (ex.: editor de célula ao editar pontos).

- **findBestMatchingLetter(targetDots)**:
  - Se `targetDots` for vazio, retorna `' '`.
  - Caso contrário, percorre todas as entradas de **letterToBraillePattern** e calcula a **distância de Hamming** entre `targetDots` e o array de pontos de cada letra (diferença simétrica: quantos pontos estão em um conjunto e não no outro).
  - Retorna a letra cujo padrão tiver **menor** distância (melhor aproximação).
  - Usado no **lápis e na borracha**: ao alterar os pontos de uma célula, a “letra” exibida/exportada é a que melhor aproxima o conjunto de pontos atual (ex.: desenho incompleto ou com ponto a mais/menos ainda gera uma letra coerente).

Assim, no desenho a **fonte da verdade** são os **dots**; a **letter** é sempre **derivada** por `findBestMatchingLetter`. Na inserção por texto, a **fonte da verdade** é a **letter** (e o par #+letra para números); os **dots** são derivados por **letterToBraillePatternFunc**.

### 4.3 Números

- **Inserção**: dígito 0–9 é tratado só na caixa de texto; na grade vira sempre **#** (célula 1) + **letra a–j** (célula 2), usando **digitToLetter** (0→j, 1→a, …, 9→i).
- **Exibição, cópia e exportação**: nunca se mostra nem se exporta o caractere dígito; onde houver `#` + letra, aparece “#” e a letra; se por engano existir um dígito em `cell.letter`, ele é convertido para letra (p. ex. em **gridToLetters** e na vista “ver letras”) via **digitToLetter**.

---

## 5. Resumo dos fluxos

| Ação              | Entrada           | Saída na célula                                      | Conversão usada                    |
|-------------------|-------------------|------------------------------------------------------|------------------------------------|
| Lápis pinta ponto | (x, y) + índice 1–6 | `dots` atualizado; `letter = findBestMatchingLetter(dots)` | Pontos → letra (melhor correspondência) |
| Borracha apaga ponto | (x, y) + índice 1–6 | `dots` sem esse ponto; `letter = findBestMatchingLetter(dots)` | Idem                               |
| Texto: letra/pontuação | caractere         | `letter = ch`, `dots = letterToBraillePatternFunc(ch)` | Letra → pontos                     |
| Texto: dígito     | ex. "6"           | Célula 1: `letter = "#"`, `dots = [3,4,5,6]`; Célula 2: `letter = "f"`, `dots = [1,2,4]` | digitToLetter + letterToBraillePatternFunc |

A grade mantém sempre **dots** e **letter** consistentes: na inserção por texto, `letter` é a fonte e `dots` são calculados; no desenho, `dots` são a fonte e `letter` é calculada. Cópia e “ver letras” usam apenas `letter` (e regras para nunca exibir dígito).
