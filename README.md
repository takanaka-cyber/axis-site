# AXIS — MAKE THE AXIS, MOVE THE FUTURE.

架空の制作会社「AXIS」のワンページ・コーポレートサイト。
デザインカンプ(ダークトーン + 玉虫色の流体ビジュアル)をWeb実装したものです。

**Live:** https://takanaka-cyber.github.io/axis-site/

## Stack

- 素のHTML / CSS / JS(ビルドなし、CDN読み込み)
- [Three.js](https://threejs.org/) — ヒーローの薄膜干渉シェーダー(イリデセント・リボン)
- [anime.js](https://animejs.com/) — テキストリビール / イントロタイムライン
- [Lenis](https://lenis.darkroom.engineering/) — 慣性スムーススクロール
- 画像アセットは fal.ai (GPT Image 2) で生成(`tools/gen_images.py`)

## Design tokens

| Token | Value |
|---|---|
| Background | `#080D11` / `#11161C` / `#1E242D` |
| Accent | `#6A7CFF` / `#00E5C2` / `#FF3D71` |
| Type (EN) | Inter(カンプの Neue Montreal の代替) |
| Type (JP) | Noto Sans JP |

## Interactions

- パララックス(画像・装飾のスクロール速度差)
- テキストリビール / スクロール連動リビール
- グラスモーフィズム(ヘッダー・カード・ボタンの backdrop-filter)
- カスタムカーソル(リンクホバーで拡大、mix-blend-mode: difference)
- スクロールインジケーター(01→10 セクション同期)
- SVG線画アイコンのストロークドローイング

## Local

```sh
python3 -m http.server 8741
# → http://localhost:8741
```
