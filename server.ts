import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const QUERY_STOPWORDS = new Set([
  'apakah',
  'ada',
  'menu',
  'yang',
  'untuk',
  'dengan',
  'atau',
  'dan',
  'ini',
  'itu',
  'di',
  'ke',
  'dari',
  'bisa',
  'minta',
  'beli',
  'pesan',
  'berapa',
  'harga',
  'harganya',
  'punya',
  'kasih',
  'dong',
  'sih',
  'ya',
  'kak',
  'mas',
  'mba',
  'tolong',
  'rekomendasi',
  'favorit',
  'terfavorit',
  'kafe',
  'cafe',
  'kopi',
  'minuman',
  'makanan',
]);

function normalizePolicies(cafeInfo: any) {
  const raw = cafeInfo?.policies || {};
  return {
    operatingHours: raw.operatingHours || '08:00 - 22:00 WIB (Setiap Hari)',
    paymentPolicy:
      raw.paymentPolicy ||
      'Pembayaran otomatis via QRIS (GoPay, OVO, DANA, ShopeePay, M-Banking) langsung terverifikasi tanpa antre kasir.',
    taxAndService:
      raw.taxAndService || 'Harga menu sudah net (termasuk pajak) & 0% biaya layanan tambahan.',
    customizationPolicy:
      raw.customizationPolicy ||
      'Gratis atur level gula (Normal, Less Sugar, No Sugar) dan es batu. Upgrade ukuran Large +Rp 5.000.',
    allergenPolicy:
      raw.allergenPolicy ||
      'Minuman latte mengandung susu sapi (dairy); pastri mengandung gluten, telur & mentega.',
    wifiAndSeatingPolicy:
      raw.wifiAndSeatingPolicy ||
      'Gratis Wi-Fi & colokan listrik tersedia di seluruh meja.',
  };
}

function findMatchedMenuItem(query: string, menuList: any[]) {
  const q = query.toLowerCase();
  const list = Array.isArray(menuList) ? menuList : [];

  // 1. Exact or full-name substring match
  const exactMatch = list.find((m) => {
    const name = String(m?.name || '').toLowerCase().trim();
    return name.length > 0 && q.includes(name);
  });
  if (exactMatch) return exactMatch;

  // 2. Multi-word overlap match ignoring generic stopwords
  const queryWords = q
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !QUERY_STOPWORDS.has(w));

  if (queryWords.length === 0) return null;

  let bestItem: any = null;
  let bestScore = 0;

  for (const item of list) {
    const nameWords = String(item?.name || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !QUERY_STOPWORDS.has(w));

    let score = 0;
    for (const qw of queryWords) {
      if (nameWords.some((nw) => nw === qw || (qw.length >= 4 && nw.includes(qw)))) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestScore > 0 ? bestItem : null;
}

const WIFI_LOCKED_REPLY =
  'Mohon maaf, akses Wi-Fi gratis khusus diberikan bagi pelanggan yang telah menyelesaikan pemesanan menu. Silakan pilih menu favoritmu terlebih dahulu ya!';

function isWifiQuery(query: string): boolean {
  const q = (query || '').toLowerCase();
  return (
    q.includes('wifi') ||
    q.includes('wi-fi') ||
    q.includes('wi fi') ||
    q.includes('password') ||
    q.includes('sandi') ||
    q.includes('internet') ||
    q.includes('hotspot') ||
    q.includes('ssid') ||
    q.includes('koneksi')
  );
}

function buildSmartBaristaFallback(
  userQuery: string,
  cafeInfo: any,
  menuList: any[],
  loyaltyInfo: any,
  checkoutStatus?: any
): string {
  const q = (userQuery || '').toLowerCase();
  const cafeName = cafeInfo?.name || 'Kopi Senja Utama';
  const baristaName = cafeInfo?.baristaName || 'Barista';
  const wifiPass = cafeInfo?.wifiPassword || '-';
  const activeTable = cafeInfo?.tableNumber || 'Meja Anda';
  const address = cafeInfo?.address || '';
  const phone = cafeInfo?.phone || '';
  const hasPaidOrder = Boolean(checkoutStatus?.hasPaidOrder);
  const paidOrder = checkoutStatus?.order || null;
  const policies = normalizePolicies(cafeInfo);
  const threshold =
    typeof cafeInfo?.lowStockThreshold === 'number' ? cafeInfo.lowStockThreshold : 5;

  const allMenus = Array.isArray(menuList) ? menuList : [];
  const availableItems = allMenus.filter(
    (m) => m.isAvailable !== false && (m.stock ?? 10) > 0
  );
  const lowStock = availableItems.filter((m) => (m.stock ?? 10) <= threshold);
  const soldOut = allMenus.filter((m) => m.isAvailable === false || (m.stock ?? 10) <= 0);

  const fmtPrice = (p: number) => `Rp ${Number(p || 0).toLocaleString('id-ID')}`;
  const formatMenuBullet = (m: any) => {
    const stock = m.stock ?? 10;
    const stockTag = stock <= threshold ? ` *(Almost Sold Out · Sisa ${stock})*` : '';
    return `• **${m.name}** (${m.category}) — ${fmtPrice(m.price)}${stockTag}`;
  };

  const rewardsList =
    Array.isArray(loyaltyInfo?.rewards) && loyaltyInfo.rewards.length > 0
      ? loyaltyInfo.rewards
      : [
          { pointsCost: 100, title: 'Diskon Rp 5.000', minOrderAmount: 15000 },
          { pointsCost: 200, title: 'Diskon Rp 12.000', minOrderAmount: 30000 },
          { pointsCost: 350, title: 'Diskon Rp 25.000', minOrderAmount: 50000 },
        ];

  // 0. Strict Wi-Fi gate checked FIRST before menu/policy matching
  if (isWifiQuery(q)) {
    if (!hasPaidOrder) {
      return WIFI_LOCKED_REPLY;
    }

    const orderMeta = paidOrder
      ? ` (Pesanan **${paidOrder.id}** di **${paidOrder.tableNumber || activeTable}**)`
      : ` di **${activeTable}**`;
    return `Terima kasih telah menyelesaikan pemesanan${orderMeta}! Ini bonus akses Wi-Fi **${cafeName}** untuk Anda 📶:\n\n• **Nama Jaringan:** \`${cafeName.replace(/\s+/g, '_')}_Guest\`\n• **Password Wi-Fi:** \`${wifiPass}\`\n• **Info Area Duduk:** ${policies.wifiAndSeatingPolicy}\n\nSelamat menikmati pesanan Anda!`;
  }

  // 1. Specific menu item lookup (live menu including newly added items)
  const isRecommendationAsk =
    q.includes('rekomendasi') || q.includes('favorit') || q.includes('terlaris');
  const matchedMenu = !isRecommendationAsk ? findMatchedMenuItem(q, allMenus) : null;

  if (matchedMenu) {
    const stock = matchedMenu.stock ?? 10;
    const isSoldOut = matchedMenu.isAvailable === false || stock <= 0;
    const stockNote = isSoldOut
      ? 'Maaf, saat ini stoknya sedang **Habis (Sold Out)**.'
      : stock <= threshold
      ? `Stok tinggal **${stock} porsi (Almost Sold Out)** — yuk segera pesan sebelum kehabisan!`
      : `Stok tersedia (**${stock} porsi**).`;

    const alternative = isSoldOut
      ? availableItems.find(
          (m) => m.id !== matchedMenu.id && m.category === matchedMenu.category
        ) || availableItems[0]
      : null;

    const altNote = alternative
      ? `\n\nSebagai alternatif yang siap diracik di **${cafeName}**, Anda bisa coba **${alternative.name}** (${fmtPrice(alternative.price)}).`
      : '';

    return `Tentu, ini info real-time **${matchedMenu.name}** di **${cafeName}** ☕:\n\n• **Kategori:** ${matchedMenu.category}\n• **Harga:** ${fmtPrice(matchedMenu.price)}\n• **Deskripsi:** ${matchedMenu.description || 'Menu spesial racikan barista kami.'}\n• **Kafein:** ${matchedMenu.caffeine || 'Tidak ada'} | **Kemanisan:** ${matchedMenu.sweetness || 'Sesuai selera'}\n• **Status Stok:** ${stockNote}${altNote}\n\n${policies.customizationPolicy}`;
  }

  // 2. Store policies, operating hours, payment, tax, location, customization
  if (
    q.includes('kebijakan') ||
    q.includes('aturan') ||
    q.includes('policy') ||
    q.includes('jam') ||
    q.includes('buka') ||
    q.includes('tutup') ||
    q.includes('operasional') ||
    q.includes('pajak') ||
    q.includes('tax') ||
    q.includes('service') ||
    q.includes('ppn') ||
    q.includes('bayar') ||
    q.includes('pembayaran') ||
    q.includes('qris') ||
    q.includes('tunai') ||
    q.includes('cash') ||
    q.includes('alamat') ||
    q.includes('lokasi') ||
    q.includes('dimana') ||
    q.includes('telepon') ||
    q.includes('kontak') ||
    q.includes('colokan') ||
    q.includes('duduk') ||
    q.includes('ukuran') ||
    q.includes('large')
  ) {
    const contactLine =
      address || phone
        ? `• **Lokasi & Kontak:** ${[address, phone].filter(Boolean).join(' • ')}\n`
        : '';
    const wifiPolicyLine = hasPaidOrder
      ? `• **Wi-Fi & Area Duduk:** ${policies.wifiAndSeatingPolicy}\n`
      : '';
    return `Berikut kebijakan resmi & informasi operasional **${cafeName}** 📜:\n\n• **Jam Operasional:** ${policies.operatingHours}\n${contactLine}• **Pembayaran:** ${policies.paymentPolicy}\n• **Pajak & Layanan:** ${policies.taxAndService}\n• **Kustomisasi & Ukuran:** ${policies.customizationPolicy}\n${wifiPolicyLine}• **Alergen & Bahan:** ${policies.allergenPolicy}\n\nAda menu yang ingin Anda pesan dari **${activeTable}**?`;
  }

  // 4. Loyalty points / promo / discount query
  if (
    q.includes('poin') ||
    q.includes('loyalty') ||
    q.includes('promo') ||
    q.includes('diskon') ||
    q.includes('voucher')
  ) {
    const pts = loyaltyInfo?.points ?? 0;
    const activeVoucherNote = loyaltyInfo?.activeReward
      ? `\n• **Voucher Aktif Anda:** **${loyaltyInfo.activeReward.title}** (siap memotong keranjang!)`
      : '';
    const rewardsText = rewardsList
      .map(
        (r: any) =>
          `• **${r.pointsCost} Poin** → **${r.title}** (min. belanja ${fmtPrice(r.minOrderAmount || 0)})`
      )
      .join('\n');

    return `Program Loyalty **${cafeName}** 🎁:\n\nSetiap transaksi QRIS otomatis mengumpulkan **1 Poin per Rp 1.000** belanja:\n• **Saldo Poin Anda Saat Ini:** **${pts} Poin**${activeVoucherNote}\n${rewardsText}\n\nKlik tombol **${pts} Poin** di pojok kanan atas layar untuk menukar voucher diskon langsung ke keranjang Anda!`;
  }

  // 5. Allergen / dairy / sugar info
  if (
    q.includes('alergen') ||
    q.includes('alergi') ||
    q.includes('susu') ||
    q.includes('dairy') ||
    q.includes('gluten') ||
    q.includes('gula') ||
    q.includes('manis') ||
    q.includes('less sugar')
  ) {
    const lightOptions = availableItems
      .filter(
        (m) =>
          m.sweetness === 'Less Sugar' ||
          m.sweetness === 'No Sugar' ||
          m.caffeine === 'Bebas Kafein'
      )
      .slice(0, 3);
    const recList = lightOptions.map(formatMenuBullet).join('\n');

    return `Info bahan & penyesuaian rasa di **${cafeName}** 🌿:\n\n• **Kebijakan Alergen:** ${policies.allergenPolicy}\n• **Kustomisasi Gula & Es:** ${policies.customizationPolicy}\n\n${recList ? `Menu yang bisa disesuaikan atau ramah gula saat ini:\n${recList}` : 'Silakan pilih menu favorit Anda dan atur tingkat gula langsung sebelum memasukkan ke keranjang.'}`;
  }

  // 6. Non-coffee / caffeine-free query
  if (
    q.includes('tanpa kafein') ||
    q.includes('bebas kafein') ||
    q.includes('non-kopi') ||
    q.includes('non kopi') ||
    q.includes('segar') ||
    q.includes('matcha') ||
    q.includes('cokelat') ||
    q.includes('teh')
  ) {
    const nonCoffee = availableItems.filter(
      (m) =>
        m.category === 'Non-Kopi' ||
        m.caffeine === 'Bebas Kafein' ||
        m.caffeine === 'Rendah'
    );
    const itemsText = nonCoffee.slice(0, 4).map(formatMenuBullet).join('\n');

    if (!itemsText) {
      return `Saat ini pilihan minuman Non-Kopi di **${cafeName}** sedang kosong atau habis stoknya. Anda bisa cek kategori lain atau tanyakan status stok terbaru ke saya ya!`;
    }

    return `Pilihan minuman segar & non-kopi yang tersedia di **${cafeName}** 🍵:\n\n${itemsText}\n\n${policies.customizationPolicy}`;
  }

  // 7. Food / snack / pastry query
  if (
    q.includes('camilan') ||
    q.includes('snack') ||
    q.includes('pastri') ||
    q.includes('pastry') ||
    q.includes('makan') ||
    q.includes('lapar') ||
    q.includes('croissant') ||
    q.includes('berat')
  ) {
    const foods = availableItems.filter(
      (m) => m.category === 'Makanan Ringan' || m.category === 'Makanan Berat'
    );
    const foodText = foods.slice(0, 4).map(formatMenuBullet).join('\n');
    const drinkPair = availableItems.find(
      (m) => m.category === 'Kopi' || m.category === 'Non-Kopi'
    );

    if (!foodText) {
      return `Maaf, semua menu makanan & pastri di **${cafeName}** saat ini sedang habis stoknya. Namun kami masih punya **${availableItems.length} minuman** yang siap diracik untuk Anda!`;
    }

    const pairNote = drinkPair
      ? `\n\n💡 **Saran Pairing:** Paling nikmat dipadukan dengan **${drinkPair.name}** (${fmtPrice(drinkPair.price)})!`
      : '';

    return `Menu makanan & pastri yang siap disajikan di **${cafeName}** 🥐:\n\n${foodText}${pairNote}`;
  }

  // 8. Stock / availability query
  if (
    q.includes('stok') ||
    q.includes('habis') ||
    q.includes('tersedia') ||
    q.includes('ready') ||
    q.includes('sold out')
  ) {
    const lowText = lowStock.length
      ? `\n⚠️ **Hampir Habis (Almost Sold Out):**\n${lowStock.map((m) => `• **${m.name}** (Sisa ${m.stock} porsi)`).join('\n')}`
      : '';
    const soldText = soldOut.length
      ? `\n❌ **Sedang Habis (Sold Out):** ${soldOut.map((m) => m.name).join(', ')}`
      : '';
    return `Update stok real-time **${cafeName}** saat ini 📋:\n\nTotal ada **${availableItems.length} menu** yang siap dipesan dari **${activeTable}**.${lowText}${soldText}\n\n${policies.paymentPolicy}`;
  }

  // 9. Price / budget / full menu list query
  if (
    q.includes('harga') ||
    q.includes('murah') ||
    q.includes('hemat') ||
    q.includes('termurah') ||
    q.includes('budget') ||
    q.includes('daftar menu') ||
    q.includes('apa saja')
  ) {
    const sorted = [...availableItems].sort((a, b) => (a.price || 0) - (b.price || 0));
    const listText = sorted.slice(0, 5).map(formatMenuBullet).join('\n');

    if (!listText) {
      return `Saat ini belum ada menu yang tersedia di katalog **${cafeName}**.`;
    }

    return `Daftar menu yang tersedia di **${cafeName}** (urut harga paling hemat) 💰:\n\n${listText}\n\n• **Pajak & Layanan:** ${policies.taxAndService}`;
  }

  // 10. Coffee-focused query
  if (q.includes('kopi') || q.includes('espresso') || q.includes('latte') || q.includes('kafein')) {
    const coffees = availableItems.filter((m) => m.category === 'Kopi');
    const coffeeText = coffees.slice(0, 4).map(formatMenuBullet).join('\n');

    if (!coffeeText) {
      return `Saat ini seluruh varian kopi di **${cafeName}** sedang habis stoknya. Anda bisa coba kategori Non-Kopi atau tanyakan menu yang tersedia sekarang!`;
    }

    return `Pilihan kopi spesial yang siap diracik di **${cafeName}** ☕:\n\n${coffeeText}\n\n${policies.customizationPolicy}`;
  }

  // 11. General recommendation / greeting fallback (100% live data)
  const popular = availableItems.filter((m) => m.isPopular);
  const picks = (popular.length >= 2 ? popular : availableItems).slice(0, 3);
  const picksText = picks.map(formatMenuBullet).join('\n');

  if (!picksText) {
    return `Halo! Saya **${baristaName}** di **${cafeName}** (${activeTable}) ☕.\n\nSaat ini stok menu sedang diperbarui oleh tim dapur kami. Jam operasional kami: **${policies.operatingHours}**. Ada yang bisa saya bantu terkait daftar menu atau kebijakan kafe?`;
  }

  return `Halo! Saya **${baristaName}** di **${cafeName}** (${activeTable}) ☕.\n\nBerikut rekomendasi menu yang tersedia saat ini:\n${picksText}\n\n✨ **Info Cepat:**\n• **Jam Buka:** ${policies.operatingHours}\n• Anda juga bisa tanya soal kebijakan kafe, alergen, level gula, atau poin loyalitas!`;
}

// Barista AI Chatbot Endpoint
app.post('/api/barista-ai', async (req, res) => {
  const { messages, cafeInfo, menuList, loyaltyInfo, checkoutStatus } = req.body || {};

  const activeCafeName = cafeInfo?.name || 'Kopi Senja Utama';
  const activeBaristaName = cafeInfo?.baristaName || 'Barista Senja';
  const activeWifiPass = cafeInfo?.wifiPassword || 'kopisenja2026';
  const activeSlogan = cafeInfo?.tagline || 'Cita Rasa Kopi Nusantara';
  const activeTable = cafeInfo?.tableNumber || 'Meja 04';
  const activeAddress = cafeInfo?.address || '-';
  const activePhone = cafeInfo?.phone || '-';
  const hasPaidOrder = Boolean(checkoutStatus?.hasPaidOrder);
  const paidOrder = checkoutStatus?.order || null;
  const policies = normalizePolicies(cafeInfo);
  const threshold = typeof cafeInfo?.lowStockThreshold === 'number' ? cafeInfo.lowStockThreshold : 5;
  const lastUserMessage =
    Array.isArray(messages) && messages.length > 0
      ? String(messages[messages.length - 1]?.content || '')
      : '';

  // Deterministic strict blockade before any LLM call when order is not paid yet
  if (!hasPaidOrder && isWifiQuery(lastUserMessage)) {
    return res.json({ reply: WIFI_LOCKED_REPLY, source: 'wifi-gate' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const formattedMenu = (menuList || [])
      .map((m: any) => {
        const stock = m.stock ?? 15;
        const stockStatus =
          m.isAvailable === false || stock <= 0
            ? 'HABIS (Sold Out)'
            : stock <= threshold
            ? `HAMPIR HABIS (Almost Sold Out, sisa ${stock})`
            : `Tersedia (${stock} porsi)`;
        return `- ${m.name} (${m.category}): Rp ${Number(m.price || 0).toLocaleString('id-ID')} | Status: ${stockStatus} | ${m.description || ''} | Kafein: ${m.caffeine || 'Tidak ada'} | Kemanisan: ${m.sweetness || 'Bisa disesuaikan'}`;
      })
      .join('\n');

    const rewardsSummary =
      Array.isArray(loyaltyInfo?.rewards) && loyaltyInfo.rewards.length > 0
        ? loyaltyInfo.rewards
            .map(
              (r: any) =>
                `${r.pointsCost} Poin = ${r.title} (min. Rp ${Number(r.minOrderAmount || 0).toLocaleString('id-ID')})`
            )
            .join(' | ')
        : '100 Poin = Diskon Rp 5.000 | 200 Poin = Diskon Rp 12.000 | 350 Poin = Diskon Rp 25.000';

    const loyaltyContext = loyaltyInfo
      ? `\nProgram Poin Loyalitas Pelanggan:
- Nama Pelanggan: ${loyaltyInfo.customerName || 'Tamu'}
- Saldo Poin Saat Ini: ${loyaltyInfo.points ?? 0} Poin (1 Poin per Rp 1.000 belanja)
- Voucher Aktif: ${loyaltyInfo.activeReward ? `${loyaltyInfo.activeReward.title} (min. Rp ${loyaltyInfo.activeReward.minOrderAmount?.toLocaleString('id-ID')})` : 'Belum ada voucher aktif'}
- Pilihan Tukar Poin: ${rewardsSummary}`
      : '';

    const wifiPromptContext = hasPaidOrder
      ? `- Status Pembayaran Pelanggan: SUDAH CHECKOUT & LUNAS (Order ${paidOrder?.id || ''}, Meja ${paidOrder?.tableNumber || activeTable}, Total Rp ${Number(paidOrder?.totalAmount || 0).toLocaleString('id-ID')})
- Password Wi-Fi Kafe (Terbuka karena sudah lunas): ${activeWifiPass}
- Kebijakan Wi-Fi & Area Duduk: ${policies.wifiAndSeatingPolicy}`
      : `- Status Pembayaran Pelanggan: BELUM LUNAS / BELUM MELAKUKAN PEMESANAN
- Status Akses Wi-Fi: TERKUNCI TOTAL (DILARANG memberikan password maupun info akses Wi-Fi sebelum status pesanan Lunas)`;

    const wifiRuleInstruction = hasPaidOrder
      ? `2. Pelanggan SUDAH menyelesaikan checkout dan pembayaran lunas. Jika ditanya password Wi-Fi, berikan jaringan \`${activeCafeName.replace(/\s+/g, '_')}_Guest\` dan password \`${activeWifiPass}\` dengan ramah. Namun JANGAN selipkan password Wi-Fi pada sapaan atau pertanyaan menu yang tidak menanyakan Wi-Fi.`
      : `2. ATURAN WAJIB WI-FI: Pelanggan BELUM memiliki pesanan berstatus Lunas. JANGAN PERNAH memberikan informasi atau password Wi-Fi dalam jawaban apa pun. Jika pelanggan menanyakan Wi-Fi, jawab persis: "${WIFI_LOCKED_REPLY}"`;

    const systemInstruction = `Kamu adalah ${activeBaristaName}, Head Barista AI yang ramah, hangat, sopan, dan ahli di kafe "${activeCafeName}" (${activeSlogan}).

Informasi Kafe & Pelanggan Saat Ini (Live State):
- Nama Kafe: ${activeCafeName}
- Alamat & Kontak: ${activeAddress} | ${activePhone}
- Meja Pelanggan: ${activeTable}
- Barista Penanggung Jawab: ${activeBaristaName}
${wifiPromptContext}

Kebijakan Kafe & Operasional Resmi (Store Policies):
- Jam Operasional: ${policies.operatingHours}
- Kebijakan Pembayaran: ${policies.paymentPolicy}
- Pajak & Biaya Layanan: ${policies.taxAndService}
- Kustomisasi Minuman & Ukuran: ${policies.customizationPolicy}
- Kebijakan Alergen & Bahan: ${policies.allergenPolicy}
${loyaltyContext}

Daftar Menu Kafe Real-Time (perhatikan status stok!):
${formattedMenu || '- Belum ada item menu di katalog.'}

Panduan Merespons:
1. Selalu gunakan nama kafe aktif "${activeCafeName}" dan data real-time di atas — JANGAN pernah mengarang menu atau kebijakan di luar daftar di atas.
${wifiRuleInstruction}
3. Jika ditanya rekomendasi menu, prioritaskan menu dari daftar di atas yang berstatus Tersedia atau Hampir Habis (beritahu jika stok tinggal sedikit agar segera dipesan), dan JANGAN rekomendasikan menu yang HABIS kecuali menjelaskan alternatifnya.
4. Jika ditanya jam buka, pembayaran, pajak/biaya layanan, ukuran cup, lokasi, atau alergen, jawab sesuai Kebijakan Kafe & Operasional Resmi di atas.
5. Jika ditanya promo atau poin, jelaskan saldo poin pelanggan dan daftar pilihan tukar poin di atas.
6. Jawab dalam Bahasa Indonesia yang natural, ringkas, ramah, dan gunakan poin ('•') agar mudah dibaca di layar HP.`;

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '') }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: 'Halo barista! Bisa bantu rekomendasi menu?' }],
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    const replyText =
      response.text ||
      buildSmartBaristaFallback(
        messages?.[messages.length - 1]?.content || '',
        cafeInfo,
        menuList,
        loyaltyInfo,
        checkoutStatus
      );

    res.json({ reply: replyText, source: 'gemini' });
  } catch (error: any) {
    console.warn('Barista AI using smart local responder:', error?.message || error);
    const lastUserMsg =
      messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    const reply = buildSmartBaristaFallback(
      lastUserMsg,
      cafeInfo,
      menuList,
      loyaltyInfo,
      checkoutStatus
    );
    res.json({ reply, source: 'assistant-fallback' });
  }
});

// Dynamic QRIS Payment Verification Webhook Simulation Endpoint
app.post('/api/qris/verify-webhook', (req, res) => {
  const { orderId, amount, cafeName } = req.body;
  res.json({
    success: true,
    message: `Payment of Rp ${amount?.toLocaleString('id-ID')} verified for Order ${orderId} at ${cafeName}`,
    status: 'PAID',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KopiFlow 3D - Self-Order & Auto-Payment System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="bg-amber-50/40 text-slate-900 font-sans antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
