import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// In-memory cache
let cachedPrice: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPrice && (now - lastFetchTime < CACHE_DURATION)) {
      return NextResponse.json({
        success: true,
        data: cachedPrice,
        cached: true,
        timestamp: new Date(lastFetchTime).toISOString(),
        source: 'kimthanhh.com (Cached)'
      });
    }

    const response = await fetch('https://kimthanhh.com/gia-vang', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 900 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Kim Thanh H: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: Array<{ type: string; buy: number; sell: number }> = [];

    $('.table-body .column-brandgold').each((i, el) => {
      const typeName = $(el).find('h3').text().trim();
      
      // The values are in the next sibling .column-typegold
      const nextSibling = $(el).next('.column-typegold');
      if (nextSibling.length > 0) {
        const buyText = nextSibling.find('.col-buy').text().trim();
        const sellText = nextSibling.find('.col-sell').text().trim();
        
        const buyPrice = parseInt(buyText.replace(/[^0-9]/g, ''), 10);
        const sellPrice = parseInt(sellText.replace(/[^0-9]/g, ''), 10);
        
        if (typeName && !isNaN(buyPrice)) {
          results.push({
            type: typeName,
            buy: buyPrice,
            sell: isNaN(sellPrice) ? buyPrice : sellPrice // Fallback if "Liên hệ"
          });
        }
      }
    });

    if (results.length > 0) {
      cachedPrice = results;
      lastFetchTime = now;
      
      return NextResponse.json({
        success: true,
        data: results,
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'kimthanhh.com'
      });
    } else {
      throw new Error("No pricing data found in HTML structure");
    }
    
  } catch (error: any) {
    console.error("Error fetching Kim Thanh H gold price:", error);
    
    // Return cached if error
    if (cachedPrice) {
      return NextResponse.json({
        success: true,
        data: cachedPrice,
        cached: true,
        timestamp: new Date(lastFetchTime).toISOString(),
        source: 'kimthanhh.com (Fallback Cache)',
        error: error.message
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch gold price', details: error.message },
      { status: 500 }
    );
  }
}
