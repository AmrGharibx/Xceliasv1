import {ApiError} from './validation.mjs';

const pulseText=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(value);

export function validateActivityLivePulse(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'Set up a valid class pulse.');
 if(body.mode!==undefined&&body.mode!=='pulse')throw new ApiError(400,'Choose a supported live-room mode.');
 const title=typeof body.title==='string'?body.title.trim():'',prompt=typeof body.prompt==='string'?body.prompt.trim():'';
 const options=body.options;
 if(!pulseText(title,3,90)||!pulseText(prompt,5,240)||!Array.isArray(options)||options.length<2||options.length>5||options.some(option=>!pulseText(option,1,80)))throw new ApiError(400,'Add a short pulse title, a clear question, and two to five answer choices.');
 const normalized=options.map(option=>option.trim());
 if(new Set(normalized.map(option=>option.toLocaleLowerCase())).size!==normalized.length)throw new ApiError(400,'Each class-pulse choice must be different.');
 if(![0,20,30,45].includes(body.timer_duration))throw new ApiError(400,'Choose a valid pulse timer.');
 const arabicInput=body.arabic??{};
 if(!arabicInput||typeof arabicInput!=='object'||Array.isArray(arabicInput))throw new ApiError(400,'Enter a valid Egyptian Arabic pulse edition.');
 const optional=(value,max,label)=>{if(value===undefined)return '';if(typeof value!=='string'||value.trim().length>max||/[\u0000-\u001f\u007f]/.test(value))throw new ApiError(400,`Enter valid ${label}.`);return value.trim();};
 if(arabicInput.options!==undefined&&(!Array.isArray(arabicInput.options)||arabicInput.options.length!==normalized.length))throw new ApiError(400,'Add one Egyptian Arabic pulse choice for each English choice.');
 const arabicTitle=optional(arabicInput.title,90,'Egyptian Arabic pulse name'),arabicPrompt=optional(arabicInput.prompt,240,'Egyptian Arabic class question'),arabicOptions=(arabicInput.options||[]).map((option,index)=>optional(option,80,`Egyptian Arabic choice ${String.fromCharCode(65+index)}`));
 const arabicQuestion={prompt:arabicPrompt,options:arabicOptions};
 const activity={
  id:'session-pulse',mode:'pulse',title,category:'Class pulse',level:'Whole class',duration_minutes:1,
  description:'A one-question, anonymous, ungraded classroom check-in. Responses are temporary and expire with the room.',
  questions:[{id:'pulse-1',prompt,options:normalized,answer:null,explanation:'',...(arabicPrompt||arabicOptions.some(Boolean)?{arabic:arabicQuestion}:{})}],
  team_names:['Whole class'],
 };
 if(arabicTitle)activity.arabic={title:arabicTitle};
 activity.timer_duration=body.timer_duration;
 return activity;
}
