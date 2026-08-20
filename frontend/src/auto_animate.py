import os
import re

base_dir = '/Users/eakhalaivan/Downloads/clinic-website/frontend/src/pages'

skip_dirs = ['auth', 'public', 'patient', 'doctor', 'common', 'shared']

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip files that already have PageTransition
    if 'PageTransition' in content:
        return False
        
    # Skip test files and css files
    if 'test' in filepath.lower() or filepath.endswith('.css'):
        return False
        
    # If the file doesn't have a standard return, it might be a small component
    # Let's check if it has a typical React component structure.
    # Look for export default at the end
    if 'export default ' not in content:
        return False

    # Insert import
    imports = "import PageTransition from '../../components/ui/PageTransition';\n"
    # Find last import
    matches = list(re.finditer(r'^import .*$', content, re.MULTILINE))
    if matches:
        last_import = matches[-1]
        
        # Determine how many directories up we are to correctly import PageTransition
        # e.g., src/pages/reception/Queue.jsx -> ../../components/ui/PageTransition
        # src/pages/nurse/workspace/Task.jsx -> ../../../components/ui/PageTransition
        rel_path = os.path.relpath(filepath, base_dir)
        depth = len(rel_path.split(os.sep)) - 1
        prefix = '../' * (depth + 1)
        imports = f"import PageTransition from '{prefix}components/ui/PageTransition';\n"
        
        content = content[:last_import.end()] + '\n' + imports + content[last_import.end():]

    # Find the main return (usually the one right before the end of the file)
    # We will look for:
    # return (
    #   <div ...>
    # OR
    # return (
    #   <ConfigDrivenDashboard ... />
    
    # Let's do a smart regex replace from the bottom up.
    # Usually the component ends with:
    #     </div>
    #   );
    # };
    # export default ...
    
    # We try to match the last `  );\n};` or `  );\n}`
    # Wait, some components return fragments `<> ... </>\n  );`
    
    # Since we can't perfectly parse JSX with regex, let's use a simple heuristic:
    # Find the very last `  );` before the end of the function.
    
    end_match = list(re.finditer(r'^  \);\n}\;?\n*(?:export default .*;?\n*)?$', content, re.MULTILINE))
    if not end_match:
        return False
        
    last_end = end_match[-1]
    
    # Find the corresponding `  return (` that starts this block
    # By searching backwards from last_end.start()
    return_idx = content.rfind('  return (', 0, last_end.start())
    if return_idx == -1:
        return False
        
    # Now we have the block!
    # Let's wrap the inner content
    
    # Block is from return_idx + len('  return (\n') to last_end.start()
    # It might have leading spaces.
    
    start_str = content[return_idx:return_idx+11] # "  return (\n"
    if not start_str.endswith('\n'):
        # Maybe it's `return (<div`
        return False
        
    # Let's inject <PageTransition> right after `return (\n`
    # and `</PageTransition>` right before `  );\n}`
    
    new_content = (
        content[:return_idx + 11] + 
        "    <PageTransition>\n" +
        content[return_idx + 11:last_end.start()] +
        "    </PageTransition>\n" +
        content[last_end.start():]
    )

    with open(filepath, 'w') as f:
        f.write(new_content)
        
    return True


processed_count = 0
for root, dirs, files in os.walk(base_dir):
    # Filter skipped dirs
    dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('__')]
    
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                processed_count += 1
                print(f"Processed {filepath}")

print(f"Total processed: {processed_count}")

