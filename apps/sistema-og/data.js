/**
 * Base de Dados Técnica e Comercial — Olho de Gato (OG)
 * Equalizador de Pressão de Pneus
 */

const OG_DATA = {
  // Metadados da Empresa e Contatos
  company: {
    name: "Olho de Gato — Equalizador de Pressão",
    shortName: "Olho de Gato",
    tagline: "Controle de Pressão, Equalização Contínua e Economia de Pneus",
    contacts: {
      financeiro: { email: "adm@equalizador.com.br", fone: "(44) 3354-2201" },
      assistencia: { email: "assistencia@equalizador.com.br", fone: "(44) 3354-2201" },
      comercial: { email: "diego@equalizador.com.br", ramais: "210 / 211 / 212 / 213" }
    }
  },

  // Tabela de Preços e Condições
  pricingTiers: {
    lead_ie: {
      id: "lead_ie",
      name: "Lead — CNPJ com Inscrição Estadual (IE)",
      description: "Padrão para transportadoras e frotas com IE ativa",
      equalizador: 213.00,
      suporte: 22.00,
      mangueira: 30.00,
      bicoGiratorio: 11.50,
      bicoEnchimento: 11.50,
      anelVedacao: 0.40,
      extraTaxPercent: 0
    },
    lead_sem_ie: {
      id: "lead_sem_ie",
      name: "Lead — Autônomo / CPF / CNPJ sem IE",
      description: "Motoristas autônomos e clientes sem IE (+12% em peças)",
      equalizador: 239.00,
      suporte: 24.00,
      mangueira: 33.60,
      bicoGiratorio: 12.88,
      bicoEnchimento: 12.88,
      anelVedacao: 0.45,
      extraTaxPercent: 12
    },
    revenda: {
      id: "revenda",
      name: "Revenda / Auto Peças / Borracharia",
      description: "Tabela exclusiva para parceiros comerciais e distribuidores",
      equalizador: 157.00,
      suporte: 20.00,
      mangueira: 30.00,
      bicoGiratorio: 11.50,
      bicoEnchimento: 11.50,
      anelVedacao: 0.40,
      extraTaxPercent: 0
    },
    tabela_base: {
      id: "tabela_base",
      name: "Tabela Geral de Catálogo",
      description: "Preço de tabela cheia",
      equalizador: 172.00,
      suporte: 22.00,
      mangueira: 30.00,
      bicoGiratorio: 11.50,
      bicoEnchimento: 11.50,
      anelVedacao: 0.40,
      extraTaxPercent: 0
    },
    locacao: {
      id: "locacao",
      name: "Locação Operacional (por Pneu/Mês)",
      description: "Zero custo de manutenção, suporte dedicado e peças inclusas",
      minPecas: 100,
      planos: [
        { meses: 24, valorPorPneuMes: 7.00, label: "24 meses — R$ 7,00/pneu/mês" },
        { meses: 36, valorPorPneuMes: 6.00, label: "36 meses — R$ 6,00/pneu/mês" }
      ]
    }
  },

  // Condições de Pagamento
  paymentRules: [
    { maxVal: 1000, condition: "30/60 dias", desc: "Para compras de até R$ 1.000,00" },
    { minVal: 1000, maxVal: 10000, condition: "30/60/90/120 dias", desc: "Para compras de R$ 1.000,00 a R$ 10.000,00" },
    { minVal: 10000, condition: "Até 6x", desc: "Para pedidos acima de R$ 10.000,00" },
    { minPecas: 150, condition: "Até 10x (sob autorização)", desc: "Especial para pedidos acima de 150 peças" }
  ],

  // Embalagens e Caixas de Despacho
  packagingBoxes: [
    { id: 1, name: "Caixa 1", dim: "19 × 19 × 29 cm", pesoMax: 10.0, kitsMax: 10, desc: "Até 10 kits (Até 10 kg)" },
    { id: 2, name: "Caixa 2", dim: "19 × 34 × 38 cm", pesoMax: 25.0, kitsMax: 25, desc: "11 a 25 kits (11 a 25 kg)" },
    { id: 3, name: "Caixa 3", dim: "34 × 30 × 50 cm", pesoMax: 50.0, kitsMax: 50, desc: "36 a 50 kits (26 a 50 kg)" },
    { id: 4, name: "Caixa 4", dim: "29 × 48 × 48 cm", pesoMax: 65.0, kitsMax: 65, desc: "51 a 65 kits (51 a 65 kg)" }
  ],

  // Pesos médios unitários para cálculo de frete (em gramas)
  weights: {
    equalizadorTraseiro: 470,
    equalizadorDianteiro: 280,
    mangueira: 105,
    suporteTracaoTruck: 300,
    suporteDianteiro: 500,
    kitManutencao545: 500
  },

  // 16 SEGMENTOS DE MERCADO
  segments: [
    { id: "transportadora", name: "Transportadora / Carga Seca", icon: "🚚", dor: "Custo elevado com reposição de pneus, alto consumo de combustível e caminhão parado.", gancho: "Quanto vocês gastam hoje com pneus e como controlam o desgaste dos rodados duplos?", focoVenda: "Custo total da frota, eliminação do rodízio e quilometragem extra." },
    { id: "refrigerado", name: "Carga Refrigerada / Frigorífico", icon: "❄️", dor: "Alta quilometragem contínua e risco elevado com perecíveis parados.", gancho: "Quanto custa para vocês um caminhão ficar parado por problema de pneu durante uma operação refrigerada?", focoVenda: "Disponibilidade 24h, pontualidade e zero paradas." },
    { id: "graneleiro", name: "Graneleiro / Grãos", icon: "🌾", dor: "Carga pesada no limite do peso por eixo, desgaste acelerado e diesel.", gancho: "Vocês acompanham o desgaste dos pneus por veículo ou só fazem a troca quando o pneu chega no limite?", focoVenda: "Preservação da carcaça para recapagem + economia de diesel." },
    { id: "carga_viva", name: "Carga Viva / Boiadeiro", icon: "🐄", dor: "Peso elevado e dinâmico, longas distâncias e estradas vicinais severas.", gancho: "Como vocês controlam os pneus nas rotas mais longas e pesadas com carga viva?", focoVenda: "Segurança e confiabilidade sem estouro de pneu." },
    { id: "agronegocio", name: "Agronegócio / Fazendas", icon: "🌽", dor: "Operação mista (terra e asfalto), estradas ruins e manutenção cara.", gancho: "Quanto o desgaste irregular dos pneus pesa hoje no custo da operação agrícola?", focoVenda: "Resistência e calibragem rápida em ponto único." },
    { id: "usinas", name: "Usinas / Cana-de-Açúcar", icon: "🍬", dor: "Operação contínua 24h na safra, poeira pesada e pedras.", gancho: "Quantos caminhões rodam diariamente na safra e como vocês acompanham a pressão dos pneus?", focoVenda: "Operação sem paradas." },
    { id: "florestal", name: "Florestal / Madeireiro", icon: "🌲", dor: "Terreno severo e grande distância de oficinas mecânicas.", gancho: "Quando um pneu apresenta problema na operação florestal, quanto isso custa em parada?", focoVenda: "Independência de socorro." },
    { id: "mineracao", name: "Mineração / Pedreiras", icon: "⛏️", dor: "Pneus de altíssimo valor unitário e hora parada cara.", gancho: "Quanto representa financeiramente para a sua mineradora uma hora de caminhão parado por pneu?", focoVenda: "Preservação de pneus de altíssimo custo." },
    { id: "construcao", name: "Construção / Caçamba", icon: "🏗️", dor: "Impactos nas rodas e cortes de talão frequentes.", gancho: "Vocês têm problema frequente com desgaste irregular e corte de talão nos pneus?", focoVenda: "Equalização em pisos acidentados." },
    { id: "onibus", name: "Empresa de Ônibus / Passageiros", icon: "🚌", dor: "Segurança dos passageiros e alta quilometragem.", gancho: "Como a equipe de vocês faz a conferência diária da pressão dos pneus internos?", focoVenda: "Gerenciamento visual sem desmontar rodas." },
    { id: "distribuicao", name: "Distribuição / Logística", icon: "🚛", dor: "Tempo escasso para manutenção na saída da frota.", gancho: "Quanto tempo a sua equipe perde diariamente fazendo a calibragem pneu por pneu?", focoVenda: "Calibragem rápida em ponto único." },
    { id: "combustivel", name: "Transporte de Combustível", icon: "🛢️", dor: "Prevenção crítica de aquecimento de talão e acidentes.", gancho: "Como vocês fazem o controle preventivo e inspeção de pressão antes da viagem?", focoVenda: "Segurança e inspeção visual rápida." },
    { id: "tanque_liquido", name: "Carga Líquida / Tanque", icon: "🧴", dor: "Desgaste acentuado nas curvas pelo efeito onda.", gancho: "Vocês conseguem acompanhar facilmente a pressão dos pneus internos durante viagens longas?", focoVenda: "Estabilidade do conjunto." },
    { id: "cimento", name: "Cimento / Siderúrgica", icon: "🧱", dor: "Cargas densas e ciclo contínuo de viagens.", gancho: "Quanto vocês gastam por mês apenas com a troca e manutenção de pneus?", focoVenda: "Distribuição equitativa de carga." },
    { id: "ecommerce", name: "E-Commerce / Encomendas", icon: "📦", dor: "Prazos curtos e frotas sob pressão de tempo.", gancho: "Como vocês controlam hoje os pneus da frota expressa para evitar paradas?", focoVenda: "Zero paradas no caminho." },
    { id: "autonomo", name: "Motorista Autônomo / Dono de Caminhão", icon: "🤠", dor: "O dinheiro do pneu sai direto do próprio bolso.", gancho: "Quantos pneus você troca por ano e quanto economizaria com 20% a mais de vida útil?", focoVenda: "Economia direta no bolso do estradeiro." }
  ],

  // =========================================================================
  // ÁRVORE DE DECISÃO & CONSULTOR DE SUPORTES POR TIPO DE CAMINHÃO (EXATO OG)
  // =========================================================================
  vehicleConsultantRules: [
    {
      id: "3_4",
      name: "Caminhão 3/4",
      category: "Caminhões Leves",
      keywords: ["3/4", "3 4", "tres quartos", "delivery", "accelo", "leve", "710", "815", "8160", "9170"],
      applications: ["Baú", "Sider", "Refrigerado", "Guincho", "Plataforma", "Carga Geral"],
      axles: { dianteiro: 1, tracao: 1, truck: 0, carreta: 0 },
      questions: [
        {
          id: "wheel_size",
          question: "Seu caminhão 3/4 utiliza roda 17 ou roda 19?",
          options: [
            { value: "19", label: "Roda 19 (Aro 19.5\")", hint: "Gera Suporte Dianteiro EQ-1340" },
            { value: "17", label: "Roda 17 (Aro 17.5\")", hint: "Gera Suporte Dianteiro EQ-1320" }
          ]
        },
        {
          id: "has_truck_3_4",
          question: "Esse caminhão 3/4 possui 3º Eixo (Truck adaptado)?",
          options: [
            { value: "nao", label: "Não (4x2 tradicional — 6 pneus)", hint: "1 dianteiro + 1 tração" },
            { value: "sim_vw", label: "Sim, é Volkswagen com Truck", hint: "Suporte Truck EQ-1155" },
            { value: "sim_mb", label: "Sim, é Mercedes com Truck", hint: "Suporte Truck EQ-1145" }
          ]
        }
      ]
    },
    {
      id: "toco_4x2",
      name: "Caminhão Toco 4x2",
      category: "Caminhões Médios/Pesados",
      keywords: ["toco", "4x2", "toco 4x2", "medio", "1620", "vm 270", "atego toco", "constellation toco"],
      applications: ["Baú", "Sider", "Refrigerado", "Carga Seca", "Caçamba"],
      axles: { dianteiro: 1, tracao: 1, truck: 0, carreta: 0 },
      questions: [
        {
          id: "brand",
          question: "Qual é a marca do caminhão Toco?",
          options: [
            { value: "scania", label: "Scania", hint: "Tração EQ-1190 | Dianteira EQ-1250" },
            { value: "volvo", label: "Volvo", hint: "Tração EQ-1145 | Dianteira EQ-1250" },
            { value: "mb", label: "Mercedes-Benz", hint: "Exige verificação de ano" },
            { value: "outras", label: "Volkswagen, Ford, Iveco ou outras", hint: "Tração EQ-1145 | Dianteira EQ-1251" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes-Benz?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017)", hint: "Dianteiro EQ-1300" },
            { value: "ge2017", label: "2017 em diante (>= 2017)", hint: "Dianteiro EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "trucado_6x2_8x2",
      name: "Trucado 6x2 e Bi-Truck 8x2",
      category: "Caminhões Pesados",
      keywords: ["truck", "trucado", "6x2", "bitruck", "bi-truck", "8x2", "cacamba", "betoneira", "munck", "roll on"],
      applications: ["Caçamba", "Baú", "Sider", "Munck", "Betoneira", "Carga Seca", "Roll On Roll Off"],
      axles: { dianteiro: 1, tracao: 1, truck: 1, carreta: 0 },
      questions: [
        {
          id: "is_bitruck",
          question: "É Truck 6x2 (1 dianteiro) ou Bi-Truck 8x2 (2 direcionais)?",
          options: [
            { value: "6x2", label: "Truck 6x2 (3 eixos — 10 pneus)" },
            { value: "8x2", label: "Bi-Truck 8x2 (4 eixos / 2 dianteiros — 12 pneus)" }
          ]
        },
        {
          id: "brand",
          question: "Qual é a marca do caminhão?",
          options: [
            { value: "scania", label: "Scania" },
            { value: "volvo", label: "Volvo" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "vw", label: "Volkswagen" },
            { value: "iveco", label: "Iveco" },
            { value: "ford", label: "Ford" }
          ]
        },
        {
          id: "scania_suspension",
          question: "Esse Scania possui suspensão a ar (pneumática)?",
          showIf: { brand: "scania" },
          options: [
            { value: "ar", label: "Sim, Suspensão a Ar (Pneumática)", hint: "Suporte Truck/Tração EQ-1390" },
            { value: "mola", label: "Não, Suspensão Tradicional de Molas", hint: "Tração EQ-1190 | Truck EQ-1135" }
          ]
        },
        {
          id: "has_reduction",
          question: "O caminhão possui cubo com redução (betoneira / caçamba severa)?",
          options: [
            { value: "sim", label: "Sim, possui cubo com redução", hint: "Volvo/Scania: EQ-1330 | MB: EQ-1271" },
            { value: "nao", label: "Não, cubo convencional standard" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes-Benz?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017)", hint: "Dianteiro EQ-1300" },
            { value: "ge2017", label: "2017 em diante (>= 2017)", hint: "Dianteiro EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "trucado_reboque",
      name: "Trucado 6x2 + Reboque (Romeu e Julieta)",
      category: "Conjuntos Articulados",
      keywords: ["romeu e julieta", "reboque", "trucado reboque", "boia", "tanque leite", "madeireiro"],
      applications: ["Romeu e Julieta", "Baú", "Boiadeiro", "Madeireiro", "Tanque de Leite"],
      axles: { dianteiro: 1, tracao: 1, truck: 1, carreta: 2 },
      questions: [
        {
          id: "brand",
          question: "Qual é a marca do caminhão trator?",
          options: [
            { value: "scania", label: "Scania" },
            { value: "volvo", label: "Volvo" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "outras", label: "Volkswagen, Iveco ou Ford" }
          ]
        },
        {
          id: "scania_suspension",
          question: "O Scania possui suspensão a ar?",
          showIf: { brand: "scania" },
          options: [
            { value: "ar", label: "Sim, Suspensão a Ar (EQ-1390 no truck)" },
            { value: "mola", label: "Não, Suspensão Mola (EQ-1190 tração / EQ-1135 truck)" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017) → EQ-1300" },
            { value: "ge2017", label: "2017 em diante → EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "cavalo_toco_carreta3",
      name: "Cavalo Toco 4x2 + Carreta 3 Eixos",
      category: "Carretas Simples",
      keywords: ["cavalo toco", "4x2 carreta", "carreta 3 eixos", "toco com carreta"],
      applications: ["Carreta de 3 Eixos", "Baú", "Sider", "Graneleiro", "Frigorífico"],
      axles: { dianteiro: 1, tracao: 1, truck: 0, carreta: 3 },
      questions: [
        {
          id: "brand",
          question: "Qual é a marca do cavalo mecânico?",
          options: [
            { value: "scania", label: "Scania (Tração EQ-1190 | Dianteira EQ-1250 | Carreta EQ-1135)" },
            { value: "volvo", label: "Volvo (Tração EQ-1145 | Dianteira EQ-1250 | Carreta EQ-1135)" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "outras", label: "Volkswagen, Iveco ou Ford (Tração EQ-1145 | Diant. EQ-1251)" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes-Benz?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017) → Dianteira EQ-1300" },
            { value: "ge2017", label: "2017 em diante → Dianteira EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "trucado_carreta3",
      name: "Trucado 6x2 + Carreta 3 Eixos (Vanderléia / 5 Eixos)",
      category: "Carretas Pesadas",
      keywords: ["vanderleia", "vanderleia 3 eixos", "afastado", "trucado carreta", "silo", "sider carreta"],
      applications: ["Vanderléia", "1º Eixo Afastado", "Sider", "Baú", "Carga Seca", "Silo"],
      axles: { dianteiro: 1, tracao: 1, truck: 1, carreta: 3 },
      questions: [
        {
          id: "brand",
          question: "Qual é a marca do cavalo mecânico?",
          options: [
            { value: "scania", label: "Scania" },
            { value: "volvo", label: "Volvo" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "outras", label: "Volkswagen, Iveco ou Ford" }
          ]
        },
        {
          id: "scania_suspension",
          question: "O Scania possui suspensão a ar?",
          showIf: { brand: "scania" },
          options: [
            { value: "ar", label: "Sim, Suspensão a Ar (EQ-1390)" },
            { value: "mola", label: "Não, Suspensão Mola (EQ-1190 tração / EQ-1135 truck)" }
          ]
        },
        {
          id: "has_reduction",
          question: "O caminhão possui cubo com redução?",
          options: [
            { value: "sim", label: "Sim, possui redução (MB: EQ-1271 | Volvo/Scania: EQ-1330)" },
            { value: "nao", label: "Não, cubo convencional standard" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes-Benz?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017) → EQ-1300" },
            { value: "ge2017", label: "2017 em diante → EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "bitrem_7eixos",
      name: "Cavalo 6x2 ou 6x4 — 7 Eixos (Bitrem)",
      category: "Combinações Longas",
      keywords: ["bitrem", "7 eixos", "bitanque", "bicacamba", "graneleiro bitrem", "6x4 bitrem"],
      applications: ["Bitrem", "Bitanque", "Bicaçamba", "Carga Seca", "Graneleiro", "Madeireiro", "Baú"],
      axles: { dianteiro: 1, tracao: 2, truck: 0, carreta: 4 },
      questions: [
        {
          id: "traction_type",
          question: "O cavalo mecânico é 6x2 ou 6x4?",
          options: [
            { value: "6x4", label: "6x4 Traçado (2 eixos de tração no cavalo)" },
            { value: "6x2", label: "6x2 Trucado (1 tração + 1 truck auxiliar no cavalo)" }
          ]
        },
        {
          id: "brand",
          question: "Qual é a marca do cavalo?",
          options: [
            { value: "scania", label: "Scania" },
            { value: "volvo", label: "Volvo" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "outras", label: "Volkswagen, Iveco ou Ford" }
          ]
        },
        {
          id: "scania_suspension",
          question: "O Scania possui suspensão a ar?",
          showIf: { brand: "scania" },
          options: [
            { value: "ar", label: "Sim, Suspensão a Ar (EQ-1390)" },
            { value: "mola", label: "Não, Suspensão Mola (EQ-1190 tração / EQ-1135 truck/carreta)" }
          ]
        },
        {
          id: "has_reduction",
          question: "Possui cubo com redução?",
          options: [
            { value: "sim", label: "Sim, possui redução (MB: EQ-1271 | Volvo/Scania: EQ-1330)" },
            { value: "nao", label: "Não possui redução" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017) → EQ-1300" },
            { value: "ge2017", label: "2017 em diante → EQ-1251" }
          ]
        }
      ]
    },
    {
      id: "rodotrem_9eixos",
      name: "Rodotrem — 9 Eixos (6x4 Traçado)",
      category: "Super Combinações",
      keywords: ["rodotrem", "9 eixos", "rodotrem 9 eixos", "dolly", "super rodotrem", "treminhao"],
      applications: ["Graneleiro", "Caçamba", "Baú", "Madeireiro", "Tanque", "Carga Seca"],
      axles: { dianteiro: 1, tracao: 2, truck: 0, carreta: 6 },
      questions: [
        {
          id: "brand",
          question: "Qual é a marca do cavalo mecânico 6x4?",
          options: [
            { value: "scania", label: "Scania" },
            { value: "volvo", label: "Volvo" },
            { value: "mb", label: "Mercedes-Benz" },
            { value: "outras", label: "Volkswagen, Iveco ou outras" }
          ]
        },
        {
          id: "scania_suspension",
          question: "O Scania possui suspensão a ar?",
          showIf: { brand: "scania" },
          options: [
            { value: "ar", label: "Sim, Suspensão a Ar (EQ-1390)" },
            { value: "mola", label: "Não, Suspensão Mola (EQ-1190)" }
          ]
        },
        {
          id: "has_reduction",
          question: "Possui cubo com redução?",
          options: [
            { value: "sim", label: "Sim, possui redução (MB: EQ-1271 | Volvo/Scania: EQ-1330)" },
            { value: "nao", label: "Não possui redução" }
          ]
        },
        {
          id: "mb_year",
          question: "Qual é o ano do Mercedes?",
          showIf: { brand: "mb" },
          options: [
            { value: "lt2017", label: "Abaixo de 2017 (< 2017) → EQ-1300" },
            { value: "ge2017", label: "2017 em diante → EQ-1251" }
          ]
        }
      ]
    }
  ],

  // CATÁLOGO GERAL DE PRODUTOS
  catalog: [
    { code: "EQ-110", internalCode: "760", ncm: "90318091", name: "Equalizador Traseiro 110 Libras", category: "equalizador", psi: 110, weight: 470, priceBase: 172.00, desc: "Equalizador para rodado duplo em 110 PSI." },
    { code: "EQ-115", internalCode: "761", ncm: "90318091", name: "Equalizador Traseiro 115 Libras", category: "equalizador", psi: 115, weight: 470, priceBase: 172.00, desc: "Modelo mais comum na linha pesada (115 PSI)." },
    { code: "EQ-120", internalCode: "762", ncm: "90318091", name: "Equalizador Traseiro 120 Libras", category: "equalizador", psi: 120, weight: 470, priceBase: 172.00, desc: "Para cargas pesadas e carretas (120 PSI)." },
    { code: "EQ-110D", internalCode: "110D", ncm: "90318091", name: "Equalizador Dianteiro 110 Libras", category: "equalizador", psi: 110, weight: 280, priceBase: 172.00, desc: "Para rodado simples dianteiro (110 PSI)." },
    { code: "EQ-115D", internalCode: "115D", ncm: "90318091", name: "Equalizador Dianteiro 115 Libras", category: "equalizador", psi: 115, weight: 280, priceBase: 172.00, desc: "Para eixo dianteiro direcional (115 PSI)." },
    { code: "EQ-120D", internalCode: "120D", ncm: "90318091", name: "Equalizador Dianteiro 120 Libras", category: "equalizador", psi: 120, weight: 280, priceBase: 172.00, desc: "Para eixo dianteiro direcional pesado (120 PSI)." },

    // Suportes
    { code: "EQ-1145", internalCode: "2346", ncm: "87082999", name: "Suporte Tração Universal / MB Truck", category: "suporte", weight: 300, priceBase: 22.00, desc: "Universal para tração: Volvo, MB, VW, Iveco, Ford." },
    { code: "EQ-1190", internalCode: "1065", ncm: "87082999", name: "Suporte Tração Scania", category: "suporte", weight: 300, priceBase: 22.00, desc: "Exclusivo para cubo de tração Scania (Série R, P, G, NTG)." },
    { code: "EQ-1135", internalCode: "2344", ncm: "87082999", name: "Suporte Universal Truck e Carreta", category: "suporte", weight: 300, priceBase: 22.00, desc: "Universal para todos os trucks e carretas/semirreboques." },
    { code: "EQ-1390", internalCode: "1783", ncm: "87082999", name: "Suporte Truck Scania Suspensão a Ar", category: "suporte", weight: 300, priceBase: 22.00, desc: "Obrigatório para Truck/Tração Scania com suspensão pneumática." },
    { code: "EQ-1271", internalCode: "1271", ncm: "87082999", name: "Suporte Tração Mercedes Cubo Redução", category: "suporte", weight: 300, priceBase: 22.00, desc: "Para caminhões Mercedes-Benz com redução no cubo." },
    { code: "EQ-1330", internalCode: "1494", ncm: "87082999", name: "Suporte Parafuso da Roda / Redução Volvo/Scania", category: "suporte", weight: 300, priceBase: 22.00, desc: "Fixação no parafuso da roda para Volvo/Scania com redução e pá carregadeira." },
    { code: "EQ-1251", internalCode: "1251", ncm: "87082999", name: "Suporte Dianteiro Universal / MB 2017+", category: "suporte", weight: 500, priceBase: 22.00, desc: "Universal dianteiro e Mercedes-Benz 2017 em diante." },
    { code: "EQ-1300", internalCode: "1302", ncm: "87082999", name: "Suporte Dianteiro Mercedes <2017", category: "suporte", weight: 500, priceBase: 22.00, desc: "Específico para Mercedes-Benz fabricados antes de 2017." },
    { code: "EQ-1250", internalCode: "1250", ncm: "87082999", name: "Suporte Dianteiro Scania e Volvo", category: "suporte", weight: 500, priceBase: 22.00, desc: "Específico para eixo dianteiro Scania e Volvo." },
    { code: "EQ-1155", internalCode: "2362", ncm: "87082999", name: "Suporte Tração 3/4 Universal (VW Delivery / MB)", category: "suporte", weight: 300, priceBase: 22.00, desc: "Suporte de tração universal para caminhões 3/4." },
    { code: "EQ-1320", internalCode: "1320", ncm: "87082999", name: "Suporte Dianteiro 3/4 Roda 17\"", category: "suporte", weight: 500, priceBase: 22.00, desc: "Para caminhão 3/4 com roda aro 17.5 polegadas." },
    { code: "EQ-1340", internalCode: "1574", ncm: "87082999", name: "Suporte Dianteiro 3/4 Roda 19\"", category: "suporte", weight: 500, priceBase: 22.00, desc: "Para caminhão 3/4 com roda aro 19.5 polegadas." },

    // Mangueiras
    { code: "EQ-1040", internalCode: "774", ncm: "90318099", name: "Mangueira Reta 410 mm (Pneu Interno)", category: "mangueira", weight: 105, priceBase: 30.00, desc: "Trinolada de alta pressão (420 PSI) para bico interno." },
    { code: "EQ-1043", internalCode: "1236", ncm: "90318099", name: "Mangueira Curva 320 mm (Pneu Externo)", category: "mangueira", weight: 105, priceBase: 30.00, desc: "Trinolada curva para bico externo do rodado duplo." },
    { code: "EQ-1041", internalCode: "1041", ncm: "90318099", name: "Mangueira Reta Fixa Dianteira", category: "mangueira", weight: 105, priceBase: 30.00, desc: "Ligação direta no equalizador dianteiro." },

    // Peças e Acessórios
    { code: "EQ-512", internalCode: "1239", ncm: "90318099", name: "Conexão Reta Giratória", category: "peca", weight: 45, priceBase: 11.50, desc: "Conexão giratória com vedação interna." },
    { code: "EQ-518", internalCode: "1249", ncm: "90318099", name: "Bico de Enchimento 70°", category: "peca", weight: 35, priceBase: 11.50, desc: "Bico de enchimento 70 graus para calibração rápida." },
    { code: "EQ-529", internalCode: "1389", ncm: "90318099", name: "Anel de Vedação Especial", category: "peca", weight: 2, priceBase: 0.40, desc: "Guarnição de vedação técnica." },
    { code: "EQ-602", internalCode: "2201", ncm: "90318099", name: "Extrator de Anel de Vedação", category: "ferramenta", weight: 80, priceBase: 35.00, desc: "Ferramenta para remoção de anéis." },
    { code: "EQ-1350", internalCode: "1585", ncm: "90318099", name: "Chave Alongada de Manutenção", category: "ferramenta", weight: 150, priceBase: 40.00, desc: "Chave alongada para mangueiras." },
    // Ferramentas e Kits Oficiais
    { code: "EQ-400", internalCode: "400", ncm: "90318099", name: "Kit Ferramenta Menor c/ Medidor", category: "ferramenta", weight: 600, priceBase: 995.00, desc: "Kit ferramenta menor com medidor calibrador." },
    { code: "EQ-600", internalCode: "600", ncm: "90318099", name: "Kit Ferramenta Maior", category: "ferramenta", weight: 800, priceBase: 1045.00, desc: "Kit ferramenta maior de instalação." },
    { code: "EQ-700", internalCode: "2218", ncm: "90318099", name: "Kit Ferramenta Maior c/ Medidor", category: "ferramenta", weight: 900, priceBase: 1425.00, desc: "Kit ferramenta maior com medidor calibrador de alta precisão." },
    { code: "EQ-545", internalCode: "2199", ncm: "90318099", name: "Kit Individual de Manutenção", category: "kit", weight: 500, priceBase: 120.00, desc: "Estojo com bicos, conexões e anéis." }
  ],

  // TRANSPORTADORAS
  transporters: [
    { code: "226", name: "TEx Encomendas", phone: "(44) 3221-1111", cleanPhone: "4432211111", coverage: "PR, SP, SC, RS, MS", fast: true },
    { code: "174", name: "São Miguel", phone: "(44) 3218-0200", cleanPhone: "4432180200", coverage: "Sul e Sudeste", fast: true },
    { code: "192", name: "Excellence", phone: "(44) 3126-3092", cleanPhone: "4431263092", coverage: "Nacional / Express", fast: false },
    { code: "363", name: "JWA Transportes", phone: "(44) 3253-5080", cleanPhone: "4432535080", coverage: "PR / SP / Centro-Oeste", fast: false },
    { code: "19", name: "Princesa dos Campos", phone: "(44) 3031-1536", cleanPhone: "4430311536", coverage: "PR, SC, SP", fast: true },
    { code: "187", name: "Alfa Transportes", phone: "(44) 3255-2101", cleanPhone: "4432552101", coverage: "Sul e Sudeste", fast: true },
    { code: "239", name: "RTE Rodonaves", phone: "(44) 3301-3000", cleanPhone: "4433013000", coverage: "Nacional (Líder SP/PR/MG/GO)", fast: true },
    { code: "221", name: "Braspress Transportes", phone: "(44) 2101-0700", cleanPhone: "4421010700", coverage: "Brasil Todo (100% Cidades)", fast: true },
    { code: "351", name: "Rodojaboti", phone: "(16) 3202-0996", cleanPhone: "1632020996", coverage: "SP / Interior", fast: false },
    { code: "378", name: "TAP Express", phone: "(44) 99141-4990", cleanPhone: "44991414990", coverage: "Cargas Expressas", fast: true },
    { code: "362", name: "Correios (Sedex / PAC)", phone: "(44) 99948-3200", cleanPhone: "44999483200", coverage: "Todo Brasil", fast: true },
    { code: "51", name: "Carvalima Transportes", phone: "(44) 99879-0408", cleanPhone: "44998790408", coverage: "MT, MS, RO, AC, PR", fast: true },
    { code: "344", name: "Tecmar Transportes", phone: "(44) 99919-1068", cleanPhone: "44999191068", coverage: "Sul e Sudeste", fast: true }
  ],

  // MODELOS DE MENSAGENS COMERCIAIS
  messageTemplates: [
    {
      id: "completar_frota",
      title: "🔄 1. Acompanhamento & Completar Instalação",
      category: "pos_venda",
      type: "whatsapp",
      subject: "Acompanhamento dos Equalizadores Olho de Gato — {empresa}",
      template: `Olá {nome}, tudo bem? Aqui é da *Olho de Gato Equalizadores de Pressão* 🐾.\n\nPassando para acompanhar os equipamentos instalados nos seus caminhões e saber se ainda ficou algum *cavalo, caminhão ou carreta no pátio* para terminarmos de instalar os kits!\n\nLembrando que quanto antes a frota estiver 100% equalizada, maior é a sua economia de pneus e diesel.\n\nQuantos veículos ainda faltam equipar para eu já separar os suportes aqui?`
    },
    {
      id: "pedido_indicacao",
      title: "🤝 2. Pedido de Indicação (Autônomos / Donos de Frota)",
      category: "indicacao",
      type: "whatsapp",
      subject: "Indicação de amigos frotistas e caminhoneiros",
      template: `Olá {nome}, tudo bem com você?\n\nComo você já conhece a qualidade e a durabilidade que o *Olho de Gato* proporciona nos pneus, queria te pedir uma ajuda rápida:\n\n👉 *Você tem 1 ou 2 amigos donos de caminhão (autônomos ou donos de frota) que também sofrem com desgaste irregular de pneus e que poderiam se beneficiar da nossa tecnologia?*\n\nSe puder me passar o contato deles, prometo atendê-los com uma condição super especial em seu nome! Obrigado pela parceria 🤝!`
    },
    {
      id: "abordagem_revenda",
      title: "🏪 3. Proposta para Revenda / Auto Peças / Borracharia",
      category: "revenda",
      type: "whatsapp",
      subject: "Condições Especiais de Revenda Olho de Gato para {empresa}",
      template: `Olá {nome}! Tudo bem?\n\nEntramos em contato para apresentar as condições exclusivas de *Revenda Autorizada Olho de Gato* para a *{empresa}*:\n\n⭐ *Preço Diferenciado de Revenda:* Equalizadores a R$ 157,00 e Suportes a R$ 20,00.\n📦 *Alta rotatividade na linha pesada:* Produto indispensável para caminhoneiros e frotistas da sua região.\n🛠️ *Suporte técnico direto de fábrica* e peças de reposição garantidas.\n\nPodemos montar um kit inicial de mostruário para a sua loja?`
    },
    {
      id: "envio_proposta",
      title: "📋 4. Envio de Proposta Comercial / Cotação",
      category: "proposta",
      type: "whatsapp",
      subject: "Proposta Comercial Olho de Gato — {empresa}",
      template: `Olá {nome}! Segue a especificação técnica e a proposta para a *{empresa}*:\n\n📋 *Projeto Dimensionado:* {veiculo}\n⚙️ *Calibragem:* {libras} Lbs\n💰 *Condição:* {condicao}\n\nO sistema já acompanha todos os equalizadores certificados, suportes específicos e mangueiras trinoladas de 420 PSI.\n\nFico no aguardo para formalizarmos o pedido!`
    }
  ],

  // STATUS DE LEADS
  leadStatuses: [
    { id: "novo", label: "Novo Lead", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
    { id: "contatado", label: "Contatado", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    { id: "proposta_enviada", label: "Proposta Enviada", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
    { id: "negociacao", label: "Em Negociação", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30" },
    { id: "fechado", label: "Venda Fechada 🏆", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    { id: "perdido", label: "Perdido / Standby", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" }
  ],

  // PRESETS DE TRANSCRIÇÃO DE IMAGEM / OCR
  ocrPresets: [
    { id: "nome_codigo", label: "Apenas Nome do Cliente e Código", prompt: "Extraia apenas o Nome do Cliente e o Código/ID de cada registro da imagem." },
    { id: "nome_telefone_cnpj", label: "Nome, Telefone e CNPJ", prompt: "Extraia o Nome do Cliente, Telefone/WhatsApp e CNPJ (se houver)." },
    { id: "completo_crm", label: "Completo (Nome, Empresa, Telefone, CNPJ, Cidade, Segmento)", prompt: "Extraia todos os dados disponíveis: Nome, Empresa, Telefone, CNPJ, Cidade/UF e Segmento da Operação." }
  ],

  // LEADS LIMPOS (INICIA VAZIO)
  sampleLeads: []
};
