"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  url: string;
  telegramUrl?: string; // Telegram Mini App посилання
  emoji: string;
  description: string;
  accent: string;
}

// Функція для генерації Telegram Mini App посилання з URL
const generateTelegramUrl = (url: string): string => {
  const domain = url.replace('https://', '').replace('.lattechi.space', '').toLowerCase();
  return `t.me/TopTrendShopBot/${domain}lattechispace`;
};

const products: Product[] = [
  { id: '1', name: 'Trekil', url: 'https://trekil.lattechi.space', telegramUrl: generateTelegramUrl('https://trekil.lattechi.space'), emoji: '🎯', description: 'Преміум якість', accent: 'hover:bg-blue-50' },
  { id: '2', name: 'Emal', url: 'https://emal.lattechi.space', telegramUrl: generateTelegramUrl('https://emal.lattechi.space'), emoji: '✨', description: 'Топ продаж', accent: 'hover:bg-purple-50' },
  { id: '3', name: 'Rustof', url: 'https://rustof.lattechi.space', telegramUrl: generateTelegramUrl('https://rustof.lattechi.space'), emoji: '🔥', description: 'Гаряча ціна', accent: 'hover:bg-orange-50' },
  { id: '4', name: 'Hold', url: 'https://hold.lattechi.space', telegramUrl: generateTelegramUrl('https://hold.lattechi.space'), emoji: '💎', description: 'Преміум вибір', accent: 'hover:bg-cyan-50' },
  { id: '5', name: 'Pover', url: 'https://pover.lattechi.space', telegramUrl: generateTelegramUrl('https://pover.lattechi.space'), emoji: '⚡', description: 'Швидка доставка', accent: 'hover:bg-yellow-50' },
  { id: '6', name: 'Valgus', url: 'https://valgus.lattechi.space', telegramUrl: generateTelegramUrl('https://valgus.lattechi.space'), emoji: '💫', description: 'Новинка', accent: 'hover:bg-pink-50' },
  { id: '7', name: 'LED', url: 'https://led.lattechi.space', telegramUrl: generateTelegramUrl('https://led.lattechi.space'), emoji: '💡', description: 'Освітлення', accent: 'hover:bg-amber-50' },
  { id: '8', name: 'LEDD', url: 'https://ledd.lattechi.space', telegramUrl: generateTelegramUrl('https://ledd.lattechi.space'), emoji: '🌟', description: 'Яскраве світло', accent: 'hover:bg-lime-50' },
  { id: '9', name: 'Pover50', url: 'https://pover50.lattechi.space', telegramUrl: generateTelegramUrl('https://pover50.lattechi.space'), emoji: '⚡', description: 'Потужність 50W', accent: 'hover:bg-indigo-50' },
  { id: '10', name: 'Shav', url: 'https://shav.lattechi.space', telegramUrl: generateTelegramUrl('https://shav.lattechi.space'), emoji: '✂️', description: 'Догляд', accent: 'hover:bg-teal-50' },
  { id: '11', name: 'Pod', url: 'https://pod.lattechi.space', telegramUrl: generateTelegramUrl('https://pod.lattechi.space'), emoji: '🎧', description: 'Аудіо преміум', accent: 'hover:bg-violet-50' },
  { id: '12', name: 'Podu', url: 'https://podu.lattechi.space', telegramUrl: generateTelegramUrl('https://podu.lattechi.space'), emoji: '🎵', description: 'Музика скрізь', accent: 'hover:bg-fuchsia-50' },
  { id: '13', name: '12V', url: 'https://12v.lattechi.space', telegramUrl: generateTelegramUrl('https://12v.lattechi.space'), emoji: '🔋', description: 'Живлення 12V', accent: 'hover:bg-emerald-50' },
  { id: '14', name: 'Pet', url: 'https://pet.lattechi.space', telegramUrl: 'https://t.me/TopTrendShopBot/petlattechispace', emoji: '🐾', description: 'Для улюбленців', accent: 'hover:bg-rose-50' },
  { id: '15', name: 'Fon', url: 'https://fon.lattechi.space', telegramUrl: generateTelegramUrl('https://fon.lattechi.space'), emoji: '📱', description: 'Мобільні аксесуари', accent: 'hover:bg-sky-50' },
  { id: '16', name: 'LEDF', url: 'https://ledf.lattechi.space', telegramUrl: generateTelegramUrl('https://ledf.lattechi.space'), emoji: '💡', description: 'LED ліхтар', accent: 'hover:bg-orange-50' },
  { id: '17', name: 'Feya', url: 'https://feya.lattechi.space', telegramUrl: generateTelegramUrl('https://feya.lattechi.space'), emoji: '🧚', description: 'Магічний вибір', accent: 'hover:bg-pink-50' },
  { id: '18', name: 'Fonar', url: 'https://fonar.lattechi.space', telegramUrl: generateTelegramUrl('https://fonar.lattechi.space'), emoji: '🔦', description: 'Потужний ліхтар', accent: 'hover:bg-yellow-50' },
  { id: '19', name: 'Tap', url: 'https://tap.lattechi.space', telegramUrl: generateTelegramUrl('https://tap.lattechi.space'), emoji: '💧', description: 'Сантехніка', accent: 'hover:bg-blue-50' },
  { id: '20', name: 'Kul', url: 'https://kul.lattechi.space', telegramUrl: generateTelegramUrl('https://kul.lattechi.space'), emoji: '🎁', description: 'Подарунки', accent: 'hover:bg-red-50' },
];

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

  useEffect(() => {
    // Ініціалізуємо Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

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
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Каталог відкритий</span>
        </div>
        
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {products.map((product) => (
            <button
              key={product.id}
              className={`group relative bg-white border-2 border-gray-100 rounded-3xl p-7 text-left transition-all duration-300 hover:border-gray-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50 ${product.accent}`}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleProductClick(product.url, product.telegramUrl)}
            >
              {/* Emoji with background */}
              <div className="relative mb-5">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-4xl">{product.emoji}</span>
                </div>
                
                {/* Arrow indicator */}
                <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-all duration-300 ${
                  hoveredId === product.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2 mb-4">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* URL chip */}
              <div className="mt-4 mb-3">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-full font-medium text-sm border border-blue-200 transition-all group-hover:bg-blue-100 group-hover:shadow-md">
                  <span className="truncate max-w-48">
                    {product.telegramUrl ? product.telegramUrl.replace('t.me/', '') : product.url.replace('https://', '').replace('www.', '')}
                  </span>
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-6 py-4 text-lg font-extrabold text-center transition-all duration-300 group-hover:from-indigo-700 group-hover:to-purple-700 group-hover:shadow-2xl group-hover:scale-105 group-active:scale-95">
                <span className="flex items-center justify-center gap-2">
                  Перейти до товару
                  <ArrowUpRight className="w-6 h-6" />
                </span>
              </div>
              
              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-900 to-gray-600 rounded-b-3xl transition-all duration-300 ${
                hoveredId === product.id ? 'opacity-100' : 'opacity-0'
              }`}></div>
            </button>
          ))}
        </div>
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