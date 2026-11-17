import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { LOYALTY_REWARDS } from '../../constants/initialData';
import { MenuItem, Order } from '../../types';

const SEED_ORDER_IDS = new Set(['ORD-8801', 'ORD-8802']);
const isOrderPaid = (order: Order | null | undefined): order is Order =>
  Boolean(
    order &&
      (order.paymentStatus === 'Lunas - QRIS' || order.paymentStatus === 'Lunas - Kasir')
  );

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BaristaAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMenuItem?: (item: MenuItem) => void;
}

function renderInlineFormatting(line: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${idx}`} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={`${keyPrefix}-i-${idx}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-c-${idx}`}
          className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-bold text-[11px] border border-amber-300/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) {
          return <div key={`sp-${i}`} className="h-1" />;
        }
        return (
          <div key={`ln-${i}`} className="leading-relaxed">
            {renderInlineFormatting(line, `ln-${i}`)}
          </div>
        );
      })}
    </div>
  );
}

export const BaristaAIChatModal: React.FC<BaristaAIChatModalProps> = ({
  isOpen,
  onClose,
  onSelectMenuItem,
}) => {
  const { cafeConfig, menuItems, loyaltyProfile, lowStockThreshold, orders, activeOrder } =
    useCafe();

  const paidCustomerOrder =
    (isOrderPaid(activeOrder) ? activeOrder : null) ||
    orders.find(
      (o) =>
        !SEED_ORDER_IDS.has(o.id) &&
        o.tableNumber === cafeConfig.tableNumber &&
        isOrderPaid(o)
    ) ||
    null;
  const hasPaidOrder = Boolean(paidCustomerOrder);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCafeSignatureRef = useRef<string>('');
  const announcedPaidOrderIdsRef = useRef<Set<string>>(new Set());

  const createWelcomeMessage = (): Message => ({
    id: `msg-welcome-${Date.now()}`,
    role: 'assistant',
    content: `Halo! Selamat datang di **${cafeConfig.name}** ☕!\n\nSaya **Agent Kafe** siap membantu Anda di **${cafeConfig.tableNumber}**. Silakan tanyakan rekomendasi menu kami, jam buka & kebijakan kafe, info alergen, atau poin loyalitas (**${loyaltyProfile.points} Poin**).`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  });

  useEffect(() => {
    const signature = `${cafeConfig.name}::Agent Kafe`;
    if (lastCafeSignatureRef.current !== signature) {
      lastCafeSignatureRef.current = signature;
      setMessages([createWelcomeMessage()]);
    } else if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0].id.startsWith('msg-welcome-'))
    ) {
      setMessages([createWelcomeMessage()]);
    }
  }, [
    isOpen,
    cafeConfig.name,
    cafeConfig.tableNumber,
    loyaltyProfile.points,
  ]);

  // Otomatis munculkan struk pembayaran & Wi-Fi setelah lunas
  useEffect(() => {
    if (!paidCustomerOrder || announcedPaidOrderIdsRef.current.has(paidCustomerOrder.id)) {
      return;
    }
    announcedPaidOrderIdsRef.current.add(paidCustomerOrder.id);

    const itemsSummary = paidCustomerOrder.items
      .map(
        (item) =>
          `• ${item.quantity}x **${item.menuItem.name}** (${item.selectedSize}) — Rp ${(
            item.sizePrice * item.quantity
          ).toLocaleString('id-ID')}`
      )
      .join('\n');
    const wifiSsid = `${cafeConfig.name.replace(/\s+/g, '_')}_Guest`;

    const postCheckoutMsg: Message = {
      id: `msg-paid-${paidCustomerOrder.id}`,
      role: 'assistant',
      content: `Pembayaran **${paidCustomerOrder.id}** berhasil diverifikasi! 🎉\n\n**Nomor Meja:** ${paidCustomerOrder.tableNumber}\n**Status:** ${paidCustomerOrder.status}\n\n**Ringkasan Pesanan:**\n${itemsSummary}\n**Total Lunas:** Rp ${paidCustomerOrder.totalAmount.toLocaleString('id-ID')}\n\n📶 **Bonus Akses Wi-Fi Kafe:**\n**WiFi:** \`${wifiSsid}\`\n**Password:** \`${cafeConfig.wifiPassword}\``,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, postCheckoutMsg]);
  }, [paidCustomerOrder, cafeConfig.name, cafeConfig.wifiPassword]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleResetChat = () => {
    setMessages([createWelcomeMessage()]);
    setInput('');
  };

  const handleCopyWifi = (msgId: string) => {
    navigator.clipboard?.writeText(cafeConfig.wifiPassword);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Logika Chat Lokal Cerdas (Tanpa perlu backend API)
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      let replyContent = "";

      if (
        lowerQuery.includes('menu') || 
        lowerQuery.includes('rekomendasi') || 
        lowerQuery.includes('minum') || 
        lowerQuery.includes('kopi') ||
        lowerQuery.includes('favorit') ||
        lowerQuery.includes('pastri') ||
        lowerQuery.includes('camilan') ||
        lowerQuery.includes('kafein')
      ) {
        const available = menuItems.filter((m: any) => m.isAvailable && m.stock > 0);
        const topPicks = available.slice(0, 3);
        const menuListStr = topPicks.map((m: any) => `- **${m.name}** (Rp ${m.price.toLocaleString('id-ID')}): ${m.description || ''}`).join('\n');
        replyContent = `Tentu! Rekomendasi menu pilihan di **${cafeConfig.name}** hari ini:\n\n${menuListStr}\n\nSilakan klik tombol di bawah untuk langsung memesannya ya! ☕`;
      } 
      else if (
        lowerQuery.includes('jam') || 
        lowerQuery.includes('buka') || 
        lowerQuery.includes('operasional') || 
        lowerQuery.includes('kebijakan') ||
        lowerQuery.includes('pajak') ||
        lowerQuery.includes('aturan')
      ) {
        replyContent = `Jam operasional **${cafeConfig.name}** adalah **${cafeConfig.policies?.operatingHours || '08:00 - 22:00 WIB'}** setiap hari. Pajak & layanan sesuai standar kafe kami. Silakan mampir! ✨`;
      } 
      else if (
        lowerQuery.includes('wifi') || 
        lowerQuery.includes('internet') || 
        lowerQuery.includes('sandi') ||
        lowerQuery.includes('password')
      ) {
        replyContent = `📶 **Akses Wi-Fi Gratis untuk Pelanggan:**\n- **Nama Wi-Fi:** \`${cafeConfig.name.replace(/\s+/g, '_')}_Guest\`\n- **Password:** \`${cafeConfig.wifiPassword || 'kopiflow2026'}\``;
      } 
      else if (
        lowerQuery.includes('poin') || 
        lowerQuery.includes('loyalty') || 
        lowerQuery.includes('diskon') ||
        lowerQuery.includes('promo')
      ) {
        replyContent = `🎁 Poin loyalty kamu saat ini terkumpul **${loyaltyProfile.points} Poin**. Kamu bisa menukarkannya dengan diskon menarik atau produk gratis di menu reward!`;
      } 
      else if (
        lowerQuery.includes('alergen') || 
        lowerQuery.includes('gula') || 
        lowerQuery.includes('susu')
      ) {
        replyContent = `🌱 Info Alergen & Gula di **${cafeConfig.name}**: Kami menyediakan opsi susu alternatif dan tingkat kemanisan (*less sugar* / *normal sugar*) sesuai selera Anda.`;
      }
      else {
        replyContent = `Halo! Sebagai **Agent Kafe** di ${cafeConfig.name}, saya siap membantu menjawab seputar rekomendasi menu, info jam buka, Wi-Fi, hingga poin loyalitas Anda. Ada yang ingin ditanyakan lagi? ☕`;
      }

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 600);
  };

  const quickPrompts = [
    { label: '⭐ Menu Terfavorit', query: 'Bisa minta 3 rekomendasi menu terfavorit di sini?' },
    { label: '📜 Kebijakan & Jam Buka', query: 'Apa saja kebijakan kafe, jam buka, pajak, dan aturan pembayaran di sini?' },
    { label: '🍃 Bebas Kafein', query: 'Mana opsi minuman yang segar, manis, dan tanpa kafein?' },
    { label: '🥐 Camilan & Pastri', query: 'Camilan pastri apa yang paling pas nemenin minum kopi?' },
    { label: '🎁 Poin & Diskon', query: 'Bagaimana cara pakai poin loyalitas dan promo diskon?' },
    { label: '🌿 Info Alergen & Gula', query: 'Apa info alergen susu dan pilihan level gula di sini?' },
  ];

  const getMentionedMenus = (text: string): MenuItem[] => {
    const lower = text.toLowerCase();
    return menuItems
      .filter((m) => m.isAvailable && m.stock > 0 && lower.includes(m.name.toLowerCase()))
      .slice(0, 3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md h-[580px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-amber-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-display font-bold text-sm text-amber-100 truncate">
                  Agent Kafe
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              </div>
              <p className="text-[11px] text-amber-300/80 truncate">
                Asisten Pintar {cafeConfig.name} · {cafeConfig.tableNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleResetChat}
              title="Mulai Ulang Percakapan"
              aria-label="Reset Chat"
              className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Tutup Agent Kafe"
              aria-label="Tutup Chat"
              className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-amber-50/80 px-3 py-2 border-b border-amber-200/60 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-white border border-amber-300/70 text-amber-900 text-xs font-medium whitespace-nowrap hover:bg-amber-100 transition-colors shadow-2xs disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const showsWifi =
              hasPaidOrder && !isUser && m.content.includes(cafeConfig.wifiPassword);
            const mentionedMenus =
              !isUser && m.id !== messages[0]?.id && !m.id.startsWith('msg-paid-')
                ? getMentionedMenus(m.content)
                : [];

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                    isUser
                      ? 'bg-amber-900 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <FormattedMessage content={m.content} />

                  {(showsWifi || mentionedMenus.length > 0) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {showsWifi && (
                        <button
                          type="button"
                          onClick={() => handleCopyWifi(m.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Password Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Wi-Fi ({cafeConfig.wifiPassword})</span>
                            </>
                          )}
                        </button>
                      )}

                      {onSelectMenuItem &&
                        mentionedMenus.map((menu) => (
                          <button
                            key={menu.id}
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectMenuItem(menu);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Pesan {menu.name}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-amber-200/70' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-500 flex items-center gap-2 shadow-2xs animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Agent Kafe sedang menyiapkan jawaban...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya Agent Kafe seputar menu, kebijakan, dll..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Kirim pesan"
            className="p-2.5 rounded-xl bg-amber-900 text-white hover:bg-amber-950 disabled:opacity-40 transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};