import re

filepath = r"j:\Excelias V2\Activites ( WorkSpace )\RedMaterialsAcademy\app.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

total_before = content.count('styles.optionBtn')
print(f"Total optionBtn occurrences before: {total_before}")

changes = 0

# ===========================================================================
# GROUP A: Standard MCQ .map() — options array with correct/incorrect state
# Pattern:
# <button
#   key={idx}
#   onClick={...}
#   style={{
#     ...styles.optionBtn,
#     [optional extra props]
#     ...(showFeedback && option === CORRECT ? styles.correctBtn : {}),
#     ...(showFeedback && selected === option && option !== CORRECT ? styles.incorrectBtn : {})
#   }}
# >
# Correct refs: q.answer, option.correct, scenario.correctIndex, question.correctIndex, response.correct, q.mistakeIndex, q.isGood
# ===========================================================================

# Match the full style block for standard MCQ (correct ref is captured)
def make_mcq_pattern(correct_ref_re):
    # correct_ref_re like r'q\.answer', r'option\.correct', etc.
    return re.compile(
        r'(style=\{\{)(\s*\n\s*)'
        r'\.\.\.styles\.optionBtn,\s*\n'
        r'((?:[ \t]+\w+[^:]*:[^,\n]+,\s*\n)*?)'   # optional extra props before state checks
        r'\s*\.\.\.\(showFeedback && option === (' + correct_ref_re + r') \? styles\.correctBtn : \{\}\),\s*\n'
        r'\s*\.\.\.\(showFeedback && selected === option && option !== \4 \? styles\.incorrectBtn : \{\}\)'
        r'((?:,\s*\n[ \t]+\w+[^:]*:[^,\n]+)*?)'   # optional trailing comma'd props
        r'\s*\n(\s*\}\})',
        re.MULTILINE
    )

mcq_correct_refs = [
    r'q\.answer',
    r'option\.correct',
    r'q\.mistakeIndex', 
    r'q\.isGood',
    r'response\.correct',
    r'q\.correct',
    r'q\.oddOne',
]

for ref_pattern in mcq_correct_refs:
    pat = make_mcq_pattern(ref_pattern)
    
    def do_replace(m, ref=None):
        extra_before = m.group(3).strip()
        correct_ref = m.group(4)
        extra_after = m.group(5).strip().lstrip(',').strip()
        extra_style = ', '.join(filter(None, [extra_before, extra_after]))
        if extra_style:
            return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}} style={{{{ {extra_style} }}}}'
        return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}}'
    
    new_content, n = pat.subn(do_replace, content)
    if n > 0:
        print(f"  {ref_pattern}: {n} replacements")
        changes += n
        content = new_content

# ===========================================================================
# GROUP B: correctIndex pattern — some activities use index-based correct answer
# ...(showFeedback && idx === q.correctIndex ? styles.correctBtn : {}),
# ...(showFeedback && selected === idx && idx !== q.correctIndex ? styles.incorrectBtn : {})
# ===========================================================================

idx_correct_refs = [
    r'question\.correctIndex',
    r'scenario\.correctIndex', 
    r'correctIdx',
]

def make_idx_pattern(correct_ref_re):
    return re.compile(
        r'(style=\{\{)(\s*\n\s*)'
        r'\.\.\.styles\.optionBtn,\s*\n'
        r'((?:[ \t]+\w+[^:]*:[^,\n]+,\s*\n)*?)'
        r'\s*\.\.\.\(showFeedback && idx === (' + correct_ref_re + r') \? styles\.correctBtn : \{\}\),\s*\n'
        r'\s*\.\.\.\(showFeedback && selected === idx && idx !== \4 \? styles\.incorrectBtn : \{\}\)'
        r'((?:,\s*\n[ \t]+\w+[^:]*:[^,\n]+)*?)'
        r'\s*\n(\s*\}\})',
        re.MULTILINE
    )

for ref_pattern in idx_correct_refs:
    pat = make_idx_pattern(ref_pattern)
    
    def do_replace_idx(m):
        extra_before = m.group(3).strip()
        correct_ref = m.group(4)
        extra_after = m.group(5).strip().lstrip(',').strip()
        extra_style = ', '.join(filter(None, [extra_before, extra_after]))
        if extra_style:
            return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, idx)}} style={{{{ {extra_style} }}}}'
        return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, idx)}}'
    
    new_content, n = pat.subn(do_replace_idx, content)
    if n > 0:
        print(f"  idx/{ref_pattern}: {n} replacements")
        changes += n
        content = new_content

total_after = content.count('styles.optionBtn')
print(f"\nTotal optionBtn occurrences: {total_before} -> {total_after} (reduced by {total_before - total_after})")
print(f"Total changes: {changes}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! File written.")
