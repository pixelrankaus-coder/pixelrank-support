# Project Rules for Pixel Rank CRM V2

The following rules must be followed at all times:

## Metronic Integration Rules
• Metronic React source files live in client/metronic
• **NEVER modify files inside client/metronic**
• You may import and extend components from client/metronic
• All custom app code must be placed in client/src
• Use Metronic React as the base
• Never rebuild Metronic CSS or layout
• Always extend existing Metronic components

## General Rules
• Do not add new UI libraries unless I approve
• Keep code structure clean: client/ and server/ split
• All new pages must follow METRONIC_RULES.md

## Layout Rules

• The main React app lives at:
  client/metronic/metronic-v9.3.6/metronic-tailwind-react-starter-kit/typescript/vite

• All screens for Pixel Rank CRM V2 must follow the Metronic Vite Layout 14 demo.
• Do not change the global header, sidebar, toolbar, or spacing from Layout 14.
• New pages must feel visually identical to the Layout 14 demo.
