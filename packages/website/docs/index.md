---
layout: page
title: TypeCell
# head:
#   - [
#       "meta",
#       {
#         property: "og:image",
#         content: "",
#       },
#     ]

hero:
  name: TypeCell
  text: TODO
  tagline: TODO TODO

  #   image:
  #     src: /logo.png
  #     alt: VitePress
  # actions:
  #   - theme: brand
  #     text: Get Started
  #     link: /docs
  #   - theme: alt
  #     text: View on GitHub
  #     link: https://github.com/TypeCellOS/BlockNote
---

<script setup lang="ts">
import Home from '@theme/components/Home.vue';

import { footerSections } from './data';
</script>

<Home
  :externalLinks=[]
  :footerSections="footerSections"
/>
