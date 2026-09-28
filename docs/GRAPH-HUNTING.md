# Graph Hunting

Mineiro v1.5 adiciona uma superfície de investigação orientada a grafo sem tornar Neo4j obrigatório.

## Objetivo

O grafo separa três coisas:

```text
observed public evidence
        ≠
candidate username similarity
        ≠
identity conclusion
```

Uma aresta tracejada significa candidato. Um pivot scan pode confirmar que o username candidato existe em determinados serviços, mas isso **não** confirma que ele pertence à mesma pessoa do alvo original.

## Similar Usernames

O motor gera variações conservadoras de username:

- remoção/substituição de separadores;
- prefixos comuns;
- sufixos funcionais;
- substituições leetspeak simples;
- similaridade normalizada por distância de edição.

Não são gerados automaticamente:

- parentes;
- peers;
- e-mails prováveis;
- data/ano de nascimento;
- atributos privados ou sensíveis.

## Pivot Scan no grafo

Selecione um nó `USERNAME_CANDIDATE` e clique em **Scan candidate**.

O scan:

1. roda em background;
2. usa preset Standard com Evidence Engine;
3. não substitui a investigação aberta;
4. guarda o resultado no cache local;
5. adiciona os perfis encontrados ao grafo atual.

Exemplo:

```text
pascho
  |
  |  SIMILAR_USERNAME (candidate)
  v
pascho_dev
  |
  |  OBSERVED_ON (observed)
  +--> GitHub
  +--> GitLab
  +--> Medium
```

A primeira aresta continua candidata. As demais representam observações públicas do pivot.

## Mineiro Graph Query

A consulta é local, read-only e inspirada em workflows de graph hunting.

### Nós por tipo

```text
MATCH type=PROFILE
MATCH type=DOMAIN
MATCH type=USERNAME_CANDIDATE
```

### Candidatos semelhantes

```text
MATCH candidate=true AND similarity>=70
```

### Busca por label

```text
MATCH label~pascho
```

### Relações

```text
EDGE relationship=SAME_DOMAIN
EDGE confidence>=80
```

### Entidades compartilhadas

```text
SHARED type=DOMAIN
```

Retorna nós daquele tipo com grau >= 2 e as arestas conectadas.

### Caminhos

```text
PATH from=TARGET to=PROFILE
```

O engine procura caminhos locais com profundidade limitada para manter a consulta previsível no navegador.

## Presets

A interface inclui:

- Similar usernames
- Shared domains
- Observed profiles
- Strong edges
- Same domain
- Target → profiles

Uma query ativa destaca os resultados e atenua o restante do grafo.

## Neo4j

O botão **Export Cypher** gera um arquivo local `.cypher` com:

- nodes;
- types;
- candidate flag;
- similarity score;
- evidence ID;
- relationships;
- confidence;
- candidate flag.

O Mineiro **não conecta automaticamente ao Neo4j** e não envia dados para fora da máquina.

Isso mantém Colab/local simples e permite usar Neo4j apenas quando o analista quiser escalar a análise.

## Modelo recomendado

```text
(:MineiroNode {type:"USERNAME"})
  -[:SIMILAR_USERNAME {candidate:true}]->
(:MineiroNode {type:"USERNAME_CANDIDATE"})

(:MineiroNode {type:"USERNAME_CANDIDATE"})
  -[:OBSERVED_ON {candidate:false}]->
(:MineiroNode {type:"PIVOT_PROFILE"})
```

## Regras analíticas

1. Similaridade de string não é identidade.
2. Pivot encontrado não confirma vínculo com o alvo original.
3. Arestas observadas e candidatas nunca compartilham a mesma semântica visual.
4. Consultas são read-only.
5. Cypher exportado preserva `candidate=true/false`.
6. Evidência pública independente é necessária para elevar uma hipótese de correlação.
