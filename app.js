/* =========================================================
   MOSTAQBALI | المستقبلي
   File: app.js
   Main Frontend Controller
   ========================================================= */

"use strict";

/* ===================== APP CONFIGURATION ===================== */

const MostaqbaliApp = (() => {
  const CONFIG = {
    appName: "المستقبلي",
    englishName: "MOSTAQBALI",
    splashDuration: 5000,
    animationDuration: 250,
    toastDuration: 3500,
    storagePrefix: "mostaqbali_"
  };

  const state = {
    initialized: false,
    currentPage: "home",
    previousPage: "home",
    currentUser: null,
    menuOpen: false,
    modalOpen: false,
    splashFinished: false,
    toastTimers: new Map(),
    eventListeners: [],
    searchTimer: null
  };

  const SELECTORS = {
    splash: "#splashScreen, .splash-screen",
    main: "#app, #mainApp, .app-main",
    sidebar: "#sidebar, .sidebar",
    sidebarBackdrop: "#sidebarBackdrop, .sidebar-backdrop",
    menuToggle: "#menuToggle, #sidebarToggle, .header-menu-toggle",
    modal: "#modalContainer, #modalRoot",
    toastContainer: "#toastContainer, .toast-container",
    globalSearch: "#globalSearch, [data-global-search]"
  };

  /* ===================== HELPERS ===================== */

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function on(element, eventName, handler, options) {
    if (!element) return;

    element.addEventListener(eventName, handler, options);

    state.eventListeners.push({
      element,
      eventName,
      handler,
      options
    });
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function safeText(element, value) {
    if (element) {
      element.textContent = String(value ?? "");
    }
  }

  function getElement(selector) {
    return $(selector);
  }

  function getAll(selector) {
    return $$(selector);
  }

  function storageKey(key) {
    return CONFIG.storagePrefix + key;
  }

  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(storageKey(key));

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.warn("تعذر قراءة البيانات المحلية:", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        storageKey(key),
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.warn("تعذر حفظ البيانات المحلية:", error);
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(storageKey(key));
      return true;
    } catch (error) {
      console.warn("تعذر حذف البيانات المحلية:", error);
      return false;
    }
  }

  function dispatch(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(`mostaqbali:${name}`, {
        detail
      })
    );
  }

  function setLoading(button, loading, label = "جارٍ التنفيذ...") {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
      }

      button.disabled = true;
      button.setAttribute("aria-busy", "true");

      button.innerHTML = `
        <span class="app-spinner" aria-hidden="true"></span>
        <span>${escapeHTML(label)}</span>
      `;
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");

      if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    }
  }

  /* ===================== DYNAMIC STYLES ===================== */

  function installRuntimeStyles() {
    if ($("#mostaqbali-runtime-styles")) return;

    const style = document.createElement("style");

    style.id = "mostaqbali-runtime-styles";

    style.textContent = `
      .app-spinner {
        display: inline-block;
        width: 17px;
        height: 17px;
        border: 2px solid currentColor;
        border-left-color: transparent;
        border-radius: 50%;
        animation: mostaqbaliSpin .7s linear infinite;
      }

      @keyframes mostaqbaliSpin {
        to { transform: rotate(360deg); }
      }

      .app-view {
        animation: mostaqbaliViewIn .22s ease both;
      }

      @keyframes mostaqbaliViewIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      body.app-modal-open {
        overflow: hidden;
      }

      body.app-menu-open {
        overflow: hidden;
      }

      .app-field-error {
        display: block;
        color: #e94d65;
        font-size: 11px;
        margin-top: 6px;
      }

      .app-field-invalid {
        border-color: #e94d65 !important;
      }

      .app-status-online {
        width: 8px;
        height: 8px;
        display: inline-block;
        border-radius: 50%;
        background: #16a879;
      }

      .app-hidden {
        display: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .app-view,
        .app-spinner {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ===================== SPLASH SCREEN ===================== */

  function finishSplash() {
    if (state.splashFinished) return;

    state.splashFinished = true;

    const splash = $(SELECTORS.splash);

    if (!splash) {
      dispatch("splash-finished");
      return;
    }

    splash.style.transition = "opacity .35s ease";
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";

    window.setTimeout(() => {
      splash.hidden = true;
      splash.setAttribute("aria-hidden", "true");

      dispatch("splash-finished");
    }, 360);
  }

  function initializeSplash() {
    const splash = $(SELECTORS.splash);

    if (!splash) {
      state.splashFinished = true;
      return;
    }

    splash.hidden = false;
    splash.removeAttribute("aria-hidden");
    splash.style.opacity = "1";
    splash.style.pointerEvents = "";

    window.setTimeout(
      finishSplash,
      CONFIG.splashDuration
    );
  }

  /* ===================== TOAST NOTIFICATIONS ===================== */

  function ensureToastContainer() {
    let container = $(SELECTORS.toastContainer);

    if (container) return container;

    container = document.createElement("div");
    container.className = "toast-container";
    container.id = "toastContainer";

    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");

    document.body.appendChild(container);

    return container;
  }

  function toast(message, type = "info", options = {}) {
    const container = ensureToastContainer();

    const id =
      "toast-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8);

    const titles = {
      success: "تم بنجاح",
      error: "حدث خطأ",
      warning: "تنبيه",
      info: "معلومة"
    };

    const icons = {
      success: "✓",
      error: "!",
      warning: "!",
      info: "i"
    };

    const toastElement = document.createElement("div");

    toastElement.className = `toast ${type}`;
    toastElement.dataset.toastId = id;

    const icon = document.createElement("div");
    icon.className = "toast-icon";
    icon.textContent = icons[type] || icons.info;

    const content = document.createElement("div");
    content.style.flex = "1";

    const title = document.createElement("div");
    title.className = "toast-title";
    title.textContent = options.title || titles[type] || titles.info;

    const body = document.createElement("div");
    body.className = "toast-message";
    body.textContent = String(message ?? "");

    content.append(title, body);
    toastElement.append(icon, content);
    container.appendChild(toastElement);

    const duration = Number(options.duration) || CONFIG.toastDuration;

    const timer = window.setTimeout(() => {
      toastElement.style.opacity = "0";
      toastElement.style.transform = "translateX(-10px)";

      window.setTimeout(() => {
        toastElement.remove();
        state.toastTimers.delete(id);
      }, 250);
    }, duration);

    state.toastTimers.set(id, timer);

    return id;
  }

  function dismissToast(id) {
    const timer = state.toastTimers.get(id);

    if (timer) {
      clearTimeout(timer);
      state.toastTimers.delete(id);
    }

    const element = $(`[data-toast-id="${id}"]`);

    if (element) {
      element.remove();
    }
  }

  /* ===================== MODALS ===================== */

  function ensureModalRoot() {
    let root = $("#modalRoot");

    if (root) return root;

    root = document.createElement("div");
    root.id = "modalRoot";

    document.body.appendChild(root);

    return root;
  }

  function openModal(options = {}) {
    const root = ensureModalRoot();

    if (state.modalOpen) {
      closeModal();
    }

    const {
      title = "",
      content = "",
      size = "",
      confirmText = "",
      cancelText = "إغلاق",
      onConfirm = null,
      onClose = null
    } = options;

    const backdrop = document.createElement("div");

    backdrop.className = "modal-backdrop";
    backdrop.dataset.modalBackdrop = "true";

    const modal = document.createElement("section");

    modal.className = `modal ${size ? `modal-${size}` : ""}`;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title || "نافذة");

    const header = document.createElement("header");
    header.className = "modal-header";

    const heading = document.createElement("h2");
    heading.className = "modal-title";
    heading.textContent = title;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn-icon";
    closeButton.setAttribute("aria-label", "إغلاق النافذة");
    closeButton.innerHTML = "&times;";

    header.append(heading, closeButton);

    const body = document.createElement("div");
    body.className = "modal-body";

    if (content instanceof Node) {
      body.appendChild(content);
    } else {
      body.innerHTML = String(content);
    }

    const footer = document.createElement("footer");
    footer.className = "modal-footer";

    if (confirmText) {
      const confirmButton = document.createElement("button");

      confirmButton.type = "button";
      confirmButton.className = "btn btn-primary";
      confirmButton.textContent = confirmText;

      on(confirmButton, "click", async () => {
        if (typeof onConfirm !== "function") {
          closeModal();
          return;
        }

        try {
          const result = await onConfirm();

          if (result !== false) {
            closeModal();
          }
        } catch (error) {
          console.error(error);

          toast(
            "حصل خطأ أثناء تنفيذ العملية.",
            "error"
          );
        }
      });

      footer.appendChild(confirmButton);
    }

    if (cancelText) {
      const cancelButton = document.createElement("button");

      cancelButton.type = "button";
      cancelButton.className = "btn btn-light";
      cancelButton.textContent = cancelText;

      on(cancelButton, "click", closeModal);

      footer.appendChild(cancelButton);
    }

    modal.append(header, body);

    if (footer.children.length) {
      modal.appendChild(footer);
    }

    backdrop.appendChild(modal);
    root.appendChild(backdrop);

    state.modalOpen = true;
    state.modalCloseCallback = onClose || null;

    document.body.classList.add("app-modal-open");

    on(closeButton, "click", closeModal);

    on(backdrop, "click", event => {
      if (event.target === backdrop) {
        closeModal();
      }
    });

    state.lastFocusedElement = document.activeElement;

    closeButton.focus();

    return {
      element: backdrop,
      close: closeModal
    };
  }

  function closeModal() {
    const root = $("#modalRoot");

    if (root) {
      root.replaceChildren();
    }

    state.modalOpen = false;

    document.body.classList.remove("app-modal-open");

    const callback = state.modalCloseCallback;

    state.modalCloseCallback = null;

    if (typeof callback === "function") {
      callback();
    }

    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement.focus === "function"
    ) {
      state.lastFocusedElement.focus();
    }
  }

  function confirm(options = {}) {
    const {
      title = "تأكيد العملية",
      message = "هل تريد المتابعة؟",
      confirmText = "تأكيد",
      cancelText = "إلغاء",
      danger = false
    } = options;

    return new Promise(resolve => {
      const content = document.createElement("p");

      content.textContent = message;
      content.style.color = "var(--text-secondary)";
      content.style.fontSize = "13px";
      content.style.lineHeight = "2";

      const modal = openModal({
        title,
        content,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true);
          return true;
        },
        onClose: () => {
          resolve(false);
        }
      });

      const confirmButton = $(
        ".modal-footer .btn-primary, .modal-footer .btn-danger",
        modal.element
      );

      if (danger && confirmButton) {
        confirmButton.classList.remove("btn-primary");
        confirmButton.classList.add("btn-danger");
      }
    });
  }

  /* ===================== SIDEBAR ===================== */

  function getSidebar() {
    return $(SELECTORS.sidebar);
  }

  function getSidebarBackdrop() {
    return $(SELECTORS.sidebarBackdrop);
  }

  function openSidebar() {
    const sidebar = getSidebar();

    if (!sidebar) return;

    sidebar.classList.add("open");

    const backdrop = getSidebarBackdrop();

    if (backdrop) {
      backdrop.classList.add("open");
    }

    state.menuOpen = true;

    document.body.classList.add("app-menu-open");

    const toggle = $(SELECTORS.menuToggle);

    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }

    dispatch("sidebar-open");
  }

  function closeSidebar() {
    const sidebar = getSidebar();

    if (sidebar) {
      sidebar.classList.remove("open");
    }

    const backdrop = getSidebarBackdrop();

    if (backdrop) {
      backdrop.classList.remove("open");
    }

    state.menuOpen = false;

    document.body.classList.remove("app-menu-open");

    const toggle = $(SELECTORS.menuToggle);

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }

    dispatch("sidebar-close");
  }

  function toggleSidebar() {
    if (state.menuOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function initializeSidebar() {
    const toggle = $(SELECTORS.menuToggle);
    const backdrop = getSidebarBackdrop();

    on(toggle, "click", toggleSidebar);
    on(backdrop, "click", closeSidebar);

    $$(".sidebar-link, [data-sidebar-link]").forEach(link => {
      on(link, "click", () => {
        if (window.innerWidth <= 900) {
          closeSidebar();
        }
      });
    });
  }

  /* ===================== PAGE NAVIGATION ===================== */

  function normalizePage(page) {
    return String(page || "home")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function getPageElements() {
    return $$("[data-page]");
  }

  function navigate(page, options = {}) {
    const targetPage = normalizePage(page);

    if (!targetPage) return false;

    const pages = getPageElements();

    const target = pages.find(element => {
      return element.dataset.page === targetPage;
    });

    if (!target) {
      const customNavigation = window.MostaqbaliPages;

      if (
        customNavigation &&
        typeof customNavigation.navigate === "function"
      ) {
        customNavigation.navigate(targetPage);
        return true;
      }

      toast(
        "الشاشة المطلوبة غير موجودة في الواجهة الحالية.",
        "warning"
      );

      return false;
    }

    state.previousPage = state.currentPage;
    state.currentPage = targetPage;

    pages.forEach(element => {
      const active = element === target;

      element.hidden = !active;
      element.classList.toggle("app-view", active);

      if (active) {
        element.setAttribute("aria-current", "page");
      } else {
        element.removeAttribute("aria-current");
      }
    });

    $$("[data-navigate]").forEach(link => {
      const active = link.dataset.navigate === targetPage;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    $$("[data-sidebar-link]").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.sidebarLink === targetPage
      );
    });

    if (options.updateHash !== false) {
      try {
        history.replaceState(
          { page: targetPage },
          "",
          `#${targetPage}`
        );
      } catch (error) {
        console.warn("تعذر تحديث عنوان الشاشة:", error);
      }
    }

    if (options.scroll !== false) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    closeSidebar();

    dispatch("navigate", {
      page: targetPage,
      previousPage: state.previousPage
    });

    return true;
  }

  function initializeNavigation() {
    on(document, "click", event => {
      const link = event.target.closest(
        "[data-navigate], [data-page-link]"
      );

      if (!link) return;

      const page =
        link.dataset.navigate ||
        link.dataset.pageLink;

      if (!page) return;

      event.preventDefault();

      navigate(page);
    });

    const initialHash = window.location.hash.replace("#", "");

    if (
      initialHash &&
      getPageElements().some(element => {
        return element.dataset.page === initialHash;
      })
    ) {
      navigate(initialHash, {
        updateHash: false,
        scroll: false
      });
      return;
    }

    const activePage = getPageElements().find(element => {
      return !element.hidden &&
        element.dataset.page;
    });

    if (activePage) {
      navigate(activePage.dataset.page, {
        updateHash: false,
        scroll: false
      });
    }
  }

  /* ===================== SEARCH ===================== */

  function initializeSearch() {
    const searchInputs = $$(
      `${SELECTORS.globalSearch}, [data-search-input]`
    );

    searchInputs.forEach(input => {
      on(input, "input", () => {
        clearTimeout(state.searchTimer);

        state.searchTimer = window.setTimeout(() => {
          const query = input.value.trim();

          dispatch("search", {
            query,
            input
          });

          applyLocalSearch(query, input);
        }, 180);
      });
    });
  }

  function applyLocalSearch(query, input) {
    const targetSelector = input.dataset.searchTarget;

    if (!targetSelector) return;

    const container = $(targetSelector);

    if (!container) return;

    const items = $$("[data-search-item]", container);

    items.forEach(item => {
      const text = (
        item.dataset.searchText ||
        item.textContent ||
        ""
      ).toLocaleLowerCase("ar");

      const normalizedQuery = query.toLocaleLowerCase("ar");

      item.hidden = Boolean(
        normalizedQuery &&
        !text.includes(normalizedQuery)
      );
    });

    const visibleCount = items.filter(item => !item.hidden).length;

    dispatch("search-results", {
      query,
      visibleCount,
      container
    });
  }

  /* ===================== FILTERS ===================== */

  function initializeFilters() {
    on(document, "click", event => {
      const chip = event.target.closest("[data-filter]");

      if (!chip) return;

      const group = chip.dataset.filterGroup || "default";
      const value = chip.dataset.filter;

      $$(`[data-filter-group="${group}"]`).forEach(item => {
        item.classList.toggle("active", item === chip);
      });

      const targetSelector = chip.dataset.filterTarget;

      if (!targetSelector) {
        dispatch("filter", {
          group,
          value,
          chip
        });

        return;
      }

      const container = $(targetSelector);

      if (!container) return;

      $$("[data-filter-value]", container).forEach(item => {
        const itemValue = item.dataset.filterValue;

        item.hidden = value !== "all" && itemValue !== value;
      });

      dispatch("filter", {
        group,
        value,
        chip,
        container
      });
    });
  }

  /* ===================== FORM VALIDATION ===================== */

  function clearFieldError(input) {
    if (!input) return;

    input.classList.remove("app-field-invalid");
    input.removeAttribute("aria-invalid");

    const parent = input.closest(".form-group") || input.parentElement;

    if (!parent) return;

    const error = $(".app-field-error", parent);

    if (error) {
      error.remove();
    }
  }

  function setFieldError(input, message) {
    if (!input) return;

    clearFieldError(input);

    input.classList.add("app-field-invalid");
    input.setAttribute("aria-invalid", "true");

    const parent = input.closest(".form-group") || input.parentElement;

    if (!parent) return;

    const error = document.createElement("span");

    error.className = "app-field-error";
    error.textContent = message;

    parent.appendChild(error);
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(value || "").trim()
    );
  }

  function validatePhone(value) {
    const normalized = String(value || "")
      .replace(/[\s()-]/g, "");

    return /^(?:\+?20|0)?1[0125]\d{8}$/.test(normalized);
  }

  function validatePassword(value) {
    return String(value || "").length >= 8;
  }

  function validateForm(form) {
    if (!form) return false;

    let valid = true;
    let firstInvalid = null;

    const fields = $$(
      "input, select, textarea",
      form
    ).filter(input => {
      return !input.disabled &&
        input.type !== "hidden" &&
        input.type !== "submit" &&
        input.type !== "button";
    });

    fields.forEach(input => {
      clearFieldError(input);

      const value = String(input.value || "").trim();

      let error = "";

      if (input.required && !value) {
        error = "الحقل ده مطلوب.";
      } else if (
        value &&
        input.type === "email" &&
        !validateEmail(value)
      ) {
        error = "اكتب بريدًا إلكترونيًا صحيحًا.";
      } else if (
        value &&
        input.dataset.validate === "phone" &&
        !validatePhone(value)
      ) {
        error = "اكتب رقم هاتف مصري صحيحًا.";
      } else if (
        input.dataset.validate === "password" &&
        !validatePassword(input.value)
      ) {
        error = "كلمة المرور لازم تكون 8 أحرف على الأقل.";
      } else if (
        input.dataset.match &&
        input.value !== $(input.dataset.match, form)?.value
      ) {
        error = "القيمتان غير متطابقتين.";
      }

      if (error) {
        valid = false;

        setFieldError(input, error);

        if (!firstInvalid) {
          firstInvalid = input;
        }
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return valid;
  }

  function initializeForms() {
    on(document, "input", event => {
      const input = event.target;

      if (
        input.matches(
          ".app-field-invalid, [aria-invalid='true']"
        )
      ) {
        clearFieldError(input);
      }
    });

    on(document, "submit", event => {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) return;

      if (form.dataset.validate !== "true") return;

      if (!validateForm(form)) {
        event.preventDefault();

        toast(
          "راجع البيانات المطلوبة قبل المتابعة.",
          "warning"
        );

        return;
      }

      dispatch("form-valid", {
        form
      });
    });
  }

  /* ===================== PASSWORD VISIBILITY ===================== */

  function initializePasswordToggles() {
    on(document, "click", event => {
      const button = event.target.closest(
        "[data-toggle-password]"
      );

      if (!button) return;

      const selector = button.dataset.togglePassword;

      const input = selector
        ? $(selector)
        : button.parentElement?.querySelector("input");

      if (!input) return;

      const show = input.type === "password";

      input.type = show ? "text" : "password";

      button.setAttribute(
        "aria-label",
        show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
      );

      button.setAttribute(
        "aria-pressed",
        String(show)
      );
    });
  }

  /* ===================== FILE UPLOADS ===================== */

  function initializeFileInputs() {
    on(document, "change", event => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) return;

      if (input.type !== "file") return;

      const files = Array.from(input.files || []);

      if (!files.length) return;

      const maxSizeMB = Number(input.dataset.maxSizeMb) || 10;
      const maxBytes = maxSizeMB * 1024 * 1024;

      const allowedTypes = input.dataset.allowedTypes
        ? input.dataset.allowedTypes
            .split(",")
            .map(type => type.trim().toLowerCase())
        : [];

      const invalidFile = files.find(file => {
        if (file.size > maxBytes) return true;

        if (
          allowedTypes.length &&
          !allowedTypes.some(type => {
            if (type.startsWith(".")) {
              return file.name.toLowerCase().endsWith(type);
            }

            return file.type.toLowerCase().includes(type);
          })
        ) {
          return true;
        }

        return false;
      });

      if (invalidFile) {
        input.value = "";

        toast(
          `الملف "${invalidFile.name}" غير مناسب للحجم أو النوع المحدد.`,
          "error"
        );

        return;
      }

      const targetSelector = input.dataset.filePreview;

      if (targetSelector) {
        const target = $(targetSelector);

        if (target) {
          target.replaceChildren();

          files.forEach(file => {
            const item = document.createElement("div");

            item.className = "file-item";

            const info = document.createElement("div");

            info.className = "file-info";

            const name = document.createElement("div");

            name.className = "file-name";
            name.textContent = file.name;

            const meta = document.createElement("div");

            meta.className = "file-meta";
            meta.textContent = formatFileSize(file.size);

            info.append(name, meta);
            item.appendChild(info);

            target.appendChild(item);
          });
        }
      }

      dispatch("files-selected", {
        files,
        input
      });
    });
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return "حجم غير معروف";
    }

    if (bytes < 1024) {
      return `${bytes} بايت`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  }

  /* ===================== IMAGE PREVIEWS ===================== */

  function initializeImagePreviews() {
    on(document, "change", event => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) return;

      if (
        input.type !== "file" ||
        !input.dataset.imagePreview
      ) {
        return;
      }

      const target = $(input.dataset.imagePreview);

      if (!target) return;

      const file = input.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast(
          "اختار ملف صورة صالحًا.",
          "warning"
        );

        input.value = "";
        return;
      }

      const objectURL = URL.createObjectURL(file);

      if (target instanceof HTMLImageElement) {
        const previousURL = target.dataset.objectUrl;

        if (previousURL) {
          URL.revokeObjectURL(previousURL);
        }

        target.src = objectURL;
        target.dataset.objectUrl = objectURL;
        target.hidden = false;
      } else {
        target.replaceChildren();

        const image = document.createElement("img");

        image.src = objectURL;
        image.alt = "معاينة الصورة";
        image.style.maxWidth = "100%";
        image.style.maxHeight = "280px";
        image.style.objectFit = "contain";
        image.dataset.objectUrl = objectURL;

        target.appendChild(image);
      }
    });
  }

  /* ===================== GLOBAL CLICK ACTIONS ===================== */

  function initializeActions() {
    on(document, "click", async event => {
      const button = event.target.closest("[data-action]");

      if (!button) return;

      const action = button.dataset.action;

      switch (action) {
        case "open-menu":
          openSidebar();
          break;

        case "close-menu":
          closeSidebar();
          break;

        case "open-modal": {
          const title = button.dataset.modalTitle || "";

          const message = button.dataset.modalMessage || "";

          openModal({
            title,
            content: escapeHTML(message),
            cancelText: "إغلاق"
          });

          break;
        }

        case "close-modal":
          closeModal();
          break;

        case "go-back":
          if (state.previousPage) {
            navigate(state.previousPage);
          } else {
            history.back();
          }
          break;

        case "scroll-top":
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
          break;

        case "sign-out": {
          const accepted = await confirm({
            title: "تسجيل الخروج",
            message: "هل أنت متأكد إنك عايز تسجل الخروج؟",
            confirmText: "تسجيل الخروج",
            cancelText: "إلغاء"
          });

          if (!accepted) return;

          dispatch("sign-out-requested");
          break;
        }

        case "show-notice":
          toast(
            button.dataset.message || "لا توجد تفاصيل إضافية.",
            button.dataset.type || "info"
          );
          break;

        default:
          dispatch("action", {
            action,
            button
          });
      }
    });
  }

  /* ===================== KEYBOARD ===================== */

  function initializeKeyboard() {
    on(document, "keydown", event => {
      if (event.key === "Escape") {
        if (state.modalOpen) {
          closeModal();
          return;
        }

        if (state.menuOpen) {
          closeSidebar();
        }
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        const search = $(SELECTORS.globalSearch);

        if (search) {
          event.preventDefault();
          search.focus();
        }
      }
    });
  }

  /* ===================== NETWORK STATUS ===================== */

  function initializeNetworkStatus() {
    function updateStatus() {
      const online = navigator.onLine;

      $$("[data-network-status]").forEach(element => {
        element.textContent = online
          ? "متصل بالإنترنت"
          : "لا يوجد اتصال بالإنترنت";

        element.classList.toggle("text-success", online);
        element.classList.toggle("text-danger", !online);
      });

      dispatch("network-status", {
        online
      });
    }

    on(window, "online", updateStatus);
    on(window, "offline", updateStatus);

    updateStatus();
  }

  /* ===================== CURRENT YEAR ===================== */

  function initializeCurrentYear() {
    $$("[data-current-year]").forEach(element => {
      element.textContent = String(new Date().getFullYear());
    });
  }

  /* ===================== EXTERNAL LINKS ===================== */

  function initializeExternalLinks() {
    $$('a[href^="http"]').forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);

        if (url.origin !== window.location.origin) {
          link.rel = "noopener noreferrer";
        }
      } catch (error) {
        console.warn("رابط غير صالح:", link.href);
      }
    });
  }

  /* ===================== EVENT CLEANUP ===================== */

  function destroy() {
    state.eventListeners.forEach(item => {
      item.element.removeEventListener(
        item.eventName,
        item.handler,
        item.options
      );
    });

    state.eventListeners = [];

    state.toastTimers.forEach(timer => {
      clearTimeout(timer);
    });

    state.toastTimers.clear();

    clearTimeout(state.searchTimer);

    state.initialized = false;
  }

  /* ===================== INITIALIZATION ===================== */

  function init() {
    if (state.initialized) return;

    state.initialized = true;

    installRuntimeStyles();

    initializeCurrentYear();
    initializeSplash();
    initializeSidebar();
    initializeNavigation();
    initializeSearch();
    initializeFilters();
    initializeForms();
    initializePasswordToggles();
    initializeFileInputs();
    initializeImagePreviews();
    initializeActions();
    initializeKeyboard();
    initializeNetworkStatus();
    initializeExternalLinks();

    dispatch("ready", {
      appName: CONFIG.appName,
      version: "1.0.0"
    });

    console.info(
      "%cMOSTAQBALI | المستقبلي",
      "color:#2864f0;font-size:16px;font-weight:bold"
    );

    console.info(
      "تم تشغيل أدوات الواجهة الأمامية."
    );
  }

  /* ===================== PUBLIC API ===================== */

  return {
    init,

    destroy,

    config: Object.freeze({ ...CONFIG }),

    getState() {
      return { ...state };
    },

    navigate,

    openSidebar,
    closeSidebar,
    toggleSidebar,

    openModal,
    closeModal,
    confirm,

    toast,
    dismissToast,

    validateForm,
    validateEmail,
    validatePhone,
    validatePassword,

    setLoading,

    readStorage,
    writeStorage,
    removeStorage,

    escapeHTML,
    formatFileSize,

    dispatch,

    getElement,
    getAll
  };
})();

/* ===================== GLOBAL ACCESS ===================== */

window.MostaqbaliApp = MostaqbaliApp;

/* ===================== START APPLICATION ===================== */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    MostaqbaliApp.init,
    { once: true }
  );
} else {
  MostaqbaliApp.init();
                }
