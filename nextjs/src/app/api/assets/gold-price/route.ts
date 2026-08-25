import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 3600; // Cache for 1 hour

let cachedPrices: any = null;

async function fetchKimThanhNhanTron() {
  try {
    const response = await fetch('https://kimthanhh.com/gia-vang', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    let result = null;

    $('.table-body .column-brandgold').each((i, el) => {
      const typeName = $(el).find('h3').text().trim();
      
      if (typeName.includes('Nhẫn Trơn 99.99')) {
        const nextSibling = $(el).next('.column-typegold');
        if (nextSibling.length > 0) {
          const buyText = nextSibling.find('.col-buy').text().trim();
          const sellText = nextSibling.find('.col-sell').text().trim();
          
          const buyPrice = parseInt(buyText.replace(/[^0-9]/g, ''), 10);
          const sellPrice = parseInt(sellText.replace(/[^0-9]/g, ''), 10);
          
          if (!isNaN(buyPrice)) {
            result = {
              buy: buyPrice * 10, // Quy về chuẩn 1 Lượng (10 chỉ)
              sell: (isNaN(sellPrice) ? buyPrice : sellPrice) * 10
            };
          }
        }
      }
    });
    return result;
  } catch (e) {
    console.error("Kim Thanh fetch error:", e);
    return null;
  }
}

export async function GET() {
  try {
    // 1. Lấy giá Vàng miếng SJC từ vang.today
    const resVangToday = await fetch("https://www.vang.today/api/prices", { 
      next: { revalidate: 3600 } 
    }).catch(() => null);
    
    let sjcMieng = null;
    let sjcNhanFallback = null;
    
    if (resVangToday && resVangToday.ok) {
      const data = await resVangToday.json();
      sjcMieng = data.prices?.SJL1L10;
      sjcNhanFallback = data.prices?.SJ9999;
    }

    // 2. Lấy giá Vàng nhẫn 99.99 từ Kim Thành H
    const kimThanhNhan = await fetchKimThanhNhanTron();

    if (!sjcMieng && !cachedPrices) {
      throw new Error("Không lấy được dữ liệu SJC");
    }

    const finalNhanTron = kimThanhNhan || sjcNhanFallback || (cachedPrices ? cachedPrices.SJ9999 : { buy: 142000000, sell: 145500000 });
    const finalMieng = sjcMieng || (cachedPrices ? cachedPrices.SJC : { buy: 147600000, sell: 150600000 });

    const prices = {
      SJC: {
        buy: finalMieng.buy,
        sell: finalMieng.sell,
      },
      SJ9999: {
        buy: finalNhanTron.buy,
        sell: finalNhanTron.sell,
      },
      updatedAt: new Date().toISOString()
    };

    // Lưu cache
    cachedPrices = prices;

    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    console.error("Lỗi lấy giá vàng:", error);
    
    // Nếu có cache trước đó, trả về cache
    if (cachedPrices) {
      return NextResponse.json({ 
        success: true, 
        data: {
          ...cachedPrices,
          isFallback: true
        } 
      });
    }

    // Nếu không có cache, trả về giá mô phỏng
    return NextResponse.json({ 
      success: true, 
      data: {
        SJC: { buy: 147600000, sell: 150600000 },
        SJ9999: { buy: 142000000, sell: 145500000 },
        updatedAt: new Date().toISOString(),
        isFallback: true
      } 
    });
  }
}
