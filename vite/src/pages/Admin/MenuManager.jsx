import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";

export default function MenuManager() {
  const { cafeId } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "taom",
    price: "",
    description: "",
    imageUrl: "",
    available: true,
  });

  useEffect(() => {
    if (!cafeId) return;

    const q = query(
      collection(db, "menu"),
      where("cafeId", "==", cafeId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setDishes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cafeId]);

  const resetForm = () => {
    setForm({
      name: "",
      category: "taom",
      price: "",
      description: "",
      imageUrl: "",
      available: true,
    });

    setEditingDish(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (dish) => {
    setForm({
      name: dish.name || "",
      category: dish.category || "taom",
      price: dish.price || "",
      description: dish.description || "",
      imageUrl: dish.imageUrl || "",
      available: dish.available ?? true,
    });

    setEditingDish(dish);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      alert("Iltimos, taom nomi va narxini kiriting");
      return;
    }

    const dishData = {
      cafeId,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      imageUrl: form.imageUrl,
      available: form.available,
    };

    try {
      if (editingDish) {
        await updateDoc(
          doc(db, "menu", editingDish.id),
          dishData
        );
      } else {
        await addDoc(collection(db, "menu"), {
          ...dishData,
          createdAt: new Date(),
        });
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Taomni saqlashda xatolik:", error);
      alert("Xatolik yuz berdi, qaytadan urinib ko'ring");
    }
  };

  const handleDelete = async (dishId) => {
    if (
      !window.confirm(
        "Bu taomni o'chirishga ishonchingiz komilmi?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "menu", dishId));
    } catch (error) {
      console.error("Taomni o'chirishda xatolik:", error);
    }
  };

  const toggleAvailability = async (dish) => {
    try {
      await updateDoc(doc(db, "menu", dish.id), {
        available: !dish.available,
      });
    } catch (error) {
      console.error("Holatni yangilashda xatolik:", error);
    }
  };

  const categories = [
    "taom",
    "desert",
    "ichimlik",
    "salat",
    "boshqa",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-800">
          Menyu boshqaruvi
        </h1>

        <button
          onClick={openAddModal}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
        >
          + Taom qo'shish
        </button>
      </div>

      {dishes.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Hozircha taomlar yo'q
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex"
            >
              <img
                src={
                  dish.imageUrl ||
                  "/src/assets/placeholders/food-placeholder.jpg"
                }
                alt={dish.name}
                className="w-24 h-24 object-cover"
              />

              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">
                      {dish.name}
                    </h3>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        dish.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {dish.available
                        ? "Mavjud"
                        : "Tugagan"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 capitalize">
                    {dish.category}
                  </p>

                  <p className="text-amber-700 font-bold mt-1">
                    {Number(dish.price).toLocaleString()} so'm
                  </p>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openEditModal(dish)}
                    className="text-xs px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Tahrirlash
                  </button>

                  <button
                    onClick={() => toggleAvailability(dish)}
                    className="text-xs px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                  >
                    {dish.available
                      ? "Tugatish"
                      : "Qaytarish"}
                  </button>

                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {editingDish
                ? "Taomni tahrirlash"
                : "Yangi taom qo'shish"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Taom nomi
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Masalan: Osh"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Kategoriya
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Narxi (so'm)
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Masalan: 35000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Tavsif
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Qisqacha tavsif"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Rasm URL manzili
                </label>

                <input
                  type="text"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="available"
                  checked={form.available}
                  onChange={handleChange}
                  id="available"
                  className="w-4 h-4"
                />

                <label
                  htmlFor="available"
                  className="text-sm text-gray-700"
                >
                  Mavjud (sotuvda)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                >
                  Saqlash
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}