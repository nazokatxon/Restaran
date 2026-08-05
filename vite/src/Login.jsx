import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Input from "./components/Input";
import Button from "./components/Button";

const ROLE_ROUTES = {
  bigadmin: "/bigadmin/cafes",
  admin: "/admin/menu",
  waiter: "/waiter/tables",
  chef: "/chef/queue",
  cashier: "/cashier/billing",
};

const ERROR_MESSAGES = {
  "auth/invalid-email": "Email manzili noto'g'ri formatda.",
  "auth/user-disabled": "Bu hisob bloklangan. Administrator bilan bog'laning.",
  "auth/user-not-found": "Bunday foydalanuvchi topilmadi.",
  "auth/wrong-password": "Parol noto'g'ri.",
  "auth/invalid-credential": "Email yoki parol noto'g'ri.",
  "auth/too-many-requests": "Juda ko'p urinish. Birozdan so'ng qayta urining.",
  default: "Kirishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email kiritilishi shart";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Email formati noto'g'ri";

    if (!password) next.password = "Parol kiritilishi shart";
    else if (password.length < 6)
      next.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const loggedInRole = await login(email.trim(), password);
      const target = ROLE_ROUTES[loggedInRole] || "/";
      navigate(target, { replace: true });
    } catch (err) {
      const code = err?.code || "default";
      setFormError(ERROR_MESSAGES[code] || ERROR_MESSAGES.default);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF6EC] px-5 py-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .disp { font-family: 'Montserrat', sans-serif; }
      `}</style>

      <div className="w-full max-w-sm">
        <h1 className="disp text-2xl font-extrabold text-[#241F19] tracking-tight">
          Tizimga kirish
        </h1>

        <p className="text-sm text-[#8E8676] mt-1">
          Tizimga kirish uchun ma'lumotlaringizni kiriting
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-white rounded-3xl shadow-sm border border-[#E8E4D8] p-6 space-y-4"
          noValidate
        >
          {formError && (
            <div className="bg-[#C0392B]/10 text-[#C0392B] text-sm font-medium rounded-xl px-3.5 py-2.5">
              {formError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            icon={<Mail size={18} />}
            placeholder=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="username"
            required
          />

          <Input
            label="Parol"
            type="password"
            icon={<Lock size={18} />}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
          >
            Kirish
          </Button>
        </form>

        <p className="text-center text-xs text-[#8E8676] mt-6">
          Hisobingiz yo'qmi? Administratoringiz bilan bog'laning.
        </p>
      </div>
    </div>
  );
}