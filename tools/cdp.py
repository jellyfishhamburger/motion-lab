"""Minimal CDP driver — 用真实 Chrome 渲染本地页面、滚动、悬停、截图。
用法: python cdp.py <url> <outdir>
依赖: websockets (hermes venv 已有)
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

import websockets

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9333
PROFILE = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "cdp-profile")


async def send(ws, mid, method, **params):
    await ws.send(json.dumps({"id": mid, "method": method, "params": params}))
    while True:
        msg = json.loads(await ws.recv())
        if msg.get("id") == mid:
            return msg.get("result", msg)


async def main(url, outdir):
    os.makedirs(outdir, exist_ok=True)
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        f"--remote-debugging-port={PORT}", f"--user-data-dir={PROFILE}",
        "--window-size=1440,1000", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws_url = None
    for _ in range(40):
        try:
            data = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2))
            pages = [d for d in data if d["type"] == "page"]
            if pages:
                ws_url = pages[0]["webSocketDebuggerUrl"]
                break
        except Exception:
            pass
        time.sleep(.3)
    if not ws_url:
        print("NO CDP"); proc.kill(); return

    async with websockets.connect(ws_url, max_size=40 * 1024 * 1024) as ws:
        i = 0
        def nid():
            nonlocal i
            i += 1
            return i

        await send(ws, nid(), "Page.enable")
        await send(ws, nid(), "Runtime.enable")
        await send(ws, nid(), "Emulation.setDeviceMetricsOverride",
                   width=1440, height=1000, deviceScaleFactor=1, mobile=False)
        await send(ws, nid(), "Page.navigate", url=url)
        await asyncio.sleep(2.5)

        async def js(expr):
            r = await send(ws, nid(), "Runtime.evaluate",
                           expression=expr, returnByValue=True, awaitPromise=True)
            return r.get("result", {}).get("value")

        async def shot(name):
            data = await send(ws, nid(), "Page.captureScreenshot", format="png", captureBeyondViewport=False)
            path = os.path.join(outdir, name + ".png")
            import base64
            with open(path, "wb") as f:
                f.write(base64.b64decode(data["data"]))
            print("SHOT", path)

        async def scroll_to(y, settle=1.3):
            await js(f"window.scrollTo({{top:{y},behavior:'instant'}})")
            await asyncio.sleep(settle)

        async def hover(selector):
            box = await js(f"""(() => {{ const e = document.querySelector({selector!r});
                if (!e) return null; const r = e.getBoundingClientRect();
                return {{x: r.left + r.width/2, y: r.top + r.height/2}}; }})()""")
            if not box:
                return False
            await send(ws, nid(), "Input.dispatchMouseEvent", type="mouseMoved",
                       x=box["x"], y=box["y"], buttons=0)
            await asyncio.sleep(.8)
            return True

        # 基本体检
        info = await js("""(() => ({
            height: document.documentElement.scrollHeight,
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            h1: document.querySelector('h1').getBoundingClientRect().height,
            splits: document.querySelectorAll('.split .c').length,
            reveals: document.querySelectorAll('.reveal').length,
            revealed: document.querySelectorAll('.reveal.in').length,
            mo: getComputedStyle(document.documentElement).getPropertyValue('--mo').trim(),
            errs: window.__errs || []
        }))()""")
        print("INFO", json.dumps(info, ensure_ascii=False))

        await shot("01-hero")
        await scroll_to(950); await shot("02-buttons")
        await hover(".card-spot"); await scroll_to(1750); await hover(".card-spot")
        await shot("03-cards")
        await scroll_to(2500); await shot("04-scroll")
        await scroll_to(3200); await shot("05-micro")
        await scroll_to(3900); await shot("06-tune")
        await scroll_to(4700); await shot("07-footer")
        # 到底
        await scroll_to(999999, 1.0); await shot("08-bottom")
        after = await js("""(() => ({
            revealed: document.querySelectorAll('.reveal.in').length,
            counts: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
            progress: document.querySelector('#prog').style.transform
        }))()""")
        print("AFTER", json.dumps(after, ensure_ascii=False))
        # 移动端
        await send(ws, nid(), "Emulation.setDeviceMetricsOverride",
                   width=390, height=844, deviceScaleFactor=2, mobile=True)
        await js("window.scrollTo({top:0,behavior:'instant'})")
        await asyncio.sleep(1.2)
        await shot("09-mobile-hero")
        mob = await js("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        print("MOBILE_OVERFLOW_X", mob)
        await scroll_to(1400); await shot("10-mobile-mid")

    proc.kill()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
