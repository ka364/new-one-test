-- 📖 بيانات القرآن الكريم - HADEROS AI CLOUD
-- آخر تحديث: 29 ديسمبر 2025
-- الملاحظة: هذا ملف نموذجي يحتوي على عينة من الآيات
-- لاستيراد القرآن الكامل (6,236 آية)، يجب توفير الملف الكامل

-- مسح البيانات القديمة (اختياري)
-- TRUNCATE TABLE quranic_verses CASCADE;

-- إدخال آيات قرآنية مع السياق الإداري

-- سورة الفاتحة
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(1, 'Al-Fatihah', 'الفاتحة', 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 1, 1, '["بسم الله", "الرحمن", "الرحيم", "البداية"]', '{"contexts": ["starting_projects", "opening_meetings"], "themes": ["mercy", "compassion", "beginnings"]}'),
(1, 'Al-Fatihah', 'الفاتحة', 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 1, 1, '["الحمد", "الشكر", "العالمين"]', '{"contexts": ["gratitude", "success_celebration"], "themes": ["thankfulness", "acknowledgment"]}'),
(1, 'Al-Fatihah', 'الفاتحة', 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 1, 1, '["العبادة", "الاستعانة", "التوكل"]', '{"contexts": ["seeking_help", "major_decisions"], "themes": ["reliance", "focus", "dedication"]}'),
(1, 'Al-Fatihah', 'الفاتحة', 6, 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 1, 1, '["الهداية", "الطريق المستقيم", "التوجيه"]', '{"contexts": ["strategy_planning", "direction_setting"], "themes": ["guidance", "right_path", "navigation"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة البقرة (آيات متعلقة بالأعمال والمعاملات)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(2, 'Al-Baqarah', 'البقرة', 83, 'وَقُولُوا لِلنَّاسِ حُسْنًا', 1, 13, '["الحسنى", "حسن المعاملة", "الكلام الطيب"]', '{"contexts": ["customer_service", "employee_relations", "communication"], "themes": ["kindness", "good_speech", "interpersonal_relations"]}'),
(2, 'Al-Baqarah', 'البقرة', 188, 'وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ', 2, 29, '["المال", "الباطل", "الظلم", "الحق"]', '{"contexts": ["financial_dealings", "contracts", "fair_trade"], "themes": ["justice", "fairness", "ethical_finance"]}'),
(2, 'Al-Baqarah', 'البقرة', 275, 'الَّذِينَ يَأْكُلُونَ الرِّبَا لَا يَقُومُونَ إِلَّا كَمَا يَقُومُ الَّذِي يَتَخَبَّطُهُ الشَّيْطَانُ مِنَ الْمَسِّ', 3, 47, '["الربا", "الحرام", "المال"]', '{"contexts": ["finance", "lending", "investment"], "themes": ["interest_prohibition", "ethical_finance", "fair_trade"]}'),
(2, 'Al-Baqarah', 'البقرة', 276, 'يَمْحَقُ اللَّهُ الرِّبَا وَيُرْبِي الصَّدَقَاتِ', 3, 47, '["الربا", "الصدقة", "البركة"]', '{"contexts": ["charity", "social_responsibility"], "themes": ["giving", "blessings", "CSR"]}'),
(2, 'Al-Baqarah', 'البقرة', 282, 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى فَاكْتُبُوهُ', 3, 48, '["الدين", "التوثيق", "الكتابة", "العقود"]', '{"contexts": ["contracts", "documentation", "legal"], "themes": ["record_keeping", "transparency", "accountability"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة آل عمران (القيادة والإدارة)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(3, 'Ali-Imran', 'آل عمران', 159, 'وَشَاوِرْهُمْ فِي الْأَمْرِ', 4, 71, '["الشورى", "المشاورة", "القرار"]', '{"contexts": ["decision_making", "team_consultation", "leadership"], "themes": ["consultation", "participative_management", "collaboration"]}'),
(3, 'Ali-Imran', 'آل عمران', 200, 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا', 4, 76, '["الصبر", "المثابرة", "الثبات"]', '{"contexts": ["challenges", "persistence", "resilience"], "themes": ["patience", "perseverance", "steadfastness"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة النساء (العدل والإنصاف)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(4, 'An-Nisa', 'النساء', 58, 'إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا', 5, 87, '["الأمانة", "الثقة", "المسؤولية"]', '{"contexts": ["trust", "responsibility", "delegation"], "themes": ["trustworthiness", "accountability", "integrity"]}'),
(4, 'An-Nisa', 'النساء', 135, 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ شُهَدَاءَ لِلَّهِ', 6, 100, '["القسط", "العدل", "الشهادة"]', '{"contexts": ["justice", "fairness", "conflict_resolution"], "themes": ["equity", "impartiality", "truth"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة المائدة (الوفاء بالعقود)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(5, 'Al-Maidah', 'المائدة', 1, 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ', 6, 106, '["العقود", "الوفاء", "الالتزام"]', '{"contexts": ["contracts", "agreements", "commitments"], "themes": ["contract_fulfillment", "promises", "obligations"]}'),
(5, 'Al-Maidah', 'المائدة', 8, 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ لِلَّهِ شُهَدَاءَ بِالْقِسْطِ وَلَا يَجْرِمَنَّكُمْ شَنَآنُ قَوْمٍ عَلَىٰ أَلَّا تَعْدِلُوا', 6, 108, '["العدل", "القسط", "الإنصاف"]', '{"contexts": ["fairness", "bias_prevention", "equal_treatment"], "themes": ["justice", "objectivity", "impartiality"]}'),
(5, 'Al-Maidah', 'المائدة', 90, 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ', 7, 122, '["الميسر", "القمار", "الحرام"]', '{"contexts": ["prohibited_activities", "risk_management"], "themes": ["gambling_prohibition", "ethical_boundaries"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الأنعام (الحكمة والتفكير)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(6, 'Al-Anam', 'الأنعام', 152, 'وَلَا تَقْرَبُوا مَالَ الْيَتِيمِ إِلَّا بِالَّتِي هِيَ أَحْسَنُ', 8, 150, '["اليتيم", "الحفظ", "الأمانة"]', '{"contexts": ["asset_management", "fiduciary_duty", "trust"], "themes": ["protection", "stewardship", "responsibility"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة التوبة (الصدق والأمانة)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(9, 'At-Tawbah', 'التوبة', 119, 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ', 11, 206, '["الصدق", "الصادقين", "الأمانة"]', '{"contexts": ["honesty", "integrity", "transparency"], "themes": ["truthfulness", "credibility", "trust"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة هود (الاستقامة)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(11, 'Hud', 'هود', 85, 'وَيَا قَوْمِ أَوْفُوا الْمِكْيَالَ وَالْمِيزَانَ بِالْقِسْطِ', 12, 228, '["الميزان", "القسط", "العدل في التجارة"]', '{"contexts": ["fair_measurement", "accurate_pricing", "quality_assurance"], "themes": ["fairness", "precision", "honesty_in_trade"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة النحل (العدل والإحسان)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(16, 'An-Nahl', 'النحل', 90, 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَىٰ', 14, 277, '["العدل", "الإحسان", "الأخلاق"]', '{"contexts": ["justice", "excellence", "stakeholder_relations"], "themes": ["fairness", "doing_good", "social_responsibility"]}'),
(16, 'An-Nahl', 'النحل', 91, 'وَأَوْفُوا بِعَهْدِ اللَّهِ إِذَا عَاهَدتُّمْ', 14, 277, '["العهد", "الوفاء", "الالتزام"]', '{"contexts": ["commitments", "agreements", "promises"], "themes": ["covenant_keeping", "reliability", "trustworthiness"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الإسراء (المسؤولية الشخصية)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(17, 'Al-Isra', 'الإسراء', 34, 'وَأَوْفُوا بِالْعَهْدِ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا', 15, 285, '["العهد", "المسؤولية", "المحاسبة"]', '{"contexts": ["accountability", "commitments", "contracts"], "themes": ["responsibility", "promise_keeping", "obligation"]}'),
(17, 'Al-Isra', 'الإسراء', 35, 'وَأَوْفُوا الْكَيْلَ إِذَا كِلْتُمْ وَزِنُوا بِالْقِسْطَاسِ الْمُسْتَقِيمِ', 15, 285, '["الكيل", "الميزان", "العدل"]', '{"contexts": ["fair_measurement", "quality", "accuracy"], "themes": ["precision", "fairness", "honesty"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الكهف (الصبر والحكمة)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(18, 'Al-Kahf', 'الكهف', 28, 'وَاصْبِرْ نَفْسَكَ مَعَ الَّذِينَ يَدْعُونَ رَبَّهُم بِالْغَدَاةِ وَالْعَشِيِّ', 15, 296, '["الصبر", "المثابرة", "الاستمرارية"]', '{"contexts": ["patience", "long_term_thinking", "persistence"], "themes": ["steadfastness", "dedication", "commitment"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الفرقان (الاعتدال)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(25, 'Al-Furqan', 'الفرقان', 67, 'وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا', 19, 364, '["الاعتدال", "التوازن", "الإنفاق"]', '{"contexts": ["budgeting", "spending", "financial_planning"], "themes": ["moderation", "balance", "wise_spending"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة القصص (التواضع)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(28, 'Al-Qasas', 'القصص', 77, 'وَابْتَغِ فِيمَا آتَاكَ اللَّهُ الدَّارَ الْآخِرَةَ وَلَا تَنسَ نَصِيبَكَ مِنَ الدُّنْيَا', 20, 394, '["التوازن", "الدنيا والآخرة", "الاعتدال"]', '{"contexts": ["work_life_balance", "long_term_planning", "purpose"], "themes": ["balance", "sustainability", "holistic_success"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الحجرات (احترام الآخرين)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(49, 'Al-Hujurat', 'الحجرات', 11, 'يَا أَيُّهَا الَّذِينَ آمَنُوا لَا يَسْخَرْ قَوْمٌ مِّن قَوْمٍ', 26, 515, '["الاحترام", "عدم السخرية", "الكرامة"]', '{"contexts": ["workplace_respect", "team_culture", "diversity"], "themes": ["respect", "dignity", "professional_behavior"]}'),
(49, 'Al-Hujurat', 'الحجرات', 12, 'يَا أَيُّهَا الَّذِينَ آمَنُوا اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ إِنَّ بَعْضَ الظَّنِّ إِثْمٌ', 26, 515, '["الظن", "التحقق", "العدل"]', '{"contexts": ["fact_checking", "due_diligence", "fair_judgment"], "themes": ["verification", "avoiding_assumptions", "objectivity"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الذاريات (العطاء والمسؤولية الاجتماعية)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(51, 'Adh-Dhariyat', 'الذاريات', 19, 'وَفِي أَمْوَالِهِمْ حَقٌّ لِّلسَّائِلِ وَالْمَحْرُومِ', 27, 521, '["المسؤولية الاجتماعية", "العطاء", "المجتمع"]', '{"contexts": ["CSR", "charity", "social_responsibility"], "themes": ["giving", "community_support", "stakeholder_welfare"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الرحمن (الاتزان في الكون)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(55, 'Ar-Rahman', 'الرحمن', 7, 'وَالسَّمَاءَ رَفَعَهَا وَوَضَعَ الْمِيزَانَ', 27, 531, '["الميزان", "التوازن", "العدل"]', '{"contexts": ["balance", "equilibrium", "fairness"], "themes": ["cosmic_order", "justice", "harmony"]}'),
(55, 'Ar-Rahman', 'الرحمن', 9, 'وَأَقِيمُوا الْوَزْنَ بِالْقِسْطِ وَلَا تُخْسِرُوا الْمِيزَانَ', 27, 531, '["الوزن", "القسط", "العدل"]', '{"contexts": ["fair_dealing", "measurement", "accuracy"], "themes": ["justice", "precision", "integrity"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الجمعة (العمل والتوكل)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(62, 'Al-Jumuah', 'الجمعة', 10, 'فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ', 28, 554, '["العمل", "السعي", "الرزق"]', '{"contexts": ["work_ethic", "enterprise", "seeking_livelihood"], "themes": ["productivity", "effort", "seeking_sustenance"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة المطففين (العدل في الميزان)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(83, 'Al-Mutaffifin', 'المطففين', 1, 'وَيْلٌ لِّلْمُطَفِّفِينَ', 30, 587, '["التطفيف", "الغش", "الميزان"]', '{"contexts": ["fair_trade", "honest_measurement", "quality_control"], "themes": ["honesty", "fairness", "integrity_in_trade"]}'),
(83, 'Al-Mutaffifin', 'المطففين', 2, 'الَّذِينَ إِذَا اكْتَالُوا عَلَى النَّاسِ يَسْتَوْفُونَ', 30, 587, '["الكيل", "الاستيفاء", "الحق"]', '{"contexts": ["receiving", "rights", "expectations"], "themes": ["claiming_rights", "receiving_due"]}'),
(83, 'Al-Mutaffifin', 'المطففين', 3, 'وَإِذَا كَالُوهُمْ أَو وَّزَنُوهُمْ يُخْسِرُونَ', 30, 587, '["الغش", "النقص", "الظلم"]', '{"contexts": ["giving", "measurement", "fairness"], "themes": ["cheating_prohibition", "fair_measure", "justice"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة الشرح (التيسير مع العسر)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(94, 'Ash-Sharh', 'الشرح', 5, 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 30, 596, '["التفاؤل", "الأمل", "التحديات"]', '{"contexts": ["crisis_management", "resilience", "hope"], "themes": ["optimism", "challenges", "relief_after_hardship"]}'),
(94, 'Ash-Sharh', 'الشرح', 6, 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', 30, 596, '["اليسر", "التفاؤل", "الفرج"]', '{"contexts": ["persistence", "hope", "difficult_times"], "themes": ["ease_after_hardship", "perseverance", "positive_outlook"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- سورة العصر (الوقت والعمل الصالح)
INSERT INTO quranic_verses (surah_number, surah_name, surah_name_ar, ayah_number, verse_text, juz, page, keywords, management_context) VALUES
(103, 'Al-Asr', 'العصر', 1, 'وَالْعَصْرِ', 30, 601, '["الوقت", "الزمن", "العصر"]', '{"contexts": ["time_management", "urgency", "value_of_time"], "themes": ["time", "era", "importance_of_time"]}'),
(103, 'Al-Asr', 'العصر', 2, 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', 30, 601, '["الخسران", "الفشل", "النقص"]', '{"contexts": ["loss_prevention", "value_creation"], "themes": ["loss", "default_state", "need_for_action"]}'),
(103, 'Al-Asr', 'العصر', 3, 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', 30, 601, '["العمل الصالح", "الحق", "الصبر", "التعاون"]', '{"contexts": ["teamwork", "truth", "patience", "good_work"], "themes": ["righteous_action", "mutual_support", "collaboration", "perseverance"]}')
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- إضافة تطبيقات إدارية للآيات
INSERT INTO management_applications (verse_id, context_type, application_area, situation_description, situation_description_ar, relevance_score)
SELECT id, 'hiring', 'HR', 'When hiring employees, ensure honesty and integrity', 'عند توظيف الموظفين، تأكد من الصدق والنزاهة', 0.95
FROM quranic_verses WHERE surah_number = 9 AND ayah_number = 119
ON CONFLICT DO NOTHING;

INSERT INTO management_applications (verse_id, context_type, application_area, situation_description, situation_description_ar, relevance_score)
SELECT id, 'financial_decision', 'Finance', 'Avoid interest-based transactions', 'تجنب المعاملات الربوية', 1.0
FROM quranic_verses WHERE surah_number = 2 AND ayah_number = 275
ON CONFLICT DO NOTHING;

INSERT INTO management_applications (verse_id, context_type, application_area, situation_description, situation_description_ar, relevance_score)
SELECT id, 'team_meeting', 'Leadership', 'Consult team members in decision making', 'استشر أعضاء الفريق في اتخاذ القرار', 0.98
FROM quranic_verses WHERE surah_number = 3 AND ayah_number = 159
ON CONFLICT DO NOTHING;

INSERT INTO management_applications (verse_id, context_type, application_area, situation_description, situation_description_ar, relevance_score)
SELECT id, 'contract_signing', 'Legal', 'Fulfill all contractual obligations', 'الوفاء بجميع الالتزامات التعاقدية', 1.0
FROM quranic_verses WHERE surah_number = 5 AND ayah_number = 1
ON CONFLICT DO NOTHING;

INSERT INTO management_applications (verse_id, context_type, application_area, situation_description, situation_description_ar, relevance_score)
SELECT id, 'quality_control', 'Operations', 'Ensure fair measurement and quality', 'ضمان القياس العادل والجودة', 0.92
FROM quranic_verses WHERE surah_number = 83 AND ayah_number = 1
ON CONFLICT DO NOTHING;

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_quranic_verses_keywords ON quranic_verses USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_quranic_verses_management_context ON quranic_verses USING GIN (management_context);

-- إحصائيات
SELECT
    'بيانات القرآن الكريم تم استيرادها بنجاح!' as message,
    COUNT(*) as total_verses,
    COUNT(DISTINCT surah_number) as total_surahs
FROM quranic_verses;
