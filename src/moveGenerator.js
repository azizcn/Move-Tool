// İsimleri temizleyen fonksiyon
const sanitizeName = (name) => {
  if (!name) return 'unknown';
  if(name.includes('<')) return name; 
  return name.replace(/::/g, '_').replace(/\s/g, '_'); 
};

const getFuncName = (label) => {
    return label.replace(/::/g, '_').replace(/\s/g, '_');
};

export const generateMoveCode = (moduleName, nodes, edges) => {
  const safeModuleName = sanitizeName(moduleName).toLowerCase().replace(/[^a-z0-9_]/g, '');

  // 1. ANA WITNESS İSMİNİ BUL
  let mainStructName = "MY_COIN"; 
  const initNode = nodes.find(n => n.type === 'initNode');
  if (initNode) {
      const witnessEdge = edges.find(e => e.target === initNode.id);
      if (witnessEdge) {
          const sourceNode = nodes.find(n => n.id === witnessEdge.source);
          if (sourceNode) mainStructName = sanitizeName(sourceNode.data.label);
      }
  }

  // --- KODU YAZMAYA BAŞLIYORUZ (EKSİK İMPORTLAR EKLENDİ) ---
  let code = `module ${safeModuleName}::${safeModuleName} {\n`;
  code += `    use sui::object::{Self, UID};\n`;
  code += `    use sui::transfer;\n`;
  code += `    use sui::tx_context::{Self, TxContext};\n`;
  code += `    use sui::coin::{Self, TreasuryCap, Coin};\n`;
  code += `    use sui::url::{Self, Url};\n`;
  code += `    use std::option;\n`;
  code += `    use std::string::{Self, String};\n\n`; // <--- İŞTE BU SATIR EKSİKTİ!

  // 2. STRUCT'LARI YAZ
  let witnessDefined = false; 

  const structs = nodes.filter(n => n.type === 'structNode');
  structs.forEach(node => {
    if (node.data.isImported) return;

    const abilities = node.data.abilities || { key: true, store: true };
    const abilityKeys = Object.entries(abilities).filter(([_, val]) => val).map(([key]) => key);
    const hasString = abilityKeys.length > 0 ? ` has ${abilityKeys.join(', ')}` : '';
    const structName = sanitizeName(node.data.label); 

    if (structName === mainStructName) witnessDefined = true;

    code += `    struct ${structName}${hasString} {\n`;
    if (node.data.fields) {
      node.data.fields.forEach(field => {
        code += `        ${field.name}: ${field.type},\n`;
      });
    }
    code += `    }\n\n`;
  });

  // 3. WITNESS YOKSA EKLE
  if (!witnessDefined) {
      code += `    // Otomatik eklenen Witness Struct\n`;
      code += `    struct ${mainStructName} has drop {}\n\n`;
  }

  // 4. INIT FONKSİYONU
  if (initNode) {
    const data = initNode.data;
    code += `    fun init(witness: ${mainStructName}, ctx: &mut TxContext) {\n`;
    code += `        let (treasury, metadata) = coin::create_currency(\n`;
    code += `            witness,\n`;
    code += `            ${data.coinDecimals || 9},\n`;
    code += `            b"${data.coinSymbol || 'SYM'}",\n`;
    code += `            b"${data.coinName || 'My Coin'}",\n`;
    code += `            b"${data.coinDescription || ''}",\n`;
    code += `            option::none(),\n`;
    code += `            ctx\n`;
    code += `        );\n`;
    code += `        transfer::public_freeze_object(metadata);\n`;
    code += `        transfer::public_transfer(treasury, tx_context::sender(ctx));\n`;
    code += `    }\n\n`;
  }

  // 5. FONKSİYONLAR
  const funcs = nodes.filter(n => n.type === 'functionNode');

  funcs.forEach(node => {
    let paramsList = [];
    if (node.data.params) {
      paramsList = node.data.params.map(p => {
        let type = p.type;
        // Generic Tip Düzeltmeleri
        if (type === '&mut TreasuryCap' || type === 'TreasuryCap') {
            type = `&mut TreasuryCap<${mainStructName}>`;
        }
        if (type === 'Coin<T>' || type === 'T') {
            type = `Coin<${mainStructName}>`;
        }
        return `${p.name}: ${type}`;
      });
    }

    const funcName = getFuncName(node.data.label);
    const paramsStr = paramsList.join(", ");
    const outgoingEdges = edges.filter(e => e.source === node.id);

    code += `    public entry fun ${funcName}(${paramsStr}) {\n`;
    
    // MINT FONKSİYONU MANTIĞI
    if (funcName === 'coin_mint') {
        code += `        let coin = coin::mint(cap, amount, ctx);\n`;
        
        const transferEdge = outgoingEdges.find(e => {
            const target = nodes.find(n => n.id === e.target);
            return target && target.data.label.includes('transfer');
        });

        if (transferEdge) {
             // Mint -> Transfer bağlantısı varsa
             const hasRecipient = node.data.params.some(p => p.name === 'recipient'); // Bu kontrol Mint'te değil Transfer'de olmalı aslında ama neyse.
             // Transfer fonksiyonunun parametrelerini bulalım
             const targetNode = nodes.find(n => n.id === transferEdge.target);
             const recipientParam = targetNode?.data?.params?.find(p => p.name === 'recipient');
             
             // Eğer transfer fonksiyonunda 'recipient' varsa ve bu bir parametreyse
             // Kodda recipient diye bir değişken olmalı.
             // Ancak bizim görsel araçta Mint fonksiyonunda recipient parametresi yoksa hata verir.
             // O yüzden basitçe:
             code += `        transfer::public_transfer(coin, tx_context::sender(ctx)); // Varsayılan gönderene yolla\n`;
        } else {
             code += `        transfer::public_transfer(coin, tx_context::sender(ctx));\n`;
        }
    } 
    // TRANSFER FONKSİYONU MANTIĞI
    else if (funcName === 'transfer_transfer') {
         code += `        transfer::public_transfer(obj, recipient);\n`;
    }
    // NFT MINT MANTIĞI (YENİ)
    else if (funcName === 'nft_mint') {
        // NFT oluşturma mantığı
        // Burada basit bir örnek yapıyoruz. Gerçek NFT struct'ını bulmak lazım ama şimdilik SimpleNFT varsayalım.
        code += `        let nft = SimpleNFT {\n`;
        code += `            id: object::new(ctx),\n`;
        code += `            name: string::utf8(name),\n`;
        code += `            url: url::new_unsafe_from_bytes(url)\n`;
        code += `        };\n`;
        
        // Transfer bağlantısı var mı?
        const transferEdge = outgoingEdges.find(e => {
            const target = nodes.find(n => n.id === e.target);
            return target && target.data.label.includes('transfer');
        });

        if(transferEdge) {
             // Burası biraz karışık çünkü transfer fonksiyonu ayrı bir entry fun.
             // MoveSketch'te iki entry fun'ı birbirine bağlayınca tek bir işlem (PTB) gibi düşünürüz.
             // Ama kod üretirken bunları birleştirmek zordur.
             // Şimdilik NFT'yi üretene yollayalım.
             code += `        transfer::public_transfer(nft, tx_context::sender(ctx));\n`;
        } else {
             code += `        transfer::public_transfer(nft, tx_context::sender(ctx));\n`;
        }
    }
    else {
         code += `        // Mantık kodları...\n`;
    }

    code += `    }\n\n`;
  });

  code += `}`;
  return code;
};

// ... (Move.toml aynen kalıyor)
export const generateMoveToml = (packageName) => {
  const safeName = sanitizeName(packageName).toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `[package]
name = "${safeName}"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
${safeName} = "0x0"
`;
};