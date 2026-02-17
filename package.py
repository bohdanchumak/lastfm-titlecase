import zipfile
import json
import os


files = [
	"img/icons/icon16.png",
	"img/icons/icon48.png",
	"img/icons/icon128.png",
	"dist/config.js",
	"dist/content.js",
	"src/background.js",
	"src/config.html",
	"src/config.css",
]

with open("manifest.json", "r") as f:
	manifest = json.load(f)


def chromium_manifest(m):
	m = json.loads(json.dumps(m))
	del m["browser_specific_settings"]
	del m["background"]["scripts"]
	return m


def firefox_manifest(m):
	m = json.loads(json.dumps(m))
	del m["background"]["service_worker"]
	return m


platforms = {
	"chrome": chromium_manifest,
	"edge": chromium_manifest,
	"firefox": firefox_manifest,
}

for name, transform in platforms.items():
	with zipfile.ZipFile(
		f"lastfm-titlecase-{name}.zip", "w", zipfile.ZIP_DEFLATED
	) as zf:
		zf.writestr(
			"manifest.json",
			json.dumps(transform(manifest), indent="\t", ensure_ascii=False),
		)
		for f in files:
			zf.write(f, f.replace(os.sep, "/"))
