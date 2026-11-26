                                                 
export const topics = [
 {id:'arrays',name:'Arrays & hash maps',lang:'JavaScript',symbol:'[ ]',tag:'FOUNDATIONS',desc:'Turn repeated work into a single pass.',color:'purple'},
 {id:'strings',name:'Strings & frequency',lang:'JavaScript',symbol:'Aa',tag:'PROBLEM SOLVING',desc:'Find patterns. Count what matters.',color:'green'},
 {id:'fastapi',name:'FastAPI settings',lang:'Python',symbol:'⚡',tag:'LEARN SOMETHING NEW',desc:'Typed configuration, straight from the environment.',color:'orange'}
];
export const lessons                                                                                              = {
 arrays:{intro:'Build a mental model before you build a solution. These are all the tools you need for this track.',sections:[
 {title:'A single pass',text:'Visit each item once to keep traversal linear in the number of inputs. A loop inside another loop can grow quadratically when both depend on input size.',code:'for (const value of values) {\n  // Process this value once.\n}'},
 {title:'Remember what you have seen',text:'A Set stores unique values. In typical JavaScript implementations, has() and add() have expected constant-time cost. Storing up to n distinct values takes O(n) extra space.',code:'const seen = new Set();\nseen.add(12);\nseen.has(12); // true'},
 {title:'Explain the trade-off',text:'A nested search may save auxiliary space but repeat work. A Set spends memory to avoid repeated searches. Describe both time complexity and extra space; do not count the input array as extra space.'}],link:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set'},
 strings:{intro:'Learn how frequency tables let you compare strings without repeatedly scanning them.',sections:[
 {title:'Iterate over a string',text:'The challenges use lowercase English letters only. For...of visits each character. Empty strings are valid input.',code:'for (const char of text) {\n  // Inspect one character.\n}'},
 {title:'Count with a Map',text:'Use a character as the key and its frequency as the value. Missing entries start at zero.',code:'const counts = new Map();\ncounts.set(char, (counts.get(char) ?? 0) + 1);'},
 {title:'Count, then compare',text:'Two strings have the same letter frequencies when each character occurs equally often. Sorting is another approach, usually O(n log n). With a fixed 26-letter alphabet, a frequency table has O(1) auxiliary space.'}],link:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map'},
 fastapi:{intro:'FastAPI applications often use Pydantic Settings to validate configuration. This round tests the settings object itself; you do not need to start a web server.',sections:[
 {title:'Define typed settings',text:'Import BaseSettings from pydantic_settings. Class annotations declare the expected types. Defaults are used when an environment variable is absent.',code:'from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    app_name: str = "My API"\n    port: int = 8000'},
 {title:'Read the environment',text:'Constructing Settings() reads environment variables. PORT="9000" becomes the integer 9000. Environment names are case-insensitive by default. Invalid values raise a validation error.',code:'import os\nos.environ["PORT"] = "9000"\nsettings = Settings()\nprint(settings.port)  # 9000'},
 {title:'Export configuration',text:'model_dump() returns a dictionary of validated field values. A new settings instance reads the current environment, which matters when tests change values between calls.',code:'def read_config():\n    return Settings().model_dump()'},
 {title:'Scope of this exercise',text:'Only fixed configuration fields are involved, so use O(1) time and O(1) extra space. The challenge does not require .env files, deployment, endpoints, or secrets.'}],link:'https://fastapi.tiangolo.com/advanced/settings/'}
};
export function challenge(topic       , variant=0){
 const track=pythonTracks.find(t=>t.id===topic);
 if(track)return {title:track.name,text:track.text,signature:track.signature,tests:track.tests,example:JSON.stringify(track.tests[1].input)+' → '+JSON.stringify(track.tests[1].expected)};
 if(topic==='fastapi')return {title:'Configuration, without surprises',text:'Write solve() with no arguments. Return a dictionary with app_name (str, default "Duel API"), port (int, default 8000), and debug (bool, default False). Read overrides from APP_NAME, PORT, and DEBUG using Pydantic Settings. Invalid PORT must raise a validation error.',signature:'# pydantic-settings is available\nfrom pydantic_settings import BaseSettings\n\n# Define your settings class here\n\ndef solve():\n    pass\n',example:'No environment overrides → {"app_name": "Duel API", "port": 8000, "debug": false}',tests:[]};
 if(topic==='strings')return {title:variant?'Same letters, different order':'Anagram check',text:'Write solve([a, b]). Return true if both strings contain exactly the same letters with the same frequencies; otherwise false. Inputs contain only lowercase a–z and may be empty. Maximum combined length: 100,000.',signature:'function solve([a, b]) {\n  // Your solution here\n}\n',example:'["listen", "silent"] → true',tests:[{input:['listen','silent'],expected:true},{input:['a','b'],expected:false},{input:['',''],expected:true},{input:['aab','abb'],expected:false},{input:['abc','ab'],expected:false},{input:['aaaa','aaaa'],expected:true},{input:['abca','caba'],expected:true},{input:['x',''],expected:false}]};
 return {title:variant?'First repeated number':'Find the first duplicate',text:'Write solve(values). Return the first number whose second occurrence is encountered when scanning left to right. Return null if all numbers are unique. Integers may be negative or zero. Maximum length: 100,000.',signature:'function solve(values) {\n  // Your solution here\n}\n',example:'[4, 2, 4, 2] → 4',tests:[{input:[4,2,4,2],expected:4},{input:[],expected:null},{input:[1,2,3],expected:null},{input:[0,0],expected:0},{input:[-1,2,-1],expected:-1},{input:[1,2,2,1],expected:2},{input:[7],expected:null},{input:[5,5,5],expected:5}]};
}
export const complexities=['O(1)','O(log n)','O(n)','O(n log n)','O(n²)'];
export function compare(a    ,b    ){if(!a||!b)return null;for(const k of ['passed','timeRank','spaceRank','elapsed']){const diff=k==='passed'?b[k]-a[k]:a[k]-b[k];if(diff)return diff<0?'host':'guest';}return 'draw';}

export const studySupport = {
  "arrays": {
    "revision": "Check membership before insertion. Zero is a valid duplicate. Empty and all-unique inputs return null.",
    "hints": [
      "Scan left to right. Return the first value already in your set. Otherwise remember it. Return null if you reach the end.",
      "seen \u2190 empty set\nfor value in values:\n    if value in seen: return value\n    add value to seen\nreturn null",
      "function solve(values) {\n  const seen = new Set();\n  for (const value of values) {\n    if (seen.has(value)) return value;\n    seen.add(value);\n  }\n  return null;\n}\nmodule.exports = solve;"
    ]
  },
  "strings": {
    "revision": "Compare counts, including repeated letters. Two empty strings match. A fixed 26-letter alphabet bounds the table size.",
    "hints": [
      "Reject different lengths. Count each letter in the first word. Spend one count for each letter in the second. Reject a missing count, otherwise accept.",
      "if lengths differ: return false\ncount letters in first word\nfor letter in second word:\n    if count[letter] is zero or missing: return false\n    decrement count[letter]\nreturn true",
      "function solve([a, b]) {\n  if (a.length !== b.length) return false;\n  const counts = new Map();\n  for (const c of a) counts.set(c, (counts.get(c) ?? 0) + 1);\n  for (const c of b) {\n    if (!counts.get(c)) return false;\n    counts.set(c, counts.get(c) - 1);\n  }\n  return true;\n}\nmodule.exports = solve;"
    ]
  },
  "fastapi": {
    "revision": "Read the environment on each call. Preserve the int and bool types. Let validation errors reach the caller.",
    "hints": [
      "Define typed settings with the requested defaults. Inside solve, create a fresh settings object and return its fields as a dictionary.",
      "define Settings extending BaseSettings\n    declare typed fields and defaults\nsolve():\n    return dictionary from new Settings instance",
      "from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    app_name: str = \"Duel API\"\n    port: int = 8000\n    debug: bool = False\n\ndef solve():\n    return Settings().model_dump()"
    ]
  }
};
lessons.arrays.sections.push({"title": "Trace a duplicate by hand", "text": "For [8, 3, 3, 8], the second 3 arrives before the second 8. The order of those second visits determines the answer."}, {"title": "Check your understanding", "text": "What should [0, 7, 0] return? Zero. Testing a value for truthiness would miss it."});
lessons.strings.sections.push({"title": "Spot the misleading match", "text": "Both aab and abb contain a and b. A set loses the repeated letters, so membership alone gives the wrong answer."}, {"title": "Check your understanding", "text": "Would listen and silent match? Yes. Reordering preserves every frequency. Adding one extra letter breaks the match."});
lessons.fastapi.sections.push({"title": "Trace a configuration override", "text": "With PORT=9000 and no other overrides, only the port changes. An invalid port must raise a validation error so the caller can detect bad configuration."}, {"title": "Check your understanding", "text": "If DEBUG is the string false, what type should solve return for debug? A boolean. bool(\"false\") would incorrectly produce True."});

const pythonTracks = [
  {
    "id": "py-basics",
    "name": "Variables & arithmetic",
    "level": "Beginner",
    "text": "Convert a Celsius temperature to Fahrenheit.",
    "note": "Multiply by nine fifths before adding 32.",
    "solution": "def solve(c):\n    return c * 9 / 5 + 32",
    "pseudo": "fahrenheit \u2190 c \u00d7 9 / 5 + 32; return fahrenheit",
    "signature": "def solve(c):\n    pass\n",
    "tests": [
      {
        "input": 0,
        "expected": 32.0
      },
      {
        "input": 100,
        "expected": 212.0
      },
      {
        "input": -40,
        "expected": -40.0
      },
      {
        "input": 10,
        "expected": 50.0
      },
      {
        "input": 20,
        "expected": 68.0
      },
      {
        "input": 30,
        "expected": 86.0
      },
      {
        "input": -10,
        "expected": 14.0
      },
      {
        "input": 5,
        "expected": 41.0
      }
    ]
  },
  {
    "id": "py-conditions",
    "name": "Conditionals",
    "level": "Beginner",
    "text": "Classify an integer as negative, zero, or positive.",
    "note": "Check below zero first, then above zero. The remaining case is zero.",
    "solution": "def solve(n):\n    if n < 0:\n        return \"negative\"\n    if n > 0:\n        return \"positive\"\n    return \"zero\"",
    "pseudo": "if n < 0 \u2192 negative; if n > 0 \u2192 positive; otherwise zero",
    "signature": "def solve(n):\n    pass\n",
    "tests": [
      {
        "input": -1,
        "expected": "negative"
      },
      {
        "input": 0,
        "expected": "zero"
      },
      {
        "input": 1,
        "expected": "positive"
      },
      {
        "input": 3,
        "expected": "positive"
      },
      {
        "input": -5,
        "expected": "negative"
      },
      {
        "input": 8,
        "expected": "positive"
      },
      {
        "input": 100,
        "expected": "positive"
      },
      {
        "input": -100,
        "expected": "negative"
      }
    ]
  },
  {
    "id": "py-loops",
    "name": "Loops & lists",
    "level": "Foundation",
    "text": "Return the sum of even integers in a list.",
    "note": "Use the remainder modulo two to recognize an even number.",
    "solution": "def solve(values):\n    return sum(n for n in values if n % 2 == 0)",
    "pseudo": "total \u2190 0; for each even value: add it to total; return total",
    "signature": "def solve(values):\n    pass\n",
    "tests": [
      {
        "input": [],
        "expected": 0
      },
      {
        "input": [
          1
        ],
        "expected": 0
      },
      {
        "input": [
          0
        ],
        "expected": 0
      },
      {
        "input": [
          2
        ],
        "expected": 2
      },
      {
        "input": [
          1,
          2,
          3,
          4
        ],
        "expected": 6
      },
      {
        "input": [
          -4,
          2
        ],
        "expected": -2
      },
      {
        "input": [
          3,
          5
        ],
        "expected": 0
      },
      {
        "input": [
          2,
          2,
          2
        ],
        "expected": 6
      }
    ]
  },
  {
    "id": "py-maps",
    "name": "Dictionaries",
    "level": "Intermediate",
    "text": "Return a dictionary counting each word in the input list. Words are case-sensitive.",
    "note": "A missing key starts with count zero.",
    "solution": "def solve(words):\n    counts = {}\n    for word in words:\n        counts[word] = counts.get(word, 0) + 1\n    return counts",
    "pseudo": "for each word: increment its count; return counts",
    "signature": "def solve(words):\n    pass\n",
    "tests": [
      {
        "input": [],
        "expected": {}
      },
      {
        "input": [
          "a"
        ],
        "expected": {
          "a": 1
        }
      },
      {
        "input": [
          "a",
          "a"
        ],
        "expected": {
          "a": 2
        }
      },
      {
        "input": [
          "a",
          "A"
        ],
        "expected": {
          "a": 1,
          "A": 1
        }
      },
      {
        "input": [
          "red",
          "blue"
        ],
        "expected": {
          "red": 1,
          "blue": 1
        }
      },
      {
        "input": [
          "",
          ""
        ],
        "expected": {
          "": 2
        }
      },
      {
        "input": [
          "one",
          "two",
          "one"
        ],
        "expected": {
          "one": 2,
          "two": 1
        }
      },
      {
        "input": [
          "3"
        ],
        "expected": {
          "3": 1
        }
      }
    ]
  },
  {
    "id": "py-sql",
    "name": "SQL & databases",
    "level": "Intermediate",
    "text": "Using Python sqlite3, return the distinct input names in ascending binary order.",
    "note": "Insert rows with bound parameters. DISTINCT removes duplicates and ORDER BY controls output order.",
    "solution": "def solve(names):\n    import sqlite3\n    db = sqlite3.connect(\":memory:\")\n    try:\n        db.execute(\"CREATE TABLE names (name TEXT)\")\n        db.executemany(\"INSERT INTO names VALUES (?)\", ((s,) for s in names))\n        return [row[0] for row in db.execute(\"SELECT DISTINCT name FROM names ORDER BY name\")]\n    finally:\n        db.close()",
    "pseudo": "insert names \u2192 select distinct names \u2192 order ascending \u2192 unpack rows",
    "signature": "def solve(names):\n    pass\n",
    "tests": [
      {
        "input": [],
        "expected": []
      },
      {
        "input": [
          "b",
          "a"
        ],
        "expected": [
          "a",
          "b"
        ]
      },
      {
        "input": [
          "a",
          "a"
        ],
        "expected": [
          "a"
        ]
      },
      {
        "input": [
          "Z",
          "a"
        ],
        "expected": [
          "Z",
          "a"
        ]
      },
      {
        "input": [
          "O'Brien"
        ],
        "expected": [
          "O'Brien"
        ]
      },
      {
        "input": [
          "",
          "x"
        ],
        "expected": [
          "",
          "x"
        ]
      },
      {
        "input": [
          "10",
          "2"
        ],
        "expected": [
          "10",
          "2"
        ]
      },
      {
        "input": [
          "b",
          "b",
          "A"
        ],
        "expected": [
          "A",
          "b"
        ]
      }
    ]
  },
  {
    "id": "py-intervals",
    "name": "Sorting & intervals",
    "level": "Advanced",
    "text": "Merge overlapping closed intervals and return them in ascending order. Touching endpoints overlap.",
    "note": "Sort by start. Only the last merged interval can overlap the next interval.",
    "solution": "def solve(intervals):\n    merged = []\n    for start, end in sorted(intervals):\n        if merged and start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged",
    "pseudo": "sort intervals; extend overlapping tail or append a new interval; return merged",
    "signature": "def solve(intervals):\n    pass\n",
    "tests": [
      {
        "input": [],
        "expected": []
      },
      {
        "input": [
          [
            1,
            2
          ]
        ],
        "expected": [
          [
            1,
            2
          ]
        ]
      },
      {
        "input": [
          [
            2,
            4
          ],
          [
            1,
            2
          ]
        ],
        "expected": [
          [
            1,
            4
          ]
        ]
      },
      {
        "input": [
          [
            0,
            8
          ],
          [
            2,
            4
          ]
        ],
        "expected": [
          [
            0,
            8
          ]
        ]
      },
      {
        "input": [
          [
            0,
            0
          ],
          [
            1,
            1
          ]
        ],
        "expected": [
          [
            0,
            0
          ],
          [
            1,
            1
          ]
        ]
      },
      {
        "input": [
          [
            1,
            4
          ],
          [
            3,
            7
          ],
          [
            6,
            9
          ]
        ],
        "expected": [
          [
            1,
            9
          ]
        ]
      },
      {
        "input": [
          [
            -4,
            -2
          ],
          [
            -3,
            0
          ]
        ],
        "expected": [
          [
            -4,
            0
          ]
        ]
      },
      {
        "input": [
          [
            1,
            1
          ],
          [
            1,
            1
          ]
        ],
        "expected": [
          [
            1,
            1
          ]
        ]
      }
    ]
  },
  {
    "id": "py-graphs",
    "name": "Graphs & dependencies",
    "level": "Expert",
    "text": "Given a dictionary mapping tasks to lists of prerequisites, return whether all tasks can finish. Every prerequisite is also a key. Support chains longer than the Python recursion limit.",
    "note": "Count unfinished prerequisites per task. Process ready tasks with a queue. A cycle leaves tasks unfinished.",
    "solution": "def solve(graph):\n    from collections import deque\n    remaining = {t: len(deps) for t, deps in graph.items()}\n    followers = {t: [] for t in graph}\n    for task, deps in graph.items():\n        for dep in deps:\n            followers[dep].append(task)\n    ready = deque(t for t in graph if remaining[t] == 0)\n    done = 0\n    while ready:\n        done += 1\n        for task in followers[ready.popleft()]:\n            remaining[task] -= 1\n            if remaining[task] == 0:\n                ready.append(task)\n    return done == len(graph)",
    "pseudo": "queue tasks with zero prerequisites; remove ready tasks and decrement dependents; compare processed count with task count",
    "signature": "def solve(graph):\n    pass\n",
    "tests": [
      {
        "input": {},
        "expected": true
      },
      {
        "input": {
          "a": []
        },
        "expected": true
      },
      {
        "input": {
          "a": [
            "a"
          ]
        },
        "expected": false
      },
      {
        "input": {
          "a": [
            "b"
          ],
          "b": []
        },
        "expected": true
      },
      {
        "input": {
          "a": [
            "b"
          ],
          "b": [
            "a"
          ]
        },
        "expected": false
      },
      {
        "input": {
          "a": [],
          "b": []
        },
        "expected": true
      },
      {
        "input": {
          "a": [],
          "b": [
            "a"
          ],
          "c": [
            "a",
            "b"
          ]
        },
        "expected": true
      },
      {
        "input": {
          "a": [],
          "b": [
            "c"
          ],
          "c": [
            "b"
          ]
        },
        "expected": false
      }
    ]
  }
];
for(const t of pythonTracks){
 const name='Python '+t.level+' · '+t.name;
 topics.push({id:t.id,name,lang:'Python',symbol:'Py',tag:t.level,desc:t.text});
 lessons[t.id]={intro:t.text,sections:[{title:'Core concept',text:t.note},{title:'Worked example',text:'Input '+JSON.stringify(t.tests[2].input)+' produces '+JSON.stringify(t.tests[2].expected)+'.'},{title:'Try it yourself',text:'Predict the result for '+JSON.stringify(t.tests[4].input)+' before running your function.'}],link:'https://docs.python.org/3/library/'};
 studySupport[t.id]={revision:t.note,hints:[t.note,t.pseudo,t.solution]};
}
