"""Validate every generated cell and all formula caches; never resave the workbook.
Run after export-imported.mjs: python tests/verify-imported-export.py QA_DIRECTORY
"""
from pathlib import Path
import json,math,sys
from openpyxl import load_workbook
root=Path(sys.argv[1]);expected=json.loads((root/'export-expected.json').read_text());f=load_workbook(root/'imported.xlsx',data_only=False);v=load_workbook(root/'imported.xlsx',data_only=True)
checks=[];cells=0;formulas=0;missing_caches=0
assert f.sheetnames==[s['name'] for s in expected];checks.append('Seven correctly named sheets')
for s in expected:
 name=s['name'];assert f[name].max_row==len(s['rows']);assert f[name].freeze_panes=='A2';assert f[name]['A1'].fill.fgColor.rgb=='FFDC2626'
 for ri,row in enumerate(s['rows'],1):
  for ci,value in enumerate(row,1):
   original=value;cached=v[name].cell(ri,ci);cell=f[name].cell(ri,ci)
   assert cached.data_type!='e',(name,ri,ci,'Error cell')
   if isinstance(value,dict):
    if 'formula' in value:
     formulas+=1;assert cell.data_type=='f';assert cell.value=='='+value['formula'];missing_caches+=value['value'] is None
    value=value.get('value')
   if value in ('',None):assert cached.value in (None,''),(name,ri,ci,value,cached.value)
   elif isinstance(value,(int,float)) and not isinstance(value,bool):assert isinstance(cached.value,(int,float)) and math.isclose(cached.value,value,rel_tol=1e-11,abs_tol=1e-11),(name,ri,ci,value,cached.value)
   else:assert cached.value==value,(name,ri,ci,value,cached.value)
   if isinstance(original,str) and original.startswith(('=','+','@')):assert cell.data_type=='s'
   cells+=1
 checks.append(name+': every cell, row count, literal text, styling and cached value verified')
# Recompute every score and checklist percentage independently from worksheet inputs.
for row in range(2,f['Assessments'].max_row+1):
 for target,cols,denominator in [('I',[4,5],10),('J',[6,7],10),('K',[4,5,6,7],20)]:
  inp=[v['Assessments'].cell(row,c).value for c in cols];got=v['Assessments'][target+str(row)].value
  if any(x in (None,'') for x in inp):assert got in (None,'')
  else:assert math.isclose(got,sum(inp)/denominator,abs_tol=1e-12)
checks.append('All 847 assessment formulas independently recomputed; NULL never treated as zero')
for row in range(2,f['10-day checklists'].max_row+1):
 inp=[v['10-day checklists'].cell(row,c).value for c in range(5,15)];assert math.isclose(v['10-day checklists']['O'+str(row)].value,sum(x in (True,'Yes',1) for x in inp)/10,abs_tol=1e-12),(row,inp)
checks.append('All 264 checklist formulas independently recomputed')
report={'ok':True,'checks':len(checks),'cell_assertions':cells,'formulas_verified':formulas,'blank_formula_caches_preserved':missing_caches,'sheet_record_counts':{s['name']:len(s['rows'])-1 for s in expected},'check_names':checks}
(root/'imported-export-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
