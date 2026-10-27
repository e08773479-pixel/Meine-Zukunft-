"use strict";

(() => {
  const config = window.MOSTAQBALI_CONFIG;

  if (!config) {
    console.error("MOSTAQBALI_CONFIG is missing.");
    return;
  }

  const elements = {
    menuToggle: document.getElementById("menuToggle"),
    navigation: document.getElementById("mainNavigation"),
    toast: document.getElementById("toast"),
    currentYear: document.getElementById("currentYear")
  };

  let toastTimer = null;

  function showToast(message) {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.classList.add("visible");

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("visible");
    }, 3600);
  }

  function closeMobileMenu() {
    if (!elements.menuToggle || !elements.navigation) return;

    elements.navigation.classList.remove("open");
    elements.menuToggle.setAttribute("aria-expanded", "false");
    elements.menuToggle.setAttribute("aria-label", "فتح القائمة");
  }

  function toggleMobileMenu() {
    if (!elements.menuToggle || !elements.navigation) return;

    const isOpen = elements.navigation.classList.toggle("open");

    elements.menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    elements.menuToggle.setAttribute(
      "aria-label",
      isOpen ? "إغلاق القائمة" : "فتح القائمة"
    );
  }

  function setupNavigation() {
    if (elements.menuToggle) {
      elements.menuToggle.addEventListener("click", toggleMobileMenu);
    }

    if (elements.navigation) {
      elements.navigation.addEventListener("click", (event) => {
        const link = event.target.closest("a");

        if (!link) return;

        closeMobileMenu();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!elements.navigation || !elements.menuToggle) return;

      const isOpen = elements.navigation.classList.contains("open");

      if (
        isOpen &&
        !elements.navigation.contains(event.target) &&
        !elements.menuToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        closeMobileMenu();
      }
    });
  }

  function setupRoleButtons() {
    const roleButtons = document.querySelectorAll("[data-role]");

    roleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const role = button.dataset.role;

        const roleNames = {
          student: "الطالب",
          teacher: "المدرس",
          parent: "ولي الأمر",
          admin: "الإدارة"
        };

        const featureName = {
          student: "studentDashboard",
          teacher: "teacherDashboard",
          parent: "parentDashboard",
          admin: "adminDashboard"
        };

        if (!Object.prototype.hasOwnProperty.call(roleNames, role)) {
          showToast("نوع الحساب غير معروف.");
          return;
        }

        const dashboardFeature = featureName[role];

        if (!config.features[dashboardFeature]) {
          showToast(
            `قسم ${roleNames[role]} قيد التجهيز. سيتم تفعيله بعد بناء نظام الحسابات والصلاحيات.`
          );

          return;
        }

        /*
         * لا نمنح الصلاحيات اعتمادًا على بيانات المتصفح.
         * سيتم توصيل كل نوع حساب بمساره الحقيقي بعد إعداد
         * المصادقة والخدمات الخلفية والتحقق من الصلاحيات.
         */

        showToast("سيتم توصيل الحساب بالخدمات الخلفية في المرحلة التالية.");
      });
    });
  }

  function setupActiveNavigation() {
    const links = Array.from(
      document.querySelectorAll(".main-navigation .nav-link")
    );

    const sections = links
      .map((link) => {
        const id = link.getAttribute("href");

        if (!id || !id.startsWith("#")) return null;

        return document.querySelector(id);
      })
      .filter(Boolean);

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (!visibleEntries.length) return;

        const activeId = `#${visibleEntries[0].target.id}`;

        links.forEach((link) => {
          const isActive = link.getAttribute("href") === activeId;

          link.classList.toggle("active", isActive);
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.15, 0.3, 0.5]
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function setupFooter() {
    if (elements.currentYear) {
      elements.currentYear.textContent = String(
        new Date().getFullYear()
      );
    }
  }

  function initialize() {
    setupNavigation();
    setupRoleButtons();
    setupActiveNavigation();
    setupFooter();

    document.documentElement.dataset.app = "mostaqbali";

    console.info(
      `${config.appName} initialized. Authentication and backend services are not enabled yet.`
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
