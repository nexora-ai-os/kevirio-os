# KEVIRIO Design Token Reference

## Source of Truth

Owner承認画像とMaster Directiveを視覚仕様のSource of Truthとする。Production UIの主軸は White / Warm White / Pearl / Champagne Gold。Silver / Soft Blue / Pale Purpleは補助色であり、Mint / Aquaはブランド主色として使用しない。

## Core tokens

|用途|Token|値|
|---|---|---|
|Canvas|`--kv-pearl`|`#f7f6f2`|
|Surface|`--kv-white`|`#ffffff`|
|Primary text|`--kv-ink`|`#171a22`|
|Muted text|`--kv-muted`|`#697080`|
|Champagne Gold|`--kv-gold-500`|`#c79525`|
|Deep Gold|`--kv-gold-700`|`#76500b`|
|Silver|`--kv-silver`|`#e4e7ed`|
|Soft Blue|`--kv-blue`|`#eaf2ff`|
|Pale Purple|`--kv-purple`|`#f1edff`|
|Success only|`--kv-success`|`#269a6a`|

## Shape, elevation, motion

- Radius: 10 / 14 / 20 / 26px。カードは原則20px、操作要素は12–14px。
- Shadow: 低コントラストの暖色影。Gold shadowは重要判断面に限定。
- Touch target: 44px以上。
- Motion: 140–220ms。`prefers-reduced-motion`では実質無効化。
- Identity: inline SVGのGold K。外部Assetや秘密情報への依存はない。

## Semantic rules

- Gold: Brand、Owner判断、Primary action。
- Emerald: 正常・成功状態のみ。
- Red: Error / Rejectのみ。
- Blue / Purple: 情報・AI補助状態。
- Actual / Forecast / Mock / Unknownを色だけで区別せず、Labelと文言を併用する。
