# AXIS — MAKE THE AXIS, MOVE THE FUTURE.

架空の制作会社「AXIS」のワンページ・コーポレートサイト。
デザインカンプ(ダークトーン + 玉虫色の流体ビジュアル)をWeb実装したものです。

**Live:** https://takanaka-cyber.github.io/axis-site/

## Stack

- 素のHTML / CSS / JS(ビルドなし、CDN読み込み)
- [Three.js](https://threejs.org/) — ヒーローの薄膜干渉シェーダー(イリデセント・リボン)
- [GSAP + ScrollTrigger](https://gsap.com/) — 章ごとのシネマティックなシーン演出 / カラージャーニー / 横スクロールFLOW
- [Lenis](https://lenis.darkroom.engineering/) — 慣性スムーススクロール(GSAP ticker統合)
- 画像アセットは fal.ai (GPT Image 2) で生成(`tools/gen_images.py`)

## Design tokens

| Token | Value |
|---|---|
| Background | `#080D11` / `#11161C` / `#1E242D` |
| Accent | `#6A7CFF` / `#00E5C2` / `#FF3D71` |
| Type (EN) | Inter(カンプの Neue Montreal の代替) |
| Type (JP) | Noto Sans JP |

## Interactions (storytelling)

- 10章構成のストーリーテリング: 章ごとに背景色がモーフする「カラージャーニー」(深黒→インディゴ→ティール→バイオレット→深黒)
- 章番号のゴーストウォーターマーク(スクラブ・パララックス)
- 見出しの文字単位リビール、シーン単位のカード入場(ScrollTrigger batch)
- ヒーローのオープニングタイトルシーケンス+スクロール退場(スクラブ)
- FLOW章はピン留め横スクロールのトラッキングショット(デスクトップのみ)
- 画像パララックス(スクラブ)、グラスモーフィズム、カスタムカーソル
- スクロールインジケーター(01→10 章同期、アクセント色も章に追従)
- SVG線画アイコンのストロークドローイング
- prefers-reduced-motion 時は全演出を無効化した静的表示

## Local

```sh
python3 -m http.server 8741
# → http://localhost:8741
```
