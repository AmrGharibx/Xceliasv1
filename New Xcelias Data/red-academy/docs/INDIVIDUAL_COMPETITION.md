# Individual live competition

1. Open Activities Studio and choose **Host live** on a challenge.
2. Select **Individuals · everyone competes**. Phone participation is enabled automatically; team names disappear.
3. Start the room and show the shared QR code or invite link.
4. Each trainee joins with a unique class nickname. No Academy login or team selection is needed. The room supports up to 80 participants, including a 20-person batch arriving together.
5. Trainees answer privately. The trainer reveals the answer and coaching explanation for everyone, then advances the round.
6. Each correct answer earns 100 temporary points plus 25 per previous consecutive correct answer, capped at an extra 100. Wrong or missed answers break the streak. Equal point totals share a rank; the complete class leaderboard includes everyone, not just the top five.
7. Finish, replay, resume, or end the room using the existing controls. Reloading a trainee's page restores their seat in that browser tab. Rooms expire after four hours.

These are classroom nicknames and temporary game results, not authenticated trainee identities or formal assessment marks. Live games do not change attendance, grades, assignments, or Academy XP. Team games and anonymous class pulses remain available.

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

Local SQLite and the Supabase Academy function use the same competition validation, bilingual activity, and tie-ranking helper. Competition mode is stored in the existing immutable room deck snapshot. For storage compatibility, individual seats use one neutral internal group; only separate player scores determine the individual leaderboard. No database migration or operational-data import is required. Old room snapshots default to team mode.

Deploy the Academy function before publishing the frontend. Verify with:

```sh
node --test tests/*.test.mjs
python tests/trainer_activities_browser.py --competition-only
```

Both commands use isolated temporary databases, not the live company workspace.
