import sys, json, os, time, importlib.util
file, topic, out = sys.argv[1:]
for key in ("APP_NAME", "PORT", "DEBUG"):
    os.environ.pop(key, None)
spec = importlib.util.spec_from_file_location("solution", file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
cases = [
 ({}, {"app_name": "Duel API", "port": 8000, "debug": False}),
 ({"PORT": "9000"}, {"app_name": "Duel API", "port": 9000, "debug": False}),
 ({"APP_NAME": "Friendly duel", "DEBUG": "true"}, {"app_name": "Friendly duel", "port": 8000, "debug": True}),
 ({"DEBUG": "false", "PORT": "1234"}, {"app_name": "Duel API", "port": 1234, "debug": False}),
 ({"PORT": "not-a-number"}, None)
]
from pydantic import ValidationError
passed = 0
start = time.perf_counter()
for i, (overrides, expected) in enumerate(cases):
    for key in ("APP_NAME", "PORT", "DEBUG"):
        os.environ.pop(key, None)
    os.environ.update(overrides)
    try:
        if expected is None:
            try:
                module.solve()
                raise AssertionError("Expected ValidationError")
            except ValidationError:
                pass
        else:
            actual = module.solve()
            assert actual == expected, repr(actual)
            assert all(type(actual[k]) is type(v) for k, v in expected.items()), "Incorrect field types"
        passed += 1
        print("PASS", i + 1)
    except Exception as e:
        print("FAIL", i + 1, str(e)[:300])
with open(out, "w") as f:
    json.dump({"passed": passed, "runtime": (time.perf_counter() - start) * 1000}, f)
