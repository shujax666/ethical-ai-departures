-- Adjudication of the seven reviewed tracker records (Prediction Tracker
-- Review, 2026-07-22). Scope: Hinton (2), Sutskever (1), Leike (2),
-- Aschenbrenner (2). The six unreviewed records (Kokotajlo x4, Saunders,
-- Hitzig) remain under_review pending the next batch. Prior adjudication
-- history is preserved in review_notes; nothing is deleted.

-- PRED-01 — Hinton, disinformation: open forecast; verbatim quote repaired;
-- prospective criteria adopted (dated).
UPDATE predictions SET
  record_kind = 'prediction',
  status = 'open',
  source_quote = $q$They want to use them for winning wars or manipulating electorates.$q$,
  is_verbatim_quote = true,
  source_url = 'https://www.technologyreview.com/2023/05/02/1072528/geoffrey-hinton-google-why-scared-ai/',
  predicted_date = '2023-05-02',
  resolution_criteria = $q$Confirm only if credible independent evidence documents both: (1) an independently documented campaign distributing AI-generated false or misleading political content to at least one million people, or a comparably large national audience; and (2) statistically credible field, platform, or quasi-experimental evidence of attitude or behavior change attributable to that content, rather than reach or engagement alone.$q$,
  criteria_adopted_at = '2026-07-22',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  review_notes = $q$2026-07-22 adjudication: kept open. Prior displayed quote could not be located in linked sources; replaced with verbatim MIT Technology Review excerpt (May 2, 2023). Lab evidence establishes persuasion capacity and deployment at scale is documented, but no single campaign yet satisfies both scale and measured persuasion (see Knight First Amendment Institute review). History: confirmed 2024-11-01, re-opened 2026-07-22 by remediation brief, criteria adopted this review.$q$
WHERE title = 'AI systems will generate persuasive disinformation at scale';

-- PRED-02 — Hinton, existential risk: corrected to a probabilistic forecast
-- with the reported 30-year horizon; excluded from binary scoring by type.
UPDATE predictions SET
  title = 'Geoffrey Hinton estimated a 10-20% chance of AI-caused human extinction within 30 years',
  record_kind = 'probabilistic_forecast',
  status = 'open',
  source_quote = $q$Estimated a 10-20% chance that AI causes human extinction within the next three decades (paraphrase of BBC Radio 4 remarks as reported by The Guardian, Dec. 27, 2024).$q$,
  is_verbatim_quote = false,
  source_url = 'https://www.theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years',
  predicted_date = '2024-12-27',
  resolution_deadline = '2054-12-31',
  criteria_adopted_at = '2026-07-22',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  review_notes = $q$2026-07-22 adjudication: prior record conflated a 5-20 year timeline with the extinction-probability estimate, and its quote could not be verified. Corrected to the reported 10-20% / 30-year estimate (Guardian, Dec. 27, 2024). Probabilistic forecasts are displayed with probability and horizon and never feed a binary accuracy percentage.$q$
WHERE title = 'AI could pose existential risk to humanity within 5-20 years';

-- PRED-03 — Sutskever & Leike, RLHF scaling: open forecast; joint attribution;
-- verbatim excerpt; resolution criteria adopted (dated).
UPDATE predictions SET
  title = 'Current human-feedback alignment methods will not scale to superintelligence',
  record_kind = 'prediction',
  status = 'open',
  description = 'Jointly published by Ilya Sutskever and Jan Leike in OpenAI''s Superalignment announcement; attributed to both.',
  source_quote = $q$Our current alignment techniques will not scale to superintelligence.$q$,
  is_verbatim_quote = true,
  source_url = 'https://openai.com/index/introducing-superalignment/',
  predicted_date = '2023-07-05',
  resolution_criteria = $q$Resolve only after all of the following exist: (1) a documented system meeting a predeclared, broad superhuman-capability threshold; (2) a serious attempt to supervise it using human-feedback methods alone; (3) evidence that those methods fail to provide reliable supervision; and (4) evidence that an additional method materially addresses that failure.$q$,
  criteria_adopted_at = '2026-07-22',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  review_notes = $q$2026-07-22 adjudication: kept open; prior displayed quote was not verbatim in the source; replaced with exact excerpt and corrected to joint Sutskever/Leike attribution. The forecast's test condition (a broadly superhuman system) has not been met.$q$
WHERE title = 'Superhuman AI will require alignment techniques beyond RLHF';

-- PRED-04 — Leike, safety culture: contemporaneous claim, out of scoring.
UPDATE predictions SET
  record_kind = 'contemporaneous_claim',
  status = 'not_applicable',
  is_verbatim_quote = true,
  source_url = 'https://x.com/janleike/status/1791498184671605209',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  resolution_date = NULL,
  resolution_outcome = NULL,
  resolution_rationale = NULL,
  review_notes = $q$2026-07-22 adjudication: this is Leike's May 2024 assessment of the preceding years, not a forecast; reclassified as a contemporaneous claim and removed from prediction scoring. Retracted prior rationale (which had been: "Multiple senior safety researchers departed OpenAI through 2024-2025 citing safety deprioritization") — it also implied Sutskever publicly cited safety deprioritization, which his departure statement did not say. History: confirmed 2024-11-01; reclassified claim 2026-07-22.$q$
WHERE title = 'OpenAI safety culture has taken a back seat to product launches';

-- PRED-05 — Leike, alignment failures: editorial synthesis, confirmation removed.
UPDATE predictions SET
  record_kind = 'editorial_synthesis',
  status = 'not_applicable',
  is_verbatim_quote = true,
  source_url = 'https://x.com/janleike/status/1791498184671605209',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  resolution_date = NULL,
  resolution_outcome = NULL,
  resolution_rationale = NULL,
  review_notes = $q$2026-07-22 adjudication: the title is an editorial synthesis, not a quotation; the source warns that building smarter-than-human systems is dangerous but does not define alignment failure, set a threshold or deadline, or make the exact causal claim. The 2026-07-08 confirmation grouped distinct phenomena (Grok outputs, image-generation harms, a model-behavior evaluation, and lawsuits) whose linked evidence supported only part of the collection; confirmation removed. History: confirmed 2026-01-26 (resolved by editorial review Jul 2026, reviewed by editor 2026-07-08); reclassified editorial synthesis 2026-07-22. Evidence links preserved on the record.$q$
WHERE title = 'Without adequate oversight, alignment failures will occur in deployed systems';

-- PRED-06 — Aschenbrenner, lab security: contemporaneous claim.
UPDATE predictions SET
  record_kind = 'contemporaneous_claim',
  status = 'not_applicable',
  source_quote = $q$Argued that leading labs' security was far from sufficient to protect model weights from state actors (paraphrase of "Situational Awareness: The Decade Ahead," June 2024).$q$,
  is_verbatim_quote = false,
  source_url = 'https://situational-awareness.ai/',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  review_notes = $q$2026-07-22 adjudication: a current-state assessment at time of writing, not a forecast; prior displayed quote was not verbatim and is replaced with a labeled paraphrase. The essay's distinct future predictions (espionage, government action) may be tracked separately with original language and criteria.$q$
WHERE title = 'Leading AI lab security is inadequate to protect model weights';

-- PRED-07 — Aschenbrenner, government preparedness: contemporaneous assessment.
UPDATE predictions SET
  record_kind = 'contemporaneous_claim',
  status = 'not_applicable',
  source_quote = $q$Argued the U.S. government was dangerously unprepared for transformative AI, with national-security implications rivaling nuclear weapons (paraphrase of "Situational Awareness: The Decade Ahead," June 2024).$q$,
  is_verbatim_quote = false,
  source_url = 'https://situational-awareness.ai/',
  under_review = false,
  reviewed_by = 'Prediction Tracker Review, 2026-07-22',
  review_notes = $q$2026-07-22 adjudication: a present-tense, partly normative judgment with no observable confirmation threshold; prior displayed quote combined site summary with the essay's analogies and is replaced with a labeled paraphrase. The essay's actual forecast of a U.S. government AGI project circa 2027-2028 may be added later as a new, separately sourced record.$q$
WHERE title = 'US government is dangerously unprepared for transformative AI';

-- Guards from the review's acceptance checks (added after data correction):
-- a confirmed record must carry a resolution date, reviewer, and evidence;
-- non-forecast types can never be confirmed.
-- Records not included in this adjudication batch remain visibly pending
-- review rather than retaining a legacy resolved status that cannot satisfy
-- the new review requirements.
UPDATE predictions SET status = 'pending_review'
WHERE under_review = true;

ALTER TABLE predictions ADD CONSTRAINT predictions_confirmed_requires_review
  CHECK (status != 'confirmed'
         OR (resolution_date IS NOT NULL
             AND reviewed_by IS NOT NULL
             AND resolution_evidence_url IS NOT NULL));
ALTER TABLE predictions ADD CONSTRAINT predictions_nonforecast_never_confirmed
  CHECK (record_kind IN ('prediction', 'probabilistic_forecast')
         OR status IN ('open', 'pending_review', 'not_applicable'));
