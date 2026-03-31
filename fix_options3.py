import re

filepath = r"j:\Excelias V2\Activites ( WorkSpace )\RedMaterialsAcademy\app.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

total_before = content.count('styles.optionBtn')
print(f"Total optionBtn occurrences before: {total_before}")
changes = 0

# ===========================================================================
# STRATEGY: Use a single flexible regex that captures the core pattern
# style={{
#   ...styles.optionBtn,
#   [line]*  <- optional extra style lines
#   ...(CONDITION1 ? styles.correctBtn : {}),
#   ...(CONDITION2 ? styles.incorrectBtn : {})
#   [line]*  <- optional trailing lines
# }}
# Replace with: className={...} [style={extra}]
# ===========================================================================

# Approach: find the outer style block of optionBtn, extract extra props,
# detect if it has correctBtn/incorrectBtn, and replace accordingly.

# The key: find any style block containing ...styles.optionBtn AND styles.correctBtn + styles.incorrectBtn
# Capture:
#   - Any extra style props (non-state-driven)
#   - Whether it's idx-based or option-based (what the correct ref is)
#   - What variable the correct answer is (captures from the condition)

# Simplified: just look for the block between `style={{` and `}}` that contains optionBtn+correctBtn+incorrectBtn
# Use a more liberal approach

# Pattern: style block that:
# 1. starts with ...styles.optionBtn,
# 2. has SOME extra props (optional)
# 3. has ...(COND1 ? styles.correctBtn : {})
# 4. has ...(COND2 ? styles.incorrectBtn : {})

# We use a non-greedy match on the inner content
# Then classify if we should use idx or option/value based

# Liberal pattern - match any style block with optionBtn + correctBtn + incorrectBtn
PAT_FULL = re.compile(
    r'\bstyle=\{\{(' 
    r'(?:[^{}]|\{[^{}]*\})*?)'    # inner content of the style object (allowing nested {})
    r'\.\.\.styles\.optionBtn,'   
    r'((?:[^{}]|\{[^{}]*\})*?)'   # middle content (optional extra props)
    r'\.\.\.\([^)]+\? styles\.correctBtn : \{\}\),'
    r'((?:[^{}]|\{[^{}]*\})*?)'   # content between correctBtn and incorrectBtn
    r'\.\.\.\([^)]+\? styles\.incorrectBtn : \{\}\)'
    r'((?:[^{}]|\{[^{}]*\})*?)'   # trailing content
    r'\}\}',
    re.DOTALL
)

def analyze_condition(cond_str):
    """Extract correct reference from condition like:
    (showFeedback && option === q.answer ? styles.correctBtn : {})
    (showFeedback && idx === question.correctIndex ? ...)
    (showResults && selected === "Primary" && q.answer !== "Primary" ? ...)
    """
    # Try: VALUE === CORRECT_REF
    m = re.search(r'&&\s*(\w+)\s*===\s*(q\.\w+|question\.\w+|scenario\.\w+|response\.\w+|correctIdx)', cond_str)
    if m:
        return m.group(1), m.group(2)  # (variable_being_tested, correct_ref)
    # Try literal string: q.answer === "STRING"
    m = re.search(r'&&\s*(q\.\w+)\s*===\s*"(\w+)"', cond_str)
    if m:
        return None, (m.group(1), m.group(2))  # (None, (correct_prop, literal_val))
    return None, None

def extract_extra_props(content_str):
    """Strip spread expressions, keep plain prop lines"""
    lines = content_str.split('\n')
    extra = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Skip spread syntax
        if stripped.startswith('...'):
            continue
        # Skip pure comment
        if stripped.startswith('//'):
            continue
        # Keep style props like `padding: '30px',` or `textAlign: 'center',`
        if re.match(r"\w+\s*:", stripped):
            extra.append(stripped.rstrip(','))
    return extra

found_matches = []
for m in PAT_FULL.finditer(content):
    full_match = m.group(0)
    prefix = m.group(1)  # before optionBtn
    middle = m.group(2)  # between optionBtn and correctBtn
    between = m.group(3)  # between correctBtn and incorrectBtn
    trailing = m.group(4)  # after incorrectBtn
    
    # Get the correctBtn condition to find what `correct ref` is
    correct_cond_match = re.search(r'\.\.\.\(([^)]+\? styles\.correctBtn[^)]+)\)', full_match)
    incorrect_cond_match = re.search(r'\.\.\.\(([^)]+\? styles\.incorrectBtn[^)]+)\)', full_match)
    
    if not correct_cond_match:
        continue
    
    cond_str = correct_cond_match.group(1)
    
    # Determine the variable being tested vs correct answer ref
    # Pattern A: option === q.answer (or similar)
    # Pattern B: idx === question.correctIndex
    # Pattern C: selected === "Primary" && q.answer !== "Primary" (value-based binary)
    
    # Try pattern A/B: variable === correct_ref
    vm = re.search(r'(option|idx|selected)\s*===\s*([^\s?]+)', cond_str)
    if not vm:
        continue
    
    test_var = vm.group(1)
    correct_ref = vm.group(2)
    
    # Collect extra style props from middle + trailing
    all_extra = prefix + middle + between + trailing
    extra_props = extract_extra_props(all_extra)
    
    found_matches.append({
        'full': full_match,
        'test_var': test_var,
        'correct_ref': correct_ref,
        'extra_props': extra_props
    })

print(f"Found {len(found_matches)} total matches")

# Now do replacements
for info in found_matches:
    test_var = info['test_var']
    correct_ref = info['correct_ref']
    extra_props = info['extra_props']
    
    # Build replacement
    if test_var == 'option':
        class_expr = f'optionClass(idx, selected, {correct_ref}, showFeedback, option)'
    elif test_var == 'idx':
        class_expr = f'optionClass(idx, selected, {correct_ref}, showFeedback, idx)'
    else:
        # selected === ... case (binary buttons)
        class_expr = f'optionClass(0, selected, {correct_ref}, showFeedback, selected)'
    
    if extra_props:
        props_str = ', '.join(extra_props)
        replacement = f'className={{{class_expr}}} style={{{{ {props_str} }}}}'
    else:
        replacement = f'className={{{class_expr}}}'
    
    new_content = content.replace(info['full'], replacement, 1)
    if new_content != content:
        changes += 1
        content = new_content
    else:
        print(f"  FAILED to replace: test_var={test_var}, correct_ref={correct_ref}")

total_after = content.count('styles.optionBtn')
print(f"\nTotal optionBtn: {total_before} -> {total_after} (reduced by {total_before - total_after})")
print(f"Total changes made: {changes}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
