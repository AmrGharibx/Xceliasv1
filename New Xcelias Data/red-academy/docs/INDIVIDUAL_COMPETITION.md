# Individual live competition

1. Open Activities Studio and choose **Host live** on a challenge.
2. Select **Individuals · everyone competes**. Phone participation is enabled automatically; team names disappear.
3. Start the room and show the shared QR code or invite link.
4. Each trainee joins with a unique class nickname. No Academy login or team selection is needed. The room supports up to 80 participants; a 40-person batch is tested end to end.
5. Trainees answer privately. The trainer reveals the answer and coaching explanation for everyone, then advances the round.
6. Each correct answer earns 100 temporary points plus 25 per previous consecutive correct answer, capped at an extra 100. Wrong or missed answers break the streak. Equal point totals share a rank; the complete class leaderboard includes everyone, not just the top five.
7. Finish, replay, resume, or end the room using the existing controls. Reloading a trainee's page restores their seat in that browser tab. Rooms expire after four hours.

These are classroom nicknames, not authenticated identities or formal assessment marks. Nickname-only games remain temporary. Batch-linked games save trainer-confirmed activity scores and Academy XP, with optional dated session attendance. Team games and anonymous class pulses remain available.

## Optional batch-linked results

1. In **Host live**, choose **Link results to a batch**. Phone joining is required; teams and individuals both work.
2. Share the room's QR code. A valid invitation displays eligible active trainee names and company labels from the selected batch only, never contact details, attendance or grades. Do not publish this invite outside the class.
3. Trainees choose their real names and may add unique nicknames. A blank nickname uses their name, shortened to 24 characters. If a nickname is taken, choose another. Reloading restores the existing seat in the same browser tab.
4. Run and finish all rounds. The trainer checks the name matches, corrects any mistaken claims and can select **Do not save** for unverified participants. Duplicate target profiles must be resolved. Selecting a name is not identity verification; no phone selection alone writes to a profile.
5. Optionally choose a scheduled **Session attendance** date, then **Confirm matches & save to profiles**. Each server-graded correct answer awards 100 Academy XP, separate from streak-inclusive game points. Only confirmed trainees who answered at least once count as present on the selected date; accuracy is not an attendance penalty. Existing attendance—including absence, tour days, arrival times and late flags—is preserved. No participation is not automatically absence. Results, XP and attendance save atomically and repeated requests do not duplicate them. A saved room cannot replay; open a new room for another recorded game.
6. Open the trainee's usual profile to see **Live activity results**: challenge, nickname, confirmation date, correct/total, answered/total, two-decimal accuracy, game points, earned Academy XP and session attendance status. The latest 100 games are shown. The Studio XP ladder combines assigned quizzes and confirmed live games. Attendance checklists and reports already derive their totals from Daily Attendance. Formal assessment marks are not replaced by activity points.

## Assigned activity management

- A writable trainer can **Count participation as attendance** for completed assignment participants on an existing batch session date, today or earlier. The operation is idempotent and preserves existing attendance. It does not infer absences or clock times.
- Administrators and the assigning trainer see **Delete assignment** for both open and closed native quizzes/fallback activities. Confirmation names the assignment and batch. A version conflict requires refresh; deletion disables private links and removes assignment entries, scores and assignment XP from active views. It never deletes the batch, roster, existing attendance or formal grades. Linked session plans are detached, not deleted.
- A private `activity_assignment_deletions` snapshot retains the assignment, participant results and linked-plan references for administrator-assisted recovery. It is inaccessible to learners and excluded from workspace state. There is deliberately no public recovery endpoint.
- Trainer and QR/link trainee pages share the 1,400-star signature. The decorative layer cannot intercept controls; reduced motion renders a still background and hidden tabs stop animation.

Confirmed history survives automatic room expiry. Archiving a batch preserves it. Explicitly deleting an enrollment or batch deletes its linked activity history consistently with other operational records. Anonymous pulses remain completely unlinked.

## New Cairo & Property Foundations

The new built-in activity has nine bilingual rounds and three recall cards. It can be hosted live in either competition mode or assigned privately using the existing roster/link workflow.

| Round | Lesson |
| --- | --- |
| 1 | Four surrounding roads: Ring, Suez, Middle Ring, Ain Sokhna |
| 2 | Five Ring Road axes: Gamal Abdel Nasser, 90 South, Taha Hussein, Sadat, Shinzo Abe |
| 3 | Four Suez Road axes: Mostafa Kamel, Mohamed Naguib, East Rehab, 90 North |
| 4 | Two Middle Ring axes: Mohamed Bin Zayed, 90 South |
| 5 | Single-family homes and apartments, with townhouse/twin/villa and studio/bedroom/duplex examples |
| 6 | Land, residential, commercial |
| 7 | Core and shell, semi-finished, fully finished, fully furnished |
| 8 | Broker versus developer: scope, market comparison, calling purpose, client advice |
| 9 | Primary versus resale: seller, payment terms, off-plan versus ready |

Road groupings reflect the supplied trainer lesson, not an exhaustive navigation dataset. Resale cash payment is described as common, not mandatory; outstanding installments and transfer conditions must be checked. Developer project focus is not presented as a universal claim about a salesperson's knowledge.

All new lesson copy has an Egyptian Arabic edition in [the copy review](EGYPTIAN_ARABIC_COPY_REVIEW.md).

## Implementation and release

Local SQLite and the Supabase Academy function use shared validation, bilingual content, tie rankings and safe roster projections. Competition mode and the minimal batch roster are stored in the immutable room deck. Individual seats use one neutral internal group; only separate player scores determine their leaderboard. Old rooms default to team mode and remain nickname-only.

Batch-linked history requires `20261001120000_live_activity_profile_results.sql`, followed by `20261001140000_activity_outcomes_and_deletion.sql`. These additive migrations introduce private, RLS-enabled history/recovery tables and service-role-only actions. No historical business data is backfilled, seeded or replaced. Only subsequent explicit trainer confirmation can write dated attendance and XP. Local tests and builds never deploy migrations.

Release order: capture a private operational backup and unchanged-data fingerprints, apply both pending migrations, deploy the Academy function, then publish the frontend. Rollback: restore the preceding frontend/API version and leave the additive schema, history and recovery snapshots intact; do not drop these tables. Never seed a live workspace from a local database.

Deploy the Academy function before publishing the frontend. Verify with:

```sh
node --test tests/*.test.mjs
python tests/trainer_activities_browser.py --competition-only
python tests/trainer_activities_browser.py --roster-only
node tests/live_roster_postgres.mjs /absolute/path/to/pglite/dist/index.js
```

All commands use isolated temporary/in-memory databases, not the live company workspace. The optional Postgres acceptance script requires a separately installed PGlite test runtime; it never uses Supabase credentials.
