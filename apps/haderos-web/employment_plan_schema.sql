-- ============================================
-- HADER 2030 - Employment Plan Tracking System
-- 9-Month Hiring Cycle Management
-- ملحق أ: اتفاق التشغيل 9 أشهر
-- ============================================

-- ============================================
-- 1. Employment Cycles - دورات التوظيف الثلاث
-- ============================================
CREATE TABLE IF NOT EXISTS employment_cycles (
  id SERIAL PRIMARY KEY,
  cycle_number INTEGER NOT NULL UNIQUE CHECK (cycle_number BETWEEN 1 AND 3),
  cycle_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  gate_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  core_pod_size INTEGER NOT NULL DEFAULT 5,
  shadow_pod_size INTEGER DEFAULT 0,
  total_workforce INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إدراج الدورات الثلاث
INSERT INTO employment_cycles (cycle_number, cycle_name, start_date, end_date, gate_date, core_pod_size, shadow_pod_size, total_workforce, is_active) VALUES
(1, 'الدورة الأولى - Core Pod', '2025-12-26', '2026-03-26', '2026-03-26', 5, 0, 5, TRUE),
(2, 'الدورة الثانية - Shadow Pod', '2026-03-27', '2026-06-24', '2026-06-24', 5, 5, 10, FALSE),
(3, 'الدورة الثالثة - New Leaders', '2026-06-25', '2026-09-22', '2026-09-22', 6, 10, 21, FALSE)
ON CONFLICT (cycle_number) DO NOTHING;

-- ============================================
-- 2. Cycle Gates - بوابات التقييم
-- ============================================
CREATE TABLE IF NOT EXISTS cycle_gates (
  id SERIAL PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES employment_cycles(id),
  gate_name VARCHAR(100) NOT NULL,
  gate_date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  description TEXT,
  is_passed BOOLEAN DEFAULT FALSE,
  passed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إدراج البوابات الثلاث
INSERT INTO cycle_gates (cycle_id, gate_name, gate_date, day_number, description) VALUES
(1, 'Gate 90 - اعتماد Core Pod', '2026-03-26', 90, 'تقييم أداء فريق النواة الأول والموافقة على استمرارهم'),
(2, 'Gate 180 - اعتماد Shadow Pod + قادة جدد', '2026-06-24', 180, 'تقييم المسار الموازي وتعيين 5 قادة جدد'),
(3, 'Gate 270 - اكتمال الهيكل 21', '2026-09-22', 270, 'اكتمال الهيكل النهائي: 6 قادة + 15 أعضاء')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Gate Criteria - معايير النجاح للبوابات
-- ============================================
CREATE TABLE IF NOT EXISTS gate_criteria (
  id SERIAL PRIMARY KEY,
  gate_id INTEGER NOT NULL REFERENCES cycle_gates(id),
  criterion_name VARCHAR(255) NOT NULL,
  criterion_type VARCHAR(50) NOT NULL,
  target_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  unit VARCHAR(50),
  weight DECIMAL(5, 2) DEFAULT 1.0,
  is_met BOOLEAN DEFAULT FALSE,
  evidence TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- معايير Gate 90
INSERT INTO gate_criteria (gate_id, criterion_name, criterion_type, target_value, unit, weight) VALUES
(1, 'معدل إنتاجية الفريق', 'performance', 80.00, '%', 2.0),
(1, 'عدد SOPs المكتملة', 'deliverable', 10.00, 'SOPs', 1.5),
(1, 'معدل رضا الفريق', 'satisfaction', 75.00, '%', 1.0),
(1, 'عدد القرارات الموثقة', 'process', 50.00, 'قرار', 1.0);

-- معايير Gate 180
INSERT INTO gate_criteria (gate_id, criterion_name, criterion_type, target_value, unit, weight) VALUES
(2, 'نجاح Shadow Pod في المهام', 'performance', 75.00, '%', 2.0),
(2, 'عدد القادة الجاهزين للتعيين', 'capacity', 5.00, 'قائد', 3.0),
(2, 'معدل التبديل الناجح', 'rotation', 90.00, '%', 1.5);

-- معايير Gate 270
INSERT INTO gate_criteria (gate_id, criterion_name, criterion_type, target_value, unit, weight) VALUES
(3, 'اكتمال الهيكل التنظيمي', 'structure', 21.00, 'عضو', 3.0),
(3, 'كفاءة العمليات الكاملة', 'efficiency', 85.00, '%', 2.0),
(3, 'جاهزية القادة للاستقلال', 'leadership', 90.00, '%', 2.5),
(3, 'نضج SOPs والأنظمة', 'maturity', 95.00, '%', 1.5);

-- ============================================
-- 4. Core Pod Members - فريق النواة الأساسي
-- ============================================
CREATE TABLE IF NOT EXISTS core_pod_members (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cycle_id INTEGER REFERENCES employment_cycles(id),
  is_founder BOOLEAN DEFAULT FALSE,
  specialization VARCHAR(100),
  performance_score DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إدراج الفريق المؤسس (5 أعضاء)
INSERT INTO core_pod_members (full_name, role, join_date, cycle_id, is_founder, specialization, status) VALUES
('Hader OS - التنفيذي والعمليات', 'Founding Executive & Operations Director', '2025-12-26', 1, TRUE, 'Leadership & Strategy', 'active'),
('Ahmed Abdel Ghaffar - المدير العام', 'General Manager', '2025-12-26', 1, TRUE, 'Operations Management', 'active'),
('Mohamed Mata - رئيس التقنية', 'Technology Lead', '2025-12-26', 1, TRUE, 'Software Engineering', 'active'),
('Ahmed El-Deeb - المنتجات والتسويق', 'Products & Marketing Lead', '2025-12-26', 1, TRUE, 'Product & Marketing', 'active'),
('Hassan Ahmed - المالية', 'Finance Lead', '2025-12-26', 1, TRUE, 'Finance & Accounting', 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Shadow Pod Members - المسار الموازي
-- ============================================
CREATE TABLE IF NOT EXISTS shadow_pod_members (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  shadowing_role VARCHAR(100) NOT NULL,
  paired_with INTEGER REFERENCES core_pod_members(id),
  join_date DATE NOT NULL,
  cycle_id INTEGER REFERENCES employment_cycles(id),
  performance_score DECIMAL(5, 2),
  rotation_count INTEGER DEFAULT 0,
  is_ready_for_leadership BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Pod Rotations - سجل تبديل الأدوار
-- ============================================
CREATE TABLE IF NOT EXISTS pod_rotations (
  id SERIAL PRIMARY KEY,
  shadow_member_id INTEGER NOT NULL REFERENCES shadow_pod_members(id),
  from_role VARCHAR(100),
  to_role VARCHAR(100) NOT NULL,
  rotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  learning_objectives TEXT,
  performance_rating DECIMAL(5, 2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. New Leaders - القادة الجدد المعينون
-- ============================================
CREATE TABLE IF NOT EXISTS new_leaders (
  id SERIAL PRIMARY KEY,
  shadow_member_id INTEGER REFERENCES shadow_pod_members(id),
  full_name VARCHAR(255) NOT NULL,
  leadership_role VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  gate_id INTEGER REFERENCES cycle_gates(id),
  team_size INTEGER DEFAULT 0,
  department VARCHAR(100),
  readiness_score DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'appointed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. Decision Log - سجل القرارات الهيكلية
-- ============================================
CREATE TABLE IF NOT EXISTS decision_log (
  id SERIAL PRIMARY KEY,
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  decision_type VARCHAR(50) NOT NULL,
  decision_title VARCHAR(255) NOT NULL,
  decision_description TEXT NOT NULL,
  made_by INTEGER REFERENCES core_pod_members(id),
  affected_cycle INTEGER REFERENCES employment_cycles(id),
  impact_level VARCHAR(50),
  outcome TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. SOPs - إجراءات التشغيل الموحدة
-- ============================================
CREATE TABLE IF NOT EXISTS sops (
  id SERIAL PRIMARY KEY,
  sop_number VARCHAR(50) NOT NULL UNIQUE,
  sop_title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_by INTEGER REFERENCES core_pod_members(id),
  approved_by INTEGER REFERENCES core_pod_members(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. Weekly Reports - التقارير الأسبوعية
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_reports (
  id SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL,
  cycle_id INTEGER REFERENCES employment_cycles(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  achievements TEXT,
  challenges TEXT,
  upcoming_milestones TEXT,
  team_health_score DECIMAL(5, 2),
  productivity_score DECIMAL(5, 2),
  submitted_by INTEGER REFERENCES core_pod_members(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. Incident Log - سجل المشكلات والحوادث
-- ============================================
CREATE TABLE IF NOT EXISTS incident_log (
  id SERIAL PRIMARY KEY,
  incident_date TIMESTAMP NOT NULL DEFAULT NOW(),
  incident_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  affected_area VARCHAR(100),
  reported_by INTEGER REFERENCES core_pod_members(id),
  resolved_by INTEGER,
  resolution TEXT,
  status VARCHAR(50) DEFAULT 'open',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cycles_active ON employment_cycles(is_active);
CREATE INDEX IF NOT EXISTS idx_gates_passed ON cycle_gates(is_passed);
CREATE INDEX IF NOT EXISTS idx_core_status ON core_pod_members(status);
CREATE INDEX IF NOT EXISTS idx_shadow_status ON shadow_pod_members(status);
CREATE INDEX IF NOT EXISTS idx_leaders_status ON new_leaders(status);
CREATE INDEX IF NOT EXISTS idx_sops_status ON sops(status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_log(status);

-- ============================================
-- VIEWS for Quick Insights
-- ============================================

-- View 1: Current Cycle Progress
CREATE OR REPLACE VIEW v_cycle_progress AS
SELECT 
  ec.cycle_number,
  ec.cycle_name,
  ec.start_date,
  ec.end_date,
  ec.gate_date,
  CURRENT_DATE - ec.start_date AS days_elapsed,
  ec.end_date - ec.start_date AS total_days,
  ROUND(
    (CURRENT_DATE - ec.start_date)::NUMERIC / 
    (ec.end_date - ec.start_date)::NUMERIC * 100, 
    2
  ) AS progress_percentage,
  ec.core_pod_size,
  ec.shadow_pod_size,
  ec.total_workforce,
  ec.status,
  ec.is_active
FROM employment_cycles ec
WHERE ec.is_active = TRUE;

-- View 2: Gates Status Summary
CREATE OR REPLACE VIEW v_gates_status AS
SELECT 
  cg.id,
  ec.cycle_name,
  cg.gate_name,
  cg.gate_date,
  cg.day_number,
  cg.is_passed,
  COUNT(gc.id) AS total_criteria,
  COUNT(CASE WHEN gc.is_met THEN 1 END) AS met_criteria,
  ROUND(
    COUNT(CASE WHEN gc.is_met THEN 1 END)::NUMERIC / 
    COUNT(gc.id)::NUMERIC * 100,
    2
  ) AS completion_percentage
FROM cycle_gates cg
JOIN employment_cycles ec ON cg.cycle_id = ec.id
LEFT JOIN gate_criteria gc ON cg.id = gc.gate_id
GROUP BY cg.id, ec.cycle_name, cg.gate_name, cg.gate_date, cg.day_number, cg.is_passed;

-- View 3: Current Workforce Summary
CREATE OR REPLACE VIEW v_current_workforce AS
SELECT 
  'Core Pod' AS team_type,
  COUNT(*) AS member_count,
  AVG(performance_score) AS avg_performance
FROM core_pod_members
WHERE status = 'active'
UNION ALL
SELECT 
  'Shadow Pod' AS team_type,
  COUNT(*) AS member_count,
  AVG(performance_score) AS avg_performance
FROM shadow_pod_members
WHERE status = 'active'
UNION ALL
SELECT 
  'New Leaders' AS team_type,
  COUNT(*) AS member_count,
  AVG(readiness_score) AS avg_performance
FROM new_leaders
WHERE status = 'appointed';

-- ============================================
-- FUNCTIONS for Automation
-- ============================================

-- Function: Update cycle status automatically
CREATE OR REPLACE FUNCTION update_cycle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gate_date <= CURRENT_DATE AND NEW.is_passed = TRUE THEN
    UPDATE employment_cycles 
    SET status = 'completed', is_active = FALSE
    WHERE id = NEW.cycle_id;
    
    -- Activate next cycle
    UPDATE employment_cycles
    SET is_active = TRUE, status = 'active'
    WHERE cycle_number = (
      SELECT cycle_number + 1 
      FROM employment_cycles 
      WHERE id = NEW.cycle_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update cycle status when gate is passed
CREATE TRIGGER trg_update_cycle_status
AFTER UPDATE ON cycle_gates
FOR EACH ROW
WHEN (NEW.is_passed = TRUE AND OLD.is_passed = FALSE)
EXECUTE FUNCTION update_cycle_status();

-- ============================================
-- Initial Data Check
-- ============================================
SELECT 'Employment Plan Schema Created Successfully!' AS status;
SELECT 'Total Cycles: ' || COUNT(*) FROM employment_cycles;
SELECT 'Total Gates: ' || COUNT(*) FROM cycle_gates;
SELECT 'Total Criteria: ' || COUNT(*) FROM gate_criteria;
SELECT 'Core Pod Members: ' || COUNT(*) FROM core_pod_members;

-- ============================================
-- Quick Start Queries
-- ============================================
/*
-- View current progress:
SELECT * FROM v_cycle_progress;

-- View gates status:
SELECT * FROM v_gates_status;

-- View current workforce:
SELECT * FROM v_current_workforce;

-- Add new Core Pod member:
INSERT INTO core_pod_members (full_name, role, specialization)
VALUES ('New Member Name', 'Role', 'Specialization');

-- Record a decision:
INSERT INTO decision_log (decision_type, decision_title, decision_description, made_by, impact_level)
VALUES ('hiring', 'New Shadow Pod Member', 'Decision to hire...', 1, 'high');

-- Update gate criteria:
UPDATE gate_criteria 
SET actual_value = 85.00, is_met = TRUE 
WHERE id = 1;

-- Pass a gate:
UPDATE cycle_gates 
SET is_passed = TRUE, passed_at = NOW() 
WHERE id = 1;
*/
