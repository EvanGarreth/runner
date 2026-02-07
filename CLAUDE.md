# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Runner is a React Native Expo mobile app for tracking running activities. It supports three run types: Timed, Distance, and Free runs. The app uses SQLite for local data persistence with GPS location tracking and weather integration planned.

## Development Commands

```bash
bun start          # Start Expo dev server
bun run android    # Build and run Android app
bun run ios        # Build and run iOS app
bun run web        # Start web version
bun run lint       # Run ESLint + Prettier
```

Package manager is **Bun** (not npm/yarn).

## Architecture

### Navigation (Expo Router - file-based)
- `src/app/_layout.tsx` - Root layout with SQLite provider and theme setup
- `src/app/(tabs)/` - Tab navigation (Overview, Run, Log)
- `src/app/runs/` - Stack navigation for run details with dynamic `[id]` routes

### Screen Logic
- `src/screens/` - Screen components separated from routing
- `src/screens/run/NewRun.tsx` - Run type selector
- `src/screens/run/Run.tsx` - Individual run detail

### Database
- SQLite via expo-sqlite with WAL mode
- `src/utils/db.ts` - Migration system (version-based)
- `assets/db_01.sql` - Schema definition
- Tables: `runs`, `weather`, `locationData`
- Run types: `T` (Timed), `D` (Distance), `F` (Free)

### Theming
- `src/components/Themed.tsx` - Theme-aware Text/View wrappers
- `src/constants/Colors.ts` - Light/dark mode color definitions

## Code Style

- TypeScript with strict mode
- Path alias: `@/*` maps to `./src/*`
- Prettier: 120 char width, semicolons, ES5 trailing commas
- ESLint extends `eslint-config-expo`

## Current Status

Early prototype phase - screens use mockup data with database queries mostly commented out.
