"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Search, Send, MessageCircle, ArrowUp, LayoutGrid, Layers, Heart, ChevronDown, FolderTree } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  url: string;
  telegramUrl?: string;
  description: string;
  accent: string;
  backgroundImage?: string;
  price?: string;
  oldPrice?: string;
  discountPercent?: number;
  category?: string;
  isNew?: boolean | number;
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

type TabType = 'catalog' | 'categories' | 'search' | 'favorites';

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function TopTrendShop() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesFromApi, setCategoriesFromApi] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [visibleProductsCount, setVisibleProductsCount] = useState(10);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ініціалізуємо Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }

    // Завантажуємо обране з localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }

    // Завантажуємо продукти з API
    fetchProducts();
    // Завантажуємо категорії з API
    fetchCategories();

    // Слухаємо скрол для показу кнопки "наверх"
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Зберігаємо обране в localStorage при зміні
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // Зберігаємо діапазон цін в localStorage при зміні (тільки якщо фільтр активний)
  useEffect(() => {
    if (typeof window !== 'undefined' && priceFilterActive) {
      localStorage.setItem('priceRange', JSON.stringify(priceRange));
      localStorage.setItem('priceFilterActive', 'true');
    }
  }, [priceRange, priceFilterActive]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      // Конвертуємо isNew з числа (0/1) в boolean
      const productsWithBoolean = data.map((p: Product) => ({
        ...p,
        isNew: p.isNew === 1 || p.isNew === true
      }));
      setProducts(productsWithBoolean);
      // Логування для дебагу
      console.log('Products loaded:', productsWithBoolean.map((p: Product) => ({ id: p.id, name: p.name, bgImage: p.backgroundImage, isNew: p.isNew })));
      
      // Ініціалізуємо діапазон цін після завантаження
      const prices = productsWithBoolean
        .map((p: Product) => {
          if (!p.price) return 0;
          // Парсимо ціну, видаляючи всі нечислові символи
          const priceNum = parseInt(p.price.replace(/\D/g, '') || '0');
          return priceNum;
        })
        .filter((p: number) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        // Округлюємо максимум до найближчого тисячі в більшу сторону для зручності
        const roundedMax = Math.ceil(max / 1000) * 1000;
        const savedRange = localStorage.getItem('priceRange');
        const savedFilterActive = localStorage.getItem('priceFilterActive');
        
        if (savedFilterActive === 'true' && savedRange) {
          try {
            const [savedMin, savedMax] = JSON.parse(savedRange);
            // Перевіряємо, чи збережені значення валідні
            const validMin = Math.max(0, Math.min(savedMin, roundedMax));
            const validMax = Math.min(roundedMax, Math.max(savedMax, 0));
            // Перевіряємо, що мін не більше макс
            if (validMin <= validMax) {
              setPriceRange([validMin, validMax]);
              setPriceFilterActive(true);
            } else {
              setPriceRange([0, roundedMax]);
              setPriceFilterActive(false);
            }
          } catch (e) {
            setPriceRange([0, roundedMax]);
            setPriceFilterActive(false);
          }
        } else {
          // Якщо фільтр не був активним, встановлюємо діапазон від 0 до округленого максимуму
          setPriceRange([0, roundedMax]);
          setPriceFilterActive(false);
        }
      } else {
        // Якщо немає товарів з ціною, встановлюємо дефолтні значення
        setPriceRange([0, 10000]);
        setPriceFilterActive(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategoriesFromApi(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Отримуємо унікальні категорії з продуктів
  const categories = ['Головна', ...Array.from(new Set(products.filter(p => p.category).map(p => p.category!)))];

  // Обчислюємо мінімальну та максимальну ціну
  const prices = products
    .map(p => parseInt(p.price?.replace(/\D/g, '') || '0'))
    .filter(p => p > 0);
  const minPrice = 0; // Завжди починаємо з 0
  const maxPrice = prices.length > 0 
    ? Math.ceil(Math.max(...prices) / 1000) * 1000 // Округлюємо до найближчого тисячі в більшу сторону
    : 10000;

  // Фільтруємо продукти за категорією, пошуковим запитом, ціною та табом
  let filteredProducts = products.filter(product => {
    // Фільтр по ціні - застосовується тільки якщо фільтр активний
    let matchesPrice = true;
    if (priceFilterActive && product.price) {
      const productPrice = parseInt(product.price.replace(/\D/g, '') || '0');
      if (productPrice > 0) {
        matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      }
      // Якщо не вдалося розпарсити ціну (productPrice === 0), показуємо товар
    }

    // Для вкладки "Обране" показуємо тільки обрані товари
    if (activeTab === 'favorites') {
      return favorites.includes(product.id) && matchesPrice;
    }
    
    // Для вкладки "Категорії" не показуємо товари (тільки список категорій)
    if (activeTab === 'categories') {
      return false;
    }

    // Для вкладки "Пошук" фільтруємо за пошуковим запитом
    if (activeTab === 'search') {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && matchesPrice;
    }

    // Для вкладки "Каталог" показуємо всі товари з фільтрами
    const matchesCategory = !selectedCategory || selectedCategory === 'Головна' || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesPrice;
  });

  // Сортуємо продукти
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'price') {
      const priceA = parseInt(a.price?.replace(/\D/g, '') || '0');
      const priceB = parseInt(b.price?.replace(/\D/g, '') || '0');
      return priceA - priceB;
    }
    // newest - залишаємо як є (вже відсортовано з API)
    return 0;
  });

  // Застосовуємо пагінацію до відсортованих товарів
  const displayProducts = sortedProducts.slice(0, visibleProductsCount);

  // Скидаємо лічильник при зміні фільтрів
  useEffect(() => {
    setVisibleProductsCount(10);
  }, [activeTab, selectedCategory, searchQuery, priceFilterActive, sortBy]);

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

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

  const handleSearchClick = () => {
    setActiveTab('search');
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleShareClick = () => {
    const shareUrl = window.location.href;
    const shareText = 'Подивись цей каталог товарів!';
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // У Telegram Mini App використовуємо Telegram Share
      if (window.Telegram.WebApp.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
      }
    } else if (navigator.share) {
      // Використовуємо нативний Web Share API
      navigator.share({
        title: 'TopTrendShop',
        text: shareText,
        url: shareUrl,
      }).catch(() => {
        // Якщо користувач скасував, нічого не робимо
      });
    } else {
      // Fallback - копіюємо посилання
      navigator.clipboard.writeText(shareUrl);
      alert('Посилання скопійовано!');
    }
  };

  const handleChatClick = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Відкриваємо чат бота через Telegram
      window.Telegram.WebApp.openTelegramLink('https://t.me/TopTrendShopBot');
    } else {
      window.open('https://t.me/TopTrendShopBot', '_blank', 'noopener,noreferrer');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900 text-white border-b border-gray-800 hidden sm:block">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-6">
              <a href="#contacts" className="hover:text-gray-300 transition-colors">Контакти</a>
              <a href="#about" className="hover:text-gray-300 transition-colors">Про нас</a>
              <a href="#delivery" className="hover:text-gray-300 transition-colors">Доставка та оплата</a>
              <a href="#privacy" className="hover:text-gray-300 transition-colors">Політика конфіденційності</a>
              <a href="#accessibility" className="hover:text-gray-300 transition-colors">Політика доступності</a>
              <a href="#offer" className="hover:text-gray-300 transition-colors">Публічна оферта</a>
            </div>
            <a href="#cabinet" className="hover:text-gray-300 transition-colors">Кабінет</a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
              <Image 
                src="/TopTrend..png" 
                alt="TopTrendShop Logo" 
                width={56} 
                height={56}
                className="object-contain"
                priority
              />
            </div>
            
            {/* Icons - Right */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSearchClick}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                aria-label="Пошук"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={handleShareClick}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                aria-label="Поділитися"
              >
                <Send className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={handleChatClick}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                aria-label="Чат"
              >
                <MessageCircle className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar - показуємо тільки на вкладках Каталог та Пошук */}
      {(activeTab === 'catalog' || activeTab === 'search') && (
        <section className="container mx-auto px-4 py-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Пошук товарів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-base font-medium shadow-sm transition-all bg-white"
            />
        </div>
        </section>
      )}

      {/* Categories - показуємо тільки на вкладці Каталог */}
      {activeTab === 'catalog' && (
        <section className="container mx-auto px-4 py-2 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
              Категорії
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === 'Головна' ? null : category)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    (category === 'Головна' && !selectedCategory) || selectedCategory === category
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Title & Filters */}
      <section className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            {activeTab === 'favorites' && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Обране</h2>
            )}
            {activeTab === 'search' && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Результати пошуку</h2>
            )}
            {activeTab === 'categories' && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Категорії</h2>
            )}
            {activeTab === 'catalog' && selectedCategory && selectedCategory !== 'Головна' && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedCategory}</h2>
            )}
            {activeTab === 'catalog' && (!selectedCategory || selectedCategory === 'Головна') && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Всі товари</h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'catalog' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Фільтри</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
        {showFilters && activeTab === 'catalog' && (
          <div className="mb-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* Price Range Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Ціна: від <span className="text-gray-900 font-bold">{Math.max(minPrice, Math.min(priceRange[0], maxPrice)).toLocaleString('uk-UA')}</span> до <span className="text-gray-900 font-bold">{Math.max(minPrice, Math.min(priceRange[1], maxPrice)).toLocaleString('uk-UA')}</span> ₴
                </p>
                {priceFilterActive && (
            <button
                    onClick={() => {
                      setPriceRange([minPrice, maxPrice]);
                      setPriceFilterActive(false);
                      localStorage.removeItem('priceFilterActive');
                      localStorage.removeItem('priceRange');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Скинути фільтр
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={Math.max(minPrice, Math.min(priceRange[0], maxPrice))}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      const currentMax = Math.max(priceRange[1], newMin);
                      setPriceRange([newMin, currentMax]);
                      setPriceFilterActive(true);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #111827 0%, #111827 ${((priceRange[0] - minPrice) / (maxPrice - minPrice || 1)) * 100}%, #e5e7eb ${((priceRange[0] - minPrice) / (maxPrice - minPrice || 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={Math.max(minPrice, Math.min(priceRange[1], maxPrice))}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const currentMin = Math.min(priceRange[0], newMax);
                      setPriceRange([currentMin, newMax]);
                      setPriceFilterActive(true);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((priceRange[1] - minPrice) / (maxPrice - minPrice || 1)) * 100}%, #111827 ${((priceRange[1] - minPrice) / (maxPrice - minPrice || 1)) * 100}%, #111827 100%)`
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className="font-medium">{minPrice.toLocaleString()} ₴</span>
                <span className="font-medium">{maxPrice.toLocaleString()} ₴</span>
              </div>
            </div>

            {/* Sort Options */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Сортувати за:</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setSortBy('newest'); setShowFilters(false); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sortBy === 'newest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Новинки
                </button>
                <button
                  onClick={() => { setSortBy('name'); setShowFilters(false); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sortBy === 'name' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Назва
                </button>
                <button
                  onClick={() => { setSortBy('price'); setShowFilters(false); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sortBy === 'price' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ціна
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories List - показуємо тільки на вкладці Категорії */}
      {activeTab === 'categories' && (
        <section className="container mx-auto px-4 pb-24 mb-24">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <div className="text-lg font-medium text-gray-400">Завантаження...</div>
            </div>
          ) : categoriesFromApi.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-4">
                <FolderTree className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <div className="text-xl font-semibold text-gray-600 mb-2">Категорій не знайдено</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {categoriesFromApi.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveTab('catalog');
                    setSelectedCategory(category.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 text-left transition-all duration-300 hover:border-gray-900 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-gray-900 group-hover:to-gray-800 transition-all">
                      <Layers className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-900">
                      {category.name}
                </h3>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span>Переглянути товари</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Products Grid - показуємо на інших вкладках */}
      {activeTab !== 'categories' && (
        <section className="container mx-auto px-4 pb-24 mb-24">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <div className="text-lg font-medium text-gray-400">Завантаження...</div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-4">
                {activeTab === 'favorites' ? (
                  <Heart className="w-16 h-16 text-gray-300 mx-auto" />
                ) : (
                  <Search className="w-16 h-16 text-gray-300 mx-auto" />
                )}
              </div>
              <div className="text-xl font-semibold text-gray-600 mb-2">
                {activeTab === 'favorites' ? 'Обране порожнє' : 'Товари не знайдено'}
              </div>
              <div className="text-sm text-gray-400">
                {activeTab === 'favorites' 
                  ? 'Додайте товари в обране, натиснувши на іконку серця' 
                  : searchQuery 
                    ? 'Спробуйте інший пошуковий запит' 
                    : 'Оберіть іншу категорію'}
              </div>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 max-w-7xl mx-auto">
            {displayProducts.map((product) => (
              <button
                key={product.id}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 active:scale-[0.98] flex flex-col"
                onClick={() => handleProductClick(product.url, product.telegramUrl)}
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-white overflow-hidden">
                  {product.backgroundImage ? (
                    <img
                      src={product.backgroundImage.startsWith('/uploads/') 
                        ? `/api${product.backgroundImage}` 
                        : product.backgroundImage.startsWith('/api/uploads/')
                        ? product.backgroundImage
                        : product.backgroundImage
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.error('Image load error:', product.backgroundImage);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <span className="text-gray-400 text-xs font-medium">Немає фото</span>
                    </div>
                  )}
                  {/* Discount Badge - на зображенні */}
                  {product.discountPercent && product.oldPrice && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-red-800 text-white text-sm font-bold rounded shadow-lg">
                        -{product.discountPercent}%
                      </span>
                    </div>
                  )}
                  {/* New Badge - якщо немає знижки */}
                  {!(product.discountPercent && product.oldPrice) && (product.isNew === true || product.isNew === 1) && (
                    <div className="absolute top-2 left-2 z-10">
                      <Image 
                        src="/New-Icon-PNG-Isolated-Pic.png" 
                        alt="Новинка" 
                        width={60} 
                        height={60}
                        className="object-contain drop-shadow-lg"
                      />
                    </div>
                  )}
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all z-10"
                    aria-label={isFavorite(product.id) ? 'Видалити з обраного' : 'Додати в обране'}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all ${
                        isFavorite(product.id) 
                          ? 'fill-red-700 text-red-700' 
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                    />
                  </button>
              </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col flex-1 bg-white">
                  <h3 className="text-base font-medium text-gray-700 line-clamp-2 leading-snug -mb-4 text-left min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    {product.oldPrice && product.price ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-xl font-bold rounded-full">
                          {product.price} ₴
                        </span>
                        <span className="text-lg text-gray-400 line-through">
                          {product.oldPrice} ₴
                        </span>
                      </div>
                    ) : product.price ? (
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-xl font-bold rounded-full">
                        {product.price} ₴
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
            </div>
            {sortedProducts.length > visibleProductsCount && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleProductsCount(prev => prev + 10)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Показати ще
                </button>
              </div>
            )}
            </>
          )}
        </section>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-xl">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                activeTab === 'catalog' 
                  ? 'text-gray-900 bg-gray-50 scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className={`w-6 h-6 ${activeTab === 'catalog' ? 'text-gray-900' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${activeTab === 'catalog' ? 'text-gray-900' : 'text-gray-500'}`}>Каталог</span>
            </button>
            <button
              onClick={() => { setActiveTab('categories'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                activeTab === 'categories' 
                  ? 'text-gray-900 bg-gray-50 scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Layers className={`w-6 h-6 ${activeTab === 'categories' ? 'text-gray-900' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${activeTab === 'categories' ? 'text-gray-900' : 'text-gray-500'}`}>Категорії</span>
            </button>
            <button
              onClick={() => { handleSearchClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                activeTab === 'search' 
                  ? 'text-gray-900 bg-gray-50 scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Search className={`w-6 h-6 ${activeTab === 'search' ? 'text-gray-900' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${activeTab === 'search' ? 'text-gray-900' : 'text-gray-500'}`}>Пошук</span>
            </button>
            <button
              onClick={() => { setActiveTab('favorites'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                activeTab === 'favorites' 
                  ? 'text-red-800 bg-red-50 scale-105' 
                  : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <Heart className={`w-6 h-6 ${activeTab === 'favorites' ? 'fill-red-700 text-red-700' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${activeTab === 'favorites' ? 'text-red-800' : 'text-gray-500'}`}>Обране</span>
              {favorites.length > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-700 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                  activeTab === 'favorites' ? 'ring-2 ring-white' : ''
                }`}>
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-40 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Нагору"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white">
                <Image 
                  src="/TopTrend..png" 
                  alt="TopTrendShop Logo" 
                  width={56} 
                  height={56}
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">
              Каталог найкращих товарів у Telegram
            </p>
            <p className="text-xs text-gray-400 font-medium">
              © 2024 TopTrendShop. Обирай товар у Mini App
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}