# CodeDuel desktop preview

A casual 1v1 coding app with its own desktop interface. CodeDuel handles rooms, study guides, timers and results; the VS Code companion handles editing and local test execution. Both players receive the same task. Final submissions are explicit and immutable.

## Start the desktop app

Prerequisites: Node.js 24 or newer, npm, desktop VS Code, and internet access for the initial Electron installation.

From PowerShell:

```powershell
cd D:\CoDuel
npm run desktop:install
npm run desktop
```

The first command installs Electron into `desktop/node_modules`. It creates a desktop-specific lockfile. The second builds the app and companion, starts a local room server, and opens CodeDuel in its own window. Close an existing local server on port 4317 before launching. Closing CodeDuel stops the server it started. Local desktop data persists in Electron's user-data directory, separately from the browser preview database.

This is a development desktop preview, not yet a packaged Windows installer. Node.js is currently required to launch its local backend.

## Connect VS Code

1. In VS Code, open Extensions > three-dot menu > Install from VSIX.
2. Select `artifacts/code-duel-0.1.0.vsix` from this project. Reinstall it if you have the previous companion.
3. Save your skills profile in CodeDuel, then create or join a room and start the round.
4. During the coding phase, choose **Open in VS Code**. Choose a parent folder, then trust your challenge workspace.
5. Write your solution. Use **Run tests** in CodeDuel or **CodeDuel: Run tests** in VS Code. The companion saves edits and returns the source and test summary automatically.
6. Review your result and declared complexity in CodeDuel, then choose **Lock final submission**.

After restarting CodeDuel, use **Open in VS Code** again and select the same parent folder to reconnect. Existing solution files are preserved. If the desktop connection is unavailable, the companion still writes `duel-result.json`, which can be imported manually. Python challenges additionally require **CodeDuel: Set up Python environment** to install `pydantic-settings` into the challenge's `.venv`.

## Local and online rooms

The default desktop server binds only to `127.0.0.1:4317`. It is for local development, not cross-computer matches. Use a separate browser profile at the same address as the second local player. The desktop app is single-instance.

The existing shared Worker/D1 backend and `.openai/hosting.json` project ID are preserved. `CODEDUEL_SERVER_URL` can select the existing allowlisted hosted origin, but that requires deploying the updated interface and verifying hosted authentication/access first. Online friend duels and the hosted desktop sign-in flow are not verified or complete in this preview. No new Sites project has been created.

## Browser preview and verification

```powershell
node scripts/build.mjs
node scripts/local.mjs
# In another terminal:
node --test tests/*.test.mjs
```

The browser preview remains available at http://127.0.0.1:4317 and retains the manual report handoff fallback.

Ten automated tests pass: room lifecycle, permissions, timing, scoring, served artifacts, JavaScript runners, authenticated bridge routing, invalid payload rejection, and companion commands with the real JavaScript runner and a mocked VS Code API. Bridge HTTP-handler tests run in memory; these are not installed-extension or live-socket end-to-end tests.

On 25 November 2026, Electron installation was blocked by npm registry DNS resolution (`ENOTFOUND`). The native desktop window and installed extension have not been exercised end-to-end. Earlier local socket and extension-install attempts also hit environment permissions. Python's `pydantic-settings` dependency is not installed here. These limitations must be resolved before calling the desktop release verified.

## Architecture and trust

- `desktop/main.mjs`: Electron window, scoped IPC, local server lifecycle, VS Code launch.
- `desktop/preload.cjs`: narrow renderer API; context isolation and sandbox remain enabled.
- `desktop/bridge.mjs`: loopback-only bridge with per-room random tokens, expiry, origin/host checks, bounded payloads and report validation.
- `extension/bridge-client.cjs`: authenticated companion polling and result delivery.
- `src/`: shared interface, study content and room API.
- `scripts/build.mjs`: builds the Worker and VSIX.

Scoring compares correctness, declared time complexity, declared extra space, then server-recorded submission time. Local runtime is informational. Local tests and complexity declarations are trust-based; this is not ranked matchmaking. The bridge exposes only test requests and result delivery, not arbitrary terminal commands or workspace access. Challenge code still executes with the local user's permissions.

## Two computers in one room

Run the coordinator once on a computer reachable by both players. In Command Prompt, from the project directory:

    node scripts/build.mjs
    set "CODEDUEL_BIND=0.0.0.0"
    node scripts/local.mjs

On the same trusted Wi-Fi, find the coordinator's Wi-Fi IPv4 address with ipconfig. In a separate Command Prompt on EACH computer (including the host), run the following with that address:

    cd /d D:\CoDuel
    set "CODEDUEL_PEER=http://192.168.1.42:4317"
    npm run desktop

Allow the coordinator through Windows Firewall on your private network if prompted. Both players need a copy of the app and its VS Code extension. Create a room on one computer and type its eight-character code into the other. The invite URL points at a local desktop window, so share the code. Keep the coordinator running for the match. HTTP mode is intended for trusted networks or an encrypted private VPN connecting the two computers. Use the VPN address instead of the Wi-Fi address for friends on different networks. Keep this development coordinator off the public internet.
