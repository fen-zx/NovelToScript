const yaml = require('yaml');

// Test 1: compact mapping at same indent as key (原始格式)
const test1 = `
scenes:
- sceneNumber: 1
    location: foo
    dialogues:
      - speaker: A
        text: hello
`;
try {
  yaml.parse(test1);
  console.log('Test 1 (compact, 0 indent): OK');
} catch(e) { console.log('Test 1 FAIL:', e.message.substring(0, 100)); }

// Test 2: compact mapping with 2-space indent
const test2 = `
scenes:
  - sceneNumber: 1
    location: foo
    dialogues:
      - speaker: A
        text: hello
`;
try {
  yaml.parse(test2);
  console.log('Test 2 (compact, 2 indent): OK');
} catch(e) { console.log('Test 2 FAIL:', e.message.substring(0, 100)); }

// Test 3: non-compact mapping
const test3 = `
scenes:
  -
    sceneNumber: 1
    location: foo
    dialogues:
      - speaker: A
        text: hello
`;
try {
  yaml.parse(test3);
  console.log('Test 3 (non-compact): OK');
} catch(e) { console.log('Test 3 FAIL:', e.message.substring(0, 100)); }

// Test 4: compact but no nested block mappings
const test4 = `
characters:
  - name: 罗峰
    role: PROTAGONIST
    traits: [a, b]
`;
try {
  yaml.parse(test4);
  console.log('Test 4 (characters): OK');
} catch(e) { console.log('Test 4 FAIL:', e.message.substring(0, 100)); }

// Test 5: indent 2 spaces, first key NOT on same line as -
const test5 = `
scenes:
  -
    sceneNumber: 1
    location: foo
    dialogues:
      - speaker: A
        text: hello
`;
try {
  yaml.parse(test5);
  console.log('Test 5 (non-compact, 2 indent): OK');
} catch(e) { console.log('Test 5 FAIL:', e.message.substring(0, 100)); }

// Test 6: proper indent with compact (like the actual file)
const test6 = `
title: test
scenes:
- sceneNumber: 1
    location: foo
    dialogues:
      - speaker: A
        text: hello
`;
try {
  yaml.parse(test6);
  console.log('Test 6 (like actual file): OK');
} catch(e) { console.log('Test 6 FAIL:', e.message.substring(0, 150)); }
