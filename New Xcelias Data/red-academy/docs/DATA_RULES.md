# RED Academy v3 / Data and calculation rules

## Source-aware relational model

A trainee row is one enrollment/profile, not a universal unique person identity. All assigned daily/checklist/assessment rows reference an enrollment in their explicit batch. Composite foreign keys prevent accidental cross-batch links. A genuinely unassigned historical record can have a NULL trainee, with its actual batch still retained. Normal editing cannot silently reassign these identities.

Companies contain the 55 real names found in the supplied data. Blank company values remain NULL. Assessment company and reported attendance/absence are source snapshots and remain separate from current trainee company and computed daily totals.

New batches default to ten operator-selected weekdays, but may use any schedule of 1-366 distinct session dates; enrolled native schedules are protected. Imported batches may retain NULL dates, status or capacity, observed dates, multiple periods, or an incomplete calendar. Old dates are not used to guess that a batch is Completed. Recording a new actual attendance date on an imported batch adds only that chosen date.

Original Notion pages, properties, relationship IDs, raw text and hashes are stored in `source_records`. `import_runs` records the import digest/reconciliation, and `import_reviews` records decisions/discrepancies. These are private APIs, not static web files. They do not cascade away when operational records are deleted. Working edits do not rewrite the original archive.

## Attendance and missing values

An explicit Present or Tour Day status counts as present; Tour Day remains separately identifiable as a subset of present. Mark a trainee who misses the tour as Absent. Off Day is excluded from the attendance rate. An unknown/unrecorded day remains unknown, not absence. The attendance rate is (Present + Tour Day) / (Present + Tour Day + Absent), or not available if the denominator is zero. Unassigned blank-status records do not mark a named trainee as recorded.

Daily rollups count the canonical daily rows directly, not once for every overlapping checklist period. Archived source rollup strings remain available even when they contain entry titles instead of numeric counts.

Timestamps use UTC storage and Africa/Cairo display/calculation. Explicit source GMT offsets were respected. Date-only source values do not invent a time. Source discrepancies remain flagged; editing an unrelated note preserves the original conflicting timestamps. New or deliberately corrected times pass chronology/date/status validation.

Calculated lateness starts strictly after 11:00:00 Cairo time. `minutesLate` is the number of whole minutes after 11:00; 11:00:30 is late but zero complete minutes. No arrival gives zero minutes and false calculated lateness. The manual late flag is independent. This follows the requested strictly-after threshold rather than dropping the timestamp's seconds.

## Live session checklist and archived source checklists

The operational session checklist is a read-only projection of each trainee's batch session dates and canonical daily attendance. Present and Tour Day are checked, but use different visual states. Absent is shown distinctly; Off Day and future sessions do not count toward due-session progress. Unrecorded sessions remain neutral and never become absences. Progress is attended due sessions divided by due scheduled sessions; duplicate/conflicting source rows are marked for review rather than guessed.

Legacy `attendance_10day` records, including their ten stored booleans, reports and source status, remain untouched as historical snapshots and are not used to calculate current session attendance. Multiple real source periods are retained, including both Batch 30 periods. New daily attendance updates the operational checklist immediately without a second write or separate checkbox state.

## Assessments and analytical eligibility

Each supplied skill is 0-5. Missing imported skills remain NULL; an explicitly recorded zero remains zero. Technical = (Mapping + Product Knowledge) / 10 * 100. Soft = (Presentability + Soft Skills) / 10 * 100. Overall = sum of four skills / 20 * 100. A group requiring a missing input remains unavailable rather than assuming zero. Excel uses equivalent blank-guarded live formulas with checked cached values.

Original outcome labels are preserved; importing or opening the form does not recalculate them. For new/corrected results the suggested thresholds are Aced >=95%, Excellent >=85%, Very Good >=75%, Good >=65%, Needs Improvement >=50%, otherwise Failed. An instructor may retain/choose a different recorded outcome.

Every source assessment remains in the register. Complete, individually evaluated records are eligible for graded averages. Incomplete, explicitly not-assessed, shared, unassigned and ambiguous duplicate results are excluded. Explicitly not-assessed source zeros/Failed labels are retained as original values, not promoted to a new personal failing evaluation. Source state and analytical inclusion are visible in record details/exports.

The one Batch 41 shared record has 23 original person links; its score remains one shared result, with no fabricated individual owner. Editing an assessment stores its previous working snapshot in `assessment_history`, including an unassigned/shared previous snapshot. All history remains in the database; the workspace snapshot loads the newest 200 revisions and 100 administrator audit items.

## Edits, export and retention

Server validation and SQLite constraints run inside version-checked transactions. A stale update fails rather than overwriting a colleague. Original source metadata cannot be forged or erased through mutation payloads. Historical forms preserve unknown values; native new records remain subject to stricter requirements.

Workbook/CSV filters follow batch and company scope. The full attendance register exports all saved dates in scope; daily-entry CSV uses its selected date. JSON export is the loaded workspace state, not every private source page or all account/history tables. A database backup is required for full recovery.

Normal deletion removes current linked records but retains source archives and historical snapshots/audit information. It is not an all-history data-erasure command. Plan retention and access procedures separately. The source importer never overwrites an existing workspace; repeating the same source import is a no-op, not a reset of later edits.
