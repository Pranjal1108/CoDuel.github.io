import importlib.util
import json
import sys
import time
from pathlib import Path

source, topic, output = sys.argv[1:]
spec = importlib.util.spec_from_file_location("solution", source)
solution = importlib.util.module_from_spec(spec)
spec.loader.exec_module(solution)
cases = json.loads(Path(__file__).with_name("tasks.json").read_text(encoding="utf8"))[topic]["tests"]
passed = 0
start = time.perf_counter()
for index, case in enumerate(cases, 1):
    try:
        actual = solution.solve(case["input"])
        expected = case["expected"]
        if actual != expected or isinstance(actual, bool) != isinstance(expected, bool):
            raise ValueError("Unexpected result")
        passed += 1
        print("PASS", index)
    except Exception as error:
        print("FAIL", index, error)
Path(output).write_text(json.dumps(dict(passed=passed, runtime=(time.perf_counter()-start)*1000)))
