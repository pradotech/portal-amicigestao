export const INITIAL_CLIENTS = [
  {
    id: 'drillex-company-3272538',
    corporateName: 'Drillex Indústria, Comércio e Serviços Ltda',
    tradeName: 'Drillex',
    cnpj: '12.845.920/0001-44',
    email: 'drilex.fin@amicigestao.com.br',
    phone: '(11) 98765-4321',
    segment: 'Indústria & Serviços',
    taxRegime: 'Lucro Presumido',
    financialAnalyst: 'Equipe Amici Gestão',
    planTier: 'BPO Gestão Financeira',
    monthlyFee: 4500.00,
    status: 'active',
    contaAzulStatus: 'connected',
    lastSync: 'Sincronizado via API V2',
    monthlyRevenue: 345800.00,
    monthlyExpense: 198200.00,
    cashBalance: 248900.00,
    pendingReconciliations: 2,
    payablesToday: 3,
    color: '#0077B6',
    isBpoClient: true
  }
]

export const INITIAL_BANK_ACCOUNTS = [
  {
    id: 'ba-drillex-01',
    clientId: 'drillex-company-3272538',
    bankName: 'Banco Itaú Unibanco',
    bankCode: '341',
    agency: '1420',
    accountNumber: '48291-5',
    accountType: 'Conta Corrente PJ',
    balance: 184350.00,
    lastSync: 'Hoje via API Oficial'
  },
  {
    id: 'ba-drillex-02',
    clientId: 'drillex-company-3272538',
    bankName: 'Banco Inter PJ',
    bankCode: '077',
    agency: '0001',
    accountNumber: '9283741-2',
    accountType: 'Conta Digital',
    balance: 64550.00,
    lastSync: 'Hoje via API Oficial'
  }
]

// CONTAS A PAGAR DISTRIBUÍDAS EM MÚLTIPLOS MESES E DIAS
export const INITIAL_PAYABLES = [
  // ================= SETEMBRO 2026 (MÊS ATUAL) =================
  {
    id: 'pay-sep-01',
    clientId: 'drillex-company-3272538',
    supplier: 'RODOALTO TRANSPORTES RODOVIARIOS',
    category: 'Logística & Fretes',
    description: 'Frete Carreta Equipamentos Industriais',
    amount: 24500.00,
    dueDate: '2026-09-04',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.00000 00000.100000 00000.000000 1 98450002450000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-02',
    clientId: 'drillex-company-3272538',
    supplier: 'AIRLINK TELECOMUNICACOES & FIBRA',
    category: 'Infraestrutura & Telefonia',
    description: 'Link Dedicado Fibra Óptica 1Gbps',
    amount: 8900.00,
    dueDate: '2026-09-08',
    status: 'paid',
    bankAccount: 'Banco Inter PJ',
    barcode: '07790.00000 00000.200000 00000.000000 2 98450000890000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-03',
    clientId: 'drillex-company-3272538',
    supplier: 'AIGNEP DO BRASIL PRODUTOS PNEUMATICOS',
    category: 'Insumos & Matéria Prima',
    description: 'Válvulas e Conexões Pneumáticas de Alta Pressão',
    amount: 31400.00,
    dueDate: '2026-09-12',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.00000 00000.300000 00000.000000 3 98450003140000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-04',
    clientId: 'drillex-company-3272538',
    supplier: 'Enel Distribuição São Paulo',
    category: 'Energia Elétrica & Utilidades',
    description: 'Conta de Energia Pavilhão Industrial',
    amount: 4210.80,
    dueDate: '2026-09-23',
    status: 'overdue',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '83610000042 1 10800072026 8 09230000000 1 00000000000 0',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-05',
    clientId: 'drillex-company-3272538',
    supplier: 'Distribuidora Hortifruti & Carnes Prime',
    category: 'Insumos & Refeitório',
    description: 'Fornecimento Refeitório Fábrica Quinzena 02',
    amount: 8950.40,
    dueDate: '2026-09-23',
    status: 'scheduled',
    bankAccount: 'Banco Inter PJ',
    barcode: '03399.82190 12044.821039 12390.100021 4 98440000895040',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-06',
    clientId: 'drillex-company-3272538',
    supplier: 'RODOALTO TRANSPORTES RODOVIARIOS',
    category: 'Logística & Fretes',
    description: 'Frete Expresso Entrega Perfuratriz Campinas',
    amount: 18320.00,
    dueDate: '2026-09-23',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.00000 00000.400000 00000.000000 4 98450001832000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-07',
    clientId: 'drillex-company-3272538',
    supplier: 'Amazon Web Services (AWS)',
    category: 'Infraestrutura Cloud & Servidores',
    description: 'Servidores de Telemetria e IoT das Sondas',
    amount: 14850.20,
    dueDate: '2026-09-24',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.79001 01043.510047 91020.150008 8 98450001485020',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-08',
    clientId: 'drillex-company-3272538',
    supplier: 'Google Workspace & Gemini API',
    category: 'Softwares & Ferramentas',
    description: 'Licenças Corporativas e IA Operacional',
    amount: 3420.00,
    dueDate: '2026-09-25',
    status: 'pending_client',
    bankAccount: 'Banco Inter PJ',
    barcode: '23793.38128 60083.001923 88000.643209 1 98460000342000',
    approvalStatus: 'pending',
    hasAttachment: true
  },
  {
    id: 'pay-sep-09',
    clientId: 'drillex-company-3272538',
    supplier: 'Dental Cremer / Segurança do Trabalho',
    category: 'EPI & Saúde Ocupacional',
    description: 'Equipamentos de Proteção Individual e Exames',
    amount: 6730.00,
    dueDate: '2026-09-26',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.10920 44021.902194 88120.940002 9 98450000673000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-sep-10',
    clientId: 'drillex-company-3272538',
    supplier: 'Gerdau Aços e Perfis SA',
    category: 'Matéria Prima / Obras',
    description: 'Tubos de Aço Liga Especial para Perfuração',
    amount: 54300.00,
    dueDate: '2026-09-28',
    status: 'pending_client',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.88410 90123.491024 10294.500018 7 98440005430000',
    approvalStatus: 'pending',
    hasAttachment: true
  },
  {
    id: 'pay-sep-11',
    clientId: 'drillex-company-3272538',
    supplier: 'Receita Federal do Brasil',
    category: 'Impostos & Tributos',
    description: 'DARF IRPJ / CSLL Quota Mensal Drillex',
    amount: 22618.60,
    dueDate: '2026-09-30',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '85890000226 0 00000179260 9 24090000000 3 00000000000 0',
    approvalStatus: 'approved',
    hasAttachment: true
  },

  // ================= AGOSTO 2026 (MÊS ANTERIOR) =================
  {
    id: 'pay-aug-01',
    clientId: 'drillex-company-3272538',
    supplier: 'RODOALTO TRANSPORTES RODOVIARIOS',
    category: 'Logística & Fretes',
    description: 'Frete Operação Nordeste',
    amount: 22800.00,
    dueDate: '2026-08-05',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.08000 00000.100000 00000.000000 1 98450002280000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-02',
    clientId: 'drillex-company-3272538',
    supplier: 'AIRLINK TELECOMUNICACOES & FIBRA',
    category: 'Infraestrutura & Telefonia',
    description: 'Link Dedicado Mês 08/2026',
    amount: 8900.00,
    dueDate: '2026-08-08',
    status: 'paid',
    bankAccount: 'Banco Inter PJ',
    barcode: '07790.08000 00000.200000 00000.000000 2 98450000890000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-03',
    clientId: 'drillex-company-3272538',
    supplier: 'AIGNEP DO BRASIL PRODUTOS PNEUMATICOS',
    category: 'Insumos & Matéria Prima',
    description: 'Reposição Conexões e Mangueiras Industriais',
    amount: 28600.00,
    dueDate: '2026-08-12',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.08000 00000.300000 00000.000000 3 98450002860000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-04',
    clientId: 'drillex-company-3272538',
    supplier: 'Enel Distribuição São Paulo',
    category: 'Energia Elétrica & Utilidades',
    description: 'Energia Elétrica Fabril Mês 08/2026',
    amount: 4150.00,
    dueDate: '2026-08-20',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '83610000041 1 10800072026 8 08200000000 1 00000000000 0',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-05',
    clientId: 'drillex-company-3272538',
    supplier: 'Amazon Web Services (AWS)',
    category: 'Infraestrutura Cloud & Servidores',
    description: 'Cloud AWS Mês 08/2026',
    amount: 13920.00,
    dueDate: '2026-08-24',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.79001 01043.510047 91020.150008 8 98450001392000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-06',
    clientId: 'drillex-company-3272538',
    supplier: 'Gerdau Aços e Perfis SA',
    category: 'Matéria Prima / Obras',
    description: 'Vigas e Tubulões Mês 08/2026',
    amount: 48500.00,
    dueDate: '2026-08-27',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.88410 90123.491024 10294.500018 7 98440004850000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-07',
    clientId: 'drillex-company-3272538',
    supplier: 'Receita Federal do Brasil',
    category: 'Impostos & Tributos',
    description: 'DARF IRPJ / CSLL Mês 08/2026',
    amount: 38230.00,
    dueDate: '2026-08-30',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '85890000382 0 00000179260 9 24080000000 3 00000000000 0',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-aug-08',
    clientId: 'drillex-company-3272538',
    supplier: 'Distribuidora Hortifruti & Manutenção',
    category: 'Manutenção Predial & Refeitório',
    description: 'Manutenção Preventiva de Compressores',
    amount: 17000.00,
    dueDate: '2026-08-31',
    status: 'paid',
    bankAccount: 'Banco Inter PJ',
    barcode: '07790.08000 00000.800000 00000.000000 8 98450001700000',
    approvalStatus: 'approved',
    hasAttachment: true
  },

  // ================= JULHO 2026 =================
  {
    id: 'pay-jul-01',
    clientId: 'drillex-company-3272538',
    supplier: 'RODOALTO TRANSPORTES RODOVIARIOS',
    category: 'Logística & Fretes',
    description: 'Frete Operação Sul',
    amount: 21500.00,
    dueDate: '2026-07-06',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.07000 00000.100000 00000.000000 1 98450002150000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-jul-02',
    clientId: 'drillex-company-3272538',
    supplier: 'AIGNEP DO BRASIL',
    category: 'Insumos & Matéria Prima',
    description: 'Kits Vedação Hidráulica',
    amount: 32800.00,
    dueDate: '2026-07-14',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.07000 00000.200000 00000.000000 2 98450003280000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-jul-03',
    clientId: 'drillex-company-3272538',
    supplier: 'Gerdau Aços e Perfis SA',
    category: 'Matéria Prima / Obras',
    description: 'Tubulações e Hastes de Perfuração',
    amount: 51200.00,
    dueDate: '2026-07-22',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.07000 00000.300000 00000.000000 3 98450005120000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-jul-04',
    clientId: 'drillex-company-3272538',
    supplier: 'Receita Federal do Brasil',
    category: 'Impostos & Tributos',
    description: 'DARF Impostos Trimestrais Julho',
    amount: 35600.00,
    dueDate: '2026-07-30',
    status: 'paid',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '85890000356 0 00000179260 9 24070000000 3 00000000000 0',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-jul-05',
    clientId: 'drillex-company-3272538',
    supplier: 'Utilidades & TI Consolidado',
    category: 'Despesas Administrativas',
    description: 'Energia, AWS, Telecomunicações Julho',
    amount: 33400.00,
    dueDate: '2026-07-31',
    status: 'paid',
    bankAccount: 'Banco Inter PJ',
    barcode: '07790.07000 00000.500000 00000.000000 5 98450003340000',
    approvalStatus: 'approved',
    hasAttachment: true
  },

  // ================= OUTUBRO 2026 (PROJEÇÃO) =================
  {
    id: 'pay-oct-01',
    clientId: 'drillex-company-3272538',
    supplier: 'RODOALTO TRANSPORTES RODOVIARIOS',
    category: 'Logística & Fretes',
    description: 'Programação Fretes Outubro 2026',
    amount: 26000.00,
    dueDate: '2026-10-06',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.10000 00000.100000 00000.000000 1 98450002600000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-oct-02',
    clientId: 'drillex-company-3272538',
    supplier: 'AIGNEP DO BRASIL',
    category: 'Insumos & Matéria Prima',
    description: 'Lote Conexões Especiais Drillex',
    amount: 34500.00,
    dueDate: '2026-10-14',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.10000 00000.200000 00000.000000 2 98450003450000',
    approvalStatus: 'approved',
    hasAttachment: true
  },
  {
    id: 'pay-oct-03',
    clientId: 'drillex-company-3272538',
    supplier: 'Gerdau Aços e Perfis SA',
    category: 'Matéria Prima / Obras',
    description: 'Contrato Fornecimento Aço Estrutural',
    amount: 58000.00,
    dueDate: '2026-10-25',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '34191.10000 00000.300000 00000.000000 3 98450005800000',
    approvalStatus: 'pending',
    hasAttachment: true
  },
  {
    id: 'pay-oct-04',
    clientId: 'drillex-company-3272538',
    supplier: 'Receita Federal & Folha Estimada',
    category: 'Impostos & Folha',
    description: 'Provisão Tributos e Encargos Outubro',
    amount: 86500.00,
    dueDate: '2026-10-30',
    status: 'scheduled',
    bankAccount: 'Banco Itaú Unibanco',
    barcode: '85890000865 0 00000179260 9 24100000000 3 00000000000 0',
    approvalStatus: 'pending',
    hasAttachment: true
  }
]

// CONTAS A RECEBER DISTRIBUÍDAS EM MÚLTIPLOS MESES E DIAS
export const INITIAL_RECEIVABLES = [
  // ================= SETEMBRO 2026 (MÊS ATUAL) =================
  {
    id: 'rec-sep-01',
    clientId: 'drillex-company-3272538',
    customer: 'ADRIELI DISTRIBUICAO LTDA',
    category: 'Venda de Equipamentos & Peças',
    description: 'Contrato Fornecimento Trados e Brocas Especiais',
    amount: 48500.00,
    dueDate: '2026-09-05',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5821'
  },
  {
    id: 'rec-sep-02',
    clientId: 'drillex-company-3272538',
    customer: 'ADORO-AD ORO ALIMENTOS SA',
    category: 'Serviços de Perfuração Industrial',
    description: 'Perfuração e Sondagem Unidade Fabril 03',
    amount: 62300.00,
    dueDate: '2026-09-10',
    status: 'received',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4910'
  },
  {
    id: 'rec-sep-03',
    clientId: 'drillex-company-3272538',
    customer: 'FINTECH NEXUS BRASIL LTDA',
    category: 'Locação de Maquinário',
    description: 'Locação Mensal Conjunto Moto-Bomba & Perfuratriz',
    amount: 54000.00,
    dueDate: '2026-09-15',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5822'
  },
  {
    id: 'rec-sep-04',
    clientId: 'drillex-company-3272538',
    customer: 'LOGISTICA EXPRESS GLOBAL SA',
    category: 'Engenharia e Laudos Geotécnicos',
    description: 'Laudo Geotécnico e Sondagem SPT de Solo',
    amount: 38500.00,
    dueDate: '2026-09-23',
    status: 'received',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4919'
  },
  {
    id: 'rec-sep-05',
    clientId: 'drillex-company-3272538',
    customer: 'AGIS EQUIPAMENTOS INDUSTRIAIS',
    category: 'Venda de Peças de Reposição',
    description: 'Hastes de Extensão e Coroas Diamantadas',
    amount: 26400.00,
    dueDate: '2026-09-23',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5824'
  },
  {
    id: 'rec-sep-06',
    clientId: 'drillex-company-3272538',
    customer: 'CONVENIO BRASIL INFRAESTRUTURA',
    category: 'Serviços de Perfuração',
    description: 'Perfuração de Poços de Monitoramento',
    amount: 32100.00,
    dueDate: '2026-09-24',
    status: 'pending',
    paymentMethod: 'Transferência Bancária',
    invoiceNumber: 'NFS-e 4920'
  },
  {
    id: 'rec-sep-07',
    clientId: 'drillex-company-3272538',
    customer: 'GRUPO IMOBILIARIO ALPHAVILLE',
    category: 'Medição de Obras Geotécnicas',
    description: 'Medição 03 - Sondagens de Solo Condomínio Alpha Park',
    amount: 45000.00,
    dueDate: '2026-09-26',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5826'
  },
  {
    id: 'rec-sep-08',
    clientId: 'drillex-company-3272538',
    customer: 'METALURGICA DRILLMAX SP',
    category: 'Venda de Máquinas e Equipamentos',
    description: 'Equipamento Perfuratriz Hidráulica Série Pro',
    amount: 39000.00,
    dueDate: '2026-09-29',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5827'
  },

  // ================= AGOSTO 2026 (MÊS ANTERIOR) =================
  {
    id: 'rec-aug-01',
    clientId: 'drillex-company-3272538',
    customer: 'ADRIELI DISTRIBUICAO LTDA',
    category: 'Venda de Equipamentos & Peças',
    description: 'Fornecimento Brocas Especiais Mês 08/2026',
    amount: 45000.00,
    dueDate: '2026-08-05',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5780'
  },
  {
    id: 'rec-aug-02',
    clientId: 'drillex-company-3272538',
    customer: 'ADORO-AD ORO ALIMENTOS SA',
    category: 'Serviços de Perfuração Industrial',
    description: 'Perfuração Base Tanques Mês 08/2026',
    amount: 58000.00,
    dueDate: '2026-08-12',
    status: 'received',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4870'
  },
  {
    id: 'rec-aug-03',
    clientId: 'drillex-company-3272538',
    customer: 'FINTECH NEXUS BRASIL LTDA',
    category: 'Locação de Maquinário',
    description: 'Locação Mensal Drillex Mês 08/2026',
    amount: 52000.00,
    dueDate: '2026-08-18',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5785'
  },
  {
    id: 'rec-aug-04',
    clientId: 'drillex-company-3272538',
    customer: 'LOGISTICA EXPRESS GLOBAL SA',
    category: 'Engenharia e Laudos Geotécnicos',
    description: 'Sondagem Solo Galpão Logístico',
    amount: 36000.00,
    dueDate: '2026-08-22',
    status: 'received',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4882'
  },
  {
    id: 'rec-aug-05',
    clientId: 'drillex-company-3272538',
    customer: 'GRUPO IMOBILIARIO ALPHAVILLE',
    category: 'Medição de Obras Geotécnicas',
    description: 'Medição 02 - Obras Fase 1 Alpha Park',
    amount: 74500.00,
    dueDate: '2026-08-28',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5790'
  },
  {
    id: 'rec-aug-06',
    clientId: 'drillex-company-3272538',
    customer: 'METALURGICA DRILLMAX SP',
    category: 'Venda de Máquinas e Equipamentos',
    description: 'Lote Peças Perfuratriz Série Standard',
    amount: 52900.00,
    dueDate: '2026-08-30',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5795'
  },

  // ================= JULHO 2026 =================
  {
    id: 'rec-jul-01',
    clientId: 'drillex-company-3272538',
    customer: 'ADRIELI DISTRIBUICAO LTDA',
    category: 'Venda de Equipamentos & Peças',
    description: 'Fornecimento Trados Julho/2026',
    amount: 42000.00,
    dueDate: '2026-07-08',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5720'
  },
  {
    id: 'rec-jul-02',
    clientId: 'drillex-company-3272538',
    customer: 'ADORO-AD ORO ALIMENTOS SA',
    category: 'Serviços de Perfuração Industrial',
    description: 'Sondagem Unidade 01 Julho/2026',
    amount: 55000.00,
    dueDate: '2026-07-15',
    status: 'received',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4810'
  },
  {
    id: 'rec-jul-03',
    clientId: 'drillex-company-3272538',
    customer: 'FINTECH NEXUS BRASIL LTDA',
    category: 'Locação de Maquinário',
    description: 'Locação Maquinário Julho/2026',
    amount: 50000.00,
    dueDate: '2026-07-20',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5725'
  },
  {
    id: 'rec-jul-04',
    clientId: 'drillex-company-3272538',
    customer: 'GRUPO IMOBILIARIO ALPHAVILLE',
    category: 'Medição de Obras Geotécnicas',
    description: 'Medição 01 - Alpha Park',
    amount: 78600.00,
    dueDate: '2026-07-28',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5730'
  },
  {
    id: 'rec-jul-05',
    clientId: 'drillex-company-3272538',
    customer: 'LOGISTICA & DRILLMAX CONSOLIDADO',
    category: 'Serviços & Peças',
    description: 'Serviços Técnicos e Reposições Julho',
    amount: 70000.00,
    dueDate: '2026-07-30',
    status: 'received',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5735'
  },

  // ================= OUTUBRO 2026 (PROJEÇÃO) =================
  {
    id: 'rec-oct-01',
    clientId: 'drillex-company-3272538',
    customer: 'ADRIELI DISTRIBUICAO LTDA',
    category: 'Venda de Equipamentos & Peças',
    description: 'Pedido Programado Outubro 2026',
    amount: 52000.00,
    dueDate: '2026-10-05',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5850'
  },
  {
    id: 'rec-oct-02',
    clientId: 'drillex-company-3272538',
    customer: 'ADORO-AD ORO ALIMENTOS SA',
    category: 'Serviços de Perfuração Industrial',
    description: 'Contrato Manutenção Sondas e Perfuração',
    amount: 68000.00,
    dueDate: '2026-10-12',
    status: 'pending',
    paymentMethod: 'PIX Direto',
    invoiceNumber: 'NFS-e 4950'
  },
  {
    id: 'rec-oct-03',
    clientId: 'drillex-company-3272538',
    customer: 'FINTECH NEXUS BRASIL LTDA',
    category: 'Locação de Maquinário',
    description: 'Locação Maquinário Outubro 2026',
    amount: 56000.00,
    dueDate: '2026-10-18',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5855'
  },
  {
    id: 'rec-oct-04',
    clientId: 'drillex-company-3272538',
    customer: 'GRUPO IMOBILIARIO ALPHAVILLE',
    category: 'Medição de Obras Geotécnicas',
    description: 'Medição 04 - Obras Alpha Park',
    amount: 88000.00,
    dueDate: '2026-10-25',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5860'
  },
  {
    id: 'rec-oct-05',
    clientId: 'drillex-company-3272538',
    customer: 'METALURGICA DRILLMAX & LOGISTICA',
    category: 'Venda de Máquinas e Equipamentos',
    description: 'Entrega Perfuratriz Pesada Outubro',
    amount: 98000.00,
    dueDate: '2026-10-29',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: 'NF-e 5865'
  }
]

export const INITIAL_BANK_TRANSACTIONS = [
  {
    id: 'tx-001',
    clientId: 'drillex-company-3272538',
    date: '2026-09-23',
    description: 'PIX RECEBIDO LOGISTICA EXPRESS GLOBAL SA',
    amount: 38500.00,
    type: 'credit',
    bank: 'Banco Itaú Unibanco',
    isReconciled: true,
    matchedEntity: 'NFS-e 4919 - Logística Express'
  },
  {
    id: 'tx-002',
    clientId: 'drillex-company-3272538',
    date: '2026-09-23',
    description: 'PAGTO ELETRONICO RODOALTO TRANSPORTES',
    amount: -18320.00,
    type: 'debit',
    bank: 'Banco Itaú Unibanco',
    isReconciled: false,
    suggestedMatch: 'Rodoalto Transportes - Frete Expresso Campinas'
  },
  {
    id: 'tx-003',
    clientId: 'drillex-company-3272538',
    date: '2026-09-22',
    description: 'TARIFA BANCARIA PACOTE EMPRESARIAL ITAU',
    amount: -149.90,
    type: 'debit',
    bank: 'Banco Itaú Unibanco',
    isReconciled: false,
    suggestedMatch: 'Tarifas Bancárias e Encargos (Classificação Automática)'
  },
  {
    id: 'tx-004',
    clientId: 'drillex-company-3272538',
    date: '2026-09-15',
    description: 'TED RECEBIDA FINTECH NEXUS BRASIL LTDA',
    amount: 54000.00,
    type: 'credit',
    bank: 'Banco Itaú Unibanco',
    isReconciled: true,
    matchedEntity: 'NF-e 5822 - Fintech Nexus'
  }
]

export const CASH_FLOW_CHART_DATA = [
  { month: 'Jun', entradas: 280000, saidas: 168000, saldo: 112000 },
  { month: 'Jul', entradas: 295600, saidas: 174500, saldo: 121100 },
  { month: 'Ago', entradas: 318400, saidas: 182100, saldo: 136300 },
  { month: 'Set (Atual)', entradas: 345800, saidas: 198200, saldo: 147600 },
  { month: 'Out (Proj.)', entradas: 362000, saidas: 205000, saldo: 157000 },
  { month: 'Nov (Proj.)', entradas: 375000, saidas: 210000, saldo: 165000 }
]

export const DRE_DATA = {
  grossRevenue: 345800.00,
  taxes: 29393.00, // ~8.5%
  netRevenue: 316407.00,
  cogs: 118400.00, // Custo Serviços/Insumos
  grossProfit: 198007.00,
  operationalExpenses: {
    payroll: 52400.00,
    marketing: 6900.00,
    administrative: 14500.00,
    softwareTech: 8200.00,
    financialCharges: 3800.00
  },
  ebitda: 112207.00,
  netIncome: 98500.00
}
