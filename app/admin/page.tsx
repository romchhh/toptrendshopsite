"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Edit2, Trash2, LogOut, Save, X, Package, FolderTree, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';

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
  displayOrder?: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  displayOrder?: number;
}

interface MetaPixel {
  id: string;
  name?: string | null;
  pixelId: string;
  enabled: number | boolean;
  displayOrder?: number;
}

type AdminTab = 'products' | 'categories' | 'pixels';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metaPixels, setMetaPixels] = useState<MetaPixel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState<string | null>(null);
  const [pixelFormData, setPixelFormData] = useState<Partial<MetaPixel>>({
    name: '',
    pixelId: '',
    enabled: true,
  });
  const [editingPixelId, setEditingPixelId] = useState<string | null>(null);
  const [isAddingPixel, setIsAddingPixel] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    url: '',
    telegramUrl: '',
    description: '',
    accent: 'hover:bg-blue-50',
    backgroundImage: '',
    price: '',
    oldPrice: '',
    discountPercent: undefined,
    category: '',
    isNew: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMetaPixels();
    checkAuth();
    // Ініціалізуємо displayOrder для товарів, якщо потрібно
    initProductOrder();
  }, []);

  const initProductOrder = async () => {
    try {
      // Перевіряємо чи є товари з displayOrder = null або undefined
      const res = await fetch('/api/products');
      const products = await res.json();
      
      if (products.length === 0) return;
      
      // Перевіряємо чи є товари з displayOrder = null або undefined (не ініціалізовані)
      const hasNull = products.some((p: any) => p.displayOrder === null || p.displayOrder === undefined);
      
      if (hasNull) {
        // Ініціалізуємо порядок тільки для товарів з null displayOrder
        await fetch('/api/products/init-order', { method: 'POST' });
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error initializing product order:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMetaPixels = async () => {
    try {
      const res = await fetch('/api/meta-pixels?all=1');
      if (!res.ok) return;
      const data = await res.json();
      setMetaPixels(data);
    } catch (error) {
      console.error('Error fetching meta pixels:', error);
    }
  };

  const checkAuth = async () => {
    const res = await fetch('/api/auth/verify');
    if (!res.ok) {
      router.push('/admin/login');
    }
  };

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
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      url: '',
      telegramUrl: '',
      description: '',
      accent: 'hover:bg-blue-50',
      backgroundImage: '',
      price: '',
      category: '',
      isNew: false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      id: '',
      name: '',
      url: '',
      telegramUrl: '',
      description: '',
      accent: 'hover:bg-blue-50',
      backgroundImage: '',
      price: '',
      category: '',
      isNew: false,
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving product with data:', formData);
      
      // Валідація обов'язкових полів
      if (!formData.id || !formData.name || !formData.url) {
        alert('Заповніть обов\'язкові поля: ID, Назва, URL');
        return;
      }

      if (isAdding) {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            emoji: '📦',
            accent: formData.accent || 'hover:bg-blue-50',
          }),
        });
        
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка створення продукту');
          return;
        }
      } else if (editingId) {
        // Знаходимо поточний товар щоб зберегти displayOrder
        const currentProduct = products.find(p => p.id === editingId);
        const response = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            emoji: '📦',
            accent: formData.accent || 'hover:bg-blue-50',
            displayOrder: currentProduct?.displayOrder,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка оновлення продукту');
          return;
        }
        console.log('Update response:', result);
      }
      await fetchProducts();
      handleCancel();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Помилка збереження');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей продукт?')) return;

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Помилка видалення');
    }
  };

  const handleOrderChange = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/products/${id}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Помилка зміни порядку');
        return;
      }
      await fetchProducts();
    } catch (error) {
      console.error('Error changing order:', error);
      alert('Помилка зміни порядку');
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingImage(productId);
    try {
      // Перевірка розміру файлу на клієнті
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Файл занадто великий. Максимальний розмір: 10 МБ');
        setUploadingImage(null);
        return;
      }

      console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Невідома помилка' }));
        console.error('Upload failed:', errorData);
        alert(errorData.error || `Помилка завантаження: ${res.status} ${res.statusText}`);
        setUploadingImage(null);
        return;
      }

      const data = await res.json();

      if (data.url) {
        console.log('Image uploaded, URL:', data.url);
        if (editingId === productId || productId === 'new') {
          // Якщо редагуємо або додаємо новий, оновлюємо formData
          setFormData((prev) => ({ ...prev, backgroundImage: data.url }));
          console.log('Updated formData with backgroundImage:', data.url);
        } else {
          // Якщо не в режимі редагування, зберігаємо одразу
          const currentProduct = products.find(p => p.id === productId);
          if (currentProduct) {
            const updatedData = { ...currentProduct, backgroundImage: data.url } as Product;
            console.log('Updating product immediately:', updatedData);
            const updateRes = await fetch(`/api/products/${productId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData),
            });
            const updateResult = await updateRes.json();
            console.log('Update result:', updateResult);
            await fetchProducts();
          }
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Помилка завантаження зображення');
    } finally {
      setUploadingImage(null);
    }
  };

  // Category management functions
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    id: '',
    name: '',
    description: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const handleCategoryAdd = () => {
    setIsAddingCategory(true);
    setEditingCategoryId(null);
    setCategoryFormData({
      id: '',
      name: '',
      description: '',
      image: '',
    });
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData(category);
    setIsAddingCategory(false);
  };

  const handleCategoryCancel = () => {
    setEditingCategoryId(null);
    setIsAddingCategory(false);
    setCategoryFormData({
      id: '',
      name: '',
      description: '',
      image: '',
    });
  };

  const handleCategoryImageUpload = async (categoryId: string, file: File) => {
    setUploadingCategoryImage(categoryId);
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Файл занадто великий. Максимальний розмір: 10 МБ');
        setUploadingCategoryImage(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Невідома помилка' }));
        alert(errorData.error || `Помилка завантаження: ${res.status}`);
        setUploadingCategoryImage(null);
        return;
      }

      const data = await res.json();

      if (data.url) {
        if (editingCategoryId === categoryId || categoryId === 'new') {
          setCategoryFormData((prev) => ({ ...prev, image: data.url }));
        } else {
          const currentCategory = categories.find(c => c.id === categoryId);
          if (currentCategory) {
            const response = await fetch(`/api/categories/${categoryId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...currentCategory, image: data.url }),
            });
            if (response.ok) {
              await fetchCategories();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Помилка завантаження зображення');
    } finally {
      setUploadingCategoryImage(null);
    }
  };

  const handleCategorySave = async () => {
    try {
      if (!categoryFormData.id || !categoryFormData.name) {
        alert('Заповніть обов\'язкові поля: ID, Назва');
        return;
      }

      if (isAddingCategory) {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData),
        });
        
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка створення категорії');
          return;
        }
      } else if (editingCategoryId) {
        const response = await fetch(`/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData),
        });
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка оновлення категорії');
          return;
        }
      }
      await fetchCategories();
      handleCategoryCancel();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Помилка збереження');
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю категорію?')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Помилка видалення категорії');
        return;
      }
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Помилка видалення');
    }
  };

  const handleCategoryOrderChange = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/categories/${id}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Помилка зміни порядку');
        return;
      }
      await fetchCategories();
    } catch (error) {
      console.error('Error changing category order:', error);
      alert('Помилка зміни порядку');
    }
  };

  const handlePixelAdd = () => {
    setIsAddingPixel(true);
    setEditingPixelId(null);
    setPixelFormData({
      name: '',
      pixelId: '',
      enabled: true,
    });
  };

  const handlePixelEdit = (pixel: MetaPixel) => {
    setEditingPixelId(pixel.id);
    setPixelFormData({
      name: pixel.name || '',
      pixelId: pixel.pixelId,
      enabled: pixel.enabled === 1 || pixel.enabled === true,
    });
    setIsAddingPixel(false);
  };

  const handlePixelCancel = () => {
    setEditingPixelId(null);
    setIsAddingPixel(false);
    setPixelFormData({
      name: '',
      pixelId: '',
      enabled: true,
    });
  };

  const handlePixelSave = async () => {
    try {
      if (!pixelFormData.pixelId?.trim()) {
        alert('Вкажіть Pixel ID');
        return;
      }

      if (isAddingPixel) {
        const response = await fetch('/api/meta-pixels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pixelFormData),
        });
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка створення пікселя');
          return;
        }
      } else if (editingPixelId) {
        const response = await fetch(`/api/meta-pixels/${editingPixelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pixelFormData),
        });
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'Помилка оновлення пікселя');
          return;
        }
      }

      await fetchMetaPixels();
      handlePixelCancel();
    } catch (error) {
      console.error('Error saving meta pixel:', error);
      alert('Помилка збереження');
    }
  };

  const handlePixelDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей піксель?')) return;

    try {
      const response = await fetch(`/api/meta-pixels/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Помилка видалення пікселя');
        return;
      }
      await fetchMetaPixels();
    } catch (error) {
      console.error('Error deleting meta pixel:', error);
      alert('Помилка видалення');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Адмін панель</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Вийти
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4" />
              Товари
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              Категорії
            </button>
            <button
              onClick={() => setActiveTab('pixels')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'pixels'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Пікселі
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {activeTab === 'products' ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Продукти</h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm('Ініціалізувати порядок товарів? Це призначить displayOrder всім товарам.')) {
                      try {
                        const res = await fetch('/api/products/init-order', { method: 'POST' });
                        const result = await res.json();
                        if (res.ok) {
                          alert(`Успішно! Ініціалізовано ${result.count || 0} товарів.`);
                          await fetchProducts();
                        } else {
                          alert(result.error || 'Помилка ініціалізації');
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Помилка ініціалізації');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  title="Ініціалізувати порядок товарів"
                >
                  🔄 Ініціалізувати порядок
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Додати продукт
                </button>
              </div>
            </div>

            {isAdding && (
              <ProductForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                onImageUpload={(file) => handleImageUpload('new', file)}
                categories={categories}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  {editingId === product.id ? (
                    <ProductForm
                      formData={formData}
                      setFormData={setFormData}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onImageUpload={(file) => handleImageUpload(product.id, file)}
                      categories={categories}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOrderChange(product.id, 'up')}
                            disabled={index === 0}
                            className={`p-2 rounded-lg transition-colors ${
                              index === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Перемістити вверх"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOrderChange(product.id, 'down')}
                            disabled={index === products.length - 1}
                            className={`p-2 rounded-lg transition-colors ${
                              index === products.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Перемістити вниз"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                        {(product.isNew === true || product.isNew === 1) && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-extrabold rounded-full shadow-md">
                            НОВИНКА
                          </span>
                        )}
                      </div>
                      {product.price && (
                        <p className="text-base font-bold text-gray-900 mb-2">{product.price}</p>
                      )}
                      {product.category && (
                        <p className="text-xs text-blue-600 mb-2">{product.category}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono truncate mb-2">{product.url}</p>
                      {product.backgroundImage && (
                        <div className="mt-4 rounded-lg overflow-hidden">
                          <Image
                            src={product.backgroundImage}
                            alt={product.name}
                            width={200}
                            height={100}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'categories' ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Категорії</h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm('Ініціалізувати порядок категорій? Це призначить displayOrder всім категоріям.')) {
                      try {
                        const res = await fetch('/api/categories/init-order', { method: 'POST' });
                        const result = await res.json();
                        if (res.ok) {
                          alert(`Успішно! Ініціалізовано ${result.count || 0} категорій.`);
                          await fetchCategories();
                        } else {
                          alert(result.error || 'Помилка ініціалізації');
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Помилка ініціалізації');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  title="Ініціалізувати порядок категорій"
                >
                  🔄 Ініціалізувати порядок
                </button>
                <button
                  onClick={handleCategoryAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Додати категорію
                </button>
              </div>
            </div>

            {isAddingCategory && (
              <CategoryForm
                formData={categoryFormData}
                setFormData={setCategoryFormData}
                onSave={handleCategorySave}
                onCancel={handleCategoryCancel}
                onImageUpload={(file) => handleCategoryImageUpload('new', file)}
                uploading={uploadingCategoryImage === 'new'}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div key={category.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  {editingCategoryId === category.id ? (
                    <CategoryForm
                      formData={categoryFormData}
                      setFormData={setCategoryFormData}
                      onSave={handleCategorySave}
                      onCancel={handleCategoryCancel}
                      onImageUpload={(file) => handleCategoryImageUpload(category.id, file)}
                      uploading={uploadingCategoryImage === category.id}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCategoryOrderChange(category.id, 'up')}
                            disabled={index === 0}
                            className={`p-2 rounded-lg transition-colors ${
                              index === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Перемістити вверх"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCategoryOrderChange(category.id, 'down')}
                            disabled={index === categories.length - 1}
                            className={`p-2 rounded-lg transition-colors ${
                              index === categories.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Перемістити вниз"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCategoryEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {category.image && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={200}
                            height={150}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono">ID: {category.id}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Meta Pixel</h2>
              <button
                onClick={handlePixelAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Додати піксель
              </button>
            </div>

            {isAddingPixel && (
              <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
                <PixelForm
                  formData={pixelFormData}
                  setFormData={setPixelFormData}
                  onSave={handlePixelSave}
                  onCancel={handlePixelCancel}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metaPixels.map((pixel) => (
                <div key={pixel.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  {editingPixelId === pixel.id ? (
                    <PixelForm
                      formData={pixelFormData}
                      setFormData={setPixelFormData}
                      onSave={handlePixelSave}
                      onCancel={handlePixelCancel}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-end mb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePixelEdit(pixel)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePixelDelete(pixel.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {pixel.name || 'Без назви'}
                      </h3>
                      <p className="text-sm font-mono text-gray-700 mb-3">{pixel.pixelId}</p>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          pixel.enabled === 1 || pixel.enabled === true
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {pixel.enabled === 1 || pixel.enabled === true ? 'Активний' : 'Вимкнений'}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {metaPixels.length === 0 && !isAddingPixel && (
              <div className="text-center py-16 text-gray-500">
                Пікселів ще немає. Додайте перший Meta Pixel.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CategoryForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  onImageUpload,
  uploading = false,
}: {
  formData: Partial<Category>;
  setFormData: (data: Partial<Category>) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageUpload?: (file: File) => void;
  uploading?: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
        <input
          type="text"
          value={formData.id || ''}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Унікальний ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Зображення</label>
        {formData.image && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <Image
              src={formData.image}
              alt="Category preview"
              width={200}
              height={150}
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
        />
        {uploading && (
          <p className="text-xs text-gray-500 mt-1">Завантаження...</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          Зберегти
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <X className="w-4 h-4" />
          Скасувати
        </button>
      </div>
    </div>
  );
}

function ProductForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  onImageUpload,
  categories,
}: {
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageUpload: (file: File) => void;
  categories: Category[];
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Функція для автоматичного розрахунку відсотка знижки
  const calculateDiscountPercent = (price: string, oldPrice: string) => {
    // Очищаємо ціни від пробілів, символів ₴ та інших нечислових символів
    const cleanPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
    const cleanOldPrice = parseFloat(oldPrice.replace(/[^\d.,]/g, '').replace(',', '.'));

    // Перевіряємо чи обидва значення валідні
    if (isNaN(cleanPrice) || isNaN(cleanOldPrice) || cleanOldPrice <= 0 || cleanPrice <= 0) {
      return undefined;
    }

    // Перевіряємо чи стара ціна більша за нову
    if (cleanOldPrice <= cleanPrice) {
      return undefined;
    }

    // Розраховуємо відсоток знижки
    const discountPercent = Math.round(((cleanOldPrice - cleanPrice) / cleanOldPrice) * 100);
    return discountPercent > 0 && discountPercent <= 100 ? discountPercent : undefined;
  };

  // Обробник зміни ціни
  const handlePriceChange = (newPrice: string) => {
    const updatedData = { ...formData, price: newPrice };
    // Автоматично розраховуємо відсоток знижки, якщо є обидві ціни
    if (newPrice && formData.oldPrice) {
      const calculatedDiscount = calculateDiscountPercent(newPrice, formData.oldPrice);
      updatedData.discountPercent = calculatedDiscount;
    } else if (!newPrice || !formData.oldPrice) {
      // Якщо одна з цін видалена, скидаємо відсоток знижки
      updatedData.discountPercent = undefined;
    }
    setFormData(updatedData);
  };

  // Обробник зміни старої ціни
  const handleOldPriceChange = (newOldPrice: string) => {
    const updatedData = { ...formData, oldPrice: newOldPrice };
    // Автоматично розраховуємо відсоток знижки, якщо є обидві ціни
    if (formData.price && newOldPrice) {
      const calculatedDiscount = calculateDiscountPercent(formData.price, newOldPrice);
      updatedData.discountPercent = calculatedDiscount;
    } else if (!formData.price || !newOldPrice) {
      // Якщо одна з цін видалена, скидаємо відсоток знижки
      updatedData.discountPercent = undefined;
    }
    setFormData(updatedData);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
        <input
          type="text"
          value={formData.id || ''}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Унікальний ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input
          type="text"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="trekillattechispace"
        />
        <p className="mt-1 text-xs text-gray-500">
          Тепер ти можеш в адмінці для кожного товару в полі URL вводити тільки частину на кшталт trekillattechispace.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ціна</label>
        <input
          type="text"
          value={formData.price || ''}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Наприклад: 2600 ₴"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Стара ціна (закреслена)</label>
        <input
          type="text"
          value={formData.oldPrice || ''}
          onChange={(e) => handleOldPriceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Наприклад: 3000 ₴"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Відсоток знижки
          {(formData.price && formData.oldPrice && formData.discountPercent !== undefined) && (
            <span className="text-xs text-gray-500 ml-2">(автоматично розраховано)</span>
          )}
        </label>
        <input
          type="number"
          value={formData.discountPercent || ''}
          onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Наприклад: 15 (розраховується автоматично)"
          min="0"
          max="100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
        <select
          value={formData.category || ''}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Без категорії</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isNew"
          checked={formData.isNew === true || formData.isNew === 1}
          onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
        />
        <label htmlFor="isNew" className="text-sm font-medium text-gray-700 cursor-pointer">
          Новинка
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Фонове зображення</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        {formData.backgroundImage && (
          <div className="mt-2">
            <img
              src={formData.backgroundImage.startsWith('/uploads/') 
                ? `/api${formData.backgroundImage}` 
                : formData.backgroundImage
              }
              alt="Preview"
              className="w-full h-24 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          Зберегти
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <X className="w-4 h-4" />
          Скасувати
        </button>
      </div>
    </div>
  );
}

function PixelForm({
  formData,
  setFormData,
  onSave,
  onCancel,
}: {
  formData: Partial<MetaPixel>;
  setFormData: (data: Partial<MetaPixel>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Наприклад: Основний"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pixel ID</label>
        <input
          type="text"
          value={formData.pixelId || ''}
          onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
          placeholder="2013507330039435"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pixelEnabled"
          checked={formData.enabled === true || formData.enabled === 1}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
        />
        <label htmlFor="pixelEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
          Активний на сайті
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          Зберегти
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <X className="w-4 h-4" />
          Скасувати
        </button>
      </div>
    </div>
  );
}

