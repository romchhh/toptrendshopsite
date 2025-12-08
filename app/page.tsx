"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  url: string;
  telegramUrl?: string;
  emoji: string;
  description: string;
  accent: string;
  backgroundImage?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        ready: () => void;
      };
    };
  }
}

export default function TopTrendShop() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ініціалізуємо Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }

    // Завантажуємо продукти з API
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      // Логування для дебагу
      console.log('Products loaded:', data.map((p: Product) => ({ id: p.id, name: p.name, bgImage: p.backgroundImage })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (url: string, telegramUrl?: string) => {
    if (typeof window !== 'undefined') {
      // Перевіряємо чи ми в Telegram Mini App
      if (window.Telegram?.WebApp) {
        // Завжди використовуємо Telegram посилання якщо воно є
        if (telegramUrl) {
          window.Telegram.WebApp.openTelegramLink(`https://${telegramUrl}`);
        } else {
          // Якщо немає Telegram посилання, все одно намагаємося відкрити через Telegram
          window.Telegram.WebApp.openLink(url, {
            try_instant_view: true
          });
        }
      } else {
        // Якщо не в Mini App, відкриваємо в новій вкладці
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-1">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center">
              <Image 
                src="/TopTrend..png" 
                alt="TopTrendShop Logo" 
                width={80} 
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 max-w-3xl text-center">

        
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          Привіт! 👋
        </h2>
        <p className="text-xl text-gray-600 mb-4 leading-relaxed">
          Тут зібрані найкращі товари в зручному каталозі.
        </p>
        <p className="text-base text-gray-500 mb-8">
          Натискай на товар, відкривай Mini App і переходь на сторінку покупки.
        </p>
        
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-lg text-gray-500">Завантаження...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {products.map((product) => (
              <button
                key={product.id}
                className="group relative bg-white border-2 border-gray-100 rounded-3xl p-7 text-left transition-all duration-300 hover:border-gray-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50 overflow-hidden min-h-[280px] flex flex-col"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleProductClick(product.url, product.telegramUrl)}
              >
                {/* Background Image */}
                {product.backgroundImage && (
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity z-0 overflow-hidden rounded-3xl">
                    <img
                      src={product.backgroundImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      style={{ filter: 'blur(0.5px)' }}
                    />
                  </div>
                )}

                {/* Arrow indicator */}
                <div className={`absolute top-4 right-4 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                  hoveredId === product.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>

                {/* Title with background */}
                <div className="relative z-10 mt-0 mb-auto">
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight inline-block px-4 py-2 bg-white/85 backdrop-blur-sm rounded-lg">
                    {product.name}
                  </h3>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-auto relative z-10 mt-4">
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed inline-block px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg">
                    {product.description}
                  </p>
                </div>

                {/* CTA Button */}
                <div className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium text-center transition-all duration-300 group-hover:from-gray-700 group-hover:to-gray-800 group-hover:shadow-lg group-hover:scale-[1.02] group-active:scale-95 relative z-10 mt-auto pt-4">
                  <span className="flex items-center justify-center gap-2">
                    Перейти до товару
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-900 to-gray-600 rounded-b-3xl transition-all duration-300 z-10 ${
                  hoveredId === product.id ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                <Image 
                  src="/TopTrend..png" 
                  alt="TopTrendShop Logo" 
                  width={64} 
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Каталог найкращих товарів у Telegram
            </p>
            <p className="text-xs text-gray-400">
              © 2024 TopTrendShop. Обирай товар у Mini App ✨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}