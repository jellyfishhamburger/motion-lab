"""交互自检：复制按钮 / 开关 / 分段控件 / 三个旋钮 / reveal"""
import asyncio, json, os, subprocess, sys, time, urllib.request, base64
import websockets

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9334
PROFILE = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "cdp-profile2")


async def send(ws, mid, method, **params):
    await ws.send(json.dumps({"id": mid, "method": method, "params": params}))
    while True:
        m = json.loads(await ws.recv())
        if m.get("id") == mid:
            return m.get("result", m)


async def main(url, outdir):
    os.makedirs(outdir, exist_ok=True)
    p = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                          f"--remote-debugging-port={PORT}", f"--user-data-dir={PROFILE}",
                          "--window-size=1440,1000", "about:blank"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws_url = None
    for _ in range(40):
        try:
            d = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2))
            pg = [x for x in d if x["type"] == "page"]
            if pg:
                ws_url = pg[0]["webSocketDebuggerUrl"]; break
        except Exception:
            pass
        time.sleep(.3)
    async with websockets.connect(ws_url, max_size=40 << 20) as ws:
        i = 0
        def nid():
            nonlocal i; i += 1; return i
        await send(ws, nid(), "Page.enable"); await send(ws, nid(), "Runtime.enable")
        try:
            await send(ws, nid(), "Browser.grantPermissions",
                       origin="file:///", permissions=["clipboardReadWrite", "clipboardSanitizedWrite"])
        except Exception as e:
            print("GRANT_FAIL", e)
        await send(ws, nid(), "Page.navigate", url=url); await asyncio.sleep(2.0)

        async def js(e):
            r = await send(ws, nid(), "Runtime.evaluate", expression=e,
                           returnByValue=True, awaitPromise=True)
            if r.get("exceptionDetails"):
                return {"EXC": r["exceptionDetails"].get("text"), "desc": str(r["exceptionDetails"])[:300]}
            return r.get("result", {}).get("value")

        out = {}
        # 1 复制
        out["copy"] = await js("""(async () => {
            const b = document.querySelector('[data-copy="roll"]');
            b.click();
            await new Promise(r => setTimeout(r, 400));
            return {toast: document.getElementById('toast').textContent,
                    on: document.getElementById('toast').classList.contains('on'),
                    len: (window.SNIPPETS.roll||'').length};
        })()""")
        # 2 开关
        out["toggle"] = await js("""(() => {
            const t = document.querySelector('.toggle'); t.click();
            return {checked: t.getAttribute('aria-checked'),
                    label: document.querySelector('.tg-state').textContent,
                    knob: getComputedStyle(t.querySelector('i')).transform};
        })()""")
        # 3 分段
        out["seg"] = await js("""(() => {
            const seg = document.querySelector('.seg'); const btns = [...seg.querySelectorAll('button')];
            btns[2].click();
            return {mo: getComputedStyle(document.documentElement).getPropertyValue('--mo').trim(),
                    pillW: seg.querySelector('.seg-pill').style.width,
                    pillT: seg.querySelector('.seg-pill').style.transform};
        })()""")
        # 4 旋钮
        out["tuner"] = await js("""(() => {
            const set = (id, v) => { const e = document.getElementById(id); e.value = v;
              e.dispatchEvent(new Event('input', {bubbles: true})); };
            set('t-mo', 1.5); set('t-dens', 1.2); set('t-rad', 6);
            const cs = getComputedStyle(document.documentElement);
            const card = document.querySelector('.demo');
            return {mo: cs.getPropertyValue('--mo').trim(), dens: cs.getPropertyValue('--dens').trim(),
                    radius: cs.getPropertyValue('--radius').trim(),
                    cardRadius: getComputedStyle(card).borderRadius,
                    code: document.getElementById('t-code').textContent,
                    outMo: document.getElementById('o-mo').textContent};
        })()""")
        # 5 复位
        out["reset"] = await js("""(() => {
            document.getElementById('t-reset').click();
            const cs = getComputedStyle(document.documentElement);
            return {mo: cs.getPropertyValue('--mo').trim(), radius: cs.getPropertyValue('--radius').trim()};
        })()""")
        # 6 reveal 与计数（滚到底）
        await js("window.scrollTo({top: document.body.scrollHeight, behavior:'instant'})")
        await asyncio.sleep(1.6)
        out["after"] = await js("""(() => ({
            revealed: document.querySelectorAll('.reveal.in').length + '/' + document.querySelectorAll('.reveal').length,
            counts: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
            clipIn: !!document.querySelector('.card-clip.in'),
            hdr: document.getElementById('hdr').className,
            progTransform: document.getElementById('prog').style.transform
        }))()""")
        print(json.dumps(out, ensure_ascii=False, indent=1))
        shot = await send(ws, nid(), "Page.captureScreenshot", format="png")
        open(os.path.join(outdir, "interact.png"), "wb").write(base64.b64decode(shot["data"]))
    p.kill()


asyncio.run(main(sys.argv[1], sys.argv[2]))
