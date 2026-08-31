/* ==========================================================================
   MARGEO - CLIENT-SIDE APP DATA STORE & NAVIGATION ENGINE (v1.0)
   Manages mock persistence, plan permissions, calculations & UI rendering.
   ========================================================================== */

(function () {
  const STORAGE_KEY_ARTICLES = 'margeo_app_articles';
  const STORAGE_KEY_LOTS = 'margeo_app_lots';
  const STORAGE_KEY_USER = 'margeo_app_user';

  // Default seed articles if user has not stored any
  const DEFAULT_ARTICLES = [
    {
      id: 'art-1',
      name: "Veste en jean Levi's vintage",
      source: 'Brocante',
      buyPrice: 8.0,
      sellPrice: 35.0,
      shippingOffered: 0,
      packageCost: 0,
      status: 'sold', // 'sold', 'pending'
      date: '2026-08-28',
      lotId: 'lot-1'
    },
    {
      id: 'art-2',
      name: 'Sneakers New Balance 550',
      source: 'Outlet',
      buyPrice: 35.0,
      sellPrice: 85.0,
      shippingOffered: 0,
      packageCost: 0,
      status: 'sold',
      date: '2026-08-25',
      lotId: null
    },
    {
      id: 'art-3',
      name: 'Blazer en laine pied-de-poule',
      source: 'Friperie',
      buyPrice: 12.0,
      sellPrice: 40.0,
      shippingOffered: 0,
      packageCost: 0,
      status: 'pending',
      date: '2026-08-20',
      lotId: 'lot-1'
    },
    {
      id: 'art-4',
      name: 'Pull mohair col rond',
      source: 'Dépôt-vente',
      buyPrice: 6.0,
      sellPrice: 22.0,
      shippingOffered: 0,
      packageCost: 0,
      status: 'sold',
      date: '2026-08-15',
      lotId: null
    }
  ];

  const DEFAULT_LOTS = [
    {
      id: 'lot-1',
      name: "Commande d'achat groupé #1",
      totalCost: 235.0,
      source: 'Grossiste déstockage',
      createdDate: '2026-08-01'
    }
  ];

  const DEFAULT_USER = {
    name: 'Camille',
    email: 'camille.resell@gmail.com',
    sellerMode: 'particulier', // 'particulier' or 'pro'
    plan: 'gratuit', // 'gratuit', 'starter', 'pro', 'empire'
    monthlyCalculationsUsed: 3, // 3 out of 5
    weeklyEmailAlert: true,
    monthlyEmailAlert: true
  };

  window.MargeoStore = {
    getUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USER);
        if (!raw) {
          // Check if set during signup/onboarding
          const savedEmail = localStorage.getItem('margeo_user_email');
          const savedMode = localStorage.getItem('margeo_seller_mode');
          if (savedEmail || savedMode) {
            const user = { ...DEFAULT_USER };
            if (savedEmail) user.email = savedEmail;
            if (savedMode) user.sellerMode = savedMode;
            this.saveUser(user);
            return user;
          }
          return DEFAULT_USER;
        }
        return JSON.parse(raw);
      } catch (e) {
        return DEFAULT_USER;
      }
    },

    saveUser(user) {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } catch (e) {}
    },

    setUserPlan(plan) {
      const user = this.getUser();
      user.plan = plan;
      this.saveUser(user);
    },

    setUserSellerMode(mode) {
      const user = this.getUser();
      user.sellerMode = mode;
      this.saveUser(user);
      localStorage.setItem('margeo_seller_mode', mode);
    },

    getArticles() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
        return raw ? JSON.parse(raw) : DEFAULT_ARTICLES;
      } catch (e) {
        return DEFAULT_ARTICLES;
      }
    },

    saveArticles(articles) {
      try {
        localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
      } catch (e) {}
    },

    addArticle(art) {
      const articles = this.getArticles();
      const newArticle = {
        id: 'art-' + Date.now(),
        name: art.name || 'Article sans nom',
        source: art.source || 'Autre',
        buyPrice: parseFloat(art.buyPrice) || 0,
        sellPrice: parseFloat(art.sellPrice) || 0,
        shippingOffered: parseFloat(art.shippingOffered) || 0,
        packageCost: parseFloat(art.packageCost) || 0,
        status: art.status || 'sold',
        date: art.date || new Date().toISOString().split('T')[0],
        lotId: art.lotId || null
      };
      articles.unshift(newArticle);
      this.saveArticles(articles);

      // Increment calculation count for free plan
      const user = this.getUser();
      user.monthlyCalculationsUsed = (user.monthlyCalculationsUsed || 0) + 1;
      this.saveUser(user);

      return newArticle;
    },

    deleteArticle(id) {
      let articles = this.getArticles();
      articles = articles.filter(a => a.id !== id);
      this.saveArticles(articles);
    },

    toggleArticleStatus(id) {
      const articles = this.getArticles();
      const item = articles.find(a => a.id === id);
      if (item) {
        item.status = item.status === 'sold' ? 'pending' : 'sold';
        this.saveArticles(articles);
      }
    },

    getLots() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_LOTS);
        return raw ? JSON.parse(raw) : DEFAULT_LOTS;
      } catch (e) {
        return DEFAULT_LOTS;
      }
    },

    saveLots(lots) {
      try {
        localStorage.setItem(STORAGE_KEY_LOTS, JSON.stringify(lots));
      } catch (e) {}
    },

    addLot(lot) {
      const lots = this.getLots();
      const newLot = {
        id: 'lot-' + Date.now(),
        name: lot.name || 'Nouveau Lot',
        totalCost: parseFloat(lot.totalCost) || 0,
        source: lot.source || 'Grossiste',
        createdDate: new Date().toISOString().split('T')[0]
      };
      lots.push(newLot);
      this.saveLots(lots);
      return newLot;
    },

    // Financial calculations
    calculateArticleGain(art, sellerMode = 'particulier') {
      const buy = parseFloat(art.buyPrice) || 0;
      const sell = parseFloat(art.sellPrice) || 0;
      const shipping = parseFloat(art.shippingOffered) || 0;
      const packageCost = parseFloat(art.packageCost) || 0;

      if (art.status !== 'sold') {
        return -buy; // Expense committed, not yet earned
      }

      let comm = 0;
      if (sellerMode === 'pro') {
        comm = sell * 0.05; // 5% pro commission
      }

      return sell - comm - buy - shipping - packageCost;
    },

    getMonthlySummary(sellerMode = 'particulier') {
      const articles = this.getArticles();
      let totalSpent = 0;
      let totalEarned = 0;
      let netProfit = 0;
      let soldCount = 0;
      let inStockCount = 0;

      articles.forEach(art => {
        const buy = parseFloat(art.buyPrice) || 0;
        const sell = parseFloat(art.sellPrice) || 0;
        const shipping = parseFloat(art.shippingOffered) || 0;
        const packageCost = parseFloat(art.packageCost) || 0;

        totalSpent += buy + (art.status === 'sold' ? (shipping + packageCost) : 0);

        if (art.status === 'sold') {
          soldCount++;
          let comm = sellerMode === 'pro' ? (sell * 0.05) : 0;
          totalEarned += sell;
          netProfit += (sell - comm - buy - shipping - packageCost);
        } else {
          inStockCount++;
          netProfit -= buy;
        }
      });

      return {
        totalSpent,
        totalEarned,
        netProfit,
        soldCount,
        inStockCount,
        marginPercent: totalEarned > 0 ? ((netProfit / totalEarned) * 100) : 0
      };
    },

    formatEuro(val) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    },

    formatPercent(val) {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(val) + ' %';
    },

    // Render unified Sidebar navigation on all app pages
    renderAppSidebar(activePage = 'dashboard') {
      const user = this.getUser();
      const sidebarContainer = document.getElementById('app-sidebar-container');
      if (!sidebarContainer) return;

      const planLabels = {
        gratuit: { name: 'Gratuit', isMax: false },
        starter: { name: 'Starter', isMax: false },
        pro: { name: 'Pro Reseller', isMax: false },
        empire: { name: 'Empire', isMax: true }
      };

      const currentPlan = planLabels[user.plan] || planLabels.gratuit;

      sidebarContainer.innerHTML = `
        <aside class="app-sidebar">
          <div class="app-sidebar-top">
            <!-- Brand -->
            <div class="app-sidebar-brand">
              <a href="index.html" class="logo" aria-label="Accueil Margeo">
                <div class="logo-icon" style="width: 32px; height: 32px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <span style="font-size: 1.25rem;">Margeo<span class="text-gradient">.</span></span>
              </a>
            </div>

            <!-- Current Plan Widget -->
            <div class="app-plan-widget">
              <div class="app-plan-info">
                <span class="app-plan-label">Formule active</span>
                <span class="app-plan-name">${currentPlan.name}</span>
              </div>
              ${!currentPlan.isMax ? '<a href="app-parametres.html#abonnement" class="app-plan-upgrade-link">Upgrade ✨</a>' : '<span style="font-size:0.75rem; color:#A5B4FC;">★ Top</span>'}
            </div>

            <!-- Navigation Links -->
            <ul class="app-nav-menu">
              <li class="app-nav-item ${activePage === 'dashboard' ? 'active' : ''}">
                <a href="app.html">
                  <span class="app-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </span>
                  <span>Dashboard</span>
                </a>
              </li>

              <li class="app-nav-item ${activePage === 'simulateur' ? 'active' : ''}">
                <a href="app-simulateur.html">
                  <span class="app-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </span>
                  <span>Simulateur</span>
                </a>
              </li>

              <li class="app-nav-item ${activePage === 'suivi' ? 'active' : ''}">
                <a href="app-suivi.html">
                  <span class="app-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </span>
                  <span>Suivi & Lots</span>
                </a>
              </li>

              <li class="app-nav-item ${activePage === 'historique' ? 'active' : ''}">
                <a href="app-historique.html">
                  <span class="app-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  </span>
                  <span>Historique</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Bottom: Profile & Settings -->
          <div class="app-sidebar-bottom">
            <a href="app-parametres.html" class="app-user-profile-row" title="Accéder aux paramètres">
              <div class="app-user-info">
                <div class="app-user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div class="app-user-name">${user.name}</div>
                  <div class="app-user-mode-tag">${user.sellerMode === 'pro' ? '💼 Vendeur Pro' : '👤 Particulier'}</div>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </a>

            <a href="mailto:contact@margeo.fr" class="app-sidebar-support-link">
              Besoin d'aide ? Support 24/7
            </a>
          </div>
        </aside>

        <!-- Mobile Bottom Nav Drawer -->
        <nav class="app-mobile-nav">
          <a href="app.html" class="app-mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Dashboard</span>
          </a>
          <a href="app-simulateur.html" class="app-mobile-nav-item ${activePage === 'simulateur' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Simulateur</span>
          </a>
          <a href="app-suivi.html" class="app-mobile-nav-item ${activePage === 'suivi' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Suivi</span>
          </a>
          <a href="app-historique.html" class="app-mobile-nav-item ${activePage === 'historique' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span>Historique</span>
          </a>
          <a href="app-parametres.html" class="app-mobile-nav-item ${activePage === 'parametres' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Réglages</span>
          </a>
        </nav>
      `;
    }
  };
})();
