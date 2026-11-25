export const sections = [
  { title: 'Diagnóstico', items: [[1, 'Visão geral', 'home'], [2, 'Perfil da frota', 'clipboard'], [4, 'Combustível', 'fuel'], [7, 'Pneus e desgaste', 'tire']] },
  { title: 'Solução', items: [[9, 'Equalizador de pressão', 'gauge'], [11, 'Monitoramento visual', 'eye'], [14, 'Instalação', 'tool']] },
  { title: 'Resultados', items: [[16, 'Simulador de pneus', 'chart'], [17, 'Simulador de diesel', 'calculator'], [18, 'Aplicação em campo', 'shield'], [19, 'Quadro de anotações', 'pen']] },
];

export const slides = [
  {},
  { chapter: 'Visão geral', title: 'Diesel e pneus: onde sua frota pode economizar?', type: 'hero' },
  { chapter: 'Perfil da frota', title: 'Como sua frota trabalha hoje?', description: 'Use estas perguntas para levantar a situação atual da operação.', type: 'profile' },
  { chapter: 'Perfil da frota', title: 'Pequenos cuidados, grandes efeitos', description: 'Uma rotina de calibragem consistente ajuda a preservar os pneus e a controlar o consumo da frota.', type: 'video', video: 'oLS7pxCKV38', videoLabel: 'A força de uma gota' },
  { chapter: 'Combustível', title: 'Quanto cada caminhão gasta com diesel por mês?', description: 'Use a média dos últimos meses para registrar um valor representativo. Esse dado pode ser levado ao simulador de diesel.', type: 'cost', cost: 'diesel' },
  { chapter: 'Combustível', title: 'Compare o gasto mensal por veículo', description: 'Use o cenário de exemplo para comparar com o valor da sua operação.', type: 'comparison' },
  { chapter: 'Combustível', title: 'Pneu murcho exige mais esforço', description: 'A bicicleta ajuda a visualizar o efeito da baixa pressão. Na frota, a resistência ao rolamento também afeta o consumo.', type: 'video', video: '5CRFzUybmGg', videoLabel: 'Demonstração com bicicleta' },
  { chapter: 'Pneus e desgaste', title: 'Quanto sua frota gasta com pneus por mês?', description: 'Considere as aquisições e reposições para entender o peso dos pneus no orçamento da operação.', type: 'cost', cost: 'tires' },
  { chapter: 'Pneus e desgaste', title: 'Da pressão dos pneus ao custo por quilômetro', description: 'A pressão recomendada para o veículo e a carga ajuda a equilibrar durabilidade, consumo e segurança.', type: 'cards', cards: [
    ['gauge', 'Pressão adequada', 'A área de contato do pneu trabalha nas condições previstas.'],
    ['tire', 'Menor resistência', 'O pneu sofre menos deformação à medida que gira.'],
    ['fuel', 'Menos esforço', 'A frota pode rodar com menor consumo e desgaste.'],
  ] },
  { chapter: 'Equalizador de pressão', title: 'Como funciona um equalizador de pressão', description: 'Um equalizador conecta os pneus de uma rodagem dupla e pode simplificar a reposição de ar e o acompanhamento da pressão.', type: 'cards', cards: [
    ['tool', 'Enchimento centralizado', 'Um ponto de acesso permite abastecer o par de pneus.'],
    ['eye', 'Indicador de pressão', 'A indicação visual facilita a inspeção de rotina.'],
    ['tire', 'Equalização', 'Uma pressão mais uniforme ajuda a distribuir a carga entre os pneus.'],
  ] },
  { chapter: 'Equalizador de pressão', title: 'Calibre os dois pneus por um único ponto', description: 'O acesso centralizado facilita a conferência do pneu interno e reduz o tempo necessário para atender cada par.', type: 'cards', cards: [
    ['tool', 'Acesso ao pneu interno', 'O operador usa o ponto de abastecimento centralizado.'],
    ['gauge', 'Conferência da pressão', 'Verifique o valor recomendado para a operação.'],
    ['clipboard', 'Rotina de pátio', 'Padronize a inspeção e registre ocorrências.'],
  ] },
  { chapter: 'Monitoramento visual', title: 'Identifique rapidamente quando inspecionar', description: 'Os estados abaixo ilustram como um indicador visual pode apoiar a rotina de conferência.', type: 'status' },
  { chapter: 'Monitoramento visual', title: 'Da inspeção visual à manutenção', description: 'Uma indicação de perda de pressão ajuda a direcionar a atenção da equipe aos pneus que precisam de revisão.', type: 'cards', cards: [
    ['eye', 'Inspecione', 'Inclua a leitura dos indicadores nas checagens de pátio.'],
    ['clipboard', 'Registre', 'Identifique o veículo, a posição do pneu e a ocorrência.'],
    ['tool', 'Verifique', 'Confira a pressão com um manômetro e avalie a origem da perda.'],
  ] },
  { chapter: 'Monitoramento visual', title: 'Pneus duplos com pressão equilibrada', description: 'Diferenças de pressão podem concentrar a carga em um pneu e aumentar o arraste do outro.', type: 'cards', cards: [
    ['tire', 'Apoio uniforme', 'O par de pneus compartilha a carga de maneira mais equilibrada.'],
    ['gauge', 'Menos deformação', 'A pressão adequada reduz o esforço associado à deformação.'],
    ['chart', 'Desgaste regular', 'O equilíbrio favorece o aproveitamento da banda de rodagem.'],
  ] },
  { chapter: 'Instalação', title: 'Veja uma instalação na prática', description: 'O vídeo mostra a montagem do equalizador Olho de Gato em uma rodagem dupla.', type: 'video', video: 'eTudgqkiajk', videoLabel: 'Instalação do equalizador' },
  { chapter: 'Instalação', title: 'Como a pressão afeta a vida útil', description: 'Explore o gráfico de referência e compare cenários abaixo e acima da pressão recomendada.', type: 'chart' },
  { chapter: 'Simulador de pneus', title: 'Estime a economia com pneus', description: 'Informe a configuração da frota e a hipótese de ganho para calcular a projeção.', type: 'sim', sim: 'tires' },
  { chapter: 'Simulador de diesel', title: 'Estime a economia com diesel', description: 'Compare o custo atual da frota com uma hipótese de redução no consumo.', type: 'sim', sim: 'diesel' },
  { chapter: 'Aplicação em campo', title: 'O que observar em um teste de campo', description: 'Conheça os critérios para avaliar o comportamento do equipamento na sua própria operação.', type: 'field' },
  { chapter: 'Quadro de anotações', title: 'Quadro de anotações', description: 'Registre as conclusões e os próximos passos da conversa.', type: 'board' },
];
