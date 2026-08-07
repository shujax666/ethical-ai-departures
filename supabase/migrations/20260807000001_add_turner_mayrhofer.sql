-- Add date precision needed for month-only departures and separate resignation
-- dates from employment end dates. Existing records are exact-day by default.
ALTER TABLE profiles
  ADD COLUMN departure_date_precision TEXT NOT NULL DEFAULT 'day'
    CHECK (departure_date_precision IN ('day', 'month', 'year')),
  ADD COLUMN effective_departure_date DATE,
  ADD COLUMN departure_date_note TEXT,
  ADD COLUMN seo_description TEXT;

ALTER TABLE publications
  ADD COLUMN published_date_precision TEXT NOT NULL DEFAULT 'day'
    CHECK (published_date_precision IN ('day', 'month', 'year')),
  ADD COLUMN last_updated_at DATE;

-- A month-precision record uses the first day only as a sortable database
-- anchor. Public rendering must follow departure_date_precision/date_note.
INSERT INTO profiles (
  slug, name, company, role, departure_date, departure_date_precision,
  effective_departure_date, departure_date_note, seo_description, stated_reason,
  departure_context, status, departure_type, motive_evidence,
  headline_counted, motive_quote, claim_status, last_reviewed_at, reviewer
)
VALUES
  (
    'alex-turner',
    'Alex Turner',
    'Google',
    'Research Scientist, Scalable Alignment (Google DeepMind)',
    '2026-06-01',
    'month',
    NULL,
    'Resigned in June 2026; the exact day is not publicly documented. Turner published his account of the departure on July 15, 2026.',
    'Alex Turner resigned from Google DeepMind in 2026 over a Pentagon AI agreement he said lacked binding safeguards on weapons and surveillance.',
    'Research scientist on Google DeepMind''s scalable alignment team who resigned after Google signed an agreement allowing the Pentagon to use its AI for classified work. Turner said the agreement lacked binding restrictions against autonomous weapons or mass surveillance, despite months of internal advocacy for enforceable safeguards. He wrote: “At that point, I couldn’t stay at Google in good conscience, so I left.”',
    'Turner spent more than two years at Google DeepMind working on AI safety and scalable alignment. In his first-person account, he described trying to prevent Google from accepting an “any lawful use” classified military agreement without binding safeguards, drafting a proposed red-line and oversight framework, and escalating the proposal through senior leadership. After Google signed the agreement, Turner concluded that its language concerning autonomous weapons and mass surveillance was aspirational rather than binding and resigned without moving directly to another frontier AI laboratory.',
    'published',
    'resigned',
    'direct',
    true,
    'At that point, I couldn’t stay at Google in good conscience, so I left.',
    'uncontested',
    '2026-08-07',
    'editorial remediation (brief 2026-07-22)'
  ),
  (
    'rene-mayrhofer',
    'René Mayrhofer',
    'Google',
    'Principal Software Engineer, Android Security',
    '2026-05-18',
    'day',
    '2026-08-31',
    'Mayrhofer''s resignation letter was dated May 18, 2026. He remains employed through August 31, 2026, while serving his notice period, and said he would immediately stop any AI work that could fall under the Pentagon agreement.',
    'René Mayrhofer resigned from Google in 2026 over its Pentagon AI agreement, citing military use, surveillance, and a lack of internal debate.',
    'Principal software engineer for Android security and former director of Android Platform Security who resigned after Google agreed to provide AI for classified Pentagon use. Mayrhofer, a self-described pacifist, said the agreement could enable offensive military applications or mass surveillance and criticized the lack of internal debate or communication around the decision. He wrote that Google’s direction left him “with the only choice to resign.”',
    'Mayrhofer joined Google in 2017 as Director of Android Platform Security and later moved to a part-time principal software engineer role after returning to Austria. In his public farewell note, he contrasted Google''s earlier restrictions on weapons and surveillance applications with its new classified military AI agreement and said the change was neither debated nor communicated internally. He also criticized what he described as the company''s retreat from its carbon-neutral goals, but identified the military agreement and his pacifist principles as the reasons his resignation had become unavoidable.',
    'published',
    'resigned',
    'direct',
    true,
    'Given Google’s top-level management direction and recent doubling-down, this unfortunately leaves me with the only choice to resign.',
    'uncontested',
    '2026-08-07',
    'editorial remediation (brief 2026-07-22)'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  role = EXCLUDED.role,
  departure_date = EXCLUDED.departure_date,
  departure_date_precision = EXCLUDED.departure_date_precision,
  effective_departure_date = EXCLUDED.effective_departure_date,
  departure_date_note = EXCLUDED.departure_date_note,
  seo_description = EXCLUDED.seo_description,
  stated_reason = EXCLUDED.stated_reason,
  departure_context = EXCLUDED.departure_context,
  status = EXCLUDED.status,
  departure_type = EXCLUDED.departure_type,
  motive_evidence = EXCLUDED.motive_evidence,
  headline_counted = EXCLUDED.headline_counted,
  motive_quote = EXCLUDED.motive_quote,
  claim_status = EXCLUDED.claim_status,
  last_reviewed_at = EXCLUDED.last_reviewed_at,
  reviewer = EXCLUDED.reviewer;

INSERT INTO profile_sources (profile_id, url, title, platform, source_type, published_date)
SELECT p.id, v.url, v.title, v.platform, v.source_type, v.published_date::date
FROM profiles p
JOIN (VALUES
  ('alex-turner', 'https://turntrout.com/why-i-left-google-deepmind', 'Why I Left Google DeepMind', 'The Pond', 'first_party', '2026-07-15'),
  ('alex-turner', 'https://www.businessinsider.com/google-deepmind-ai-researcher-resign-military-contract-pentagon-2026-7', 'A DeepMind researcher resigned over its AI military deal: ''I couldn’t stay at Google in good conscience''', 'Business Insider', 'reporting', '2026-07-15'),
  ('rene-mayrhofer', 'https://www.mayrhofer.eu.org/post/leaving-google/', 'Why I’m Forced to Say Farewell: Google Management Has Lost Its Moral Compass', 'René Mayrhofer', 'first_party', NULL),
  ('rene-mayrhofer', 'https://www.businessinsider.com/google-director-resigned-pentagon-ai-deal-military-artificial-intelligence-gemini-2026-6', 'Google director resigns, citing its military deals: ''Management has lost its moral compass''', 'Business Insider', 'reporting', '2026-06-11')
) AS v(slug, url, title, platform, source_type, published_date)
  ON p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM profile_sources ps
  WHERE ps.profile_id = p.id AND ps.url = v.url
);

INSERT INTO profile_concern_tags (profile_id, concern_tag_id)
SELECT p.id, ct.id
FROM profiles p
JOIN concern_tags ct ON ct.slug IN (
  'military-applications', 'inadequate-oversight', 'lack-of-transparency'
)
WHERE p.slug IN ('alex-turner', 'rene-mayrhofer')
ON CONFLICT DO NOTHING;

INSERT INTO publications (
  profile_id, title, url, publication_type, publisher, published_date,
  published_date_precision, last_updated_at, abstract
)
SELECT p.id, v.title, v.url, v.publication_type, v.publisher,
  v.published_date::date, v.published_date_precision, v.last_updated_at::date,
  v.abstract
FROM profiles p
JOIN (VALUES
  (
    'alex-turner',
    'Why I Left Google DeepMind',
    'https://turntrout.com/why-i-left-google-deepmind',
    'essay',
    'The Pond',
    '2026-07-15',
    'day',
    '2026-08-02',
    'Turner''s first-person account of his resignation from Google DeepMind after Google signed an agreement allowing the Pentagon to use its AI for classified purposes. He describes months of internal advocacy, including a proposed red-line and oversight framework intended to preserve meaningful human authority over military AI and prohibit mass-surveillance uses. Turner argues that the agreement''s restrictions were aspirational rather than binding and that Google retained no right to veto lawful government operational decisions. He says the decision made it impossible for him to remain at the company in good conscience.'
  ),
  (
    'rene-mayrhofer',
    'Why I’m Forced to Say Farewell: Google Management Has Lost Its Moral Compass',
    'https://www.mayrhofer.eu.org/post/leaving-google/',
    'resignation_letter',
    'Self-published',
    '2026-06-01',
    'month',
    '2026-06-15',
    'Mayrhofer''s public farewell note explaining his decision to resign from Google after the company entered a classified AI agreement with the U.S. Department of Defense. He contrasts the agreement with Google''s earlier restrictions on weapons and surveillance applications and argues that its terms could allow AI to support offensive warfare or mass surveillance. A self-described pacifist, Mayrhofer says the company''s change in direction was imposed without meaningful internal debate or communication and was incompatible with his ethical principles. He also criticizes Google''s environmental direction. His Google employment is scheduled to end on August 31, 2026.'
  )
) AS v(slug, title, url, publication_type, publisher, published_date, published_date_precision, last_updated_at, abstract)
  ON p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM publications pub
  WHERE pub.profile_id = p.id AND pub.url = v.url
);

-- Keep the legacy realtime row aligned for clients that receive an update
-- between server renders. Values are derived from the canonical profile rows.
UPDATE ticker_stats
SET total_count = (
      SELECT count(*) FROM profiles WHERE status = 'published'
    ),
    ninety_day_count = (
      SELECT count(*)
      FROM profiles
      WHERE status = 'published'
        AND departure_date >= current_date - interval '90 days'
    ),
    updated_at = now();
