# 🐾 PetShop Pro Enterprise - Sistema de Gestão Empresarial, Estética Animal & Clínica

<p align="center">
  <img src="frontend/public/logo.png" width="120" alt="PetShop Pro Logo" />
</p>

<p align="center">
  <strong>Solução Completa Local-First (SaaS Local) para Pet Shops, Clínicas Veterinárias e Centros de Estética Animal</strong><br>
  <em>100% autônomo, sem mensalidades de servidores em nuvem, com proteção de dados, backup de hora a hora e controle integrado de licenças comerciais.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versão-2.0.0-7c3aed?style=for-the-badge" alt="Versão 2.0.0" />
  <img src="https://img.shields.io/badge/Arquitetura-Local--First%20PWA-059669?style=for-the-badge" alt="Local First" />
  <img src="https://img.shields.io/badge/Banco%20de%20Dados-SQLite%20ACID%20%2B%20Postgres-0284c7?style=for-the-badge" alt="SQLite & Postgres" />
  <img src="https://img.shields.io/badge/Backup-Google%20Drive%20Sync-d97706?style=for-the-badge" alt="Google Drive Sync" />
  <img src="https://img.shields.io/badge/Licença-HMAC--SHA256%20Offline-dc2626?style=for-the-badge" alt="Licença HMAC" />
</p>

---

## ⚡ Instalação Rápida (1 Comando)

### 🪟 No Windows:
1. Baixe ou clone o repositório em uma pasta do computador.
2. Dê **dois cliques** no arquivo `instalar.bat` (ou execute pelo terminal):
```cmd
git clone https://github.com/AdrianoDBA/petshop-app.git
cd petshop-app
instalar.bat
```
*O instalador baixa as dependências, compila o frontend, cria o atalho oficial **"PetShop Pro" na Área de Trabalho** e inicia o sistema imediatamente.*

### 🍎 No macOS e Linux:
Execute no terminal:
```bash
git clone https://github.com/AdrianoDBA/petshop-app.git
cd petshop-app
chmod +x instalar.sh iniciar.command
./instalar.sh
```

---

## 🖥️ Modo Janela de Aplicativo Dedicado (PWA Standalone)

O PetShop Pro foi projetado para **não parecer uma página web**:
- Ao abrir pelo atalho `iniciar.bat` ou `iniciar.command`, ele executa em modo **aplicativo independente** (`--app=http://localhost:3001`), **sem barra de endereço, sem abas e sem botões de navegação**.
- Você também pode clicar no botão **"📲 Instalar App"** no canto superior direito para fixar o aplicativo nativo no Windows, Mac, iPad ou celular Android/iOS.

---

## 🧙 Assistente de Primeira Execução (Onboarding de Loja Limpa)

Ao ligar o sistema pela primeira vez, o assistente inteligente conduz o proprietário em 4 passos rápidos:
1. **Dados da Loja**: Nome fantasia, CNPJ/CPF, WhatsApp oficial, e-mail e endereço.
2. **Conta Administradora**: Criação do login e senha do proprietário.
3. **Catálogo Inicial**: Opção de importar catálogo pré-configurado (Banho, Tosa Higiênica, Tosa Completa, Consulta Vet, Vacina) ou cadastrar do zero.
4. **Ativação da Licença**: Inserção da chave comercial fornecida ou início imediato de **15 dias de Avaliação Gratuita (Trial)**.

---

## 💾 Backups Automáticos de Hora em Hora com Google Drive

Proteção patrimonial completa dos dados da loja:
* **Frequência Customizável**: De hora em hora (padrão), a cada 6h, diário no fechamento (23:00) ou sob demanda.
* **Integridade Transacional (ACID)**: Snapshots gerados via `VACUUM INTO` do SQLite para garantir zero risco de corrupção de dados.
* **Sincronização em Nuvem Gratuita**: Basta apontar a pasta de destino para a pasta sincronizada do **Google Drive para Computador** ou **OneDrive** (ex: `G:\Meu Drive\Backups_PetShop`). A cada 60 minutos, um arquivo `.zip` é salvo e sincronizado na nuvem.
* **Download com 1 Clique**: Tabela com histórico de backups e download direto pela interface em **Gestão > Backups & Nuvem**.

---

## 🔑 Controle e Emissão de Licenças Comerciais

O software possui motor de validação criptográfica offline **HMAC-SHA256**. O cliente não precisa estar conectado à internet para o software validar a licença.

### Como o Vendedor / Administrador Gera Chaves para Clientes:

No terminal, execute o gerador utilitário:

```bash
# Licença Mensal (30 dias)
node backend/scripts/gerar-licenca.js --cliente "Pet Shop Patinhas de Ouro" --dias 30

# Licença Anual (365 dias)
node backend/scripts/gerar-licenca.js --cliente "Clínica PetVida" --dias 365 --tipo anual --doc "12.345.678/0001-90"

# Licença Vitalícia
node backend/scripts/gerar-licenca.js --cliente "Pet Shop Central" --tipo vitalicio
```

### Como Auditar / Verificar uma Chave de Licença:
```bash
node backend/scripts/verificar-licenca.js "TOKEN_DA_CHAVE"
```

* **Avisos Prévios**: Faltando 7 dias ou menos para a expiração, um aviso amarelo elegante surge no topo do software alertando o cliente com botão para renovar via WhatsApp.
* **Bloqueio de Segurança**: Se o plano expirar, a criação de novas vendas e agendamentos é travada graciosamente até a entrada da nova chave, mantendo os dados intactos para consulta.

---

## 📋 Módulos Inclusos no Sistema

| Módulo | Descrição das Funcionalidades |
| :--- | :--- |
| 📊 **Dashboard Executivo** | Métricas financeiras em tempo real, atendimentos do dia, alertas de vacina e produtos em baixa. |
| 📅 **Agenda Inteligente** | Banho, tosa, veterinária, prevenção de sobreposição de horários e bloqueio de atendimento prematuro. |
| 🌐 **Portal de Auto-Agendamento** | Link público para os tutores agendarem banho e consulta diretamente pelo celular. |
| 🛒 **Frente de Caixa (PDV)** | Venda ágil de produtos e serviços, controle de formas de pagamento e emissão de **Recibos em PDF**. |
| 🔁 **Pacotes & Assinaturas** | Planos quinzenais e mensais (ex: 4 banhos/mês) com controle automático de sessões restantes. |
| 🩺 **Clínica & Prontuários** | Registro anamnese, peso, histórico clínico, prescrições e controle de vacinação com reforço. |
| 💬 **WhatsApp & Lembretes** | Envio de mensagens prontas para confirmação de agendamento e aviso de pet pronto para retirada. |
| 📦 **Estoque & Validade** | Baixa automática atômica, controle de lotes, datas de vencimento e reposição mínima. |
| 💰 **Comissões da Equipe** | Rateio configurável de comissões por profissional (tosador, veterinário, banhista). |
| 🔒 **Usuários & Permissões** | Perfis de acesso rígidos (Admin, Gerente, Atendente, Veterinário, Tosador). |
| 💾 **Backups & Nuvem** | Snapshots automatizados hora a hora com suporte a Google Drive. |
| 🔑 **Licença & Assinatura** | Painel de controle de expiração, dias restantes e ativação com 1 clique. |

---

## 🧹 Preparar o Sistema para um Novo Cliente

Antes de entregar uma nova máquina ou enviar a pasta para um cliente, execute o comando de limpeza:

```bash
node backend/scripts/preparar-entrega.js
```
*Isso limpa todos os dados de simulação e deixa o banco 100% zerado para acionar o Assistente de Onboarding na primeira abertura.*

---

## 🧪 Testes Automatizados

O sistema conta com suíte de testes com **100% de aprovação (61 testes em 17 suítes)**:

```bash
cd backend
npm test
```

---

<p align="center">
  Desenvolvido com excelência técnica para o mercado pet brasileiro.<br>
  <strong>PetShop Pro Enterprise © 2026</strong>
</p>
