/* =========================================================
   Restoran Menü (Sayfa Çevirme) - Uygulama
   ---------------------------------------------------------
   İçerik: data/menu.json
   Tasarım: css/styles.css
   ========================================================= */

(function () {
  const MENU_JSON = "data/menu.json";

  const els = {
    book: document.getElementById("book"),
    brandName: document.getElementById("brandName"),
    brandTagline: document.getElementById("brandTagline"),
    brandLogo: document.getElementById("brandLogo"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    indicator: document.getElementById("pageIndicator"),
    footerUpdated: document.getElementById("footerUpdated"),
};

  // Menü alanının yüksekliğine göre PageFlip sayfa yüksekliğini dinamik hesapla
  // Amaç: Genişliği bozmadan, sayfanın yüksekliği kategori barından footer'a kadar alanı doldursun.
  function calcFlipHeight() {
    const wrap = document.querySelector(".book-wrap");
    if (!wrap) return 640;

    const cw = wrap.clientWidth || 420;
    const ch = wrap.clientHeight || 640;

    // usePortrait açık olduğu için dar ekranlarda tek sayfa, geniş ekranlarda çift sayfa varsayımı
    const pagesPerView = cw < 720 ? 1 : 2;
    const baseW = 420;
    const spreadW = baseW * pagesPerView;

    const scaleW = cw / spreadW;
    const safeScaleW = Math.max(scaleW, 0.05);

    let h = Math.round(ch / safeScaleW);

    // Mantıklı sınırlar
    h = Math.max(520, Math.min(h, 1400));
    return h;
  }

  // Menü ve kategori sekmeleri hizalaması CSS tarafında ortak padding/width ile yapılır.
  // Bu yüzden JS ile kaydırma/hesaplama yapılmaz (kategori değişince oynama olmasın).


  /** Basit HTML escape */
  function esc(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatPrice(price, currency) {
    const p = String(price ?? "").trim();
    if (!p) return "";
    // Zaten para birimi varsa tekrar ekleme
    const hasCurrency = /₺|TL|TRY|€|\$|£/i.test(p);
    if (hasCurrency || !currency) return p;
    // Boşluklu gösterim: "120 ₺"
    return p + " " + currency;
  }

  function createMenuItemHTML(item, currency) {
    const name = esc(item.name);
    const desc = esc(item.description || "");
    const price = esc(formatPrice(item.price, currency));
    const tags = Array.isArray(item.tags) ? item.tags : [];

    // Opsiyonel arka plan görseli (ör: "assets/items/latte.jpg")
    // JSON'da item.image (veya item.img / item.photo) alanını doldurabilirsiniz.
    // Not: GitHub Pages'de dosya yolları büyük/küçük harfe duyarlıdır.
    // Ayrıca JSON'da bazen yanlışlıkla başta/sonda boşluk kalabiliyor; bu da URL'yi bozup
    // görselin görünmemesine neden olur. Bu yüzden trim() uyguluyoruz.
    const imageRaw = String(item.image || item.img || item.photo || "").trim();
    const imgUrl = imageRaw ? encodeURI(imageRaw).replaceAll("'", "%27") : "";
    const itemClass = imgUrl ? "menu-item has-image" : "menu-item";
    const imgTag = imgUrl
      ? `<img class="item-bg" src="${esc(imgUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';">`
      : "";

    const tagsHTML = tags.length
      ? `<div class="item-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`
      : "";

    const descHTML = desc ? `<div class="item-desc">${desc}</div>` : "";

    return `
      <div class="${itemClass}">
        ${imgTag}
        <div class="item-main">
          <div class="item-name">${name}</div>
          ${descHTML}
          ${tagsHTML}
        </div>
        <div class="item-price">${price}</div>
      </div>
    `;
  }

  function createSectionHTML(section, currency) {
    const title = esc(section.name || "");
    const items = Array.isArray(section.items) ? section.items : [];
    const itemsHTML = items.map(i => createMenuItemHTML(i, currency)).join("");

    return `
      <section class="section">
        ${title ? `<h2 class="section-title">${title}</h2>` : ""}
        <div class="menu-list">
          ${itemsHTML || `<div class="item-desc">Bu bölümde henüz ürün yok.</div>`}
        </div>
      </section>
    `;
  }

  function createPageElement(page, pageIndex, totalPages, restaurant) {
    const title = esc(page.title || "Sayfa");
    const subtitle = esc(page.subtitle || "");
    const currency = restaurant.currency || "₺";
    const lastUpdated = esc(restaurant.lastUpdated || "");

    const sections = Array.isArray(page.sections) ? page.sections : [];
    const sectionsHTML = sections.map(s => createSectionHTML(s, currency)).join("");

    const el = document.createElement("div");
    el.className = "page";

    // Sert sayfa istiyorsan JSON'da page.hard = true yapabilirsin
    if (page.hard) el.setAttribute("data-density", "hard");

    el.innerHTML = `
      <div class="page-inner">
        <div class="page-head">
          <div>
            <h1 class="page-title">${title}</h1>
            ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ""}
          </div>
          <div class="page-meta">
            ${restaurant.name ? `<div>${esc(restaurant.name)}</div>` : ""}
            ${lastUpdated ? `<div>Güncelleme: ${lastUpdated}</div>` : ""}
          </div>
        </div>

        <div class="page-content">
          ${sectionsHTML || `<div class="item-desc">Bu sayfada henüz içerik yok.</div>`}
        </div>

        <div class="page-foot">
          <div>${esc(restaurant.footerNote || "")}</div>
          <div class="page-number">${pageIndex + 1} / ${totalPages}</div>
        </div>
      </div>
    `;
    return el;
  }

  function setTopBrand(restaurant) {
    if (restaurant.name) els.brandName.textContent = restaurant.name;
    if (restaurant.tagline) els.brandTagline.textContent = restaurant.tagline;

    if (restaurant.logoPath) {
      els.brandLogo.src = restaurant.logoPath;
    }
  }

  function setFooter(restaurant) {
    const updated = restaurant.lastUpdated ? `Son güncelleme: ${restaurant.lastUpdated}` : "Son güncelleme: -";
    if (els.footerUpdated) els.footerUpdated.textContent = updated;
  }

  function showError(message) {
    els.book.innerHTML = `
      <div class="page">
        <div class="page-inner">
          <div class="page-head">
            <h1 class="page-title">Hata</h1>
          </div>
          <div class="page-content">
            <div class="item-desc">${esc(message)}</div>
          </div>
          <div class="page-foot">
            <div>data/menu.json kontrol edin.</div>
            <div class="page-number">-</div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadMenu() {
    try {
      const res = await fetch(MENU_JSON, { cache: "no-store" });
      if (!res.ok) throw new Error("menu.json okunamadı (" + res.status + ")");
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function initPageFlip(pageCount) {
    // PageFlip kütüphanesi yüklenmediyse daha açıklayıcı hata ver
    if (!(window.St && window.St.PageFlip)) {
      throw new Error("Sayfa çevirme kütüphanesi yüklenemedi. İnternet bağlantısı ve CDN erişimini kontrol edin.");
    }

    // Not: width/height base ölçülerdir. size:'stretch' ile ekrana uyarlanır.
    const isDesktop = window.matchMedia("(min-width: 1100px)").matches;
    // Mobilde mevcut görünüm korunur. Masaüstünde tek sayfa ama 3 sayfa genişliğinde "panoramik" görünüm.
    const basePageWidth = 420;
    const pageWidth = isDesktop ? basePageWidth * 3 : basePageWidth;

    const pageFlip = new window.St.PageFlip(els.book, {
      width: pageWidth,
      height: calcFlipHeight(),
      size: "stretch",
      minWidth: isDesktop ? 900 : 280,
      maxWidth: isDesktop ? 1400 : 980,
      minHeight: 420,
      maxHeight: 1100,
      maxShadowOpacity: 0.35,
      showCover: false,
      mobileScrollSupport: false,
      useMouseEvents: false,
      // Her zaman tek sayfa (spread yok) — masaüstünde de.
      usePortrait: true,
      flippingTime: 900
    });


    // İçerik sayfaları DOM'da hazır olunca yükle
    pageFlip.loadFromHTML(els.book.querySelectorAll(".page"));


    function updateIndicator() {
      const idx = pageFlip.getCurrentPageIndex();
      els.indicator.textContent = (idx + 1) + " / " + pageCount;

      // Buton durumları
      els.prevBtn.disabled = idx <= 0;
      els.nextBtn.disabled = idx >= pageCount - 1;
    }

    // NOT: StPageFlip'te disableFlipByClick=true iken flipNext/flipPrev/flip çağrıları
    // bazı sürümlerde çalışmayabiliyor (issue #18/#29). Bu yüzden disableFlipByClick
    // kullanmıyoruz ve oklarla sayfa geçişini doğrudan hedef sayfaya "flip" ederek yapıyoruz.
    function goTo(delta) {
      const total = pageFlip.getPageCount();
      const current = pageFlip.getCurrentPageIndex();
      const target = Math.max(0, Math.min(total - 1, current + delta));
      if (target !== current) pageFlip.flip(target, "top");
    }

    els.prevBtn.addEventListener("click", () => goTo(-1));
    els.nextBtn.addEventListener("click", () => goTo(1));

    // Klavye ile gezinme
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(-1);
      if (e.key === "ArrowRight") goTo(1);
    });

    pageFlip.on("flip", updateIndicator);
    updateIndicator();

    // Ekran döndüğünde/resize olduğunda indicator doğru kalsın
    pageFlip.on("changeOrientation", updateIndicator);

    // Orientation değişince indicator güncellenir; hizalama CSS ile sabittir.

    return pageFlip;
  }


  // Sayfa içindeki dikey kaydırma (scroll) alanlarını koru:
  // Bazı cihazlarda dokunma hareketleri PageFlip tarafından "sayfa çevirme" gibi algılanabiliyor.
  // Biz oklarla çevirme kullandığımız için, içerik alanındaki dokunma/tekerlek olaylarını yukarı taşımıyoruz.
  
  // Kategori sekmeleri: pages dizisinden otomatik üretir, tıklayınca ilgili sayfaya gider.
  function setupCategoryTabs(pages, pageFlip) {
    const tabsEl = document.getElementById("categoryTabs");
    if (!tabsEl || !Array.isArray(pages) || !pageFlip) return;

    tabsEl.innerHTML = "";

    pages.forEach((p, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-tab";
      btn.dataset.pageIndex = String(idx);
      btn.textContent = (p && (p.navTitle || p.title)) ? String(p.navTitle || p.title) : `Sayfa ${idx + 1}`;
      tabsEl.appendChild(btn);
    });

    function setActive(activeIdx) {
      tabsEl.querySelectorAll(".category-tab").forEach((b) => {
        const i = Number(b.dataset.pageIndex || -1);
        b.classList.toggle("is-active", i === activeIdx);
      });
    }

    // İlk durum
    setActive(pageFlip.getCurrentPageIndex ? pageFlip.getCurrentPageIndex() : 0);

    // Tıklayınca sayfaya git
    tabsEl.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".category-tab") : null;
      if (!btn) return;
      const target = Number(btn.dataset.pageIndex);
      if (!Number.isFinite(target)) return;

      // Aynı sayfadaysa işlem yapma
      const current = pageFlip.getCurrentPageIndex ? pageFlip.getCurrentPageIndex() : 0;
      if (target === current) return;

      try {
        pageFlip.flip(target, "top");
      } catch (_) {
        // Bazı sürümlerde flip yerine turnToPage olabilir
        if (typeof pageFlip.turnToPage === "function") pageFlip.turnToPage(target);
      }
    });

    // Sayfa değişince aktif sekmeyi güncelle
    if (typeof pageFlip.on === "function") {
      pageFlip.on("flip", () => setActive(pageFlip.getCurrentPageIndex()));
    }
  }

function protectScrollAreas() {
    const events = ["touchstart", "touchmove", "pointerdown", "pointermove", "wheel"];
    document.querySelectorAll(".page-content").forEach((el) => {
      events.forEach((evt) => {
        el.addEventListener(evt, (e) => e.stopPropagation(), { passive: true });
      });
    });
  }

  // Sayfanın kendisi (body) kaymasın; sadece .page-content içi kayabilsin.
  // Mobilde bazı tarayıcılarda "lastik" kaymayı (rubber-band) azaltır.
  function preventBodyScroll() {
    const shouldAllow = (target) => {
      if (!target) return false;
      return !!target.closest?.('.page-content');
    };

    // Touch
    document.addEventListener(
      'touchmove',
      (e) => {
        if (!shouldAllow(e.target)) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Wheel (desktop trackpad)
    document.addEventListener(
      'wheel',
      (e) => {
        if (!shouldAllow(e.target)) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  

  // Mobilde "aşağı çek-yenile" (pull to refresh) benzeri davranış:
  // - Sayfanın kendisi kaymasın diye body overflow kapalı
  // - Kullanıcı üstten aşağı doğru çekerse (ve menü listesi en üstteyse) sayfayı yeniler
  function enablePullToRefresh() {
    const ptr = document.getElementById("ptr");
    const ptrText = document.getElementById("ptrText");

    const THRESHOLD = 78; // px
    const START_ZONE = 120; // px (ekranın üst kısmı)

    let startY = 0;
    let triggered = false;
    let ready = false;
    let activeScroller = null;

    function setPtrState(state) {
      if (!ptr) return;
      ptr.classList.remove("show", "ready", "loading");
      if (state === "show") ptr.classList.add("show");
      if (state === "ready") ptr.classList.add("show", "ready");
      if (state === "loading") ptr.classList.add("show", "loading");
    }

    function setPtrText(text) {
      if (ptrText) ptrText.textContent = text;
    }

    document.addEventListener("touchstart", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;

      activeScroller = e.target && e.target.closest ? e.target.closest(".page-content") : null;

      // Dokunuş menü içinde ve scrollTop>0 ise kullanıcı menüyü kaydırıyordur; pull-to-refresh başlatma.
      if (activeScroller && activeScroller.scrollTop > 0) {
        startY = 0;
        triggered = false;
        ready = false;
        setPtrState("hide");
        return;
      }

      // Sadece sayfanın tepesine yakın başlarsa (kazara tetiklemeyi azaltır)
      if (t.clientY < START_ZONE) {
        startY = t.clientY;
        triggered = false;
        ready = false;
        setPtrText("Yenilemek için aşağı çek");
        setPtrState("hide");
      } else {
        startY = 0;
        triggered = false;
        ready = false;
        setPtrState("hide");
      }
    }, { passive: true, capture: true });

    document.addEventListener("touchmove", (e) => {
      if (!startY || triggered) return;
      const t = e.touches && e.touches[0];
      if (!t) return;

      const dy = t.clientY - startY;
      if (dy <= 12) {
        setPtrState("hide");
        return;
      }

      // Pull hareketi sırasında sayfanın (body) "lastik" kaymasını engelle
      // (menü içindeyse ve en üstteyse de engeller, böylece sadece ikon görünür)
      if (activeScroller && activeScroller.scrollTop === 0) {
        try { e.preventDefault(); } catch (_) {}
      }

      // Menünün içinde ve scrollTop>0 ise asla tetikleme
      const scroller = e.target && e.target.closest ? e.target.closest(".page-content") : null;
      if (scroller && scroller.scrollTop > 0) return;

      if (dy >= THRESHOLD) {
        ready = true;
        setPtrText("Bırakınca yenilenecek");
        setPtrState("ready");
      } else {
        ready = false;
        setPtrText("Yenilemek için aşağı çek");
        setPtrState("show");
      }
    }, { passive: false, capture: true });

    document.addEventListener("touchend", () => {
      if (startY && ready && !triggered) {
        triggered = true;
        setPtrText("Yenileniyor…");
        setPtrState("loading");
        setTimeout(() => location.reload(), 120);
      } else {
        setPtrState("hide");
      }

      // Reset
      startY = 0;
      triggered = false;
      ready = false;
      activeScroller = null;
    }, { passive: true, capture: true });
  }


  // İletişim butonlarında (Telefon/Instagram/Adres/Mail) onay kutusu
  function setupContactConfirm() {
    const overlay = document.getElementById("confirmOverlay");
    const titleEl = document.getElementById("confirmTitle");
    const msgEl = document.getElementById("confirmMessage");
    const btnNo = document.getElementById("confirmNo");
    const btnYes = document.getElementById("confirmYes");
    if (!overlay || !msgEl || !btnNo || !btnYes || !titleEl) return;

    const getMessageForHref = (href) => {
      if (!href) return "Devam etmek ister misin?";
      const h = href.toLowerCase();
      if (h.startsWith("tel:")) return "Bir kebap mesafesindeyiz 😋 Aramak ister misin?";
      if (h.includes("instagram.com")) return "Izgaradan taze kareler var 📸🔥 Instagram’a göz atalım mı?";
      if (h.includes("google.com/maps") || h.includes("maps.google") || h.includes("/maps")) return "Kebabın yolu buradan geçiyor 🗺️🔥Yol tarifini açalım mı?";
      if (h.startsWith("mailto:")) return "Bir mesaj bırakmak ister misin? Okuruz, cevaplarız 😉";
      return "Devam etmek ister misin?";
    };

    const getTitleForHref = (href) => {
      if (!href) return "Bilgilendirme";
      const h = href.toLowerCase();
      if (h.startsWith("tel:")) return "Telefonla Aramak Üzeresiniz";
      if (h.includes("instagram.com")) return "İnstagram'a Yönlendirileceksiniz";
      if (h.includes("google.com/maps") || h.includes("maps.google") || h.includes("/maps")) return "Adresi Görmek Üzeresiniz";
      if (h.startsWith("mailto:")) return "Mail Atmak Üzeresiniz";
      return "Bilgilendirme";
    };

    let pendingAction = null;

    const open = (title, message, actionFn) => {
      titleEl.textContent = title || "Bilgilendirme";
      msgEl.textContent = message || "Devam etmek ister misin?";
      pendingAction = typeof actionFn === "function" ? actionFn : null;
      overlay.hidden = false;
      // iOS'ta bazen ilk tıkta odak çerçevesi çıkabiliyor; kısa süre sonra odakla
      setTimeout(() => { try { btnNo.focus({ preventScroll: true }); } catch(_) {} }, 0);
    };

    const close = () => {
      overlay.hidden = true;
      pendingAction = null;
    };

    btnNo.addEventListener("click", () => close());
    btnYes.addEventListener("click", () => {
      const fn = pendingAction;
      close();
      // kapandıktan sonra yönlendir (mobilde daha stabil)
      if (fn) setTimeout(fn, 30);
    });

    // Arka plana tıklayınca kapat
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // ESC ile kapat
    window.addEventListener("keydown", (e) => {
      if (!overlay.hidden && (e.key === "Escape" || e.key === "Esc")) close();
    });

    // Footer iletişim linklerini yakala
    document.querySelectorAll(".contact-action").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        const target = a.getAttribute("target") || "";
        const rel = a.getAttribute("rel") || "";

        // Bazı butonlar zaten noopener/blank olabilir; biz onaydan sonra aynı şekilde açacağız.
        e.preventDefault();
        e.stopPropagation();

        const message = getMessageForHref(href);
        const title = getTitleForHref(href);

        open(title, message, () => {
          if (target === "_blank") {
            // noopener güvenliği
            window.open(href, "_blank", rel.includes("noopener") ? "noopener" : "noopener");
          } else {
            window.location.href = href;
          }
        });
      }, { passive: false });
    });
  }

async function main() {
    try {
      const data = await loadMenu();
      const restaurant = data.restaurant || {};
      const pages = Array.isArray(data.pages) ? data.pages : [];

      if (!pages.length) {
        showError("Menü sayfası bulunamadı. data/menu.json içindeki pages alanını kontrol edin.");
        return;
      }

      setTopBrand(restaurant);
      setFooter(restaurant);

      // Sayfaları oluştur
      els.book.innerHTML = "";
      pages.forEach((p, i) => {
        const pageEl = createPageElement(p, i, pages.length, restaurant);
        els.book.appendChild(pageEl);
      });

      const pageFlip = initPageFlip(pages.length);
      setupCategoryTabs(pages, pageFlip);

      // Hizalama CSS ile; resize'da JS kaydırması yok.

      protectScrollAreas();
      preventBodyScroll();
      enablePullToRefresh();
      setupContactConfirm();



      // İpucu: sayfa çoksa, metni kısalt (görsel kalabalık olmasın)
} catch (err) {
      showError(err?.message || "Beklenmeyen bir hata oluştu.");
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
