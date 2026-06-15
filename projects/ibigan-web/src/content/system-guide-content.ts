import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Columns3,
  Globe,
  Keyboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  Shield,
  Table2,
  Users,
  Zap,
} from 'lucide-react';

export type GuideLocale = 'pt' | 'en';

export type GuideBlock = {
  title?: Record<GuideLocale, string>;
  text?: Record<GuideLocale, string>;
  items?: Record<GuideLocale, string>[];
};

export type GuideSection = {
  id: string;
  icon: LucideIcon;
  title: Record<GuideLocale, string>;
  summary: Record<GuideLocale, string>;
  blocks: GuideBlock[];
};

export const SYSTEM_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'intro',
    icon: LayoutGrid,
    title: { pt: 'Bem-vindo ao Ibigan', en: 'Welcome to Ibigan' },
    summary: {
      pt: 'Visão geral da plataforma para o dia a dia.',
      en: 'Platform overview for everyday use.',
    },
    blocks: [
      {
        text: {
          pt: 'O Ibigan é uma plataforma para gerenciar sua empresa: pessoas, comunicações, relatórios e configurações em um só lugar. Você acessa pelo navegador — não precisa instalar programas no computador.',
          en: 'Ibigan is a platform to manage your organization: people, communications, reports, and settings in one place. You access it through the browser — no software installation required.',
        },
      },
      {
        title: { pt: 'Dois ambientes', en: 'Two environments' },
        items: [
          {
            pt: 'Painel da empresa (tenant): usuários, campanhas, relatórios e configurações da sua organização.',
            en: 'Company panel (tenant): users, campaigns, reports, and settings for your organization.',
          },
          {
            pt: 'Painel central (SaaS): visível apenas para super-administradores da plataforma — empresas, catálogo global, traduções e ferramentas.',
            en: 'Central panel (SaaS): visible only to platform super-admins — companies, global catalog, translations, and tools.',
          },
        ],
      },
      {
        title: { pt: 'Menu e perfil', en: 'Menu and profile' },
        text: {
          pt: 'O menu principal fica na barra lateral ou no topo (conforme sua preferência). Perfil, notificações, idioma, layout do menu e modo escuro ficam no menu do avatar, no canto superior direito.',
          en: 'The main menu is in the sidebar or top bar (based on your preference). Profile, notifications, language, menu layout, and dark mode are in the avatar menu at the top right.',
        },
      },
    ],
  },
  {
    id: 'usability',
    icon: Keyboard,
    title: { pt: 'Atalhos e usabilidade', en: 'Shortcuts and usability' },
    summary: {
      pt: 'Como navegar mais rápido nas listagens e formulários.',
      en: 'How to navigate listings and forms faster.',
    },
    blocks: [
      {
        title: { pt: 'Nas listagens (grids)', en: 'In listings (grids)' },
        items: [
          { pt: '1 clique na linha: seleciona ou desmarca o registro.', en: 'Single click on a row: selects or deselects the record.' },
          { pt: 'Shift + clique: seleciona vários registros em sequência (bloco).', en: 'Shift + click: selects a range of records.' },
          { pt: 'Duplo clique na linha: abre o registro (equivalente à primeira opção do menu Ações — normalmente Visualizar).', en: 'Double click on a row: opens the record (same as the first Actions menu option — usually View).' },
          { pt: 'Enter com 1 item selecionado: abre o registro selecionado.', en: 'Enter with one item selected: opens the selected record.' },
          { pt: 'Delete com itens selecionados: abre a confirmação de exclusão.', en: 'Delete with items selected: opens delete confirmation.' },
          { pt: 'Esc: limpa a seleção e fecha diálogos abertos.', en: 'Esc: clears selection and closes open dialogs.' },
        ],
      },
      {
        title: { pt: 'Nos formulários', en: 'In forms' },
        items: [
          { pt: 'Enter: salva (ação principal — em geral “Salvar e voltar à listagem”).', en: 'Enter: saves (primary action — usually “Save and return to list”).' },
          { pt: 'Delete: abre confirmação de exclusão do registro em edição.', en: 'Delete: opens delete confirmation for the record being edited.' },
          { pt: 'O botão Voltar fica sempre logo após Salvar.', en: 'The Back button is always right after Save.' },
          { pt: 'Enter não salva quando você está digitando em campos longos (área de texto) ou com menus abertos.', en: 'Enter does not save when typing in long text fields or with open menus.' },
        ],
      },
      {
        title: { pt: 'Menu Ações por linha', en: 'Row Actions menu' },
        text: {
          pt: 'Cada linha possui o botão Ações com as operações daquele registro (visualizar, editar, excluir, etc.). Passe o mouse sobre o botão para abrir o menu rapidamente.',
          en: 'Each row has an Actions button with operations for that record (view, edit, delete, etc.). Hover over the button to open the menu quickly.',
        },
      },
    ],
  },
  {
    id: 'personalization',
    icon: Globe,
    title: { pt: 'Idioma, layout e aparência', en: 'Language, layout, and appearance' },
    summary: {
      pt: 'Personalize a interface ao seu gosto.',
      en: 'Customize the interface to your preference.',
    },
    blocks: [
      {
        title: { pt: 'Idioma', en: 'Language' },
        text: {
          pt: 'No menu do avatar, escolha Português ou English. O sistema lembra sua escolha no próximo acesso.',
          en: 'In the avatar menu, choose Portuguese or English. The system remembers your choice on the next visit.',
        },
      },
      {
        title: { pt: 'Layout do menu', en: 'Menu layout' },
        items: [
          { pt: 'Horizontal: itens do menu na barra superior (ideal em telas largas).', en: 'Horizontal: menu items in the top bar (ideal on wide screens).' },
          { pt: 'Vertical: menu lateral fixo (sidebar).', en: 'Vertical: fixed side menu (sidebar).' },
        ],
      },
      {
        title: { pt: 'Modo escuro', en: 'Dark mode' },
        text: {
          pt: 'Ative ou desative o modo escuro no menu do avatar. A preferência é salva automaticamente.',
          en: 'Enable or disable dark mode in the avatar menu. The preference is saved automatically.',
        },
      },
    ],
  },
  {
    id: 'companies',
    icon: Building2,
    title: { pt: 'Empresas (multi-tenant)', en: 'Companies (multi-tenant)' },
    summary: {
      pt: 'Como funcionam as organizações na plataforma.',
      en: 'How organizations work on the platform.',
    },
    blocks: [
      {
        text: {
          pt: 'Cada empresa possui seus próprios dados isolados: usuários, campanhas, relatórios e configurações. Ao fazer login, você entra no contexto da empresa escolhida.',
          en: 'Each company has its own isolated data: users, campaigns, reports, and settings. When you log in, you enter the context of the selected company.',
        },
      },
      {
        title: { pt: 'Super-administradores', en: 'Super administrators' },
        text: {
          pt: 'Usuários com perfil super-admin podem acessar o painel central (empresas, catálogo da plataforma) e, quando vinculados a uma empresa, também administram tudo dentro dela.',
          en: 'Users with the super-admin role can access the central panel (companies, platform catalog) and, when linked to a company, also manage everything within it.',
        },
      },
    ],
  },
  {
    id: 'access',
    icon: Shield,
    title: { pt: 'Funções e permissões', en: 'Roles and permissions' },
    summary: {
      pt: 'Quem pode fazer o quê no sistema.',
      en: 'Who can do what in the system.',
    },
    blocks: [
      {
        title: { pt: 'Funções (papéis)', en: 'Roles' },
        text: {
          pt: 'Funções agrupam permissões comuns — por exemplo: administrador, gestor, operador. Cada usuário pode ter uma ou mais funções.',
          en: 'Roles group common permissions — for example: administrator, manager, operator. Each user can have one or more roles.',
        },
      },
      {
        title: { pt: 'Permissões', en: 'Permissions' },
        text: {
          pt: 'Permissões controlam ações específicas (visualizar usuários, gerenciar menus, executar relatórios, etc.). Se um item não aparece no menu ou um botão está desabilitado, sua função pode não incluir aquela permissão.',
          en: 'Permissions control specific actions (view users, manage menus, run reports, etc.). If a menu item is missing or a button is disabled, your role may not include that permission.',
        },
      },
      {
        title: { pt: 'Aprovações e convites', en: 'Approvals and invites' },
        items: [
          { pt: 'Convites: envie links para novas pessoas se cadastrarem na empresa.', en: 'Invites: send links for new people to register in the company.' },
          { pt: 'Aprovações: revise cadastros pendentes antes de liberar o acesso.', en: 'Approvals: review pending registrations before granting access.' },
        ],
      },
    ],
  },
  {
    id: 'templates',
    icon: MessageSquare,
    title: { pt: 'Templates de mensagem', en: 'Message templates' },
    summary: {
      pt: 'Modelos reutilizáveis para e-mail, SMS, WhatsApp e notificações.',
      en: 'Reusable models for email, SMS, WhatsApp, and notifications.',
    },
    blocks: [
      {
        text: {
          pt: 'Templates guardam o texto e a formatação das mensagens que sua empresa envia. Variáveis como nome do destinatário podem ser inseridas no corpo da mensagem.',
          en: 'Templates store the text and formatting of messages your company sends. Variables such as the recipient name can be inserted in the message body.',
        },
      },
      {
        title: { pt: 'Canais suportados', en: 'Supported channels' },
        items: [
          { pt: 'E-mail: mensagens HTML formatadas.', en: 'Email: formatted HTML messages.' },
          { pt: 'SMS: textos curtos para celular.', en: 'SMS: short texts for mobile phones.' },
          { pt: 'WhatsApp: mensagens pelo canal WhatsApp (quando configurado).', en: 'WhatsApp: messages via WhatsApp channel (when configured).' },
          { pt: 'Notificação no app: alertas dentro do Ibigan (sininho no topo).', en: 'In-app notification: alerts inside Ibigan (bell icon at the top).' },
        ],
      },
      {
        title: { pt: 'Testar template', en: 'Test template' },
        text: {
          pt: 'Antes de usar em campanhas, utilize a opção de envio de teste no formulário do template. Escolha os canais e confira se a mensagem chegou corretamente.',
          en: 'Before using in campaigns, use the test send option in the template form. Choose channels and verify the message was delivered correctly.',
        },
      },
      {
        title: { pt: 'Catálogo da plataforma', en: 'Platform catalog' },
        text: {
          pt: 'Super-admins podem manter templates padrão no painel central, que são sincronizados para as empresas.',
          en: 'Super-admins can maintain default templates in the central panel, synced to companies.',
        },
      },
    ],
  },
  {
    id: 'campaigns',
    icon: Megaphone,
    title: { pt: 'Campanhas', en: 'Campaigns' },
    summary: {
      pt: 'Envio em massa ou agendado para grupos de pessoas.',
      en: 'Bulk or scheduled sending to groups of people.',
    },
    blocks: [
      {
        text: {
          pt: 'Campanhas combinam um template de mensagem com um público (usuários, funções ou critérios). Você pode salvar como rascunho, agendar ou enviar.',
          en: 'Campaigns combine a message template with an audience (users, roles, or criteria). You can save as draft, schedule, or send.',
        },
      },
      {
        title: { pt: 'Status comuns', en: 'Common statuses' },
        items: [
          { pt: 'Rascunho: ainda em edição — duplo clique abre o formulário.', en: 'Draft: still editing — double click opens the form.' },
          { pt: 'Agendada: envio programado para data/hora futura.', en: 'Scheduled: send planned for a future date/time.' },
          { pt: 'Enviando / Enviada: processamento e conclusão.', en: 'Sending / Sent: processing and completion.' },
          { pt: 'Cancelada: interrompida antes ou durante o envio.', en: 'Cancelled: stopped before or during sending.' },
        ],
      },
      {
        title: { pt: 'Canais na campanha', en: 'Campaign channels' },
        text: {
          pt: 'Selecione um ou mais canais (e-mail, SMS, WhatsApp, notificação) conforme o template e a configuração da empresa.',
          en: 'Select one or more channels (email, SMS, WhatsApp, notification) based on the template and company setup.',
        },
      },
    ],
  },
  {
    id: 'reports',
    icon: Table2,
    title: { pt: 'Relatórios', en: 'Reports' },
    summary: {
      pt: 'Consultas personalizadas e execuções em lote.',
      en: 'Custom queries and batch executions.',
    },
    blocks: [
      {
        text: {
          pt: 'Relatórios permitem extrair dados da empresa usando consultas configuradas. Você define parâmetros (datas, filtros) e executa quando precisar.',
          en: 'Reports let you extract company data using configured queries. You set parameters (dates, filters) and run when needed.',
        },
      },
      {
        title: { pt: 'Minhas execuções', en: 'My executions' },
        text: {
          pt: 'Acompanhe relatórios que você já executou: status, data e resultado. Execuções pesadas rodam em segundo plano — você não precisa manter a página aberta.',
          en: 'Track reports you have run: status, date, and result. Heavy runs happen in the background — you do not need to keep the page open.',
        },
      },
      {
        title: { pt: 'Processamento em fila (jobs)', en: 'Queued processing (jobs)' },
        text: {
          pt: 'Tarefas demoradas (envio de campanhas, execução de relatórios, milhares de registros) são processadas em fila pelo sistema. Falhas pontuais podem ser reprocessadas sem travar o restante. Administradores técnicos acompanham as filas pela ferramenta Horizon.',
          en: 'Long-running tasks (campaign sends, report runs, thousands of records) are processed in a queue. Occasional failures can be retried without blocking the rest. Technical admins monitor queues via Horizon.',
        },
      },
    ],
  },
  {
    id: 'translations',
    icon: Globe,
    title: { pt: 'Traduções', en: 'Translations' },
    summary: {
      pt: 'Textos da interface por empresa.',
      en: 'Interface texts per company.',
    },
    blocks: [
      {
        text: {
          pt: 'Super-admins podem ajustar traduções específicas de cada empresa no painel central. Isso permite personalizar rótulos e mensagens sem alterar o código do sistema.',
          en: 'Super-admins can adjust company-specific translations in the central panel. This customizes labels and messages without changing system code.',
        },
      },
      {
        title: { pt: 'Recarregar traduções', en: 'Reload translations' },
        text: {
          pt: 'Após salvar traduções, use a opção de recarregar para ver as mudanças imediatamente na interface.',
          en: 'After saving translations, use reload to see changes immediately in the interface.',
        },
      },
    ],
  },
  {
    id: 'grids',
    icon: Columns3,
    title: { pt: 'Listagens (grids)', en: 'Listings (grids)' },
    summary: {
      pt: 'Tabelas, filtros, colunas e modos de visualização.',
      en: 'Tables, filters, columns, and view modes.',
    },
    blocks: [
      {
        title: { pt: 'Barra de ferramentas', en: 'Toolbar' },
        items: [
          { pt: 'Novo: cria um registro em branco.', en: 'New: creates a blank record.' },
          { pt: 'Visualizar: abre o registro quando há exatamente 1 selecionado.', en: 'View: opens the record when exactly 1 is selected.' },
          { pt: 'Ativar / Desativar / Excluir: ações em lote nos selecionados.', en: 'Activate / Deactivate / Delete: bulk actions on selected items.' },
          { pt: 'Atualizar: recarrega os dados da listagem.', en: 'Refresh: reloads listing data.' },
          { pt: 'Exportar: gera arquivo com os dados (onde disponível).', en: 'Export: generates a data file (where available).' },
        ],
      },
      {
        title: { pt: 'Colunas', en: 'Columns' },
        items: [
          { pt: 'Mostrar/ocultar: escolha quais colunas aparecem.', en: 'Show/hide: choose which columns appear.' },
          { pt: 'Arrastar: reordene colunas arrastando o cabeçalho (modo tabela).', en: 'Drag: reorder columns by dragging the header (table mode).' },
          { pt: 'Ordenar: clique no título da coluna para ordenar ascendente/descendente.', en: 'Sort: click column title to sort ascending/descending.' },
          { pt: 'Suas preferências de colunas são lembradas no navegador.', en: 'Your column preferences are remembered in the browser.' },
        ],
      },
      {
        title: { pt: 'Filtros', en: 'Filters' },
        items: [
          { pt: 'Filtros ativos aparecem destacados como etiquetas (badges) acima da tabela.', en: 'Active filters appear highlighted as badges above the table.' },
          { pt: 'Busca rápida: campo de pesquisa geral na barra superior da listagem.', en: 'Quick search: general search field in the listing top bar.' },
          { pt: 'Filtros por coluna: texto, datas, listas de valores e intervalos.', en: 'Per-column filters: text, dates, value lists, and ranges.' },
          { pt: 'Limpar filtros: remove todos os filtros de uma vez.', en: 'Clear filters: removes all filters at once.' },
        ],
      },
      {
        title: { pt: 'Modos de visualização', en: 'View modes' },
        items: [
          { pt: 'Tabela: visão em colunas — padrão no desktop.', en: 'Table: column view — default on desktop.' },
          { pt: 'Lista: linhas compactas, boa para leitura sequencial.', en: 'List: compact rows, good for sequential reading.' },
          { pt: 'Cards: cartões visuais — padrão no celular.', en: 'Cards: visual cards — default on mobile.' },
        ],
      },
    ],
  },
  {
    id: 'desktop-mobile',
    icon: MousePointerClick,
    title: { pt: 'Desktop e celular', en: 'Desktop and mobile' },
    summary: {
      pt: 'Diferenças importantes entre telas grandes e pequenas.',
      en: 'Important differences between large and small screens.',
    },
    blocks: [
      {
        title: { pt: 'No computador (desktop)', en: 'On desktop' },
        items: [
          { pt: 'Preferência automática pela visualização em tabela.', en: 'Automatic preference for table view.' },
          { pt: 'Menu horizontal disponível; menu lateral opcional.', en: 'Horizontal menu available; optional sidebar.' },
          { pt: 'Rolagem infinita na tabela ao descer a página (em algumas listagens).', en: 'Infinite scroll in the table when scrolling down (on some listings).' },
          { pt: 'Menu do perfil abre ao passar o mouse no avatar.', en: 'Profile menu opens on avatar hover.' },
        ],
      },
      {
        title: { pt: 'No celular (mobile)', en: 'On mobile' },
        items: [
          { pt: 'Visualização em cards por padrão — mais fácil de tocar.', en: 'Cards view by default — easier to tap.' },
          { pt: 'Menu principal em painel lateral (ícone de menu).', en: 'Main menu in a side panel (menu icon).' },
          { pt: 'Filtros em janela dedicada para caber na tela.', en: 'Filters in a dedicated dialog to fit the screen.' },
          { pt: 'Menu do perfil abre ao tocar no avatar.', en: 'Profile menu opens on avatar tap.' },
        ],
      },
    ],
  },
  {
    id: 'realtime',
    icon: Zap,
    title: { pt: 'Atualização em tempo real', en: 'Real-time updates' },
    summary: {
      pt: 'Dados que se atualizam sem recarregar a página.',
      en: 'Data that updates without reloading the page.',
    },
    blocks: [
      {
        text: {
          pt: 'Várias partes do Ibigan atualizam sozinhas após você salvar, excluir ou quando outra pessoa faz alterações. Não é necessário apertar F5 na maior parte das telas.',
          en: 'Many parts of Ibigan update automatically after you save, delete, or when someone else makes changes. You usually do not need to press F5.',
        },
      },
      {
        title: { pt: 'Notificações', en: 'Notifications' },
        text: {
          pt: 'O sininho no topo recebe novos avisos em tempo real (conexão WebSocket). A contagem de não lidas atualiza automaticamente.',
          en: 'The bell icon at the top receives new alerts in real time (WebSocket). Unread count updates automatically.',
        },
      },
      {
        title: { pt: 'Listagens e formulários', en: 'Listings and forms' },
        text: {
          pt: 'Após salvar um registro, a listagem é atualizada ao voltar. Botão Atualizar na barra do formulário recarrega os dados do servidor quando necessário.',
          en: 'After saving a record, the listing updates when you go back. The Refresh button on the form toolbar reloads server data when needed.',
        },
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: { pt: 'Notificações e webhooks', en: 'Notifications and webhooks' },
    summary: {
      pt: 'Alertas internos e integrações externas.',
      en: 'Internal alerts and external integrations.',
    },
    blocks: [
      {
        title: { pt: 'Central de notificações', en: 'Notification center' },
        text: {
          pt: 'Acesse pelo sininho ou pelo menu do perfil. Marque como lida, veja detalhes e configure preferências por canal (e-mail, app, etc.).',
          en: 'Access via the bell or profile menu. Mark as read, view details, and configure preferences per channel (email, app, etc.).',
        },
      },
      {
        title: { pt: 'Webhooks', en: 'Webhooks' },
        text: {
          pt: 'Para integrações técnicas, webhooks enviam eventos do Ibigan para outros sistemas quando algo acontece (cadastro, alteração, etc.).',
          en: 'For technical integrations, webhooks send Ibigan events to other systems when something happens (registration, update, etc.).',
        },
      },
    ],
  },
  {
    id: 'users',
    icon: Users,
    title: { pt: 'Usuários e perfil', en: 'Users and profile' },
    summary: {
      pt: 'Gestão de pessoas e sua conta pessoal.',
      en: 'People management and your personal account.',
    },
    blocks: [
      {
        items: [
          { pt: 'Usuários: cadastro, edição, ativação e vínculo com funções.', en: 'Users: register, edit, activate, and link to roles.' },
          { pt: 'Meu perfil: nome, foto, e-mail e preferências pessoais.', en: 'My profile: name, photo, email, and personal preferences.' },
          { pt: 'Segurança: senha e autenticação em duas etapas (2FA).', en: 'Security: password and two-factor authentication (2FA).' },
          { pt: 'Histórico de atividades: registro de ações importantes no sistema (para administradores).', en: 'Activity log: record of important actions in the system (for administrators).' },
        ],
      },
    ],
  },
  {
    id: 'tips',
    icon: RefreshCw,
    title: { pt: 'Dicas finais', en: 'Final tips' },
    summary: {
      pt: 'Boas práticas para o dia a dia.',
      en: 'Good practices for everyday use.',
    },
    blocks: [
      {
        items: [
          { pt: 'Use a busca global (atalho ⌘K / Ctrl+K) para encontrar telas rapidamente.', en: 'Use global search (⌘K / Ctrl+K shortcut) to find screens quickly.' },
          { pt: 'Em dúvida sobre um botão, passe o mouse — muitos têm dica (tooltip).', en: 'Unsure about a button? Hover — many have tooltips.' },
          { pt: 'Documentação técnica da API (desenvolvedores): disponível em Ferramentas → Documentação API.', en: 'API technical documentation (developers): available under Tools → API Documentation.' },
          { pt: 'Suporte: suporte@ibigan.com.br', en: 'Support: suporte@ibigan.com.br' },
        ],
      },
    ],
  },
];

export function guideText(
  record: Record<GuideLocale, string> | undefined,
  locale: GuideLocale,
): string {
  if (!record) return '';
  return record[locale] ?? record.pt;
}

export function guideItems(
  items: Record<GuideLocale, string>[] | undefined,
  locale: GuideLocale,
): string[] {
  if (!items) return [];
  return items.map((item) => item[locale] ?? item.pt);
}
