# Portal Amici - BPO Gestão Financeira

Portal completo de gestão financeira para a **Amici Gestão Financeira (BPO)** com sincronização e integração com a **API da Conta Azul**, interface desenvolvida em **React JS**, estilizada com **Tailwind CSS** e banco de dados **Supabase**.

---

## 🚀 Tecnologias Utilizadas

- **React 19 & Vite**: Interface moderna, ágil e reativa.
- **Tailwind CSS v4**: Design system refinado com a identidade visual da Amici (Azul Marinho, Ciano e Dark Mode executivo).
- **Supabase**: Banco de dados PostgreSQL com script de tabelas, RLS e autenticação.
- **Conta Azul API (OAuth 2.0)**: Camada de integração para importação de clientes, bancos, contas a pagar, contas a receber e conciliação bancária.
- **Recharts**: Gráficos analíticos de fluxo de caixa realizado vs. projetado e composição de custos.
- **Lucide Icons**: Ícones modernos e consistentes.

---

## 📂 Estrutura do Projeto

- [`src/components/AmiciLogo.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/components/AmiciLogo.jsx): Logo oficial e vetorizado da Amici Gestão Financeira.
- [`src/views/DashboardView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/DashboardView.jsx): Dashboard BPO com KPIs consolidados, alertas do dia e gráficos.
- [`src/views/ClientsView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/ClientsView.jsx): Gestão da carteira de clientes, status dos tokens Conta Azul e cadastro de novas empresas.
- [`src/views/PayablesView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/PayablesView.jsx): Contas a pagar, emissão de borderôs e cópia de linhas digitáveis de boletos.
- [`src/views/ReceivablesView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/ReceivablesView.jsx): Contas a receber, controle de faturamento e régua de cobrança.
- [`src/views/ReconciliationView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/ReconciliationView.jsx): Central de conciliação bancária inteligente com match em 1 clique.
- [`src/views/DreReportsView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/DreReportsView.jsx): DRE Gerencial analítico e sintético (Margem Bruta, EBITDA e Lucro Líquido).
- [`src/views/ContaAzulSyncView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/ContaAzulSyncView.jsx): Monitor da API Conta Azul, autorização OAuth2 e sincronizador.
- [`src/views/ClientPortalView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/ClientPortalView.jsx): Visão dedicada exclusiva para o cliente final da Amici aprovar pagamentos e acompanhar a saúde financeira.
- [`src/views/SettingsView.jsx`](file:///Users/caioprado/Desktop/works/portal-amici/src/views/SettingsView.jsx): Configurações do Supabase e Conta Azul com testador de conexão em tempo real.
- [`supabase/schema.sql`](file:///Users/caioprado/Desktop/works/portal-amici/supabase/schema.sql): Script SQL pronto para executar no Supabase.

---

## ⚙️ Como Executar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra no navegador: `http://localhost:5173`

---

## 🗄️ Configuração do Banco Supabase

1. Acesse seu painel no [Supabase](https://supabase.com).
2. Abra o **SQL Editor**.
3. Copie e execute o conteúdo do arquivo [`supabase/schema.sql`](file:///Users/caioprado/Desktop/works/portal-amici/supabase/schema.sql) (ou utilize o botão "Copiar SQL" na aba de Configurações do Portal).
4. No Portal Amici, acesse a aba **Configurações & Supabase** e informe sua URL e Chave Anon.
