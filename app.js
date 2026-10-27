"use strict";

/* =========================================================
   MOSTAQBALI | المستقبلي
   File: app.js
   Main Frontend Controller
   Compatible with the supplied index.html and config.js
   ========================================================= */

(function () {
  const CONFIG = {
    appName: "المستقبلي",
    englishName: "MOSTAQBALI",
    version: "1.0.1",
    splashDuration: 5000,
    toastDuration: 3500,
    storagePrefix: "mostaqbali_"
  };

  const state = {
    initialized: false,
    currentPage: "home",
    previousPage: "home",
    currentUser: null,
    splashFinished: false,
    menuOpen: false,
    modalOpen: false,
    toastTimers: new Map(),
    lastFocusedElement: null,
    modalCloseCallback: null
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function dispatch(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(`mostaqbali:${name}`, { detail })
    );
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(CONFIG.storagePrefix + key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn("[MOSTAQBALI] تعذرت قراءة البيانات المحلية.", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        CONFIG.storagePrefix + key,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.warn("[MOSTAQBALI] تعذر حفظ البيانات المحلية.", error);
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(CONFIG.storagePrefix + key);
      return true;
    } catch {
      return false;
    }
  }

  function getConfig(path, fallback = undefined) {
    const config = window.MOSTAQBALI_CONFIG;
    if (!config || typeof path !== "string") return fallback;

    const result = path.split(".").reduce((value, key) => {
      if (
        value === null ||
        value === undefined ||
        !Object.prototype.hasOwnProperty.call(value, key)
      ) {
        return undefined;
      }
      return value[key];
    }, config);

    return result === undefined ? fallback : result;
  }

  /* ==================== STYLES ==================== */

  function installRuntimeStyles() {
    if ($("#mostaqbali-runtime-styles")) return;

    const style = document.createElement("style");
    style.id = "mostaqbali-runtime-styles";

    style.textContent = `
      .app-spinner {
        display:inline-block;
        width:17px;height:17px;
        border:2px solid currentColor;
        border-left-color:transparent;
        border-radius:50%;
        animation:mostaqbali-spin .7s linear infinite;
      }

      @keyframes mostaqbali-spin {
        to { transform:rotate(360deg); }
      }

      .app-view {
        animation:mostaqbali-view-in .22s ease both;
      }

      @keyframes mostaqbali-view-in {
        from { opacity:0;transform:translateY(5px); }
        to { opacity:1;transform:translateY(0); }
      }

      .app-field-error {
        display:block;color:#d94343;font-size:12px;margin-top:6px;
      }

      .app-field-invalid {
        border-color:#d94343 !important;
      }

      .toast-container {
        position:fixed;z-index:10000;top:18px;left:18px;
        display:flex;flex-direction:column;gap:10px;
        width:min(360px,calc(100vw - 36px));
      }

      .toast {
        display:flex;gap:12px;align-items:flex-start;
        padding:14px;border-radius:14px;
        background:#fff;color:#17233f;
        box-shadow:0 12px 35px #101b3d20;
        border:1px solid #e7ebf4;
        transition:opacity .2s ease,transform .2s ease;
      }

      .toast-icon {
        width:28px;height:28px;flex-shrink:0;
        display:grid;place-items:center;border-radius:50%;
        background:#eef3ff;color:#2864f0;font-weight:800;
      }

      .toast.success .toast-icon { background:#e8f8f0;color:#159b69; }
      .toast.error .toast-icon { background:#fff0f0;color:#d94343; }
      .toast.warning .toast-icon { background:#fff7e6;color:#b77908; }

      .toast-title { font-weight:800;font-size:13px;margin-bottom:4px; }
      .toast-message { font-size:12px;line-height:1.8; }

      #modalRoot:empty { display:none; }

      .modal-backdrop {
        position:fixed;inset:0;z-index:10001;
        display:grid;place-items:center;padding:18px;
        background:#101b3d80;overflow:auto;
      }

      .modal {
        width:min(480px,100%);max-height:90vh;overflow:auto;
        background:#fff;color:#17233f;border-radius:20px;
        box-shadow:0 24px 70px #0003;
      }

      .modal-header,.modal-footer {
        display:flex;align-items:center;justify-content:space-between;
        gap:12px;padding:16px 20px;
      }

      .modal-header { border-bottom:1px solid #edf0f6; }
      .modal-title { margin:0;font-size:18px; }
      .modal-body { padding:20px;line-height:1.9; }
      .modal-footer { justify-content:flex-start;border-top:1px solid #edf0f6; }
      .modal-footer button { cursor:pointer; }
      .btn-icon { border:0;background:transparent;font-size:26px;cursor:pointer; }

      body.app-modal-open,body.app-menu-open { overflow:hidden; }

      @media(prefers-reduced-motion:reduce) {
        .app-view,.app-spinner { animation:none !important; }
      }
    `;

    document.head.appendChild(style);
  }

  /* ==================== SPLASH SCREEN ==================== */

  function finishSplash() {
    if (state.splashFinished) return;

    state.splashFinished = true;

    const splash = $("#splash-screen") || $(".splash-screen");
    const app = $("#app") || $("#mainApp");

    /*
     * مهم: إظهار التطبيق قبل إخفاء شاشة البداية
     * يمنع ظهور شاشة فارغة بين المرحلتين.
     */
    if (app) {
      app.hidden = false;
      app.removeAttribute("hidden");
      app.style.removeProperty("display");
    }

    if (splash) {
      splash.style.transition = "opacity .35s ease";
      splash.style.opacity = "0";
      splash.style.pointerEvents = "none";
      splash.setAttribute("aria-hidden", "true");

      window.setTimeout(() => {
        splash.hidden = true;
        splash.style.display = "none";
      }, 370);
    }

    /*
     * عرض الصفحة الصحيحة بعد ظهور التطبيق.
     * الصفحة الرئيسية هي الاختيار الافتراضي.
     */
    const hashPage = window.location.hash
      .replace(/^#/, "")
      .trim();

    const routeMap = {
      subjects: "home",
      "how-it-works": "home"
    };

    const requestedPage = routeMap[hashPage] || hashPage;

    const availablePages = $$("[data-page]");
    const requestedExists = availablePages.some(
      page => page.dataset.page === requestedPage
    );

    const initialPage = requestedExists
      ? requestedPage
      : "home";

    if (availablePages.length) {
      showPage(initialPage, {
        updateHash: false,
        scroll: false
      });
    }

    dispatch("splash-finished", { page: state.currentPage });
  }

  function initializeSplash() {
    const splash = $("#splash-screen") || $(".splash-screen");
    const app = $("#app") || $("#mainApp");

    if (app) app.hidden = true;

    if (!splash) {
      finishSplash();
      return;
    }

    splash.hidden = false;
    splash.style.display = "";
    splash.style.opacity = "1";
    splash.style.pointerEvents = "";
    splash.removeAttribute("aria-hidden");

    const duration = Number(
      getConfig("app.splashDuration", CONFIG.splashDuration)
    );

    window.setTimeout(
      finishSplash,
      Number.isFinite(duration) && duration >= 0
        ? duration
        : CONFIG.splashDuration
    );
  }

  /* ==================== PAGE NAVIGATION ==================== */

  function normalizePage(page) {
    return String(page || "home")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function showPage(pageName, options = {}) {
    const page = normalizePage(pageName);
    const pages = $$("[data-page]");

    let target = pages.find(
      element => element.dataset.page === page
    );

    if (!target && page === "subjects") {
      target = $('[data-page="home"]');
    }

    if (!target && page === "how-it-works") {
      target = $('[data-page="home"]');
    }

    if (!target) {
      toast("الصفحة المطلوبة غير موجودة.", "warning");
      return false;
    }

    state.previousPage = state.currentPage;
    state.currentPage = target.dataset.page;

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

    /*
     * الإندكس يستخدم data-route.
     * ندعم كذلك data-navigate وdata-page-link.
     */
    $$("[data-route], [data-navigate], [data-page-link]").forEach(link => {
      const value =
        link.dataset.route ||
        link.dataset.navigate ||
        link.dataset.pageLink;

      const active =
        value === state.currentPage ||
        (
          value === "subjects" &&
          state.currentPage === "home"
        ) ||
        (
          value === "how-it-works" &&
          state.currentPage === "home"
        );

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (options.updateHash !== false) {
      try {
        history.replaceState(
          { page: state.currentPage },
          "",
          `#${page}`
        );
      } catch (error) {
        console.warn("[MOSTAQBALI] تعذر تحديث الرابط.", error);
      }
    }

    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    closeSidebar();

    dispatch("navigate", {
      page: state.currentPage,
      previousPage: state.previousPage
    });

    return true;
  }

  function navigate(page, options = {}) {
    const app = $("#app");

    if (app && app.hidden) {
      finishSplash();
    }

    return showPage(page, options);
  }

  function initializeNavigation() {
    on(document, "click", event => {
      const link = event.target.closest(
        "[data-route], [data-navigate], [data-page-link]"
      );

      if (!link) return;

      const page =
        link.dataset.route ||
        link.dataset.navigate ||
        link.dataset.pageLink;

      if (!page) return;

      event.preventDefault();

      if (page === "subjects" || page === "how-it-works") {
        navigate("home");
        window.setTimeout(() => {
          const section = page === "subjects"
            ? $("#subjects-section")
            : $("#how-it-works-section");

          section?.scrollIntoView({ behavior: "smooth" });
        }, 50);

        return;
      }

      navigate(page);
    });

    on(window, "hashchange", () => {
      if (!state.splashFinished) return;

      const page = window.location.hash.replace(/^#/, "");

      if (page) showPage(page, { updateHash: false });
    });
  }

  /* ==================== AUTH INTERFACE ==================== */

  function setAuthTab(tabName) {
    const tab = tabName === "register" ? "register" : "login";

    const loginPanel = $("#login-panel");
    const registerPanel = $("#register-panel");
    const forgotPanel = $("#forgot-password-panel");

    if (loginPanel) loginPanel.hidden = tab !== "login";
    if (registerPanel) registerPanel.hidden = tab !== "register";
    if (forgotPanel) forgotPanel.hidden = true;

    const loginTab = $("#login-tab");
    const registerTab = $("#register-tab");

    if (loginTab) {
      loginTab.classList.toggle("active", tab === "login");
      loginTab.setAttribute("aria-selected", String(tab === "login"));
    }

    if (registerTab) {
      registerTab.classList.toggle("active", tab === "register");
      registerTab.setAttribute("aria-selected", String(tab === "register"));
    }
  }

  function openAuth(tab = "login") {
    navigate("auth");
    setAuthTab(tab);
  }

  function openForgotPassword() {
    navigate("auth");

    const loginPanel = $("#login-panel");
    const registerPanel = $("#register-panel");
    const forgotPanel = $("#forgot-password-panel");

    if (loginPanel) loginPanel.hidden = true;
    if (registerPanel) registerPanel.hidden = true;
    if (forgotPanel) forgotPanel.hidden = false;

    $$(".auth-tab").forEach(tab => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });
  }

  function initializeAuthInterface() {
    on(document, "click", event => {
      const tab = event.target.closest("[data-auth-tab]");

      if (tab) {
        event.preventDefault();
        setAuthTab(tab.dataset.authTab);
        return;
      }

      const button = event.target.closest("[data-action]");
      if (!button) return;

      switch (button.dataset.action) {
        case "open-login":
          event.preventDefault();
          openAuth("login");
          break;

        case "open-register":
          event.preventDefault();
          openAuth("register");
          break;

        case "back-home":
          event.preventDefault();
          navigate("home");
          break;

        case "forgot-password":
          event.preventDefault();
          openForgotPassword();
          break;

        case "browse-teachers":
          event.preventDefault();
          navigate("teachers");
          break;

        case "browse-subject":
          event.preventDefault();
          navigate("teachers");

          if ($("#teacher-subject-filter")) {
            $("#teacher-subject-filter").value =
              button.dataset.subject || "";
          }

          dispatch("subject-selected", {
            subject: button.dataset.subject || ""
          });
          break;

        case "join-teacher":
          event.preventDefault();
          openAuth("register");

          if ($("#register-role")) {
            $("#register-role").value = "teacher";
            $("#register-role").dispatchEvent(
              new Event("change", { bubbles: true })
            );
          }
          break;

        case "open-parent-info":
          event.preventDefault();
          openAuth("register");

          if ($("#register-role")) {
            $("#register-role").value = "parent";
          }
          break;

        case "logout":
          event.preventDefault();
          logout();
          break;
      }
    });
  }

  function initializeTeacherFields() {
    const roleSelect = $("#register-role");
    const teacherFields = $("#teacher-application-fields");

    if (!roleSelect || !teacherFields) return;

    function update() {
      teacherFields.hidden = roleSelect.value !== "teacher";
    }

    on(roleSelect, "change", update);
    update();
  }

  /* ==================== FORMS ==================== */

  function setFormMessage(form, message, type = "info") {
    if (!form) return;

    const container = $(
      ".form-message",
      form
    ) || $(
      `#${form.id.replace("-form", "-message")}`
    );

    if (!container) {
      toast(message, type);
      return;
    }

    container.textContent = message;
    container.className = `form-message ${type}`;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(value || "").trim()
    );
  }

  function validPhone(value) {
    const phone = String(value || "").replace(/[\s()-]/g, "");
    return /^(?:\+?20|0)?1[0125]\d{8}$/.test(phone);
  }

  function clearErrors(form) {
    $$(".app-field-error", form).forEach(error => error.remove());

    $$("[aria-invalid='true']", form).forEach(input => {
      input.removeAttribute("aria-invalid");
      input.classList.remove("app-field-invalid");
    });
  }

  function fieldError(input, message) {
    input.classList.add("app-field-invalid");
    input.setAttribute("aria-invalid", "true");

    const error = document.createElement("span");
    error.className = "app-field-error";
    error.textContent = message;

    input.insertAdjacentElement("afterend", error);
  }

  function validateForm(form) {
    if (!form) return false;

    clearErrors(form);

    let valid = true;
    let firstInvalid = null;

    $$("input, select, textarea", form).forEach(input => {
      if (
        input.disabled ||
        input.type === "hidden" ||
        input.type === "button" ||
        input.type === "submit" ||
        input.type === "file"
      ) {
        if (input.type === "file" && input.required && !input.files?.length) {
          valid = false;
          firstInvalid ||= input;
          fieldError(input, "اختار الملف المطلوب.");
        }
        return;
      }

      const value = String(input.value || "").trim();
      let error = "";

      if (input.required && input.type === "checkbox" && !input.checked) {
        error = "لازم توافق على هذا الخيار.";
      } else if (input.required && input.type !== "checkbox" && !value) {
        error = "الحقل ده مطلوب.";
      } else if (value && input.type === "email" && !validEmail(value)) {
        error = "اكتب بريدًا إلكترونيًا صحيحًا.";
      } else if (
        value &&
        input.type === "tel" &&
        !validPhone(value)
      ) {
        error = "اكتب رقم هاتف مصري صحيحًا.";
      } else if (
        value &&
        input.type === "password" &&
        input.minLength >= 8 &&
        value.length < 8
      ) {
        error = "كلمة المرور لازم تكون 8 أحرف على الأقل.";
      } else if (
        input.name === "confirmPassword" &&
        value !== $("#register-password")?.value
      ) {
        error = "كلمتا المرور غير متطابقتين.";
      } else if (
        input.type === "number" &&
        value &&
        Number(value) <= 0
      ) {
        error = "أدخل رقمًا أكبر من صفر.";
      }

      if (error) {
        valid = false;
        fieldError(input, error);
        firstInvalid ||= input;
      }
    });

    if (firstInvalid) firstInvalid.focus();

    return valid;
  }

  async function handleFormSubmit(event) {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) return;

    const supported = [
      "login-form",
      "register-form",
      "forgot-password-form",
      "teacher-join-form",
      "payment-proof-form",
      "support-form"
    ];

    if (!supported.includes(form.id)) return;

    event.preventDefault();

    if (!validateForm(form)) {
      toast("راجع البيانات المطلوبة وحاول مرة أخرى.", "warning");
      return;
    }

    if (form.id === "register-form") {
      const data = new FormData(form);
      const role = String(data.get("role") || "student");

      /*
       * لا ننشئ حسابًا حقيقيًا محليًا.
       * التسجيل الفعلي يحتاج Backend آمنًا.
       */
      const message = role === "teacher"
        ? "تم التحقق من البيانات في الواجهة. إرسال طلب المدرس يحتاج إلى ربط الخادم."
        : "البيانات سليمة. لإنشاء الحساب فعليًا، يجب ربط خدمة الحسابات بالخادم.";

      setFormMessage(form, message, "info");
      toast(message, "info");
      dispatch("register-requested", {
        role,
        data: Object.fromEntries(data.entries())
      });
      return;
    }

    if (form.id === "login-form") {
      const message =
        "تسجيل الدخول الحقيقي غير مفعّل بعد. يجب ربط نظام الحسابات بالخادم.";

      setFormMessage(form, message, "warning");
      toast(message, "warning");

      dispatch("login-requested", {
        email: $("#login-email")?.value || ""
      });
      return;
    }

    if (form.id === "forgot-password-form") {
      const message =
        "استعادة كلمة المرور تحتاج إلى ربط خدمة البريد الإلكتروني والخادم.";

      setFormMessage(form, message, "info");
      toast(message, "info");
      return;
    }

    if (form.id === "teacher-join-form") {
      const message =
        "تم التحقق من البيانات في الواجهة. لم يُرسل الطلب إلى الإدارة لأن الخادم غير مربوط.";

      setFormMessage(form, message, "info");
      toast(message, "info");
      return;
    }

    if (form.id === "payment-proof-form") {
      const message =
        "لم يتم تأكيد الدفع. إرسال الإثبات ومراجعته يتطلبان خادمًا فعليًا.";

      setFormMessage(form, message, "warning");
      toast(message, "warning");
      return;
    }

    if (form.id === "support-form") {
      const message =
        "تم التحقق من البيانات. إرسال تذكرة الدعم يحتاج إلى ربط الخادم.";

      setFormMessage(form, message, "info");
      toast(message, "info");
    }
  }

  function initializeForms() {
    on(document, "submit", handleFormSubmit);

    on(document, "input", event => {
      const input = event.target;

      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLTextAreaElement ||
        input instanceof HTMLSelectElement
      ) {
        if (input.hasAttribute("aria-invalid")) {
          input.removeAttribute("aria-invalid");
          input.classList.remove("app-field-invalid");

          const next = input.nextElementSibling;
          if (next?.classList.contains("app-field-error")) {
            next.remove();
          }
        }
      }
    });
  }

  /* ==================== TOASTS ==================== */

  function ensureToastContainer() {
    let container = $("#toastContainer") || $("#toast-region");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    return container;
  }

  function toast(message, type = "info", options = {}) {
    const container = ensureToastContainer();
    const element = document.createElement("div");
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const titles = {
      success: "تم بنجاح",
      error: "حدث خطأ",
      warning: "تنبيه",
      info: "معلومة"
    };

    element.className = `toast ${type}`;
    element.dataset.toastId = id;

    const icon = document.createElement("div");
    icon.className = "toast-icon";
    icon.textContent = type === "success" ? "✓" :
      type === "error" ? "!" :
      type === "warning" ? "!" : "i";

    const content = document.createElement("div");
    content.style.flex = "1";

    const title = document.createElement("div");
    title.className = "toast-title";
    title.textContent = options.title || titles[type] || titles.info;

    const body = document.createElement("div");
    body.className = "toast-message";
    body.textContent = String(message ?? "");

    content.append(title, body);
    element.append(icon, content);
    container.appendChild(element);

    const duration = Number(options.duration) || CONFIG.toastDuration;

    const timer = window.setTimeout(() => {
      element.style.opacity = "0";
      element.style.transform = "translateX(-8px)";

      window.setTimeout(() => {
        element.remove();
        state.toastTimers.delete(id);
      }, 250);
    }, duration);

    state.toastTimers.set(id, timer);

    return id;
  }

  function dismissToast(id) {
    const timer = state.toastTimers.get(id);

    if (timer) clearTimeout(timer);

    state.toastTimers.delete(id);
    $(`[data-toast-id="${id}"]`)?.remove();
  }

  /* ==================== MODALS ==================== */

  function ensureModalRoot() {
    let root = $("#modalRoot");

    if (!root) {
      root = document.createElement("div");
      root.id = "modalRoot";
      document.body.appendChild(root);
    }

    return root;
  }

  function openModal(options = {}) {
    closeModal();

    const root = ensureModalRoot();
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const modal = document.createElement("section");
    modal.className = `modal ${options.size ? `modal-${options.size}` : ""}`;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", options.title || "نافذة");

    const header = document.createElement("header");
    header.className = "modal-header";

    const heading = document.createElement("h2");
    heading.className = "modal-title";
    heading.textContent = options.title || "";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn-icon";
    close.setAttribute("aria-label", "إغلاق النافذة");
    close.textContent = "×";

    header.append(heading, close);

    const body = document.createElement("div");
    body.className = "modal-body";

    if (options.content instanceof Node) {
      body.appendChild(options.content);
    } else {
      body.textContent = String(options.content || "");
    }

    const footer = document.createElement("footer");
    footer.className = "modal-footer";

    if (options.confirmText) {
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "btn btn-primary";
      confirmButton.textContent = options.confirmText;

      on(confirmButton, "click", async () => {
        try {
          const result = await options.onConfirm?.();
          if (result !== false) closeModal();
        } catch (error) {
          console.error(error);
          toast("تعذر تنفيذ العملية.", "error");
        }
      });

      footer.appendChild(confirmButton);
    }

    if (options.cancelText !== "") {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn-outline";
      cancel.textContent = options.cancelText || "إغلاق";
      on(cancel, "click", closeModal);
      footer.appendChild(cancel);
    }

    modal.append(header, body);

    if (footer.children.length) modal.appendChild(footer);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);

    state.modalOpen = true;
    state.modalCloseCallback = options.onClose || null;
    state.lastFocusedElement = document.activeElement;

    document.body.classList.add("app-modal-open");

    on(close, "click", closeModal);

    on(backdrop, "click", event => {
      if (event.target === backdrop) closeModal();
    });

    close.focus();

    return { element: backdrop, close: closeModal };
  }

  function closeModal() {
    const root = $("#modalRoot");
    if (root) root.replaceChildren();

    const wasOpen = state.modalOpen;
    state.modalOpen = false;

    document.body.classList.remove("app-modal-open");

    if (wasOpen && typeof state.modalCloseCallback === "function") {
      const callback = state.modalCloseCallback;
      state.modalCloseCallback = null;

      try {
        callback();
      } catch (error) {
        console.error(error);
      }
    }

    if (state.lastFocusedElement?.isConnected) {
      state.lastFocusedElement.focus();
    }

    state.lastFocusedElement = null;
  }

  function confirm(options = {}) {
    return new Promise(resolve => {
      let resolved = false;

      const finish = value => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      openModal({
        title: options.title || "تأكيد العملية",
        content: options.message || "هل تريد المتابعة؟",
        confirmText: options.confirmText || "تأكيد",
        cancelText: options.cancelText || "إلغاء",
        onConfirm: () => {
          finish(true);
          return true;
        },
        onClose: () => finish(false)
      });
    });
  }

  /* ==================== SIDEBAR ==================== */

  function openSidebar() {
    const sidebar = $("#sidebar") || $(".sidebar");
    const backdrop = $("#sidebarBackdrop") || $(".sidebar-backdrop");

    if (!sidebar) return;

    sidebar.classList.add("open");
    backdrop?.classList.add("open");

    state.menuOpen = true;
    document.body.classList.add("app-menu-open");

    const toggle = $("#menuToggle") ||
      $("#sidebarToggle") ||
      $(".header-menu-toggle");

    toggle?.setAttribute("aria-expanded", "true");
    dispatch("sidebar-open");
  }

  function closeSidebar() {
    const sidebar = $("#sidebar") || $(".sidebar");
    const backdrop = $("#sidebarBackdrop") || $(".sidebar-backdrop");

    sidebar?.classList.remove("open");
    backdrop?.classList.remove("open");

    state.menuOpen = false;
    document.body.classList.remove("app-menu-open");

    const toggle = $("#menuToggle") ||
      $("#sidebarToggle") ||
      $(".header-menu-toggle");

    toggle?.setAttribute("aria-expanded", "false");
    dispatch("sidebar-close");
  }

  function initializeSidebar() {
    on(document, "click", event => {
      const button = event.target.closest("[data-action]");

      if (!button) return;

      if (button.dataset.action === "open-menu") openSidebar();
      if (button.dataset.action === "close-menu") closeSidebar();
    });

    on($("#mobile-menu-toggle"), "click", () => {
      if (state.menuOpen) closeSidebar();
      else openSidebar();
    });

    on($("#sidebarBackdrop") || $(".sidebar-backdrop"), "click", closeSidebar);

    on($("#mobile-menu-toggle"), "click", () => {
      const button = $("#mobile-menu-toggle");
      button?.setAttribute("aria-expanded", String(state.menuOpen));
    });
  }

  /* ==================== GLOBAL ACTIONS ==================== */

  function logout() {
    state.currentUser = null;
    removeStorage("user");
    toast("تم إنهاء الجلسة المحلية.", "info");
    navigate("home");
    dispatch("logout");
  }

  function initializeActions() {
    on(document, "click", async event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      switch (button.dataset.action) {
        case "scroll-top":
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;

        case "show-notice":
          toast(button.dataset.message || "لا توجد تفاصيل إضافية.", button.dataset.type || "info");
          break;

        case "open-modal":
          openModal({
            title: button.dataset.modalTitle || "",
            content: button.dataset.modalMessage || "",
            cancelText: "إغلاق"
          });
          break;

        case "close-modal":
          closeModal();
          break;

        case "go-back":
          navigate(state.previousPage || "home");
          break;

        case "sign-out":
          if (await confirm({
            title: "تسجيل الخروج",
            message: "هل تريد تسجيل الخروج؟",
            confirmText: "تسجيل الخروج",
            cancelText: "إلغاء"
          })) {
            logout();
          }
          break;
      }
    });
  }

  /* ==================== SEARCH AND FILTERS ==================== */

  function initializeTeacherSearch() {
    const form = $("#teacher-search-form");
    const input = $("#teacher-search");
    const filter = $("#teacher-subject-filter");

    if (!form) return;

    on(form, "submit", event => {
      event.preventDefault();

      dispatch("teacher-search", {
        query: input?.value.trim() || "",
        subject: filter?.value || ""
      });

      toast(
        "البحث عن المدرسين الحقيقيين يحتاج إلى ربط قاعدة البيانات.",
        "info"
      );
    });

    on(filter, "change", () => {
      dispatch("teacher-filter", {
        subject: filter.value
      });
    });
  }

  function initializeGenericSearch() {
    $$("[data-search-input], [data-global-search]").forEach(input => {
      on(input, "input", () => {
        const query = input.value.trim().toLocaleLowerCase("ar");
        const selector = input.dataset.searchTarget;

        if (!selector) return;

        const container = $(selector);
        if (!container) return;

        $$("[data-search-item]", container).forEach(item => {
          const text = (
            item.dataset.searchText ||
            item.textContent ||
            ""
          ).toLocaleLowerCase("ar");

          item.hidden = Boolean(query && !text.includes(query));
        });
      });
    });

    on(document, "click", event => {
      const chip = event.target.closest("[data-filter]");
      if (!chip) return;

      const group = chip.dataset.filterGroup || "default";

      $$(`[data-filter-group="${group}"]`).forEach(item => {
        item.classList.toggle("active", item === chip);
      });

      const selector = chip.dataset.filterTarget;
      if (!selector) return;

      const container = $(selector);
      if (!container) return;

      $$("[data-filter-value]", container).forEach(item => {
        item.hidden =
          chip.dataset.filter !== "all" &&
          item.dataset.filterValue !== chip.dataset.filter;
      });
    });
  }

  /* ==================== PASSWORD VISIBILITY ==================== */

  function initializePasswordToggles() {
    on(document, "click", event => {
      const button = event.target.closest("[data-toggle-password]");
      if (!button) return;

      const input = $(button.dataset.togglePassword) ||
        button.parentElement?.querySelector("input");

      if (!input) return;

      input.type = input.type === "password" ? "text" : "password";
    });
  }

  /* ==================== FILE INPUTS ==================== */

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "حجم غير معروف";
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  }

  function initializeFileInputs() {
    on(document, "change", event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;

      const files = Array.from(input.files || []);
      if (!files.length) return;

      const maxMB = Number(input.dataset.maxSizeMb) || 20;
      const maxBytes = maxMB * 1024 * 1024;

      const invalid = files.find(file => file.size > maxBytes);

      if (invalid) {
        input.value = "";
        toast(`الملف ${invalid.name} أكبر من الحجم المسموح.`, "error");
        return;
      }

      const previewSelector = input.dataset.filePreview;
      const preview = previewSelector ? $(previewSelector) : null;

      if (preview) {
        preview.replaceChildren();

        files.forEach(file => {
          const item = document.createElement("div");
          item.className = "file-item";
          item.textContent = `${file.name} — ${formatFileSize(file.size)}`;
          preview.appendChild(item);
        });
      }

      dispatch("files-selected", { files, input });
    });
  }

  /* ==================== IMAGE PREVIEW ==================== */

  function initializeImagePreviews() {
    on(document, "change", event => {
      const input = event.target;

      if (
        !(input instanceof HTMLInputElement) ||
        input.type !== "file" ||
        !input.dataset.imagePreview
      ) {
        return;
      }

      const target = $(input.dataset.imagePreview);
      const file = input.files?.[0];

      if (!target || !file) return;

      if (!file.type.startsWith("image/")) {
        input.value = "";
        toast("اختار صورة صالحة.", "warning");
        return;
      }

      const url = URL.createObjectURL(file);

      if (target instanceof HTMLImageElement) {
        if (target.dataset.objectUrl) {
          URL.revokeObjectURL(target.dataset.objectUrl);
        }

        target.src = url;
        target.dataset.objectUrl = url;
        target.hidden = false;
        return;
      }

      target.replaceChildren();

      const image = document.createElement("img");
      image.src = url;
      image.alt = "معاينة الصورة";
      image.style.maxWidth = "100%";
      image.style.maxHeight = "280px";
      image.style.objectFit = "contain";
      image.dataset.objectUrl = url;

      target.appendChild(image);
    });
  }

  /* ==================== NETWORK STATUS ==================== */

  function initializeNetworkStatus() {
    function update() {
      const online = navigator.onLine;

      $$("[data-network-status]").forEach(element => {
        element.textContent = online
          ? "متصل بالإنترنت"
          : "لا يوجد اتصال بالإنترنت";

        element.classList.toggle("text-success", online);
        element.classList.toggle("text-danger", !online);
      });

      dispatch("network-status", { online });
    }

    on(window, "online", update);
    on(window, "offline", update);
    update();
  }

  /* ==================== KEYBOARD ==================== */

  function initializeKeyboard() {
    on(document, "keydown", event => {
      if (event.key === "Escape") {
        if (state.modalOpen) closeModal();
        else if (state.menuOpen) closeSidebar();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        const search = $("#globalSearch") || $("[data-global-search]");
        if (search) {
          event.preventDefault();
          search.focus();
        }
      }
    });
  }

  /* ==================== FOOTER YEAR ==================== */

  function initializeCurrentYear() {
    const year = String(new Date().getFullYear());

    $("#current-year")?.replaceChildren(document.createTextNode(year));

    $$("[data-current-year]").forEach(element => {
      element.textContent = year;
    });
  }

  /* ==================== EXTERNAL LINKS ==================== */

  function initializeExternalLinks() {
    $$('a[href^="http"]').forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);

        if (url.origin !== window.location.origin) {
          link.rel = "noopener noreferrer";
        }
      } catch (error) {
        console.warn("[MOSTAQBALI] رابط غير صالح.", error);
      }
    });
  }

  /* ==================== EVENT HELPERS ==================== */

  const listeners = [];

  function on(element, eventName, handler, options) {
    if (!element) return;

    element.addEventListener(eventName, handler, options);

    listeners.push({
      element,
      eventName,
      handler,
      options
    });
  }

  function destroy() {
    listeners.forEach(item => {
      item.element.removeEventListener(
        item.eventName,
        item.handler,
        item.options
      );
    });

    listeners.length = 0;

    state.toastTimers.forEach(timer => clearTimeout(timer));
    state.toastTimers.clear();

    state.initialized = false;
  }

  /* ==================== INITIALIZATION ==================== */

  function init() {
    if (state.initialized) return;

    state.initialized = true;

    installRuntimeStyles();
    initializeCurrentYear();
    initializeSplash();
    initializeNavigation();
    initializeSidebar();
    initializeAuthInterface();
    initializeTeacherFields();
    initializeForms();
    initializeActions();
    initializeTeacherSearch();
    initializeGenericSearch();
    initializePasswordToggles();
    initializeFileInputs();
    initializeImagePreviews();
    initializeNetworkStatus();
    initializeKeyboard();
    initializeExternalLinks();

    dispatch("ready", {
      appName: CONFIG.appName,
      version: CONFIG.version
    });

    console.info(
      "%cMOSTAQBALI | المستقبلي",
      "color:#2864f0;font-size:16px;font-weight:bold"
    );

    console.info("تم تشغيل المتحكم الرئيسي للواجهة.");
  }

  /* ==================== PUBLIC API ==================== */

  const api = {
    init,
    destroy,
    config: Object.freeze({ ...CONFIG }),

    getState() {
      return { ...state };
    },

    navigate,
    openAuth,
    setAuthTab,
    openForgotPassword,

    openSidebar,
    closeSidebar,

    openModal,
    closeModal,
    confirm,

    toast,
    dismissToast,

    validateForm,
    validEmail,
    validPhone,

    readStorage,
    writeStorage,
    removeStorage,

    escapeHTML,
    formatFileSize,
    dispatch
  };

  window.MostaqbaliApp = api;

  /* ==================== START APPLICATION ==================== */

  function safeInitialize() {
    try {
      init();
    } catch (error) {
      console.error("[MOSTAQBALI] خطأ أثناء تشغيل التطبيق:", error);

      /*
       * حماية احتياطية: لا تترك المستخدم على شاشة البداية
       * إذا حدث خطأ أثناء تهيئة إحدى وظائف الواجهة.
       */
      const splash = $("#splash-screen");
      const app = $("#app");

      if (app) app.hidden = false;

      if (splash) {
        splash.hidden = true;
        splash.style.display = "none";
      }

      const home = $('[data-page="home"]');

      if (home) home.hidden = false;

      toast(
        "تم فتح الواجهة الأساسية، لكن إحدى الوظائف واجهت خطأ. راجع سجل الأخطاء.",
        "warning"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInitialize, {
      once: true
    });
  } else {
    safeInitialize();
  }
})();
