import fs from 'node:fs';
/** Small dependency-free loader. Process environment wins over both files. */
export function loadEnv(){
 for(const filename of ['.env.local','.env'])if(fs.existsSync(filename)){
  for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){
   const match=line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
   if(match&&process.env[match[1]]===undefined)process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
 }
}
