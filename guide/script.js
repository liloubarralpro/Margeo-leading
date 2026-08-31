/* ==========================================================================
   MARGEO - INTERACTIVE JAVASCRIPT ENGINE (v2.1)
   - Vinted Calculator (Particulier 0% comm vs Pro 5% comm)
   - Accessible Mode Switcher (aria-pressed, keyboard nav)
   - French Number Formatting (virgules décimales, espaces insécables)
   - Article Tracker with Welcoming Empty State Toggle
   - "Lot de commande" Real Interactive Break-Even Simulator
   - 4-Tier Pricing Switcher (Gratuit, Starter, Pro Reseller, Empire)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. CALCULATEUR VINTED & LOGIQUE DE MARGE
  // ==========================================
  let currentSellerMode = 'particulier'; // 'particulier' or 'pro'

  const modeParticulierBtn = document.getElementById('mode-particulier-btn');
  const modeProBtn = document.getElementById('mode-pro-btn');
  const modeNoticeBanner = document.getElementById('mode-notice-banner');
  const proFieldsContainer = document.getElementById('pro-fields-container');

  const buyPriceInput = document.getElementById('buy-price');
  const sellPriceInput = document.getElementById('sell-price');
  const packageCostInput = document.getElementById('package-cost');
  const shippingOfferedInput = document.getElementById('shipping-offered');
  const proCommissionInput = document.getElementById('pro-commission-rate');
  const proTaxVatCheckbox = document.getElementById('pro-vat-toggle');

  const netProfitDisplay = document.getElementById('net-profit-display');
  const marginPercentDisplay = document.getElementById('margin-percent-display');
  const buyerExtraFeeDisplay = document.getElementById('buyer-extra-fee-display');
  const buyerTotalDisplay = document.getElementById('buyer-total-display');

  // Breakdown rows
  const bdSellPrice = document.getElementById('bd-sell-price');
  const bdBuyPrice = document.getElementById('bd-buy-price');
  const bdCommissionRow = document.getElementById('bd-commission-row');
  const bdCommissionVal = document.getElementById('bd-commission-val');
  const bdShippingOfferedRow = document.getElementById('bd-shipping-offered-row');
  const bdShippingOfferedVal = document.getElementById('bd-shipping-offered-val');
  const bdPackageRow = document.getElementById('bd-package-row');
  const bdPackageVal = document.getElementById('bd-package-val');
  const bdNetProfit = document.getElementById('bd-net-profit');
  const toggleBreakdownBtn = document.getElementById('toggle-breakdown-btn');
  const detailedBreakdownBox = document.getElementById('detailed-breakdown-box');

  // French Number Formatter (e.g. 25,25 €)
  const formatEuro = (val) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatPercent = (val) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(val) + ' %';
  };

  function updateCalculator() {
    const buyPrice = parseFloat(buyPriceInput?.value) || 0;
    const sellPrice = parseFloat(sellPriceInput?.value) || 0;
    const packageCost = parseFloat(packageCostInput?.value) || 0;
    const shippingOffered = parseFloat(shippingOfferedInput?.value) || 0;
    const proCommissionRate = parseFloat(proCommissionInput?.value) || 5;
    const isVatApplied = proTaxVatCheckbox?.checked || false;

    // Buyer Side info: 0,70 € fixe + 5% protection + estimated shipping ~3,29 €
    const protectionFee = sellPrice > 0 ? (0.70 + (sellPrice * 0.05)) : 0;
    const estimatedBuyerShipping = sellPrice > 0 ? 3.29 : 0;
    const buyerExtraTotal = protectionFee + estimatedBuyerShipping;
    const totalBuyerPaid = sellPrice + buyerExtraTotal;

    let vintedCommission = 0;
    let vatAmount = 0;

    if (currentSellerMode === 'pro') {
      vintedCommission = sellPrice * (proCommissionRate / 100);
      if (isVatApplied) {
        vatAmount = vintedCommission * 0.20; // 20% TVA sur les frais de service
      }
    }

    // Real Net Margin calculation:
    // Particulier : Prix vente - Prix achat - Port offert - Emballage
    // Pro : Prix vente - Commission (5%) - TVA - Prix achat - Port offert - Emballage
    const netProfit = sellPrice - vintedCommission - vatAmount - buyPrice - shippingOffered - packageCost;
    const marginPercent = sellPrice > 0 ? ((netProfit / sellPrice) * 100) : 0;

    // Update main profit displays
    if (netProfitDisplay) {
      netProfitDisplay.textContent = (netProfit >= 0 ? '+' : '') + formatEuro(netProfit);
      netProfitDisplay.className = netProfit >= 0 ? 'result-stat-value profit-positive' : 'result-stat-value profit-negative';
    }

    if (marginPercentDisplay) {
      marginPercentDisplay.textContent = (marginPercent >= 0 ? '+' : '') + formatPercent(marginPercent);
      marginPercentDisplay.className = marginPercent >= 0 ? 'result-stat-value profit-positive' : 'result-stat-value profit-negative';
    }

    // Buyer Information Banner (Crucial: never deducted from seller)
    if (buyerExtraFeeDisplay) {
      buyerExtraFeeDisplay.textContent = formatEuro(buyerExtraTotal);
    }
    if (buyerTotalDisplay) {
      buyerTotalDisplay.textContent = formatEuro(totalBuyerPaid);
    }

    // Detailed Breakdown Values
    if (bdSellPrice) bdSellPrice.textContent = formatEuro(sellPrice);
    if (bdBuyPrice) bdBuyPrice.textContent = '- ' + formatEuro(buyPrice);

    if (bdCommissionRow && bdCommissionVal) {
      if (currentSellerMode === 'pro') {
        bdCommissionRow.style.display = 'flex';
        bdCommissionVal.textContent = '- ' + formatEuro(vintedCommission + vatAmount) + ` (${proCommissionRate} %${isVatApplied ? ' + TVA' : ''})`;
      } else {
        bdCommissionRow.style.display = 'none';
      }
    }

    if (bdShippingOfferedRow && bdShippingOfferedVal) {
      if (shippingOffered > 0) {
        bdShippingOfferedRow.style.display = 'flex';
        bdShippingOfferedVal.textContent = '- ' + formatEuro(shippingOffered);
      } else {
        bdShippingOfferedRow.style.display = 'none';
      }
    }

    if (bdPackageRow && bdPackageVal) {
      if (packageCost > 0) {
        bdPackageRow.style.display = 'flex';
        bdPackageVal.textContent = '- ' + formatEuro(packageCost);
      } else {
        bdPackageRow.style.display = 'none';
      }
    }

    if (bdNetProfit) {
      bdNetProfit.textContent = (netProfit >= 0 ? '+' : '') + formatEuro(netProfit);
      bdNetProfit.className = netProfit >= 0 ? 'val-plus' : 'val-minus';
    }
  }

  // Event Listeners for inputs
  [buyPriceInput, sellPriceInput, packageCostInput, shippingOfferedInput, proCommissionInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', updateCalculator);
    }
  });

  if (proTaxVatCheckbox) {
    proTaxVatCheckbox.addEventListener('change', updateCalculator);
  }

  // Seller Mode Switcher (Accessible with ARIA & Keyboard support)
  function setSellerMode(mode) {
    currentSellerMode = mode;
    const isPro = (mode === 'pro');

    if (modeParticulierBtn && modeProBtn) {
      modeParticulierBtn.classList.toggle('active', !isPro);
      modeParticulierBtn.setAttribute('aria-pressed', !isPro ? 'true' : 'false');
      
      modeProBtn.classList.toggle('active', isPro);
      modeProBtn.setAttribute('aria-pressed', isPro ? 'true' : 'false');
    }

    if (proFieldsContainer) {
      proFieldsContainer.classList.toggle('show', isPro);
    }

    if (modeNoticeBanner) {
      if (isPro) {
        modeNoticeBanner.className = 'mode-notice-banner pro-mode';
        modeNoticeBanner.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          <div><strong>Mode Vinted Pro :</strong> Pour les vendeurs ayant activé le badge Vinted Pro (auto-entrepreneur / entreprise). Commission vendeur de 5 % déduite.</div>
        `;
      } else {
        modeNoticeBanner.className = 'mode-notice-banner';
        modeNoticeBanner.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <div><strong>Mode Particulier :</strong> Vinted ne prend <u>aucune commission</u> au vendeur particulier (vous recevez 100 % du prix affiché). La protection acheteur est payée par l'acheteur en plus.</div>
        `;
      }
    }
    updateCalculator();
  }

  if (modeParticulierBtn && modeProBtn) {
    modeParticulierBtn.addEventListener('click', () => setSellerMode('particulier'));
    modeProBtn.addEventListener('click', () => setSellerMode('pro'));

    // Keyboard accessibility (Space / Enter)
    [modeParticulierBtn, modeProBtn].forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  // Toggle Detailed Breakdown Accordion
  if (toggleBreakdownBtn && detailedBreakdownBox) {
    toggleBreakdownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      detailedBreakdownBox.classList.toggle('open');
      const isOpen = detailedBreakdownBox.classList.contains('open');
      toggleBreakdownBtn.innerHTML = isOpen
        ? '<span>Masquer le récapitulatif détaillé ▲</span>'
        : '<span>Voir le récapitulatif détaillé ligne par ligne ▼</span>';
    });
  }

  // Check URL params or localStorage for initial mode (e.g. from onboarding /bienvenue)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const savedMode = localStorage.getItem('margeo_seller_mode');
    if (modeParam === 'pro' || modeParam === 'particulier') {
      setSellerMode(modeParam);
    } else if (savedMode === 'pro' || savedMode === 'particulier') {
      setSellerMode(savedMode);
    } else {
      updateCalculator();
    }
  } catch (e) {
    updateCalculator();
  }


  // ==========================================
  // 2. ARTICLE TRACKER & RECAP AVEC ÉTAT VIDE
  // ==========================================
  const sampleArticles = [
    { name: "🧥 Veste en jean Levi's vintage", source: "Brocante", buy: 8, sell: 35, status: "sold" },
    { name: "👟 Sneakers New Balance 550", source: "Outlet", buy: 35, sell: 85, status: "sold" },
    { name: "🧥 Blazer en laine pied-de-poule", source: "Friperie", buy: 12, sell: 0, status: "pending" }
  ];

  let isTrackerEmpty = false;
  const toggleEmptyViewBtn = document.getElementById('toggle-empty-view-btn');
  const articleListContainer = document.getElementById('article-list-container');
  const articleEmptyState = document.getElementById('article-empty-state');

  function renderArticleRecap() {
    const activeList = isTrackerEmpty ? [] : sampleArticles;
    let totalSpent = 0;
    let totalEarned = 0;
    let pendingCount = 0;

    activeList.forEach(item => {
      totalSpent += item.buy;
      if (item.status === 'sold') {
        totalEarned += item.sell;
      } else {
        pendingCount++;
      }
    });

    const netRecapProfit = totalEarned - totalSpent;

    const recapSpentEl = document.getElementById('recap-total-spent');
    const recapEarnedEl = document.getElementById('recap-total-earned');
    const recapNetEl = document.getElementById('recap-net-profit');
    const recapMessageEl = document.getElementById('recap-verdict-message');

    if (articleListContainer && articleEmptyState) {
      if (isTrackerEmpty) {
        articleListContainer.style.display = 'none';
        articleEmptyState.classList.add('show');
      } else {
        articleListContainer.style.display = 'flex';
        articleEmptyState.classList.remove('show');
      }
    }

    if (recapSpentEl) recapSpentEl.textContent = formatEuro(totalSpent);
    if (recapEarnedEl) recapEarnedEl.textContent = formatEuro(totalEarned);
    
    if (recapNetEl) {
      if (isTrackerEmpty) {
        recapNetEl.textContent = "0,00 €";
        recapNetEl.style.color = "#CBD5E1";
      } else {
        recapNetEl.textContent = (netRecapProfit >= 0 ? '+' : '') + formatEuro(netRecapProfit);
        recapNetEl.style.color = netRecapProfit >= 0 ? '#34D399' : '#F87171';
      }
    }

    if (recapMessageEl) {
      if (isTrackerEmpty) {
        recapMessageEl.innerHTML = `Ce mois-ci : <strong>0,00 €</strong> <span style="font-size:0.75rem; color:#A5B4FC;">(Prêt pour ta 1ère vente)</span>`;
      } else {
        if (netRecapProfit >= 0) {
          recapMessageEl.innerHTML = `Ce mois-ci : <strong>Bénéfice de +${formatEuro(netRecapProfit)}</strong> <span style="font-size:0.75rem; color:#A5B4FC;">(${pendingCount} en stock)</span>`;
        } else {
          recapMessageEl.innerHTML = `Ce mois-ci : <strong>En perte de ${formatEuro(netRecapProfit)}</strong> <span style="font-size:0.75rem; color:#FCA5A5;">(${pendingCount} articles à vendre)</span>`;
        }
      }
    }
  }

  if (toggleEmptyViewBtn) {
    toggleEmptyViewBtn.addEventListener('click', () => {
      isTrackerEmpty = !isTrackerEmpty;
      toggleEmptyViewBtn.textContent = isTrackerEmpty ? "Voir avec des exemples" : "Voir à vide";
      renderArticleRecap();
    });
  }

  renderArticleRecap();


  // ==========================================
  // 3. FONCTIONNALITÉ "LOT DE COMMANDE" (SIMULATEUR RÉEL)
  // ==========================================
  const lotNameInput = document.getElementById('lot-name-input');
  const lotSimInput = document.getElementById('lot-sim-price-input');
  const lotCard = document.getElementById('lot-break-even-card');
  const lotProgressTitle = document.getElementById('lot-progress-title');
  const lotProgressBar = document.getElementById('lot-progress-bar');
  const lotStatusText = document.getElementById('lot-status-text');

  const baseLotCost = 235; // Coût total du lot
  const baseRecovered = 178; // Déjà récupéré sur les ventes passées

  function updateLotSimulation() {
    const lotName = (lotNameInput?.value || '').trim() || "Nom du lot";
    const nextSale = parseFloat(lotSimInput?.value) || 0;
    const totalRecovered = baseRecovered + nextSale;
    const percent = Math.min(100, Math.max(0, (totalRecovered / baseLotCost) * 100));
    const isGreen = (totalRecovered >= baseLotCost);

    // Format clair : "[Nom du lot] — 235 € de coût total, X € récupérés (Y%)"
    if (lotProgressTitle) {
      lotProgressTitle.innerHTML = `<strong>${lotName}</strong> — ${formatEuro(baseLotCost)} de coût total, <strong>${formatEuro(totalRecovered)}</strong> récupérés (${percent.toFixed(0)} %)`;
    }

    if (lotProgressBar) {
      lotProgressBar.style.width = percent + '%';
    }

    if (lotCard && lotStatusText) {
      if (isGreen) {
        lotCard.classList.add('in-the-green');
        const profit = totalRecovered - baseLotCost;
        lotStatusText.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span class="green-tag">🎉 Seuil franchi : Tu es dans le vert ! (+${formatEuro(profit)} de profit pur sur ce lot)</span>
        `;
      } else {
        lotCard.classList.remove('in-the-green');
        const remaining = baseLotCost - totalRecovered;
        lotStatusText.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          <span>Encore <strong>${formatEuro(remaining)}</strong> pour atteindre le seuil de rentabilité</span>
        `;
      }
    }
  }

  if (lotNameInput) {
    lotNameInput.addEventListener('input', updateLotSimulation);
  }

  if (lotSimInput) {
    lotSimInput.addEventListener('input', updateLotSimulation);
  }

  updateLotSimulation();


  // ==========================================
  // 4. TARIFICATION : 4 FORMULES & SWITCHER MENSUEL/ANNUEL
  // ==========================================
  const billingCheckbox = document.getElementById('billing-toggle');
  const priceStarter = document.getElementById('price-starter');
  const pricePro = document.getElementById('price-pro');
  const priceEmpire = document.getElementById('price-empire');
  const periodStarter = document.getElementById('period-starter');
  const periodPro = document.getElementById('period-pro');
  const periodEmpire = document.getElementById('period-empire');

  if (billingCheckbox) {
    billingCheckbox.addEventListener('change', () => {
      const isAnnual = billingCheckbox.checked;
      document.querySelector('.toggle-label.monthly')?.classList.toggle('active', !isAnnual);
      document.querySelector('.toggle-label.annual')?.classList.toggle('active', isAnnual);

      if (isAnnual) {
        if (priceStarter) priceStarter.textContent = '4';
        if (pricePro) pricePro.textContent = '7';
        if (priceEmpire) priceEmpire.textContent = '19';

        if (periodStarter) periodStarter.textContent = '€ / mois (facturé 48 €/an)';
        if (periodPro) periodPro.textContent = '€ / mois (facturé 84 €/an)';
        if (periodEmpire) periodEmpire.textContent = '€ / mois (facturé 228 €/an)';
      } else {
        if (priceStarter) priceStarter.textContent = '5';
        if (pricePro) pricePro.textContent = '9';
        if (priceEmpire) priceEmpire.textContent = '24';

        if (periodStarter) periodStarter.textContent = '€ / mois sans engagement';
        if (periodPro) periodPro.textContent = '€ / mois sans engagement';
        if (periodEmpire) periodEmpire.textContent = '€ / mois sans engagement';
      }
    });
  }


  // ==========================================
  // 5. NAVBAR & MOBILE NAVIGATION
  // ==========================================
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });
  }


  // ==========================================
  // 6. FAQ ACCORDION
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });
      item.classList.toggle('active', !isActive);
    });
  });


  // ==========================================
  // 7. MODAL D'INSCRIPTION & ESSAI GRATUIT
  // ==========================================
  const modalOverlay = document.getElementById('signup-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const ctaButtons = document.querySelectorAll('.trigger-modal');
  const modalPlanInput = document.getElementById('modal-selected-plan');
  const modalPlanTitle = document.getElementById('modal-plan-title');
  const modalForm = document.getElementById('modal-form');

  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const planName = btn.dataset.plan || 'Gratuit (Sans carte)';
      if (modalPlanInput) modalPlanInput.value = planName;
      if (modalPlanTitle) modalPlanTitle.textContent = planName;
      modalOverlay?.classList.add('active');
    });
  });

  modalCloseBtn?.addEventListener('click', () => {
    modalOverlay?.classList.remove('active');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });

  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = modalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '✨ Activation de votre accès...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.innerHTML = '✅ Compte activé avec succès !';
        setTimeout(() => {
          modalOverlay?.classList.remove('active');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          modalForm.reset();
        }, 1200);
      }, 900);
    });
  }


  // ==========================================
  // 8. TOAST NOTIFICATION LIVE ACTIVITY
  // ==========================================
  const liveToast = document.getElementById('live-toast');
  const toastText = document.getElementById('toast-text');
  const toastClose = document.getElementById('toast-close');

  const activities = [
    { name: "Camille R.", item: "Blouson Cuir Vintage", gain: "+27,00 €" },
    { name: "Maxime D.", item: "Nike Dunk Low Retro", gain: "+50,00 €" },
    { name: "Léa P.", item: "Robe Sézane fleurie", gain: "+24,50 €" },
    { name: "Thomas B.", item: "Lot achat groupé (12 pièces)", gain: "+142,00 €" }
  ];

  let actIdx = 0;
  function showNextToast() {
    if (!liveToast || !toastText) return;
    const act = activities[actIdx];
    toastText.innerHTML = `<strong>${act.name}</strong> a validé sa marge sur <em>${act.item}</em> : <span class="toast-gain">${act.gain}</span> net`;
    liveToast.classList.add('show');

    setTimeout(() => {
      liveToast.classList.remove('show');
    }, 4500);

    actIdx = (actIdx + 1) % activities.length;
  }

  setTimeout(() => {
    showNextToast();
    setInterval(showNextToast, 12000);
  }, 4000);

  toastClose?.addEventListener('click', () => {
    liveToast?.classList.remove('show');
  });

});
