-- V58: Seed CDS Rules for Dynamic Safety Checks

INSERT INTO cds_rules (name, description, trigger_event, conditions, severity, action_type, is_active, version, created_at, updated_at) VALUES
(
    'Penicillin Allergy Cross-Reactivity',
    'Checks for prescribing Penicillin class drugs (Amoxicillin, Ampicillin) to patients with a registered Penicillin allergy.',
    'ON_PRESCRIPTION',
    '{"type": "ALLERGY_CROSS_REACTIVITY", "allergy": "PENICILLIN", "medications": ["PENICILLIN", "AMOXICILLIN", "AMPICILLIN"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Sulfa Allergy Cross-Reactivity',
    'Checks for prescribing Sulfa class drugs (Sulfamethoxazole, Trimethoprim) to patients with a registered Sulfa allergy.',
    'ON_PRESCRIPTION',
    '{"type": "ALLERGY_CROSS_REACTIVITY", "allergy": "SULFA", "medications": ["SULFA", "SULFAMETHOXAZOLE", "TRIMETHOPRIM"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'NSAID Contraindication - Chronic Kidney Disease (CKD)',
    'Non-steroidal anti-inflammatory drugs (NSAIDs) are contraindicated in patients with advanced chronic kidney disease.',
    'ON_PRESCRIPTION',
    '{"type": "DRUG_DISEASE_CONTRAINDICATION", "conditions": ["CKD", "CHRONIC KIDNEY DISEASE", "RENAL FAILURE"], "medications": ["IBUPROFEN", "NAPROXEN"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'NSAID Contraindication - Peptic Ulcer',
    'NSAIDs are contraindicated in patients with active peptic ulcer disease due to bleeding risk.',
    'ON_PRESCRIPTION',
    '{"type": "DRUG_DISEASE_CONTRAINDICATION", "conditions": ["PEPTIC ULCER", "GASTRIC ULCER", "BLEEDING DISORDER"], "medications": ["IBUPROFEN", "NAPROXEN", "ASPIRIN"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Metformin Contraindication - Renal Impairment',
    'Metformin carries a risk of lactic acidosis in patients with severe renal impairment.',
    'ON_PRESCRIPTION',
    '{"type": "DRUG_DISEASE_CONTRAINDICATION", "conditions": ["SEVERE RENAL IMPAIRMENT", "METABOLIC ACIDOSIS"], "medications": ["METFORMIN"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Pregnancy Contraindication - ACE Inhibitors',
    'ACE inhibitors are contraindicated during pregnancy due to teratogenic effects.',
    'ON_PRESCRIPTION',
    '{"type": "DRUG_DISEASE_CONTRAINDICATION", "conditions": ["PREGNANCY", "PREGNANT"], "medications": ["ENALAPRIL", "LOSARTAN"]}'::jsonb,
    'CRITICAL',
    'BLOCK_ACTION',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
