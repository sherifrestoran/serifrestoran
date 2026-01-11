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
    hint: document.getElementById("hint"),
  };

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
    const styleAttr = imgUrl ? ` style="--item-bg: url('${esc(imgUrl)}')"` : "";

    const tagsHTML = tags.length
      ? `<div class="item-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`
      : "";

    const descHTML = desc ? `<div class="item-desc">${desc}</div>` : "";

    return `
      <div class="${itemClass}"${styleAttr}>
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
    els.footerUpdated.textContent = updated;
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
    const pageFlip = new window.St.PageFlip(els.book, {
      width: 420,
      height: 640,
      size: "stretch",
      minWidth: 280,
      maxWidth: 980,
      minHeight: 420,
      maxHeight: 1100,
      maxShadowOpacity: 0.35,
      showCover: false,
      mobileScrollSupport: false,
      useMouseEvents: false,
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

    return pageFlip;
  }


  // Sayfa içindeki dikey kaydırma (scroll) alanlarını koru:
  // Bazı cihazlarda dokunma hareketleri PageFlip tarafından "sayfa çevirme" gibi algılanabiliyor.
  // Biz oklarla çevirme kullandığımız için, içerik alanındaki dokunma/tekerlek olaylarını yukarı taşımıyoruz.
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

      initPageFlip(pages.length);
      protectScrollAreas();
      preventBodyScroll();

      // İpucu: sayfa çoksa, metni kısalt (görsel kalabalık olmasın)
      if (pages.length > 8) {
        els.hint.textContent = "İpucu: Sayfayı çevirmek için üstteki okları kullanın.";
      }
    } catch (err) {
      showError(err?.message || "Beklenmeyen bir hata oluştu.");
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
