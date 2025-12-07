import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // Portal, baloncukların kesilmemesi için gerekli

// --- 🪙 COIN ŞABLONU VERİLERİ (GERİ EKLENDİ) ---
const COIN_TEMPLATE_NODES = [
    { id: 's-wit-c', type: 'structNode', position: { x: 50, y: 300 }, data: { label: 'MY_COIN', customTitle: 'Witness Struct 📦', fields: [{ name: 'id', type: 'UID' }], isImported: false, abilities: { drop: true } } },
    { id: 'i-init-c', type: 'initNode', position: { x: 300, y: 300 }, data: { label: 'CoinInit', coinName: 'My Coin', coinSymbol: 'MYC', coinDecimals: 9 } },
    { id: 's-cap-c', type: 'structNode', position: { x: 50, y: 500 }, data: { label: 'TreasuryCap', customTitle: 'Hazine Yetkisi 🔑', isImported: true } },
    { id: 'f-mint-c', type: 'functionNode', position: { x: 300, y: 500 }, data: { label: 'coin::mint', customTitle: 'Para Bas 🖨️', params: [{ name: 'cap', type: '&mut TreasuryCap' }, { name: 'amount', type: 'u64' }, { name: 'ctx', type: '&mut TxContext' }] } },
    { id: 'f-transfer-c', type: 'functionNode', position: { x: 600, y: 500 }, data: { label: 'transfer::transfer', customTitle: 'Adrese Gönder 🚚', params: [{ name: 'obj', type: 'T' }, { name: 'recipient', type: 'address' }] } }
];
const COIN_TEMPLATE_EDGES = [
    { id: 'e-wit-init', source: 's-wit-c', target: 'i-init-c', sourceHandle: 'obj-main', targetHandle: 'witness-input', type: 'buttonEdge', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
    { id: 'e-cap-mint', source: 's-cap-c', target: 'f-mint-c', sourceHandle: 'obj-main', targetHandle: 'param-0', type: 'buttonEdge', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    { id: 'e-mint-transfer', source: 'f-mint-c', target: 'f-transfer-c', sourceHandle: 'return-val', targetHandle: 'param-0', type: 'buttonEdge', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }
];

// --- 🖼️ NFT ŞABLONU VERİLERİ (GERİ EKLENDİ) ---
const NFT_TEMPLATE_NODES = [
    { id: 's-nft-temp', type: 'structNode', position: { x: 50, y: 150 }, data: { label: 'SimpleNFT', customTitle: 'NFT Şablonu 🖼️', fields: [{ name: 'id', type: 'UID' }, { name: 'name', type: 'String' }, { name: 'url', type: 'Url' }], abilities: { key: true, store: true } } },
    { id: 'f-mint-nft', type: 'functionNode', position: { x: 300, y: 150 }, data: { label: 'nft::mint', customTitle: 'NFT Oluştur 🎨', params: [{ name: 'name', type: 'vector<u8>' }, { name: 'url', type: 'vector<u8>' }, { name: 'ctx', type: '&mut TxContext' }] } },
    { id: 'f-transfer-nft', type: 'functionNode', position: { x: 600, y: 150 }, data: { label: 'transfer::transfer', customTitle: 'Adrese Gönder 🚚', params: [{ name: 'obj', type: 'T' }, { name: 'recipient', type: 'address' }] } }
];
const NFT_TEMPLATE_EDGES = [
    { id: 'e-nft-mint-transfer', source: 'f-mint-nft', target: 'f-transfer-nft', sourceHandle: 'return-val', targetHandle: 'param-0', type: 'buttonEdge', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } }
];

// --- SIDEBAR BİLEŞENİ ---

export default function Sidebar({ onClose, onSelect }) {
  
  // DRAG BAŞLANGICI: TEK NODE VEYA KOMPLE TEMPLATE GÖNDERİYORUZ
  const onDragStart = (event, nodeType, templateData, isTemplate = false) => {
    const payload = JSON.stringify(isTemplate ? { type: 'template', data: { nodes: templateData.nodes, edges: templateData.edges } } : { type: nodeType, data: templateData });
    event.dataTransfer.setData('text/plain', payload);
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- SORU İŞARETİ BİLEŞENİ (GÖRÜNÜRLÜĞÜ GARANTİLENDİ) ---
  const HelpIcon = ({ text }) => {
    const [tooltipPos, setTooltipPos] = useState(null);

    const handleMouseEnter = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({ 
        top: rect.top,
        left: rect.right + 15
      }); 
    };

    const tooltipContent = (
      <div 
        className="help-tooltip" 
        style={{ 
          top: tooltipPos?.top, 
          left: tooltipPos?.left,
        }}
      >
        <div className="help-arrow"></div>
        {text}
      </div>
    );

    return (
      <>
        {/* İKONUN KENDİSİ */}
        <div 
          className="help-icon"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setTooltipPos(null)}
          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); }} 
        >
          ? 
        </div>

        {/* BALONCUK (BODY'YE TAŞINIYOR) */}
        {tooltipPos && createPortal(tooltipContent, document.body)}
      </>
    );
  };

  const makeId = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

  // --- TEMPLATE LİSTESİ (ŞABLON VERİLERİ TANITILDI) ---
const templates = [
    {
      category: 'Hazır Şablonlar',
      items: [
        { toolId: 'temp-coin', label: 'Coin Şablonu 🪙', desc: 'Basit bir Coin(token) basma şablonu. Sürükle ve bırak.', type: 'template', data: { nodes: COIN_TEMPLATE_NODES, edges: COIN_TEMPLATE_EDGES } },
        { toolId: 'temp-nft', label: 'NFT Şablonu 🖼️', desc: 'Basit bir NFT oluşturma şablonu. Sürükle ve bırak.', type: 'template', data: { nodes: NFT_TEMPLATE_NODES, edges: NFT_TEMPLATE_EDGES } }
      ]
    },
    {
      category: 'Temel Malzemeler',
      items: [
        { 
          label: 'Kimlik Kartı 🆔', 
          desc: 'UID: Sui üzerindeki her objenin sahip olması gereken benzersiz kimlik numarasıdır.\n\n💡 Nasıl Kullanılır:\nHerhangi bir Struct oluştururken ilk alan (field) olarak mutlaka eklenmelidir. Fonksiyon içinde `object::new(ctx)` ile üretilir.',
          type: 'structNode', 
          data: { label: 'UID', customTitle: 'Kimlik Kartı 🆔', isImported: true, fields: [] } 
        },
        { 
          label: 'Yazı (Metin) 📝', 
          desc: 'String: İsim, açıklama veya mesaj gibi metin verilerini tutar.\n\n💡 Nasıl Kullanılır:\nStruct içinde bir alan olarak tanımlanır. Veri girerken `string::utf8(b"Merhaba")` şeklinde dönüştürülerek kullanılır.',
          type: 'structNode', 
          data: { label: 'String', customTitle: 'Yazı 📝', isImported: true, fields: [] } 
        },
        { 
          label: 'Resim Linki 🖼️', 
          desc: 'Url: İnternet üzerindeki bir dosyanın (resim, video) adresini tutar.\n\n💡 Nasıl Kullanılır:\nGenellikle NFT oluştururken kullanılır. `url::new_unsafe_from_bytes(...)` fonksiyonu ile oluşturulup Struct içine kaydedilir.',
          type: 'structNode', 
          data: { label: 'Url', customTitle: 'Resim Linki 🖼️', isImported: true, fields: [] } 
        },
      ]
    },
    {
      category: 'Para & Finans',
      items: [
        { 
          label: 'Hazine Anahtarı 🔑', 
          desc: 'TreasuryCap: Coin basma (Mint) ve yakma (Burn) yetkisi veren en önemli objedir.\n\n💡 Nasıl Kullanılır:\nBu objeyi `Coin::Mint` fonksiyonunun "cap" girişine bağlayarak para basabilirsin. Bu anahtarı kimseye kaptırma!',
          type: 'structNode', 
          data: { label: 'TreasuryCap', customTitle: 'Hazine Anahtarı 🔑', isImported: true, fields: [] } 
        },
        { 
          label: 'Jeton (Coin) 🪙', 
          desc: 'Coin<T>: Harcanabilir, transfer edilebilir dijital paradır.\n\n💡 Nasıl Kullanılır:\nGenellikle `Coin::Mint` fonksiyonunun çıktısı olarak oluşur. Sonrasında bunu `Transfer` fonksiyonuna bağlayarak birine gönderebilirsin.',
          type: 'structNode', 
          data: { label: 'Coin', customTitle: 'Jeton 🪙', isImported: true, fields: [{ name: 'value', type: 'u64' }] } 
        },
        { 
          label: 'Cüzdan Bakiyesi 💰', 
          desc: 'Balance<T>: Coin\'in sayısal değeridir. Coin bir cüzdansa, Balance içindeki nakittir.\n\n💡 Nasıl Kullanılır:\nGenellikle başka bir Struct\'ın içinde (örneğin bir dükkan kasası) para saklamak için alan (field) olarak kullanılır.',
          type: 'structNode', 
          data: { label: 'Balance', customTitle: 'Cüzdan Bakiyesi 💰', isImported: true, fields: [{ name: 'value', type: 'u64' }] } 
        }
      ]
    },
    {
      category: 'Kargo İşlemleri',
      items: [
        { 
          label: 'Adrese Gönder 🚚', 
          desc: 'Transfer: Bir eşyayı alır ve belirtilen adrese teslim eder.\n\n💡 Nasıl Kullanılır:\n"obj" girişine göndermek istediğin eşyayı (örn: Coin), "recipient" girişine de alıcının adresini bağla.',
          type: 'functionNode', 
          data: { label: 'transfer::transfer', customTitle: 'Adrese Gönder 🚚', params: [{ name: 'obj', type: 'T' }, { name: 'recipient', type: 'address' }] } 
        },
        { 
          label: 'Herkesle Paylaş 📢', 
          desc: 'Share Object: Eşyayı "ortaya" koyar. Artık herkes onu görebilir ve etkileşime geçebilir.\n\n💡 Nasıl Kullanılır:\nGenellikle oyunlardaki market, sıralama tablosu gibi herkesin kullanacağı objeler yaratıldıktan hemen sonra buna bağlanır.',
          type: 'functionNode', 
          data: { label: 'transfer::share_object', customTitle: 'Herkesle Paylaş 📢', params: [{ name: 'obj', type: 'T' }] } 
        },
        { 
          label: 'Dondur (Sabitle) ❄️', 
          desc: 'Freeze Object: Eşyayı sonsuza kadar kilitler. Değiştirilemez olur.\n\n💡 Nasıl Kullanılır:\nCoin\'in metadata bilgileri (ismi, resmi) veya kuralları gibi sonradan değişmemesi gereken objeler buna bağlanır.',
          type: 'functionNode', 
          data: { label: 'transfer::freeze_object', customTitle: 'Dondur ❄️', params: [{ name: 'obj', type: 'T' }] } 
        },
        { 
          label: 'Olay Yarat (Haber Ver) 🔔', 
          desc: 'Event Emit: Blockchain dışına sinyal gönderir.\n\n💡 Nasıl Kullanılır:\nÖnemli bir işlem (örn: NFT satışı) bitince, oluşturduğun bilgi fişini (Event Struct) buna bağla ki herkes duysun.',
          type: 'functionNode', 
          data: { label: 'event::emit', customTitle: 'Haber Ver 🔔', params: [{ name: 'event', type: 'T' }] } 
        }
      ]
    },
    {
      category: 'Para Fabrikası',
      items: [
        { 
          label: 'Para Bas 🖨️', 
          desc: 'Mint: Yeni coin üretir.\n\n💡 Nasıl Kullanılır:\n"cap" girişine Hazine Anahtarını bağla. "amount" kısmına miktar gir. Çıkan sonucu (Coin) transfer fonksiyonuna bağla.',
          type: 'functionNode', 
          data: { label: 'coin::mint', customTitle: 'Para Bas 🖨️', params: [{ name: 'cap', type: '&mut TreasuryCap' }, { name: 'amount', type: 'u64' }, { name: 'ctx', type: '&mut TxContext' }] } 
        },
        { 
          label: 'Para Yak (Yok Et) 🔥', 
          desc: 'Burn: Coin\'i piyasadan siler.\n\n💡 Nasıl Kullanılır:\n"cap" girişine Hazine Anahtarını, "c" girişine de yakılacak Coin\'i bağla. Geri dönüşü yoktur!',
          type: 'functionNode', 
          data: { label: 'coin::burn', customTitle: 'Para Yak 🔥', params: [{ name: 'cap', type: '&mut TreasuryCap' }, { name: 'c', type: 'Coin<T>' }] } 
        },
        { 
          label: 'Paraları Birleştir 🔗', 
          desc: 'Join: İki parayı tek cüzdanda toplar.\n\n💡 Nasıl Kullanılır:\n"self" ana cüzdandır, "c" ise içine katılacak paradır. İşlem sonunda "c" yok olur, değeri "self"e eklenir.',
          type: 'functionNode', 
          data: { label: 'coin::join', customTitle: 'Paraları Birleştir 🔗', params: [{ name: 'self', type: '&mut Coin<T>' }, { name: 'c', type: 'Coin<T>' }] } 
        },
        { 
          label: 'Parayı Boz (Ayır) ✂️', 
          desc: 'Split: Bir bütün paradan bozukluk ayırır.\n\n💡 Nasıl Kullanılır:\n"self" ana paradır. "split_amount" ayrılacak miktardır. Çıktı olarak yeni bir Coin (bozukluk) verir.',
          type: 'functionNode', 
          data: { label: 'coin::split', customTitle: 'Parayı Boz ✂️', params: [{ name: 'self', type: '&mut Coin<T>' }, { name: 'split_amount', type: 'u64' }, { name: 'ctx', type: '&mut TxContext' }] } 
        }
      ]
    },
    {
      category: 'Süper Güçler',
      items: [
        { 
          label: 'Duvar Saati ⏰', 
          desc: 'Clock: Sistemin zaman kaynağıdır.\n\n💡 Nasıl Kullanılır:\nZamanla ilgili işlem yapacaksan bu objeyi fonksiyonuna girdi olarak eklemelisin. Genellikle "0x6" adresinde yaşar.',
          type: 'structNode', 
          data: { label: 'Clock', customTitle: 'Duvar Saati ⏰', isImported: true, fields: [] } 
        },
        { 
          label: 'Zamanı Öğren ⏳', 
          desc: 'Timestamp: Şu anki zamanı milisaniye olarak verir.\n\n💡 Nasıl Kullanılır:\n"clock" girişine Duvar Saati objesini bağla. Çıktı olarak sana bir sayı (u64) verir. Bunu süre kontrolü için kullanabilirsin.',
          type: 'functionNode', 
          data: { label: 'clock::timestamp_ms', customTitle: 'Zamanı Öğren ⏳', params: [{ name: 'clock', type: '&Clock' }] } 
        },
        { 
          label: 'Sihirli Çanta 🎒', 
          desc: 'Bag: İçine her türlü farklı eşyayı koyabileceğin dinamik bir depodur.\n\n💡 Nasıl Kullanılır:\nStruct içinde "store" yeteneği olan her şeyi bunun içinde saklayabilirsin. Tablo (Table) gibidir ama daha esnektir.',
          type: 'structNode', 
          data: { label: 'Bag', customTitle: 'Sihirli Çanta 🎒', isImported: true, fields: [] } 
        }
      ]
    }
  ];

  // --- JSX RENDER ---
  return (
    <aside id="sidebar-panel" className="sidebar">
      <div className="sidebar-header">
        <h3>🛠️ Zengin Çanta</h3>
        <button onClick={onClose} className="sidebar-close-btn">✕</button>
      </div>
      
      <div className="sidebar-hint">
        💡 <b>İpucu:</b> Öğeleri sahneye sürükleyebilir veya tıklayarak ekleyebilirsiniz.
      </div>

      <div className="sidebar-content">
        {templates.map((cat, i) => (
          <div key={i} className="sidebar-category">
            <div className="category-title">{cat.category}</div>
            <div className="category-items">
              {cat.items.map((item, j) => (
                <div
                  key={j}
                  id={item.toolId || `tool-${makeId(item.label)}`}
                  draggable 
                  onDragStart={(event) => onDragStart(event, item.type, item.data, item.type === 'template')}
                  onClick={() => onSelect && onSelect(item.type, item.data)}
                  className="sidebar-item"
                >
                  <span className="item-icon">{item.type === 'structNode' ? '📦' : (item.type === 'initNode' ? '🏁' : '⚡')}</span>
                  <span className="item-label">{item.label}</span>
                  <HelpIcon text={item.desc} /> 
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}