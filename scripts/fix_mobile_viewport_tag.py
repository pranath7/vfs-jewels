import os

def add_viewport_tag(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    viewport_tag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n  '

    if 'name="viewport"' not in code:
        code = code.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  ' + viewport_tag)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Added mobile viewport tag to {file_path}")
    else:
        print(f"Viewport tag already present in {file_path}")

add_viewport_tag('index.html')
add_viewport_tag('wholesale.html')
