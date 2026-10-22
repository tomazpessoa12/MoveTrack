# Changelog

Todas as alterações relevantes do MoveTrack da Melodia Pet são registradas neste arquivo.

## v1.2.1 — 22/10/2026

### Melhorias

- Produção passa a usar o nome Paletes na aba principal, preservando o conteúdo.
- Ícones distintos para Paletes (boxes-stacked) e Avulsos (box) na operação.
- Descrição da cor padrão abaixo do título, alinhada à esquerda e ao lado do seletor.
- Resumo prioriza uma linha quando os produtos cabem na largura disponível; resumos maiores mantêm duas linhas por coluna em ordem alfabética.
- Resumo de itens padronizado nas três áreas: nome destacado, código e unidades em texto menor.
- Pendentes de Produção e Admin exibem nome destacado e código abaixo, mantendo quantidade na coluna própria.
- Ícone PWA usa a arte aprovada com borda azul neon e novos endereços para atualização.

### Correções de bugs

- Recebimentos reorganizados com número à esquerda, informações e assinatura em sequência e uma única seta à direita.
- Regras gerais dos botões deixam de centralizar o conteúdo e aplicar laranja forte aos recebimentos.
- Layout dos recebimentos se adapta ao menu aberto e a telas menores; assinatura e seta à direita, com dados à esquerda. Cores aprovadas: fundo #E2752A e texto branco; número com fundo #F8DCC8 e texto #6A2E0A.

## v1.2.0 — 22/10/2026

### Melhorias

- Nova marca MoveTrack em duas linhas, símbolo de palete e indicação ™, com instalações PWA individuais para Admin, Produção e Logística.
- Login administrativo redesenhado com cena isométrica de doca: ré de 7 segundos, palete saindo pela porta em camadas sem fade nem parada intermediária e partida imediata após carregar. Caminhão com logo MoveTrack na perspectiva da carroceria. Textos do login preservados.
- Menu lateral administrativo recolhível, organizado por Administração, Produção e Logística, com cores próprias e ícones Font Awesome Free.
- Catálogo local de produtos com 80 registros iniciais, pesquisa, ordenação, edição, exclusão individual ou em lote e importação CSV a partir da consulta do Sankhya.
- Foto vinculada ao código do produto nos paletes e no catálogo, com indicação quando indisponível.
- Confirmação visual destacada e loading personalizado isométrico cartoon: base de quatro caixas, uma caixa superior fixa e três caixas animadas completando duas camadas.
- Ícones nas ações do sistema e cabeçalho unificado com as marcas MoveTrack e Melodia Pet, alinhados verticalmente. O lettering é extraído da referência e tem 60% da altura do ícone.
- Filtros e ações do relatório divididos em mês 17%, tipo 17%, ordenação 21% e botões 45%; mês exibido como “Outubro 2026”.
- Catálogo com itens mais altos, checkbox estilizado na paleta do Admin, edição por ícone e exclusão pela seleção.
- Cor padrão e botão de adicionar linha organizados lado a lado nas configurações.
- Contador do catálogo acompanha os produtos exibidos na pesquisa.
- Ícones boxes-stacked para registrar palete, box para avulsos e QR Code do Font Awesome Free.
- Confirmações antes de remover itens ou excluir produtos.

### Correções de bugs

- Avisos de sucesso e erro fecham automaticamente após 3 segundos, com saída em fade subindo e temporizador reiniciado a cada novo aviso.
- Ícone de visualizar senha centralizado, com estado aberto/fechado correspondente ao campo.
- Pendentes em Produção e Admin: produto à esquerda; OP e quantidade à direita; status e pronto em centralizados.
- Corrigidos espaçamento dos filtros, abertura do mês com um clique, alinhamento dos dias do Discord e ordem das três versões no changelog.
- O código do produto é associado ao palete durante a leitura quando presente no QR ou identificável no catálogo.
- Feedback duplicado removido e OP exibida sem repetir o prefixo.
- Palete cancelado pode ser registrado novamente com o mesmo QR, mantendo o cancelamento anterior no histórico; motivo do cancelamento é opcional.

## v1.1.9 — 30/09/2026

### Melhorias

- Seletor de tipo do relatório passa a ter visual alinhado aos campos de mês e ordenação.
- Ajustes visuais unificam a altura e as setas dos filtros.
- Relatório pode ser ordenado por data, paletes ou unidades; **Data - Decrescente** é a opção padrão.

### Correções de bugs

- Seletor de tipo fecha automaticamente ao clicar fora dele.
- Ícone de senha agora representa corretamente o estado do campo.

## v1.1.8 — 30/09/2026

### Melhorias

- Filtros e botões do relatório ficam lado a lado em telas maiores, na proporção aproximada de 60% para filtros e 40% para ações.
- Filtro de ordenação passa a exibir as opções **Data - Crescente** e **Data - Decrescente**.
- A senha do Admin pode ser exibida ou ocultada pelo ícone de olho dentro do próprio campo.

### Correções de bugs

- Rótulo do filtro de tipo alinhado ao padrão dos demais filtros.
- Checkboxes de tipo passam a seguir a paleta visual do Admin.
- Layout mantém a organização adequada em telas menores.
- Botão separado **Mostrar senha** removido, deixando a tela de acesso mais compacta.

## v1.1.7 — 30/09/2026

### Melhorias

- Relatório do Admin recebe filtro por tipo de movimentação, com seleção independente de **Palete** e **Avulso**.
- Recebimentos podem ser ordenados em ordem cronológica crescente ou decrescente.
- PDF e CSV passam a respeitar os filtros escolhidos no relatório.

### Correções de bugs

- Filtros do relatório são mantidos ao expandir ou recolher um recebimento.

## v1.1.6 — 21/09/2026

### Melhorias

- Admin passa a ter manifesto PWA próprio, com nome e instalação independentes.

### Correções de bugs

- Aplicativo instalado a partir de `/admin` passa a abrir diretamente no Admin, sem redirecionar para Produção.

## v1.1.5 — 18/09/2026

### Melhorias

- Melhor organização visual da tela de acesso administrativo e da área de Configurações.

### Correções de bugs

- Checkbox **Manter conectado neste dispositivo** alinhado corretamente ao texto.
- Separação visual adicionada entre os botões **Entrar** e **Mostrar senha**.

## v1.1.4 — 18/09/2026

### Melhorias

- Opção **Manter conectado neste dispositivo** no acesso administrativo.
- Botão **Sair** no cabeçalho do Admin.

### Correções de bugs

- Cores corrigidas para abas ativas e inativas do Admin.
- Botões **Aplicar**, **Gerar PDF** e **Baixar CSV** receberam as cores definidas.

## v1.1.3 — 18/09/2026

### Melhorias

- Paletas finais: Admin `#E2752A`, Produção `#001A38` e Logística `#FCB539`.
- Abas inativas do Admin possuem tons próprios por área, mantendo a cor forte apenas na aba ativa.
- Avulsos pendentes podem ser adicionados ou retirados do recebimento em andamento pela aba **Avulsos** do Admin.

### Correções de bugs

- Botões do relatório voltam a ter dois níveis visuais de destaque.
- Fundo dos recebimentos no Admin foi suavizado e o espaçamento após o filtro mensal foi ampliado.

## v1.1.2 — 18/09/2026

### Melhorias

- Paletas refinadas: Admin `#E2752A`, Produção `#FFE242` e Logística `#FCB539`.
- Abas ativas ganham a cor forte da área; abas inativas permanecem discretas.
- Botões **Aplicar**, **Gerar PDF** e **Baixar CSV** retomam distinção visual dentro da paleta do Admin.

### Correções de bugs

- A tela do Admin permanece identificada como **ADMIN**, inclusive nas abas operacionais.
- Fundos dos recebimentos receberam tom mais suave para melhorar a leitura.
- Changelog administrativo passa a mostrar corretamente as três versões mais recentes.

## v1.1.1 — 18/09/2026

### Melhorias

- Identidade visual monocromática própria para Admin, Produção e Logística.
- Áreas operacionais dentro do Admin adotam a identidade de Produção ou Logística.

### Correções de bugs

- Cabeçalho simplificado, sem a linha visual abaixo dele.

## v1.1.0 — 18/09/2026

### Melhorias

- Observação opcional em cada recebimento, disponível no relatório e PDF.
- Instalações independentes para Produção e Logística, cada uma abrindo sua própria área.
- Diferenciação visual das áreas por cor e identificação no cabeçalho.

### Correções de bugs

- Instalação iniciada pela Logística não abre mais a tela da Produção.

## v1.0.1 — 10/09/2026

### Melhorias

- Sistema configurado como aplicativo instalável (PWA) em dispositivos compatíveis.
- Ícone, abertura em janela própria e suporte ao menu **Instalar app** do navegador.
- Backup local das configurações, incluindo o webhook do Discord, junto aos dados operacionais.

### Correções de bugs

- Sem correções nesta versão.

## v1.0.0 — 10/09/2026

### Melhorias

- Registro e recebimento de paletes por QR Code, com suporte a leitura manual no Admin.
- Fluxo de unidades avulsas, incluindo retirada e devolução parcial ao palete de origem.
- Resumos de pendências por paletes, avulsos e produto nas áreas de Produção e Logística.
- Leitor de QR Code com moldura de centralização, troca de câmera, foco contínuo e zoom quando disponíveis no aparelho.
- Relatório mensal com filtro, CSV, impressão em PDF e detalhamento cronológico de cada recebimento.
- PDF em retrato com logo, totalizadores, assinatura e identificação de data/hora de geração e versão do sistema.
- Configurações centralizadas para Discord e linhas de produto, com cores editáveis, campo hexadecimal e cor padrão.
- Changelog acessível na área administrativa e neste repositório.

### Correções de bugs

- As cores configuradas das linhas de produto agora são aplicadas também nas telas de Produção e Logística.
- A ação **Aplicar** no relatório atualiza os dados mesmo quando o mesmo mês já está selecionado.
- Controles do leitor de QR Code permanecem visíveis em telas menores.
