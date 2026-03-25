import re
import json
import sys

def parse_skill_lua(lua_file_path, encoding='cp949'):
    """
    Parse RO skillinfolist.lua file and extract skill information.
    
    Args:
        lua_file_path: Path to the .lua file
        encoding: File encoding (default: cp949 for Korean RO client)
    
    Returns:
        List of skill dictionaries
    """
    with open(lua_file_path, 'r', encoding=encoding, errors='replace') as f:
        content = f.read()
    
    skills = []
    
    # Regex pattern to match skill blocks:
    # [SKID.SKILL_NAME] = { ... }
    pattern = r'\[SKID\.(\w+)\]\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
    
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        skill_id = match.group(1)
        skill_block = match.group(2)
        
        skill_data = {
            'skill_id': skill_id,
            'name_kr': None,
            'max_level': 1,
            'sp_cost': [],
            'is_passive': False,
            'attack_range': [],
            'prerequisites': []
        }
        
        # Extract SkillName (Korean name)
        name_match = re.search(r'SkillName\s*=\s*["\']([^"\']+)["\']', skill_block)
        if name_match:
            skill_data['name_kr'] = name_match.group(1)
        
        # Extract MaxLv
        maxlv_match = re.search(r'MaxLv\s*=\s*(\d+)', skill_block)
        if maxlv_match:
            skill_data['max_level'] = int(maxlv_match.group(1))
        
        # Extract SpAmount (SP cost per level)
        sp_match = re.search(r'SpAmount\s*=\s*\{([^}]+)\}', skill_block)
        if sp_match:
            sp_values = sp_match.group(1).strip()
            skill_data['sp_cost'] = [int(x.strip()) for x in sp_values.split(',') if x.strip().isdigit()]
        
        # Extract IsPassive
        if 'IsPassive = true' in skill_block:
            skill_data['is_passive'] = True
        
        # Extract AttackRange
        range_match = re.search(r'AttackRange\s*=\s*\{([^}]+)\}', skill_block)
        if range_match:
            range_values = range_match.group(1).strip()
            skill_data['attack_range'] = [int(x.strip()) for x in range_values.split(',') if x.strip().isdigit()]
        
        # Extract _NeedSkillList (prerequisites)
        prereq_match = re.search(r'_NeedSkillList\s*=\s*\{([^}]+(?:\{[^}]*\})*)\}', skill_block)
        if prereq_match:
            prereq_block = prereq_match.group(1)
            # Find { SKID.XXX, level } patterns
            prereq_items = re.findall(r'\{\s*SKID\.(\w+)\s*,\s*(\d+)\s*\}', prereq_block)
            skill_data['prerequisites'] = [
                {'skill_id': skill_id, 'level': int(level)}
                for skill_id, level in prereq_items
            ]
        
        skills.append(skill_data)
    
    return skills

def save_to_json(skills, output_file='skills.json'):
    """Save parsed skills to JSON file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(skills, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {len(skills)} skills to {output_file}")

def print_sample(skills, count=5):
    """Print sample skills for verification"""
    print(f"\n📊 Sample skills ({count}/{len(skills)}):\n")
    for skill in skills[:count]:
        print(f"ID: {skill['skill_id']}")
        print(f"  Name: {skill['name_kr'] or '(No name)'}")
        print(f"  Max Level: {skill['max_level']}")
        print(f"  SP Cost: {skill['sp_cost']}")
        print(f"  Passive: {skill['is_passive']}")
        print(f"  Prerequisites: {len(skill['prerequisites'])} skill(s)")
        print()

if __name__ == '__main__':
    # Usage: python skill_parser.py <lua_file_path> [output_json]
    if len(sys.argv) < 2:
        print("Usage: python skill_parser.py <skillinfolist.lua> [output.json]")
        print("\nExample:")
        print("  python skill_parser.py skillinfolist.lua skills.json")
        sys.exit(1)
    
    lua_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'skills.json'
    
    print(f"🔍 Parsing {lua_file}...")
    
    # Try different encodings
    for encoding in ['cp949', 'euc-kr', 'utf-8']:
        try:
            skills = parse_skill_lua(lua_file, encoding=encoding)
            print(f"✅ Successfully parsed with {encoding} encoding")
            break
        except Exception as e:
            print(f"❌ Failed with {encoding}: {e}")
            continue
    else:
        print("Failed to parse with any encoding")
        sys.exit(1)
    
    # Save to JSON
    save_to_json(skills, output_file)
    
    # Print sample
    print_sample(skills)
    
    print(f"\n✨ Total skills parsed: {len(skills)}")
