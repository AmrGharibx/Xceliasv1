import re

filepath = r"j:\Excelias V2\Activites ( WorkSpace )\RedMaterialsAcademy\app.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

total_before = content.count('styles.optionBtn')
print(f"Total optionBtn occurrences before: {total_before}")

# ========================================================================
# PATTERN 1: Standard MCQ map pattern (inside .map callback with 'option', 'idx')
# style={{
#   ...styles.optionBtn,
#   (optional extra style props like padding, textAlign, etc.)
#   ...(showFeedback && option === q.SOMETHING ? styles.correctBtn : {}),
#   ...(showFeedback && selected === option && option !== q.SOMETHING ? styles.incorrectBtn : {})
# }}
# Becomes:
# className={optionClass(idx, selected, q.SOMETHING, showFeedback, option)}
# (extra style props like padding/textAlign move to a separate style={{}} if needed)
# ========================================================================

# Match: the 3-line core pattern (optionBtn + correctBtn + incorrectBtn) with optional extra lines
# Uses DOTALL for multiline matching within the style block
pat1 = re.compile(
    r'style=\{\{(\s*)'
    r'\.\.\.(styles\.optionBtn),\s*\n'
    r'((?:\s+\w+:[^,\n]+,\s*\n)*?)'   # optional extra style props (padding, textAlign, etc.)
    r'\s*\.\.\.\(showFeedback && option === (q\.\w+) \? styles\.correctBtn : \{\}\),\s*\n'
    r'\s*\.\.\.\(showFeedback && selected === option && option !== \4 \? styles\.incorrectBtn : \{\}\)\s*\n'
    r'(\s*)\}\}'
)

def replace_mcq(m):
    extra_props = m.group(3).strip()
    correct_ref = m.group(4)
    if extra_props:
        # Keep extra props as a separate style override
        return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}} style={{{{{extra_props}}}}}'
    return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}}'

new_content, count1 = pat1.subn(replace_mcq, content)
print(f"Pattern 1 (standard MCQ map): {count1} replacements")

# ========================================================================
# PATTERN 2: Same but with extra props AFTER the correctBtn/incorrectBtn lines
# (some activities place padding etc. after the state checks)
# ========================================================================
content = new_content
pat2 = re.compile(
    r'style=\{\{(\s*)'
    r'\.\.\.(styles\.optionBtn),\s*\n'
    r'\s*\.\.\.\(showFeedback && option === (q\.\w+) \? styles\.correctBtn : \{\}\),\s*\n'
    r'\s*\.\.\.\(showFeedback && selected === option && option !== \3 \? styles\.incorrectBtn : \{\}\),\s*\n'
    r'((?:\s+\w+:[^,\n]+,?\s*\n)*?)'   # trailing extra style props
    r'(\s*)\}\}'
)

def replace_mcq2(m):
    correct_ref = m.group(3)
    extra_props = m.group(4).strip()
    if extra_props:
        return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}} style={{{{{extra_props}}}}}'
    return f'className={{optionClass(idx, selected, {correct_ref}, showFeedback, option)}}'

new_content, count2 = pat2.subn(replace_mcq2, content)
print(f"Pattern 2 (MCQ with trailing props): {count2} replacements")

# ========================================================================
# PATTERN 3: Simple Matching/Selection pattern
# style={{
#   ...styles.optionBtn,
#   ONE extra state-driven prop (borderColor, background, opacity)
# }}
# These are selection/matching buttons — convert to game-option with selection state class
# Leave the style= for state-driven overrides via a wrapper className
# ========================================================================
# (leave these for manual handling — they are more complex)

# ========================================================================
# PATTERN 4: Standalone two-choice pair (not inside map, explicit TRUE/FALSE or A/B)
# These are already handled manually above
# ========================================================================

total_after = new_content.count('styles.optionBtn')
print(f"Total optionBtn occurrences after: {total_after}")
print(f"Reduced by: {total_before - total_after}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done! File written.")
