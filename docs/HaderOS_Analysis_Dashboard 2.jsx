import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const HaderOSAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Data for completion status
  const completionData = [
    { name: 'الوثائق الاستراتيجية', value: 75, color: '#10B981' },
    { name: 'المواصفات الفنية', value: 55, color: '#F59E0B' },
    { name: 'الكود التنفيذي', value: 12, color: '#EF4444' },
    { name: 'البنية التحتية', value: 5, color: '#EF4444' },
    { name: 'نظام التشغيل', value: 0, color: '#6B7280' },
  ];

  // Risk assessment data
  const riskData = [
    { risk: 'تقني', level: 85 },
    { risk: 'مالي', level: 60 },
    { risk: 'سوقي', level: 45 },
    { risk: 'تنظيمي', level: 70 },
    { risk: 'فريق', level: 75 },
  ];

  // Options comparison
  const optionsData = [
    { option: 'MVP مصغر', time: 3, budget: 50, risk: 30, reward: 40 },
    { option: 'مرحلي', time: 12, budget: 500, risk: 70, reward: 90 },
    { option: 'استثمار', time: 5, budget: 20, risk: 80, reward: 60 },
    { option: 'MVP ذكي ⭐', time: 6, budget: 100, risk: 45, reward: 75 },
  ];

  // Timeline data
  const timelineData = [
    { phase: 'محرك الشريعة', weeks: 3, files: 10 },
    { phase: 'طبقة API', weeks: 3, files: 10 },
    { phase: 'قاعدة البيانات', weeks: 2, files: 5 },
    { phase: 'النشر', weeks: 2, files: 4 },
    { phase: 'التوثيق', weeks: 2, files: 6 },
  ];

  // Budget breakdown
  const budgetData = [
    { name: 'الرواتب', value: 62000, color: '#3B82F6' },
    { name: 'بنية تحتية', value: 1800, color: '#10B981' },
    { name: 'استشارات', value: 7000, color: '#F59E0B' },
    { name: 'طوارئ', value: 10620, color: '#EF4444' },
  ];

  const TabButton = ({ name, label, icon }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        activeTab === name
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className={`bg-white rounded-xl p-6 shadow-lg border-r-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  const ConcernCard = ({ number, title, status, color, description }) => (
    <div className={`bg-white rounded-lg p-4 shadow border-r-4 ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">{number}</span>
        <h4 className="font-bold">{title}</h4>
        <span className={`ml-auto px-2 py-1 rounded text-xs ${
          status === '✅' ? 'bg-green-100 text-green-800' :
          status === '⚠️' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>{status}</span>
      </div>
      <p className="text-sm text-gray-600 mr-11">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 mb-6 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 تحليل مشروع HaderOS</h1>
            <p className="text-blue-200">تقرير تحليلي شامل للوضع الحالي والتوصيات الاستراتيجية</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-blue-200">نسبة الإنجاز الإجمالية</p>
            <p className="text-4xl font-bold">20%</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <TabButton name="overview" label="نظرة عامة" icon="📊" />
        <TabButton name="concerns" label="المخاوف الخمسة" icon="⚠️" />
        <TabButton name="recommendation" label="التوصية" icon="🎯" />
        <TabButton name="timeline" label="الجدول الزمني" icon="📅" />
        <TabButton name="budget" label="الميزانية" icon="💰" />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="إجمالي الملفات المطلوبة" value="210" subtitle="للمنتج الكامل" color="border-blue-500" icon="📁" />
            <StatCard title="ملفات MVP" value="35" subtitle="للمنتج الأولي" color="border-green-500" icon="🚀" />
            <StatCard title="الميزانية المقترحة" value="$81K" subtitle="للـ MVP الذكي" color="border-yellow-500" icon="💵" />
            <StatCard title="المدة المقترحة" value="6 أشهر" subtitle="12 أسبوع" color="border-purple-500" icon="⏱️" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">📈 نسب الإنجاز حسب الفئة</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completionData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Radar */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">🎯 تقييم المخاطر</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={riskData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="risk" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="مستوى المخاطر" dataKey="level" stroke="#EF4444" fill="#EF4444" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'concerns' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">⚠️ المخاوف الخمسة والإجابات</h2>
          <ConcernCard
            number="1"
            title="افتراضات النمو السريع"
            status="⚠️"
            color="border-yellow-500"
            description="التوقعات طموحة جداً. التوصية: خفض التوقعات 40-50% للسنوات الأولى والتركيز على إثبات المفهوم أولاً."
          />
          <ConcernCard
            number="2"
            title="التكاليف التشغيلية"
            status="⚠️"
            color="border-yellow-500"
            description="الميزانية المعلنة لا تشمل: الضرائب (15-25%)، الاستشارات الشرعية والقانونية، الصيانة والتحديثات. التوصية: إضافة 25-35%."
          />
          <ConcernCard
            number="3"
            title="المنافسة الفعلية"
            status="✅"
            color="border-green-500"
            description="موقف تنافسي واعد! Theology-as-Code و KAIA فريدة من نوعها. التوصية: التركيز على 'Compliance-as-a-Service' كنقطة تميز."
          />
          <ConcernCard
            number="4"
            title="القدرة التقنية"
            status="❌"
            color="border-red-500"
            description="أكبر المخاوف! المشروع يحتاج خبراء نادرين (AI + Ontology + Fiqh). التوصية: شراكة مع جامعة أو توظيف استشاري متخصص."
          />
          <ConcernCard
            number="5"
            title="القبول السوقي"
            status="✅"
            color="border-green-500"
            description="سوق التمويل الإسلامي ($4.5 تريليون) ينمو 12-15% سنوياً. التوصية: دراسة سوق مصغرة مع 5-10 عملاء محتملين."
          />
        </div>
      )}

      {activeTab === 'recommendation' && (
        <div className="space-y-6">
          {/* Recommended Option */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🎯</span>
              <div>
                <h2 className="text-2xl font-bold">التوصية: MVP الذكي + المرحلي</h2>
                <p className="text-green-100">الخيار الأمثل الذي يوازن بين المخاطر والعوائد</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur">
                <p className="text-green-200">المدة</p>
                <p className="text-2xl font-bold">6 أشهر</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur">
                <p className="text-green-200">الميزانية</p>
                <p className="text-2xl font-bold">$81,420</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur">
                <p className="text-green-200">الفريق</p>
                <p className="text-2xl font-bold">4 أشخاص</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur">
                <p className="text-green-200">الملفات</p>
                <p className="text-2xl font-bold">35 ملف</p>
              </div>
            </div>
          </div>

          {/* Options Comparison */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">📊 مقارنة الخيارات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optionsData}>
                <XAxis dataKey="option" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="time" name="الوقت (شهور)" fill="#3B82F6" />
                <Bar dataKey="risk" name="المخاطر %" fill="#EF4444" />
                <Bar dataKey="reward" name="العائد المتوقع %" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Why This Option */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">✅ لماذا هذا الخيار؟</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '⚡', title: 'يوازن بين السرعة والجودة', desc: '6 أشهر كافية لمنتج حقيقي' },
                { icon: '💰', title: 'ميزانية واقعية', desc: 'لا يتطلب تمويلاً ضخماً' },
                { icon: '🎯', title: 'يثبت المفهوم', desc: 'قبل الاستثمار الكبير' },
                { icon: '💵', title: 'إيرادات مبكرة', desc: 'API قابل للبيع كـ SaaS' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">📅 الجدول الزمني للـ MVP (12 أسبوع)</h2>
          
          {/* Timeline Visualization */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <XAxis dataKey="phase" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="weeks" name="الأسابيع" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="files" name="عدد الملفات" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Phases Detail */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { phase: 1, name: 'محرك الشريعة', weeks: '1-3', icon: '⚙️', color: 'from-blue-500 to-blue-600' },
              { phase: 2, name: 'طبقة API', weeks: '4-6', icon: '🔌', color: 'from-purple-500 to-purple-600' },
              { phase: 3, name: 'قاعدة البيانات', weeks: '7-8', icon: '💾', color: 'from-green-500 to-green-600' },
              { phase: 4, name: 'النشر', weeks: '9-10', icon: '🚀', color: 'from-orange-500 to-orange-600' },
              { phase: 5, name: 'التوثيق', weeks: '11-12', icon: '📚', color: 'from-pink-500 to-pink-600' },
            ].map((p) => (
              <div key={p.phase} className={`bg-gradient-to-br ${p.color} rounded-xl p-4 text-white text-center shadow-lg`}>
                <span className="text-3xl block mb-2">{p.icon}</span>
                <p className="font-bold">المرحلة {p.phase}</p>
                <p className="text-sm opacity-90">{p.name}</p>
                <p className="text-xs mt-2 opacity-75">الأسبوع {p.weeks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">💰 الميزانية التفصيلية</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Pie Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">توزيع الميزانية</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Details */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">التفاصيل</h3>
              <div className="space-y-4">
                {[
                  { label: 'مطور رئيسي (3 شهور)', value: '$24,000', desc: 'خبرة 5+ سنوات' },
                  { label: 'مطور Backend (3 شهور)', value: '$15,000', desc: 'خبرة 3+ سنوات' },
                  { label: 'DevOps (2 شهور جزئي)', value: '$8,000', desc: 'جزء من الوقت' },
                  { label: 'مستشار شرعي (3 شهور)', value: '$9,000', desc: 'استشاري' },
                  { label: 'QA (2 شهور جزئي)', value: '$6,000', desc: 'جزء من الوقت' },
                  { label: 'بنية تحتية', value: '$1,800', desc: 'AWS/GCP + أدوات' },
                  { label: 'استشارات واعتمادات', value: '$7,000', desc: 'قانوني + شرعي' },
                  { label: 'طوارئ (15%)', value: '$10,620', desc: 'احتياطي' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <p className="font-bold text-blue-600">{item.value}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 mt-4 border-t-2">
                  <p className="text-lg font-bold">الإجمالي</p>
                  <p className="text-2xl font-bold text-green-600">$81,420</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>📊 تحليل Claude AI - ديسمبر 2025 | 🎯 HaderOS Strategic Analysis Dashboard</p>
      </div>
    </div>
  );
};

export default HaderOSAnalysisDashboard;
