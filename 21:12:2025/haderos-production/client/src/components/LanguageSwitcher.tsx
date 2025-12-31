import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Update document direction for RTL languages
    document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.flag}</span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
