// Sistema de gestão de contatos
class ContactManager {
  constructor() {
    this.contacts = [
      {
        nome: "João Silva",
        email: "joao@email.com",
        telefone: "(11) 99999-9999",
        status: "nova",
        agente: "Maria Santos",
        pipeline: "Lead",
      },
      {
        nome: "Maria Costa",
        email: "maria@email.com",
        telefone: "(11) 88888-8888",
        status: "resolvida",
        agente: "João Silva",
        pipeline: "Fechado",
      },
      {
        nome: "Carlos Santos",
        email: "carlos@email.com",
        telefone: "(11) 77777-7777",
        status: "pausa",
        agente: "Ana Oliveira",
        pipeline: "Proposta",
      },
      {
        nome: "Ana Oliveira",
        email: "ana@email.com",
        telefone: "(11) 66666-6666",
        status: "andamento",
        agente: "Carlos Costa",
        pipeline: "Qualificado",
      },
      {
        nome: "Pedro Lima",
        email: "pedro@email.com",
        telefone: "(11) 55555-5555",
        status: "andamento",
        agente: "Maria Santos",
        pipeline: "Negociação",
      },
      {
        nome: "Luiza Fernandes",
        email: "luiza@email.com",
        telefone: "(11) 44444-4444",
        status: "resolvida",
        agente: "João Silva",
        pipeline: "Fechado",
      },
      {
        nome: "Roberto Souza",
        email: "roberto@email.com",
        telefone: "(11) 33333-3333",
        status: "nova",
        agente: "Ana Oliveira",
        pipeline: "Lead",
      },
      {
        nome: "Mariana Alves",
        email: "mariana@email.com",
        telefone: "(11) 22222-2222",
        status: "pausa",
        agente: "Carlos Costa",
        pipeline: "Proposta",
      },
    ];

    this.filteredContacts = [];
    this.selectedContacts = new Set();
    this.isFiltered = false;
    this.selectedTags = new Set(); // Para armazenar as tags selecionadas

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateResultsCount();
    this.setupTagsInput();
    this.renderTags(); // Inicializar display das tags
    this.initializeApplyButton(); // Initialize apply button
    this.setupModalClosing(); // Setup modal closing on outside click
  }

  bindEvents() {
    // Eventos dos botões de filtro
    document
      .getElementById("visualizarAcoes")
      .addEventListener("click", () => this.showPreviousActions());
    document
      .getElementById("aplicarFiltros")
      .addEventListener("click", () => this.applyFilters());
    document
      .getElementById("limparFiltros")
      .addEventListener("click", () => this.clearFilters());

    // Eventos de seleção
    document
      .getElementById("selectAll")
      .addEventListener("click", () => this.selectAll());
    document
      .getElementById("deselectAll")
      .addEventListener("click", () => this.deselectAll());

    // Eventos de ações em massa (removidos - agora são onChange nos selects)
    // Adicionando evento para o botão baixar CSV que não está no grid
    const downloadBtn = document.querySelector(".download-card .btn--download");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadCSV());
    }

    // Eventos do modal (removidos - agora cada modal tem sua própria lógica)

    // Fechar modais ao clicar fora (removido - não há mais modais)
  }

  applyFilters() {
    const filters = this.getFiltersFromForm();
    this.filteredContacts = this.contacts.filter((contact) =>
      this.matchesFilters(contact, filters)
    );
    this.isFiltered = true;
    this.selectedContacts.clear();

    this.renderResults();
    this.showMassActionsSection();
    this.updateResultsCount();
    this.updateSelectionCount();
    this.updateMassActionButtons();

    this.showToast("Filtros aplicados com sucesso!", "success");
  }

  getFiltersFromForm() {
    const filters = {};

    // Filtros de texto
    const textFilters = ["nome", "email", "telefone", "cidade", "cep"];
    textFilters.forEach((field) => {
      const value = document.getElementById(field).value.trim();
      if (value) filters[field] = value.toLowerCase();
    });

    // Filtros de seleção
    const selectFilters = [
      "rating",
      "countryCode",
      "pais",
      "estado",
      "grupos",
      "agente",
      "status",
      "pipeStage",
    ];
    selectFilters.forEach((field) => {
      const value = document.getElementById(field).value;
      if (value) filters[field] = value;
    });

    // Filtros de idade
    const idadeMin = document.getElementById("idadeMin").value;
    const idadeMax = document.getElementById("idadeMax").value;
    if (idadeMin) filters.idadeMin = parseInt(idadeMin);
    if (idadeMax) filters.idadeMax = parseInt(idadeMax);

    // Tags especiais
    if (this.selectedTags.size > 0) {
      filters.tags = Array.from(this.selectedTags);
      filters.tagsCondition = document.getElementById("tagsCondition").value;
    }

    return filters;
  }

  matchesFilters(contact, filters) {
    // Filtros de texto
    if (filters.nome && !contact.nome.toLowerCase().includes(filters.nome))
      return false;
    if (filters.email && !contact.email.toLowerCase().includes(filters.email))
      return false;
    if (filters.telefone && !contact.telefone.includes(filters.telefone))
      return false;

    // Filtros de seleção
    if (filters.agente && contact.agente !== filters.agente) return false;
    if (filters.status && contact.status !== filters.status) return false;
    if (filters.pipeStage && contact.pipeline !== filters.pipeStage)
      return false;

    return true;
  }

  showPreviousActions() {
    this.openPreviousActionsModal();
  }

  clearFilters() {
    // Limpar formulário
    document.getElementById("filtersForm").reset();

    // Limpar tags personalizadas
    this.clearAllTags();

    // Resetar estado
    this.filteredContacts = [];
    this.selectedContacts.clear();
    this.isFiltered = false;

    // Esconder seção de ações em massa e limpar seletores
    this.hideMassActionsSection();
    this.resetAllSelectors();

    // Limpar tabela
    this.renderEmptyState();
    this.updateResultsCount();

    this.showToast("Filtros limpos com sucesso!", "success");
  }

  renderResults() {
    const tbody = document.getElementById("resultsBody");

    if (this.filteredContacts.length === 0) {
      tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7" class="text-center">
                        <i class="fas fa-search"></i><br>
                        Nenhum contato encontrado com os filtros aplicados
                    </td>
                </tr>
            `;
      this.updateSelectAllCheckbox();
      return;
    }

    tbody.innerHTML = this.filteredContacts
      .map(
        (contact, index) => `
            <tr>
                <td class="checkbox-column">
                    <input type="checkbox" 
                           data-contact-index="${index}" 
                           onchange="contactManager.handleContactSelection(this)">
                </td>
                <td>${contact.nome}</td>
                <td>${contact.email}</td>
                <td>${contact.telefone}</td>
                <td>${contact.agente}</td>
                <td><span class="status-badge ${contact.status
                  .toLowerCase()
                  .replace(" ", "-")}">${contact.status}</span></td>
                <td>${contact.pipeline}</td>
            </tr>
        `
      )
      .join("");

    this.updateSelectAllCheckbox();
  }

  renderEmptyState() {
    const tbody = document.getElementById("resultsBody");

    tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7" class="text-center">
                    <i class="fas fa-filter"></i><br>
                    Aplique filtros para visualizar os contatos
                </td>
            </tr>
        `;

    this.updateSelectAllCheckbox();
  }

  showMassActionsSection() {
    const massActionsCard = document.getElementById("massActionsCard");
    massActionsCard.style.display = "block";

    // Animação suave
    setTimeout(() => {
      massActionsCard.classList.add("show");
    }, 10);
  }

  hideMassActionsSection() {
    const massActionsCard = document.getElementById("massActionsCard");
    massActionsCard.classList.remove("show");

    setTimeout(() => {
      massActionsCard.style.display = "none";
    }, 300);
  }

  handleContactSelection(checkbox) {
    const contactIndex = parseInt(checkbox.dataset.contactIndex);

    if (checkbox.checked) {
      this.selectedContacts.add(contactIndex);
    } else {
      this.selectedContacts.delete(contactIndex);
    }

    this.updateSelectionCount();
    this.updateMassActionButtons();
    this.updateSelectAllCheckbox();
  }

  selectAll() {
    const checkboxes = document.querySelectorAll("input[data-contact-index]");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      this.selectedContacts.add(parseInt(checkbox.dataset.contactIndex));
    });

    this.updateSelectionCount();
    this.updateMassActionButtons();
    this.updateSelectAllCheckbox();
  }

  deselectAll() {
    const checkboxes = document.querySelectorAll("input[data-contact-index]");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    this.selectedContacts.clear();
    this.updateSelectionCount();
    this.updateMassActionButtons();
    this.resetAllSelectors();
    this.updateSelectAllCheckbox();
  }

  toggleSelectAll(headerCheckbox) {
    if (headerCheckbox.checked) {
      this.selectAll();
    } else {
      this.deselectAll();
    }
  }

  updateSelectAllCheckbox() {
    const headerCheckbox = document.getElementById("selectAllCheckbox");
    const contactCheckboxes = document.querySelectorAll(
      "input[data-contact-index]"
    );

    if (contactCheckboxes.length === 0) {
      headerCheckbox.checked = false;
      headerCheckbox.indeterminate = false;
      return;
    }

    const checkedCount = Array.from(contactCheckboxes).filter(
      (cb) => cb.checked
    ).length;

    if (checkedCount === 0) {
      headerCheckbox.checked = false;
      headerCheckbox.indeterminate = false;
    } else if (checkedCount === contactCheckboxes.length) {
      headerCheckbox.checked = true;
      headerCheckbox.indeterminate = false;
    } else {
      headerCheckbox.checked = false;
      headerCheckbox.indeterminate = true;
    }
  }

  updateSelectionCount() {
    const count = this.selectedContacts.size;
    const countElement = document.getElementById("selectionCount");
    countElement.textContent = `${count} selecionado${count !== 1 ? "s" : ""}`;
  }

  updateMassActionButtons() {
    const hasSelection = this.selectedContacts.size > 0;
    const massActionButtons = document.querySelectorAll(".mass-action-btn");

    massActionButtons.forEach((button) => {
      button.disabled = !hasSelection;
    });
  }

  updateResultsCount() {
    const count = this.isFiltered ? this.filteredContacts.length : 0;
    const countElement = document.getElementById("resultsCount");
    countElement.textContent = `${count} contato${
      count !== 1 ? "s" : ""
    } encontrado${count !== 1 ? "s" : ""}`;
  }

  executeChangeAgent() {
    const novoAgente = document.getElementById("novoAgente").value;
    if (!novoAgente) {
      return; // Não fazer nada se não selecionou
    }

    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      document.getElementById("novoAgente").value = "";
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Simular alteração do agente nos contatos selecionados
    Array.from(this.selectedContacts).forEach((index) => {
      if (this.filteredContacts[index]) {
        this.filteredContacts[index].agente = novoAgente;
      }
    });

    this.renderResults();
    this.resetAllSelectors();
    this.deselectAll();

    this.showToast(
      `Agente alterado para "${novoAgente}" em ${selectedCount} contato${
        selectedCount !== 1 ? "s" : ""
      }!`,
      "success"
    );
  }

  executeChangeStatus() {
    const novoStatus = document.getElementById("novoStatus").value;
    if (!novoStatus) {
      return; // Não fazer nada se não selecionou
    }

    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      document.getElementById("novoStatus").value = "";
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Simular alteração do status nos contatos selecionados
    Array.from(this.selectedContacts).forEach((index) => {
      if (this.filteredContacts[index]) {
        this.filteredContacts[index].status = novoStatus;
      }
    });

    this.renderResults();
    this.resetAllSelectors();
    this.deselectAll();

    this.showToast(
      `Status alterado para "${novoStatus}" em ${selectedCount} contato${
        selectedCount !== 1 ? "s" : ""
      }!`,
      "success"
    );
  }

  executeChangePipeline() {
    const novoPipeline = document.getElementById("novoPipeline").value;
    if (!novoPipeline) {
      return; // Não fazer nada se não selecionou
    }

    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      document.getElementById("novoPipeline").value = "";
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Simular alteração do pipeline nos contatos selecionados
    Array.from(this.selectedContacts).forEach((index) => {
      if (this.filteredContacts[index]) {
        this.filteredContacts[index].pipeline = novoPipeline;
      }
    });

    this.renderResults();
    this.resetAllSelectors();
    this.deselectAll();

    this.showToast(
      `Pipeline alterado para "${novoPipeline}" em ${selectedCount} contato${
        selectedCount !== 1 ? "s" : ""
      }!`,
      "success"
    );
  }

  executeAddTags() {
    const novaTag = document.getElementById("novaTag").value;
    if (!novaTag) {
      return; // Não fazer nada se não selecionou
    }

    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      document.getElementById("novaTag").value = "";
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Simular adição de tag (em uma implementação real, isso seria salvo no banco)
    this.resetAllSelectors();
    this.deselectAll();

    this.showToast(
      `Tag "${novaTag}" adicionada em ${selectedCount} contato${
        selectedCount !== 1 ? "s" : ""
      }!`,
      "success"
    );
  }

  executeAddToGroup() {
    const novoGrupo = document.getElementById("novoGrupo").value;
    if (!novoGrupo) {
      return; // Não fazer nada se não selecionou
    }

    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      document.getElementById("novoGrupo").value = "";
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Simular adição ao grupo (em uma implementação real, isso seria salvo no banco)
    this.resetAllSelectors();
    this.deselectAll();

    this.showToast(
      `${selectedCount} contato${selectedCount !== 1 ? "s" : ""} adicionado${
        selectedCount !== 1 ? "s" : ""
      } ao grupo "${novoGrupo}"!`,
      "success"
    );
  }

  showMessageModal() {
    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      return;
    }

    // Simular envio/agendamento de mensagem
    const selectedCount = this.selectedContacts.size;
    this.deselectAll();

    this.showToast(
      `Ação de mensagem preparada para ${selectedCount} contato${
        selectedCount !== 1 ? "s" : ""
      }!`,
      "success"
    );
  }

  executeDeleteContacts() {
    if (this.selectedContacts.size === 0) {
      this.showToast("Selecione pelo menos um contato", "warning");
      return;
    }

    const selectedCount = this.selectedContacts.size;

    // Confirmar antes de excluir
    if (
      !confirm(
        `Tem certeza que deseja excluir ${selectedCount} contato${
          selectedCount !== 1 ? "s" : ""
        }? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    // Remover contatos selecionados
    const indicesToRemove = Array.from(this.selectedContacts).sort(
      (a, b) => b - a
    );

    indicesToRemove.forEach((index) => {
      this.filteredContacts.splice(index, 1);
    });

    this.renderResults();
    this.updateResultsCount();
    this.selectedContacts.clear();
    this.resetAllSelectors();

    this.showToast(
      `${selectedCount} contato${selectedCount !== 1 ? "s" : ""} excluído${
        selectedCount !== 1 ? "s" : ""
      } com sucesso!`,
      "success"
    );
  }

  // Mass Action Apply Button Logic
  enableApplyButton() {
    const applyButton = document.getElementById("aplicarAcaoMassa");
    if (applyButton) {
      applyButton.disabled = false;
    }
  }

  disableApplyButton() {
    const applyButton = document.getElementById("aplicarAcaoMassa");
    if (applyButton) {
      applyButton.disabled = true;
    }
  }

  initializeApplyButton() {
    const applyButton = document.getElementById("aplicarAcaoMassa");
    if (applyButton) {
      applyButton.addEventListener("click", () =>
        this.executeSelectedMassAction()
      );
      this.disableApplyButton(); // Start disabled
    }
  }

  executeSelectedMassAction() {
    if (this.selectedContacts.size === 0) {
      this.showToast(
        "Selecione pelo menos um contato para aplicar a ação",
        "warning"
      );
      return;
    }

    // Check which action is selected
    const novoAgente = document.getElementById("novoAgente").value;
    const novoStatus = document.getElementById("novoStatus").value;
    const novoPipeline = document.getElementById("novoPipeline").value;
    const novaTag = document.getElementById("novaTag").value;
    const novoGrupo = document.getElementById("novoGrupo").value;

    let actionExecuted = false;

    if (novoAgente) {
      this.executeTrocarAgente(novoAgente);
      actionExecuted = true;
    } else if (novoStatus) {
      this.executeTrocarStatus(novoStatus);
      actionExecuted = true;
    } else if (novoPipeline) {
      this.executeTrocarPipeline(novoPipeline);
      actionExecuted = true;
    } else if (novaTag) {
      this.executeAdicionarTag(novaTag);
      actionExecuted = true;
    } else if (novoGrupo) {
      this.executeAdicionarGrupo(novoGrupo);
      actionExecuted = true;
    } else if (this.selectedMessageAction) {
      this.executeMessageAction(this.selectedMessageAction);
      actionExecuted = true;
    }

    if (actionExecuted) {
      // Reset form and disable button again
      this.resetMassActionForm();
      this.disableApplyButton();
    } else {
      this.showToast("Selecione uma ação para aplicar", "warning");
    }
  }

  executeTrocarAgente(novoAgente) {
    const selectedContacts = Array.from(this.selectedContacts);
    // Update contacts data
    this.filteredContacts.forEach((contact) => {
      if (selectedContacts.includes(contact.nome)) {
        contact.agente = novoAgente;
      }
    });
    this.renderResults();
    this.showToast(
      `Agente alterado para "${novoAgente}" em ${selectedContacts.length} contatos`,
      "success"
    );
  }

  executeTrocarStatus(novoStatus) {
    const selectedContacts = Array.from(this.selectedContacts);
    // Update contacts data
    this.filteredContacts.forEach((contact) => {
      if (selectedContacts.includes(contact.nome)) {
        contact.status = novoStatus;
      }
    });
    this.renderResults();
    this.showToast(
      `Status alterado para "${novoStatus}" em ${selectedContacts.length} contatos`,
      "success"
    );
  }

  executeTrocarPipeline(novoPipeline) {
    const selectedContacts = Array.from(this.selectedContacts);
    // Update contacts data
    this.filteredContacts.forEach((contact) => {
      if (selectedContacts.includes(contact.nome)) {
        contact.pipeline = novoPipeline;
      }
    });
    this.renderResults();
    this.showToast(
      `Pipeline alterado para "${novoPipeline}" em ${selectedContacts.length} contatos`,
      "success"
    );
  }

  executeAdicionarTag(novaTag) {
    const selectedContacts = Array.from(this.selectedContacts);
    this.showToast(
      `Tag "${novaTag}" adicionada a ${selectedContacts.length} contatos`,
      "success"
    );
  }

  executeAdicionarGrupo(novoGrupo) {
    const selectedContacts = Array.from(this.selectedContacts);
    this.showToast(
      `${selectedContacts.length} contatos adicionados ao "${novoGrupo}"`,
      "success"
    );
  }

  executeMessageAction(type) {
    const selectedContacts = Array.from(this.selectedContacts);
    const actionText = type === "agendar" ? "agendada" : "enviada";
    this.showToast(
      `Mensagem em massa ${actionText} para ${selectedContacts.length} contatos`,
      "success"
    );
  }

  selectMessageAction(type) {
    // Remove active state from all message buttons
    document.querySelectorAll(".message-card .btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Add active state to clicked button
    event.target.classList.add("active");

    // Enable apply button when message action is selected
    this.selectedMessageAction = type;
    this.enableApplyButton();
  }

  resetMassActionForm() {
    // Reset all mass action selects
    document.getElementById("novoAgente").value = "";
    document.getElementById("novoStatus").value = "";
    document.getElementById("novoPipeline").value = "";
    document.getElementById("novaTag").value = "";
    document.getElementById("novoGrupo").value = "";

    // Reset message action state
    this.selectedMessageAction = null;

    // Remove any active states from message buttons
    document.querySelectorAll(".message-card .btn").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  downloadCSV() {
    const selectedContacts = Array.from(this.selectedContacts).map(
      (index) => this.filteredContacts[index]
    );

    if (selectedContacts.length === 0) {
      this.showToast("Nenhum contato selecionado para download", "warning");
      return;
    }

    // Criar CSV
    const headers = [
      "Nome",
      "E-mail",
      "Telefone",
      "Agente",
      "Status",
      "Pipeline",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedContacts.map((contact) =>
        [
          contact.nome,
          contact.email,
          contact.telefone,
          contact.agente,
          contact.status,
          contact.pipeline,
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contatos_selecionados_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    this.showToast(
      `CSV baixado com ${selectedContacts.length} contatos!`,
      "success"
    );
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.querySelector(".toast-icon");

    // Configurar ícone baseado no tipo
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-times-circle",
      warning: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    };

    toastIcon.className = `toast-icon ${icons[type] || icons.success}`;
    toastMessage.textContent = message;

    // Remover classes de tipo anteriores
    toast.classList.remove("error", "warning", "info");
    if (type !== "success") {
      toast.classList.add(type);
    }

    // Mostrar toast
    toast.style.display = "block";

    // Esconder após 3 segundos
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  setupTagsInput() {
    const tagsInput = document.getElementById("tagsInput");

    tagsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addTag(tagsInput.value.trim());
        tagsInput.value = "";
      }
    });

    // Permitir também adicionar tag ao perder o foco, se houver texto
    tagsInput.addEventListener("blur", () => {
      const value = tagsInput.value.trim();
      if (value) {
        this.addTag(value);
        tagsInput.value = "";
      }
    });
  }

  addTag(tagText) {
    if (!tagText || this.selectedTags.has(tagText)) {
      return; // Não adicionar tag vazia ou duplicada
    }

    this.selectedTags.add(tagText);
    this.renderTags();
  }

  removeTag(tagText) {
    this.selectedTags.delete(tagText);
    this.renderTags();
  }

  renderTags() {
    const tagsDisplay = document.getElementById("tagsDisplay");

    if (this.selectedTags.size === 0) {
      tagsDisplay.innerHTML =
        '<span class="tags-placeholder">Nenhuma tag adicionada</span>';
      return;
    }

    tagsDisplay.innerHTML = Array.from(this.selectedTags)
      .map(
        (tag) => `
            <div class="tag-item">
                <span>${tag}</span>
                <button type="button" class="tag-remove" onclick="contactManager.removeTag('${tag}')" title="Remover tag">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `
      )
      .join("");
  }

  clearAllTags() {
    this.selectedTags.clear();
    this.renderTags();
  }

  // Previous Actions Modal Methods
  openPreviousActionsModal() {
    const modal = document.getElementById("previousActionsModal");
    modal.style.display = "flex";
    this.loadPreviousActions();
  }

  closePreviousActionsModal() {
    const modal = document.getElementById("previousActionsModal");
    modal.style.display = "none";
  }

  loadPreviousActions() {
    // Sample data for previous actions matching the image design
    const sampleActions = [
      {
        id: 1,
        datetime: "2024-01-15 14:30",
        action: "Troca de agente",
        details: 'De "João Silva" para "Maria Santos"',
        contactsCount: 25,
        user: "Admin",
        status: "success",
      },
      {
        id: 2,
        datetime: "2024-01-15 10:15",
        action: "Adição de tag",
        details: 'Tag "VIP" adicionada',
        contactsCount: 12,
        user: "Ana Oliveira",
        status: "success",
      },
      {
        id: 3,
        datetime: "2024-01-14 16:22",
        action: "Troca de status",
        details: 'Status alterado para "Resolvida"',
        contactsCount: 8,
        user: "Carlos Costa",
        status: "success",
      },
      {
        id: 4,
        datetime: "2024-01-14 09:45",
        action: "Mensagem em massa",
        details: "Mensagem promocional enviada",
        contactsCount: 156,
        user: "Maria Santos",
        status: "pending",
      },
      {
        id: 5,
        datetime: "2024-01-13 13:28",
        action: "Troca de pipeline",
        details: 'Movido para "Qualificado"',
        contactsCount: 3,
        user: "João Silva",
        status: "failed",
      },
    ];

    this.renderPreviousActions(sampleActions);
  }

  filterPreviousActions() {
    // This would normally filter the actions based on the selected period and type
    // For now, we'll just reload the same data
    this.loadPreviousActions();
    this.showToast("Filtros aplicados às ações anteriores", "info");
  }

  renderPreviousActions(actions) {
    const tbody = document.getElementById("actionsTableBody");

    if (actions.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px;">
                        <i class="fas fa-inbox" style="color: #9ca3af; font-size: 24px; margin-bottom: 12px;"></i><br>
                        <span style="color: #6b7280; font-size: 14px;">Nenhuma ação encontrada para os filtros selecionados</span>
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = actions
      .map(
        (action) => `
            <tr>
                <td>${this.formatDateTime(action.datetime)}</td>
                <td>
                    <div class="action-title">${action.action}</div>
                    <div class="action-details">${action.details}</div>
                </td>
                <td>${action.contactsCount} contatos</td>
                <td>${action.user}</td>
                <td>
                    <span class="action-status ${action.status}">
                        ${
                          action.status === "success"
                            ? "Concluída"
                            : action.status === "pending"
                            ? "Pendente"
                            : "Falhou"
                        }
                    </span>
                </td>
                <td>
                    <button type="button" class="btn--details" onclick="contactManager.showActionDetails(${
                      action.id
                    })">
                        Ver Detalhes
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  showActionDetails(actionId) {
    // This would show detailed information about a specific action
    this.showToast(
      `Detalhes da ação ${actionId} - Funcionalidade em desenvolvimento`,
      "info"
    );
  }

  setupModalClosing() {
    // Close modal when clicking outside
    document.addEventListener("click", (e) => {
      const modal = document.getElementById("previousActionsModal");
      if (e.target === modal) {
        this.closePreviousActionsModal();
      }
    });
  }
}

// Inicializar o sistema quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  window.contactManager = new ContactManager();
});

// Adicionar estilos dinâmicos para botões de erro
const errorButtonStyle = document.createElement("style");
errorButtonStyle.textContent = `
    .btn--error {
        background: var(--color-error) !important;
        color: white !important;
    }
    
    .btn--error:hover {
        background: rgba(var(--color-error-rgb), 0.9) !important;
    }
`;
document.head.appendChild(errorButtonStyle);
