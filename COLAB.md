# Executando o Mineiro Username Extractor no Google Colab

Sim. A v1.3 foi preparada para rodar em uma VM do Google Colab.

## Limitações do Colab

- A VM é temporária. Reiniciar a sessão apaga dependências e processos.
- O servidor roda dentro da VM, então a porta 3000 precisa ser aberta pelo proxy do Colab ou por um túnel opcional.
- Deep Scan continua sujeito a rate limits e políticas dos serviços consultados.
- Não coloque chaves reais de API diretamente no notebook compartilhado.

## Caminho recomendado

Abra:

`notebooks/Mineiro_Username_Extractor_Colab.ipynb`

O notebook:

1. clona o repositório;
2. instala dependências;
3. valida o Mineiro Registry;
4. inicia o servidor;
5. verifica `http://127.0.0.1:3000`;
6. tenta abrir a interface pelo proxy do Colab.

## Instalação manual em uma célula

```bash
!git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
%cd Mineiro-OSINT-Extractor
!npm install
!npm run registry:validate
```

Depois:

```python
import subprocess, time

server = subprocess.Popen(
    ["npm", "run", "dev"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

time.sleep(4)
print("Servidor iniciado na porta 3000")
```

### Abrir pelo proxy do Colab

```python
from google.colab import output
from IPython.display import Javascript, display

display(Javascript("""
(async () => {
  const url = await google.colab.kernel.proxyPort(3000);
  window.open(url, '_blank');
})();
"""))
```

Se o proxy não funcionar na sessão atual, use o modo de teste via API local ou configure um túnel temporário conscientemente.

## Rodar somente validação do catálogo

O Colab também é útil como bancada para manter o catálogo sem abrir a interface:

```bash
!npm run registry:stats
!npm run registry:validate
```

Isso permite revisar packs, categorias e proveniência antes de enviar um Pull Request.

## Boas práticas

Evite rodar Deep Scan repetidamente apenas para testar a interface. Para desenvolvimento, use Quick/Standard. O catálogo amplo existe para investigação legítima, não para gerar tráfego inútil contra centenas de serviços.
