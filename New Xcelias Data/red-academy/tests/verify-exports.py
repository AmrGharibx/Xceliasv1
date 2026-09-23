"""Read the application's generated workbooks; do not resave cached formula cells.
Usage: python tests/verify-exports.py OUTPUT_DIRECTORY
Optional verification dependency: openpyxl.
"""
from pathlib import Path
import json, math, sys
from openpyxl import load_workbook
root=Path(sys.argv[1]); checks=[]
def check(name, value):
    if not value:raise AssertionError(name)
    checks.append(name)
expected=['Overview','Batches','Trainees','Daily attendance','10-day checklists','Session checklist','Assessments','Companies']
for name in ('empty','populated'):
    formulas=load_workbook(root/(name+'.xlsx'),data_only=False)
    cached=load_workbook(root/(name+'.xlsx'),data_only=True)
    check(name+' has eight named sheets',formulas.sheetnames==expected)
    check(name+' has no cached spreadsheet errors',all(cell.data_type!='e' for sheet in cached for row in sheet for cell in row))
    check(name+' freezes and styles headers',all(sheet.freeze_panes=='A2' and sheet['A1'].fill.fgColor.rgb=='FFDC2626' for sheet in formulas))
    check(name+' marks the private workspace source',cached['Overview']['B3'].value=='Internal company training system')
    if name=='empty':
        check('Empty export contains no company, enrollment or result rows',all(formulas[s].max_row==1 for s in expected[1:]))
        check('Empty attendance does not fabricate a rate',cached['Overview']['B15'].value=='Not available')
    else:
        cells=[('Assessments','I2',1.0),('Assessments','J2',0.95),('Assessments','K2',0.975),('10-day checklists','O2',0.3)]
        for sheet,cell,value in cells:
            check(sheet+' '+cell+' contains a live formula',formulas[sheet][cell].data_type=='f')
            check(sheet+' '+cell+' cache matches independent calculation',math.isclose(cached[sheet][cell].value,value))
        check('Formula-like trainee notes remain literal text',formulas['Trainees']['G2'].data_type=='s' and formulas['Trainees']['G2'].value=='=1+1')
        check('Excel arrival calculates 45 minutes late',cached['Daily attendance']['I2'].value==45)
        check('Excel manual and calculated lateness remain independent',cached['Daily attendance']['H2'].value=='No' and cached['Daily attendance']['J2'].value=='Yes')
result={'suite':'XLSX export validation with openpyxl','passed':len(checks),'failed':0,'checks':checks,'formulas_verified':4}
(root/'results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
