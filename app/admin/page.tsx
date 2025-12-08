"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Edit2, Trash2, LogOut, Save, X } from 'lucide-react';

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

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    url: '',
    telegramUrl: '',
    emoji: '',
    description: '',
    accent: 'hover:bg-blue-50',
    backgroundImage: '',
  });

  useEffect(() => {
    fetchProducts();
    checkAuth();
  }, []);

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
      setProducts(data);
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
      emoji: '',
      description: '',
      accent: 'hover:bg-blue-50',
      backgroundImage: '',
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
      emoji: '',
      description: '',
      accent: 'hover:bg-blue-50',
      backgroundImage: '',
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving product with data:', formData);
      if (isAdding) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (editingId) {
        const response = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
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

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingImage(productId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
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

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Продукти</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Додати продукт
          </button>
        </div>

        {isAdding && (
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={handleCancel}
            onImageUpload={(file) => handleImageUpload('new', file)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6">
              {editingId === product.id ? (
                <ProductForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onImageUpload={(file) => handleImageUpload(product.id, file)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{product.emoji}</div>
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
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
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
      </main>
    </div>
  );
}

function ProductForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  onImageUpload,
}: {
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageUpload: (file: File) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Унікальний ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input
          type="text"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telegram URL</label>
        <input
          type="text"
          value={formData.telegramUrl || ''}
          onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="t.me/TopTrendShopBot/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
        <input
          type="text"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
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
            <Image
              src={formData.backgroundImage}
              alt="Preview"
              width={200}
              height={100}
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

