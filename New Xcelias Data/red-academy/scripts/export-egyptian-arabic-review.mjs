import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {EGYPTIAN_ARABIC_REVIEW_COPY} from '../public/modules/egyptian-arabic.mjs';
import {studioLibrary,studioQuiz} from '../server/activity-studio.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escapeCell=value=>String(value).replaceAll('|','\\|').replaceAll('\r',' ').replaceAll('\n','<br>');
const inventory={...EGYPTIAN_ARABIC_REVIEW_COPY};
const add=(english,arabic)=>{if(english&&arabic)inventory[english]=arabic;};
for(const item of studioLibrary()){
 const activity=studioQuiz(item.id);
 for(const key of ['title','category','description'])add(activity[key],activity.arabic?.[key]);
 for(const question of activity.questions){
  for(const key of ['prompt','hint','explanation'])add(question[key],question.arabic?.[key]);
  question.options.forEach((option,index)=>add(option,question.arabic?.options?.[index]));
 }
 for(const card of activity.study_cards||[])for(const key of ['front','back'])add(card[key],card.arabic?.[key]);
}
const rows=Object.entries(inventory)
 .sort(([left],[right])=>left.localeCompare(right,'en'))
 .map(([english,egyptian])=>`| ${escapeCell(english)} | ${escapeCell(egyptian)} |`);
const document=[
 '# Egyptian Arabic copy review',
 '',
 'This is the fixed, curated English-to-Egyptian-Arabic copy inventory used by the RED Academy Activities Studio. Wording aims for clear, respectful Egyptian classroom and real-estate sales language—not Modern Standard Arabic or literal machine translation.',
 '',
 'Custom trainer-authored activities use the paired Arabic fields in the builder. AI-generated custom challenges receive English and a separately authored Egyptian Arabic edition. Temporary AI role-plays and session prompts are drafted in the language selected in the Studio. Those generated drafts are reviewed by the trainer before use.',
 '',
 'The table below contains the fixed UI phrases and all curated quiz, challenge, recall-card, sequence, and ready-made role-play content.',
 '',
 '| English | Egyptian Arabic |',
 '| --- | --- |',
 ...rows,
 '',
 ].join('\n');

await writeFile(path.join(root,'docs','EGYPTIAN_ARABIC_COPY_REVIEW.md'),document,{encoding:'utf8'});
console.log(`Wrote ${rows.length} bilingual copy pairs to docs/EGYPTIAN_ARABIC_COPY_REVIEW.md`);
